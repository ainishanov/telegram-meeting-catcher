#!/usr/bin/env node

import fs from 'node:fs/promises';
import { loadConfig } from './config.mjs';
import { loadState, saveState, sourceIdFor, shortId, isHandled } from './state.mjs';
import { extractDeterministicEvents } from './parser/deterministic.mjs';
import { extractWithLlm } from './parser/llm.mjs';
import { createCalendarEvent } from './adapters/google-calendar.mjs';
import { listenTelegram } from './adapters/telegram-mtproto.mjs';

const args = new Set(process.argv.slice(2));
const config = loadConfig();
const { file: stateFile, data: state } = loadState(config.stateDir);

if (args.has('--demo')) {
  const messages = JSON.parse(await fs.readFile(new URL('../examples/messages.json', import.meta.url), 'utf8'));
  await processMessages(messages, { dryRun: true });
} else if (args.has('--listen')) {
  const dryRun = args.has('--dry-run');
  await listenTelegram(config, (messages) => processMessages(messages, { dryRun }));
  await new Promise(() => {});
} else {
  console.log('Usage: npm run demo | npm run listen -- --dry-run | npm run listen');
}

async function processMessages(messages, options = {}) {
  const dryRun = options.dryRun || args.has('--dry-run');
  let stateChanged = false;
  const deterministic = extractDeterministicEvents(messages, config);
  const llm = deterministic.length ? [] : await extractWithLlm(messages, config).catch((error) => {
    console.warn(JSON.stringify({ type: 'llm_skipped', error: error.message }));
    return [];
  });

  const events = [...deterministic, ...llm].map((event) => {
    const sourceMessage = messages.find((message) => event.sourceMessageIds.includes(String(message.id))) || messages[0] || {};
    return {
      ...event,
      sourceId: sourceIdFor(sourceMessage),
      sourceChat: event.sourceChat || sourceMessage.chat || sourceMessage.chatId || '',
    };
  });

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
      const id = shortId(event.sourceId);
      state.pendingReview[event.sourceId] = { ...event, reviewId: id, createdAt: new Date().toISOString() };
      stateChanged = true;
      console.log(JSON.stringify({ type: 'pending_review', reviewId: id, event }));
      continue;
    }

    if (dryRun) {
      console.log(JSON.stringify({ type: 'dry_calendar_event', event }, null, 2));
      continue;
    }

    const created = await createCalendarEvent(event, config);
    state.created[event.sourceId] = {
      calendarEventId: created.id,
      htmlLink: created.htmlLink,
      summary: event.summary,
      start: `${event.startDate} ${event.startTime}`,
      createdAt: new Date().toISOString(),
    };
    stateChanged = true;
    console.log(JSON.stringify({ type: 'calendar_event_created', sourceId: event.sourceId, eventId: created.id }));
  }

  if (stateChanged) saveState(stateFile, state);
}
