const INTENT_RE =
  /(созвон|созвониться|встреч|встрет|колл|call|demo|демо|zoom|meet\b|google meet|appointment|при[её]м|звонок|позвон|переговор)/iu;

const MONTHS = new Map([
  ['января', 1], ['янв', 1],
  ['февраля', 2], ['фев', 2],
  ['марта', 3], ['мар', 3],
  ['апреля', 4], ['апр', 4],
  ['мая', 5],
  ['июня', 6], ['июн', 6],
  ['июля', 7], ['июл', 7],
  ['августа', 8], ['авг', 8],
  ['сентября', 9], ['сен', 9], ['сент', 9],
  ['октября', 10], ['окт', 10],
  ['ноября', 11], ['ноя', 11],
  ['декабря', 12], ['дек', 12],
]);

const WEEKDAYS = new Map([
  ['sunday', 0], ['воскресенье', 0], ['вс', 0],
  ['monday', 1], ['понедельник', 1], ['пн', 1],
  ['tuesday', 2], ['вторник', 2], ['вт', 2],
  ['wednesday', 3], ['среда', 3], ['среду', 3], ['ср', 3],
  ['thursday', 4], ['четверг', 4], ['чт', 4],
  ['friday', 5], ['пятница', 5], ['пятницу', 5], ['пт', 5],
  ['saturday', 6], ['суббота', 6], ['субботу', 6], ['сб', 6],
]);

export function extractDeterministicEvents(messages, config, now = new Date()) {
  const events = [];
  for (const message of messages) {
    const event = extractFromText(message, config, now);
    if (event) events.push(event);
  }
  return events;
}

export function extractFromText(message, config, now = new Date()) {
  const text = String(message.text || '').trim();
  if (!text || !INTENT_RE.test(text)) return null;

  const date = parseDate(text, message.date ? new Date(message.date) : now);
  const time = parseTime(text);
  if (!date || !time) return null;

  return {
    sourceMessageIds: [String(message.id || '')].filter(Boolean),
    sourceChat: message.chat || message.chatId || '',
    summary: summarize(text),
    startDate: date,
    startTime: time,
    durationMinutes: inferDuration(text, config.defaultDurationMinutes),
    location: inferLocation(text),
    confidence: 0.9,
    reason: 'deterministic: meeting intent with date and time',
    extractor: 'deterministic',
    rawText: text,
  };
}

function parseTime(text) {
  const match = String(text).match(/\b([01]?\d|2[0-3])(?::|\.)([0-5]\d)\b|\b([01]?\d|2[0-3])\s*(?:ч|час|часа|часов)\b/iu);
  if (!match) return null;
  const hour = Number.parseInt(match[1] || match[3], 10);
  const minute = Number.parseInt(match[2] || '0', 10);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function parseDate(text, baseDate) {
  const lower = String(text).toLowerCase();
  const base = startOfDay(baseDate);
  if (hasToken(lower, 'today') || lower.includes('сегодня')) return ymd(base);
  if (hasToken(lower, 'tomorrow') || lower.includes('завтра')) return ymd(addDays(base, 1));
  if (/послезавтра/u.test(lower)) return ymd(addDays(base, 2));

  const numeric = lower.match(/\b([0-3]?\d)[./-]([01]?\d)(?:[./-](\d{2,4}))?\b/u);
  if (numeric) {
    const day = Number.parseInt(numeric[1], 10);
    const month = Number.parseInt(numeric[2], 10);
    const year = normalizeYear(numeric[3], base.getFullYear());
    return ymd(new Date(Date.UTC(year, month - 1, day)));
  }

  const monthName = lower.match(/\b([0-3]?\d)\s+([\p{L}]+)\b/u);
  if (monthName && MONTHS.has(monthName[2])) {
    const day = Number.parseInt(monthName[1], 10);
    const month = MONTHS.get(monthName[2]);
    let year = base.getFullYear();
    let candidate = new Date(Date.UTC(year, month - 1, day));
    if (candidate < base) candidate = new Date(Date.UTC(year + 1, month - 1, day));
    return ymd(candidate);
  }

  for (const [label, weekday] of WEEKDAYS.entries()) {
    const matched = isAscii(label)
      ? new RegExp(`\\b(?:next\\s+)?${escapeRegExp(label)}\\b`, 'iu').test(lower)
      : lower.includes(label);
    if (matched) return ymd(nextWeekday(base, weekday));
  }

  return null;
}

function inferDuration(text, fallback) {
  if (/demo|демо|презентац/iu.test(text)) return 45;
  if (/call|созвон|колл|звонок|zoom|meet\b/iu.test(text)) return 30;
  return fallback;
}

function inferLocation(text) {
  if (/zoom/iu.test(text)) return 'Zoom';
  if (/google meet|meet\b/iu.test(text)) return 'Google Meet';
  return null;
}

function summarize(text) {
  const cleaned = String(text).replace(/\s+/g, ' ').trim();
  if (/demo|демо|презентац/iu.test(cleaned)) return 'Demo call';
  if (/созвон|call|колл|звонок|zoom|meet\b/iu.test(cleaned)) return 'Call';
  if (/встреч|appointment|при[её]м/iu.test(cleaned)) return 'Meeting';
  return cleaned.slice(0, 80);
}

function startOfDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

function nextWeekday(base, weekday) {
  const current = base.getUTCDay();
  let delta = (weekday - current + 7) % 7;
  if (delta === 0) delta = 7;
  return addDays(base, delta);
}

function normalizeYear(value, fallback) {
  if (!value) return fallback;
  const year = Number.parseInt(value, 10);
  return year < 100 ? 2000 + year : year;
}

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasToken(text, token) {
  return new RegExp(`\\b${escapeRegExp(token)}\\b`, 'iu').test(text);
}

function isAscii(value) {
  return /^[\x00-\x7F]+$/.test(value);
}
