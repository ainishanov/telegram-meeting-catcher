#!/usr/bin/env node

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { loadConfig } from '../src/config.mjs';
import { ensureEnvFile, loadEnvFile, maskSecret } from './env-file.mjs';

ensureEnvFile();
loadEnvFile();

const config = loadConfig();
const checks = [];

await check('Node.js >= 20', async () => {
  const major = Number.parseInt(process.versions.node.split('.')[0], 10);
  if (major < 20) throw new Error(`found ${process.versions.node}`);
  return process.versions.node;
});

await check('.env file exists', async () => '.env');

await check('Telegram API credentials', async () => {
  if (!config.telegram.apiId) throw new Error('TG_API_ID is missing');
  if (!config.telegram.apiHash) throw new Error('TG_API_HASH is missing');
  return `api_id=${config.telegram.apiId}, api_hash=${maskSecret(config.telegram.apiHash)}`;
});

await check('Telegram session string', async () => {
  if (!config.telegram.sessionString) throw new Error('TG_SESSION_STRING is missing. Run npm run setup:telegram.');
  return maskSecret(config.telegram.sessionString);
});

await check('Allowed chats configured', async () => {
  if (!config.allowedChats.size) throw new Error('TMC_ALLOWED_CHATS is empty');
  return [...config.allowedChats].join(', ');
});

await check('Google OAuth credentials', async () => {
  if (!config.google.clientId) throw new Error('GOOGLE_CLIENT_ID is missing');
  if (!config.google.clientSecret) throw new Error('GOOGLE_CLIENT_SECRET is missing');
  if (!config.google.refreshToken) throw new Error('GOOGLE_REFRESH_TOKEN is missing. Run npm run setup:google.');
  return `calendar=${config.google.calendarId || 'primary'}`;
});

if (!hasFlag('--offline')) {
  await check('Telegram connection', () => checkTelegram(config));
  await check('Google Calendar access', () => checkGoogleCalendar(config));
} else {
  checks.push({ name: 'Telegram connection', status: 'skip', detail: '--offline' });
  checks.push({ name: 'Google Calendar access', status: 'skip', detail: '--offline' });
}

printReport();
if (checks.some((item) => item.status === 'fail')) process.exit(1);

async function check(name, fn) {
  try {
    const detail = await fn();
    checks.push({ name, status: 'pass', detail });
  } catch (error) {
    checks.push({ name, status: 'fail', detail: error.message || String(error) });
  }
}

async function checkTelegram(cfg) {
  const client = new TelegramClient(
    new StringSession(cfg.telegram.sessionString),
    cfg.telegram.apiId,
    cfg.telegram.apiHash,
    { connectionRetries: 1 }
  );
  await client.connect();
  const me = await client.getMe();
  await client.disconnect();
  return me.username ? `@${me.username}` : String(me.firstName || me.id);
}

async function checkGoogleCalendar(cfg) {
  const token = await getAccessToken(cfg);
  const calendarId = encodeURIComponent(cfg.google.calendarId || 'primary');
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Google Calendar failed: ${response.status}`);
  return data.summary || cfg.google.calendarId || 'primary';
}

async function getAccessToken(cfg) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.google.clientId,
      client_secret: cfg.google.clientSecret,
      refresh_token: cfg.google.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || `OAuth failed: ${response.status}`);
  return data.access_token;
}

function printReport() {
  for (const item of checks) {
    const icon = item.status === 'pass' ? 'PASS' : item.status === 'skip' ? 'SKIP' : 'FAIL';
    console.log(`${icon} ${item.name}${item.detail ? ` - ${item.detail}` : ''}`);
  }
}

function hasFlag(name) {
  return process.argv.includes(name);
}

