import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function sourceIdFor(message) {
  const chat = message.chat || message.chatId || 'unknown';
  const id = message.id || message.messageId || crypto.createHash('sha256').update(String(message.text || '')).digest('hex').slice(0, 12);
  return `${chat}:${id}`;
}

export function shortId(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 8);
}

export function loadState(stateDir) {
  const file = path.join(stateDir, 'state.json');
  try {
    return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch {
    return {
      file,
      data: {
        created: {},
        pendingReview: {},
        skipped: {},
      },
    };
  }
}

export function saveState(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, file);
}

export function isHandled(state, sourceId) {
  return Boolean(state.created[sourceId] || state.pendingReview[sourceId] || state.skipped[sourceId]);
}

