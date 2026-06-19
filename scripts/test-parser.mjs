import assert from 'node:assert/strict';
import { extractDeterministicEvents } from '../src/parser/deterministic.mjs';

const config = { defaultDurationMinutes: 45 };
const now = new Date('2026-06-19T09:00:00Z');

const cases = [
  {
    text: 'Давай завтра в 15:30 созвонимся',
    expect: { startDate: '2026-06-20', startTime: '15:30', summary: 'Call' },
  },
  {
    text: 'Can we do a demo next Monday at 11:00?',
    expect: { startDate: '2026-06-22', startTime: '11:00', summary: 'Demo call' },
  },
  {
    text: 'Просто статья про календарь',
    expect: null,
  },
];

for (const [index, item] of cases.entries()) {
  const events = extractDeterministicEvents([{ id: index + 1, chat: 'test', text: item.text }], config, now);
  if (!item.expect) {
    assert.equal(events.length, 0);
    continue;
  }
  assert.equal(events.length, 1);
  assert.equal(events[0].startDate, item.expect.startDate);
  assert.equal(events[0].startTime, item.expect.startTime);
  assert.equal(events[0].summary, item.expect.summary);
}

console.log('parser tests passed');

