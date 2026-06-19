#!/usr/bin/env node

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { ensureEnvFile, loadEnvFile, maskSecret, setEnvValues } from './env-file.mjs';

ensureEnvFile();
loadEnvFile();

const rl = readline.createInterface({ input, output });

try {
  const updates = {};
  const apiId = await readRequiredNumber('TG_API_ID', 'Telegram api_id from https://my.telegram.org: ');
  const apiHash = await readRequiredString('TG_API_HASH', 'Telegram api_hash from https://my.telegram.org: ');
  updates.TG_API_ID = String(apiId);
  updates.TG_API_HASH = apiHash;
  setEnvValues(updates);

  console.log('\nSigning in to Telegram. Codes and 2FA are sent by Telegram.');
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 3 });
  await client.start({
    phoneNumber: () => rl.question('Phone number: '),
    phoneCode: () => rl.question('Telegram code: '),
    password: () => rl.question('2FA password, if asked: '),
    onError: (error) => console.error(error.message || error),
  });

  const session = client.session.save();
  setEnvValues({ TG_SESSION_STRING: session });
  const me = await client.getMe().catch(() => null);
  await client.disconnect();

  console.log('\nTelegram session saved to .env');
  console.log(`TG_SESSION_STRING=${maskSecret(session)}`);
  if (me) console.log(`Signed in as: ${me.username ? `@${me.username}` : me.firstName || me.id}`);
  console.log('\nNext: set TMC_ALLOWED_CHATS in .env, then run npm run doctor.');
} finally {
  rl.close();
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

async function readRequiredNumber(name, prompt) {
  while (true) {
    const raw = await readRequiredString(name, prompt);
    const value = Number.parseInt(raw, 10);
    if (Number.isFinite(value) && value > 0) return value;
    console.log(`${name} must be a positive number.`);
  }
}

