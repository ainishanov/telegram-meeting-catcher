import { normalizeChatKey } from '../config.mjs';

export async function listenTelegram(config, onMessages) {
  const { TelegramClient } = await import('telegram');
  const { StringSession } = await import('telegram/sessions/index.js');
  const { NewMessage } = await import('telegram/events/index.js');

  if (!config.telegram.apiId || !config.telegram.apiHash || !config.telegram.sessionString) {
    throw new Error('TG_API_ID, TG_API_HASH and TG_SESSION_STRING are required for --listen');
  }
  if (!config.allowedChats.size) {
    throw new Error('Set TMC_ALLOWED_CHATS before listening to Telegram');
  }

  const client = new TelegramClient(
    new StringSession(config.telegram.sessionString),
    config.telegram.apiId,
    config.telegram.apiHash,
    { connectionRetries: 3 }
  );

  await client.connect();
  client.addEventHandler(async (update) => {
    const message = update.message;
    if (!message?.message) return;
    const chat = await message.getChat().catch(() => null);
    const chatKey = normalizeChatKey(chat?.username || chat?.id || chat?.title || '');
    if (!chatKey || config.ignoredChats.has(chatKey)) return;
    if (!config.allowedChats.has(chatKey)) return;

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
