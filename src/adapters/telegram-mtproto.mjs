import { normalizeChatKey } from '../config.mjs';

export async function listenTelegram(config, onMessages) {
  const { NewMessage } = await import('telegram/events/index.js');
  const client = await connectTelegram(config, '--listen');
  client.addEventHandler(async (update) => {
    const message = update.message;
    if (!message?.message) return;
    const chat = await message.getChat().catch(() => null);
    const chatKey = allowedChatKey(config, chat, message.chatId);
    if (!chatKey) return;

    await onMessages([
      {
        id: message.id,
        chat: chat?.title || chat?.username || String(chat?.id || chatKey),
        chatId: chatKey,
        from: message.out ? 'me' : 'peer',
        text: message.message,
        date: message.date ? new Date(Number(message.date) * 1000).toISOString() : new Date().toISOString(),
      },
    ]);
  }, new NewMessage({}));

  console.log(JSON.stringify({ type: 'listener_started', allowedChats: [...config.allowedChats] }));
  return client;
}

export async function scanTelegram(config, { limit = 50 } = {}) {
  const client = await connectTelegram(config, 'scan');
  try {
    const dialogs = await client.getDialogs({ limit: 200 });
    const rows = [];

    for (const dialog of dialogs) {
      const chat = dialog.entity || dialog;
      const chatKey = allowedChatKey(config, chat);
      if (!chatKey) continue;

      const messages = await client.getMessages(chat, { limit });
      for (const message of messages) {
        if (!message?.message) continue;
        rows.push(messageToRow(message, chat, chatKey));
      }
    }

    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return rows;
  } finally {
    await client.disconnect();
  }
}

async function connectTelegram(config, mode) {
  const { TelegramClient } = await import('telegram');
  const { StringSession } = await import('telegram/sessions/index.js');

  if (!config.telegram.apiId || !config.telegram.apiHash || !config.telegram.sessionString) {
    throw new Error(`TG_API_ID, TG_API_HASH and TG_SESSION_STRING are required for ${mode}`);
  }
  if (!config.allowedChats.size) {
    throw new Error('Set TMC_ALLOWED_CHATS before using Telegram');
  }

  const client = new TelegramClient(
    new StringSession(config.telegram.sessionString),
    config.telegram.apiId,
    config.telegram.apiHash,
    { connectionRetries: 3 }
  );

  await client.connect();
  return client;
}

function messageToRow(message, chat, chatKey) {
  return {
    id: message.id,
    chat: chat?.title || chat?.username || String(chat?.id || chatKey),
    chatId: chatKey,
    from: message.out ? 'me' : 'peer',
    text: message.message,
    date: message.date ? new Date(Number(message.date) * 1000).toISOString() : new Date().toISOString(),
  };
}

function allowedChatKey(config, chat, fallbackId) {
  const keys = chatKeysFor(chat, fallbackId);
  if (!keys.length) return null;
  if (keys.some((key) => config.ignoredChats.has(key))) return null;
  return keys.find((key) => config.allowedChats.has(key)) || null;
}

function chatKeysFor(chat, fallbackId) {
  return [
    chat?.username,
    chat?.id,
    fallbackId,
    chat?.title,
  ]
    .map(normalizeChatKey)
    .filter(Boolean);
}
