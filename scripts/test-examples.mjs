import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { extractDeterministicEvents } from '../src/parser/deterministic.mjs';

const messages = JSON.parse(await fs.readFile(new URL('../examples/messages.json', import.meta.url), 'utf8'));
const events = extractDeterministicEvents(messages, { defaultDurationMinutes: 45 });
const byMessageId = new Map(events.map((event) => [event.sourceMessageIds[0], event]));

assert.equal(events.length, 7);
assert.equal(byMessageId.get('101').summary, 'Call');
assert.equal(byMessageId.get('102').summary, 'Demo call');
assert.equal(byMessageId.get('106').location, 'Google Meet');
assert.equal(byMessageId.get('108').location, 'Zoom');
assert.equal(byMessageId.has('103'), false);
assert.equal(byMessageId.has('109'), false);
assert.equal(byMessageId.has('110'), false);

console.log('example tests passed');
