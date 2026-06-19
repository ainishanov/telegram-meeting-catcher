import { createEventAndRecord } from './events.mjs';

export function listPendingReviews(state) {
  return Object.entries(state.pendingReview || {})
    .map(([sourceId, event]) => ({ sourceId, ...event }))
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
}

export function findPendingReview(state, id) {
  const needle = String(id || '').trim().toLowerCase();
  if (!needle) return null;

  return listPendingReviews(state).find((event) => {
    return (
      String(event.reviewId || '').toLowerCase() === needle ||
      String(event.sourceId || '').toLowerCase().startsWith(needle)
    );
  }) || null;
}

export async function confirmPendingReview(state, id, config, { dryRun = false } = {}) {
  const event = findPendingReview(state, id);
  if (!event) return { found: false };

  if (dryRun) {
    return { found: true, dryRun: true, event };
  }

  const created = await createEventAndRecord(state, event, config);
  return { found: true, created, event };
}

export function skipPendingReview(state, id) {
  const event = findPendingReview(state, id);
  if (!event) return { found: false };

  state.skipped[event.sourceId] = {
    ...event,
    skippedAt: new Date().toISOString(),
  };
  delete state.pendingReview[event.sourceId];
  return { found: true, event };
}

export function formatPendingReview(event) {
  const lines = [
    `${event.reviewId || '(no id)'}  ${event.summary || '(untitled)'}`,
    `  when: ${event.startDate} ${event.startTime} (${event.durationMinutes || 45} min)`,
    event.sourceChat ? `  chat: ${event.sourceChat}` : '',
    Number.isFinite(event.confidence) ? `  confidence: ${Math.round(event.confidence * 100)}%` : '',
    event.reason ? `  reason: ${event.reason}` : '',
    event.rawText ? `  text: ${truncate(event.rawText, 180)}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function truncate(value, max) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

