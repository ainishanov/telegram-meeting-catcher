#!/usr/bin/env node

import fs from 'node:fs/promises';
import { loadConfig } from './config.mjs';
import { loadState, saveState } from './state.mjs';
import { extractEventsFromMessages, handleExtractedEvents } from './events.mjs';
import { confirmPendingReview, formatPendingReview, listPendingReviews, skipPendingReview } from './review.mjs';
import { listenTelegram } from './adapters/telegram-mtproto.mjs';

const args = new Set(process.argv.slice(2));
const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const config = loadConfig();
const { file: stateFile, data: state } = loadState(config.stateDir);

if (positional[0] === 'review') {
  listReviews();
} else if (positional[0] === 'confirm') {
  await confirmReview(positional[1]);
} else if (positional[0] === 'skip') {
  skipReview(positional[1]);
} else if (args.has('--demo')) {
  const messages = JSON.parse(await fs.readFile(new URL('../examples/messages.json', import.meta.url), 'utf8'));
  await processMessages(messages, { dryRun: true });
} else if (args.has('--listen')) {
  const dryRun = args.has('--dry-run');
  await listenTelegram(config, (messages) => processMessages(messages, { dryRun }));
  await new Promise(() => {});
} else {
  console.log('Usage: telegram-meeting-catcher --demo | telegram-meeting-catcher --listen --dry-run | telegram-meeting-catcher review | telegram-meeting-catcher confirm <id> | telegram-meeting-catcher skip <id>');
}

async function processMessages(messages, options = {}) {
  const dryRun = options.dryRun || args.has('--dry-run');
  const events = await extractEventsFromMessages(messages, config);
  const { changed } = await handleExtractedEvents(events, { config, state, dryRun });
  if (changed) saveState(stateFile, state);
}

function listReviews() {
  const pending = listPendingReviews(state);
  if (!pending.length) {
    console.log('No pending reviews.');
    return;
  }

  for (const event of pending) {
    console.log(formatPendingReview(event));
    console.log('');
  }
}

async function confirmReview(id) {
  if (!id) {
    console.error('Usage: telegram-meeting-catcher confirm <review-id>');
    process.exit(1);
  }

  const result = await confirmPendingReview(state, id, config, { dryRun: args.has('--dry-run') });
  if (!result.found) {
    console.error(`Pending review not found: ${id}`);
    process.exit(1);
  }

  if (result.dryRun) {
    console.log(`Dry-run: would create ${result.event.summary} at ${result.event.startDate} ${result.event.startTime}`);
    return;
  }

  saveState(stateFile, state);
  console.log(`Confirmed ${result.event.reviewId}: ${result.event.summary}`);
}

function skipReview(id) {
  if (!id) {
    console.error('Usage: telegram-meeting-catcher skip <review-id>');
    process.exit(1);
  }

  const result = skipPendingReview(state, id);
  if (!result.found) {
    console.error(`Pending review not found: ${id}`);
    process.exit(1);
  }

  saveState(stateFile, state);
  console.log(`Skipped ${result.event.reviewId}: ${result.event.summary}`);
}
