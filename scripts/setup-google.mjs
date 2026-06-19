#!/usr/bin/env node

import http from 'node:http';
import { spawn } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ensureEnvFile, loadEnvFile, maskSecret, setEnvValues } from './env-file.mjs';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const DEFAULT_PORT = 53682;

ensureEnvFile();
loadEnvFile();

const rl = readline.createInterface({ input, output });

try {
  const clientId = await readRequiredString('GOOGLE_CLIENT_ID', 'Google OAuth client ID: ');
  const clientSecret = await readRequiredString('GOOGLE_CLIENT_SECRET', 'Google OAuth client secret: ');
  const calendarId = await readString('GOOGLE_CALENDAR_ID', 'Calendar ID', 'primary');
  setEnvValues({ GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret, GOOGLE_CALENDAR_ID: calendarId });

  const port = Number.parseInt(process.env.TMC_GOOGLE_OAUTH_PORT || String(DEFAULT_PORT), 10);
  const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
  const state = Math.random().toString(36).slice(2);
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPES.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);

  const codePromise = waitForOAuthCode(port, state);
  console.log('\nOpen this URL to connect Google Calendar:\n');
  console.log(url.toString());
  openBrowser(url.toString());

  const code = await codePromise;
  const token = await exchangeCode({ clientId, clientSecret, code, redirectUri });
  if (!token.refresh_token) {
    throw new Error('Google did not return a refresh_token. Re-run setup and make sure prompt=consent is allowed for this OAuth client.');
  }

  setEnvValues({ GOOGLE_REFRESH_TOKEN: token.refresh_token });
  console.log('\nGoogle refresh token saved to .env');
  console.log(`GOOGLE_REFRESH_TOKEN=${maskSecret(token.refresh_token)}`);
  console.log('\nNext: run npm run doctor.');
} finally {
  rl.close();
}

function waitForOAuthCode(port, expectedState) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
        if (url.pathname !== '/oauth2callback') {
          res.writeHead(404).end('Not found');
          return;
        }
        const error = url.searchParams.get('error');
        if (error) throw new Error(`Google OAuth error: ${error}`);
        if (url.searchParams.get('state') !== expectedState) throw new Error('OAuth state mismatch');
        const code = url.searchParams.get('code');
        if (!code) throw new Error('OAuth code is missing');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Google Calendar connected</h1><p>You can close this tab and return to your terminal.</p>');
        server.close();
        resolve(code);
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(error.message);
        server.close();
        reject(error);
      }
    });
    server.once('error', reject);
    server.listen(port, '127.0.0.1');
  });
}

async function exchangeCode({ clientId, clientSecret, code, redirectUri }) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || `OAuth token exchange failed: ${response.status}`);
  return data;
}

function openBrowser(url) {
  const platform = process.platform;
  const command = platform === 'win32' ? 'cmd' : platform === 'darwin' ? 'open' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, { detached: true, stdio: 'ignore', shell: false });
  child.on('error', () => {});
  child.unref();
}

async function readString(name, label, fallback) {
  const current = process.env[name] || fallback;
  const value = await rl.question(`${label} [${current}]: `);
  return value.trim() || current;
}

async function readRequiredString(name, prompt) {
  const current = process.env[name];
  if (current) {
    const keep = await rl.question(`${name} is already set (${maskSecret(current)}). Press Enter to keep or type a new value: `);
    return keep.trim() || current;
  }
  while (true) {
    const value = (await rl.question(prompt)).trim();
    if (value) return value;
  }
}

