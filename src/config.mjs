try {
  await import('dotenv/config');
} catch {
  // Keep offline demos runnable before npm install.
}

export function readList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberEnv(name, fallback, min, max) {
  const value = Number.parseFloat(process.env[name] || '');
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function loadConfig() {
  return {
    timezone: process.env.TMC_TIMEZONE || 'Europe/Moscow',
    stateDir: process.env.TMC_STATE_DIR || 'data',
    defaultDurationMinutes: numberEnv('TMC_DEFAULT_DURATION_MINUTES', 45, 10, 360),
    autoCreateMinConfidence: numberEnv('TMC_AUTO_CREATE_MIN_CONFIDENCE', 0.82, 0, 1),
    reviewMinConfidence: numberEnv('TMC_REVIEW_MIN_CONFIDENCE', 0.55, 0, 1),
    allowedChats: new Set(readList(process.env.TMC_ALLOWED_CHATS).map(normalizeChatKey)),
    ignoredChats: new Set(readList(process.env.TMC_IGNORED_CHATS).map(normalizeChatKey)),
    telegram: {
      apiId: Number.parseInt(process.env.TG_API_ID || '0', 10),
      apiHash: process.env.TG_API_HASH || '',
      sessionString: process.env.TG_SESSION_STRING || '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    },
    llm: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
  };
}

export function normalizeChatKey(value) {
  return String(value || '').replace(/^@/, '').trim().toLowerCase();
}
