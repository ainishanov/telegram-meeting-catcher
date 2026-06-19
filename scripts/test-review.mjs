import assert from 'node:assert/strict';
import { confirmPendingReview, findPendingReview, listPendingReviews, skipPendingReview } from '../src/review.mjs';

const state = {
  created: {},
  pendingReview: {
    'chat:100': {
      sourceId: 'chat:100',
      reviewId: 'abc12345',
      summary: 'Demo call',
      startDate: '2026-06-22',
      startTime: '11:00',
      durationMinutes: 45,
      confidence: 0.7,
      createdAt: '2026-06-19T10:00:00.000Z',
    },
  },
  skipped: {},
};

assert.equal(listPendingReviews(state).length, 1);
assert.equal(findPendingReview(state, 'abc12345').summary, 'Demo call');
assert.equal(findPendingReview(state, 'chat:').summary, 'Demo call');

const dryRun = await confirmPendingReview(state, 'abc12345', {}, { dryRun: true });
assert.equal(dryRun.found, true);
assert.equal(dryRun.dryRun, true);
assert.equal(state.pendingReview['chat:100'].summary, 'Demo call');

const skipped = skipPendingReview(state, 'abc12345');
assert.equal(skipped.found, true);
assert.equal(state.pendingReview['chat:100'], undefined);
assert.equal(state.skipped['chat:100'].summary, 'Demo call');

console.log('review tests passed');

