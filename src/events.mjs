import { sourceIdFor, shortId, isHandled } from './state.mjs';
import { extractDeterministicEvents } from './parser/deterministic.mjs';
import { extractWithLlm } from './parser/llm.mjs';
import { createCalendarEvent } from './adapters/google-calendar.mjs';

export async function extractEventsFromMessages(messages, config) {
  const deterministic = extractDeterministicEvents(messages, config);
  const llm = deterministic.length ? [] : await extractWithLlm(messages, config).catch((error) => {
    console.warn(JSON.stringify({ type: 'llm_skipped', error: error.message }));
    return [];
  });

  return [...deterministic, ...llm].map((event) => {
    const sourceMessage = messages.find((message) => event.sourceMessageIds.includes(String(message.id))) || messages[0] || {};
    return normalizeExtractedEvent(event, sourceMessage);
  });
}

export async function handleExtractedEvents(events, { config, state, dryRun = false }) {
  let changed = false;

  for (const event of events) {
    if (isHandled(state, event.sourceId)) {
      console.log(JSON.stringify({ type: 'already_handled', sourceId: event.sourceId }));
      continue;
    }

    if (event.confidence < config.reviewMinConfidence) {
      console.log(JSON.stringify({ type: 'ignored_low_confidence', event }));
      continue;
    }

    if (event.confidence < config.autoCreateMinConfidence) {
      if (dryRun) {
        const reviewId = event.reviewId || shortId(event.sourceId);
        console.log(JSON.stringify({ type: 'dry_pending_review', reviewId, event }, null, 2));
        continue;
      }
      pendingReview(state, event);
      changed = true;
      console.log(JSON.stringify({ type: 'pending_review', reviewId: event.reviewId, event }));
      continue;
    }

    if (dryRun) {
      console.log(JSON.stringify({ type: 'dry_calendar_event', event }, null, 2));
      continue;
    }

    await createEventAndRecord(state, event, config);
    changed = true;
  }

  return { changed };
}

export async function createEventAndRecord(state, event, config) {
  const created = await createCalendarEvent(event, config);
  state.created[event.sourceId] = buildCreatedRecord(event, created);
  delete state.pendingReview[event.sourceId];
  console.log(JSON.stringify({
    type: created.duplicate ? 'calendar_event_duplicate' : 'calendar_event_created',
    sourceId: event.sourceId,
    eventId: created.id,
  }));
  return created;
}

export function pendingReview(state, event) {
  const reviewId = event.reviewId || shortId(event.sourceId);
  state.pendingReview[event.sourceId] = {
    ...event,
    reviewId,
    createdAt: event.createdAt || new Date().toISOString(),
  };
  event.reviewId = reviewId;
  return reviewId;
}

export function normalizeExtractedEvent(event, sourceMessage) {
  return {
    ...event,
    sourceId: event.sourceId || sourceIdFor(sourceMessage),
    sourceChat: event.sourceChat || sourceMessage.chat || sourceMessage.chatId || '',
  };
}

function buildCreatedRecord(event, created) {
  return {
    calendarEventId: created.id,
    htmlLink: created.htmlLink,
    summary: event.summary,
    start: `${event.startDate} ${event.startTime}`,
    duplicate: Boolean(created.duplicate),
    createdAt: new Date().toISOString(),
  };
}
