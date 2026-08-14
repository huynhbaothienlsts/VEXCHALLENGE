import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateScore, clampCount, driverFromRemaining, formatTime } from '../src/utils/challenge.js';

test('score calculator uses only Cups × 5 + Pins × 10', () => {
  assert.deepEqual(calculateScore(0, 0), { cups: 0, pins: 0, cupPoints: 0, pinPoints: 0, totalScore: 0 });
  assert.equal(calculateScore(1, 0).totalScore, 5);
  assert.equal(calculateScore(0, 1).totalScore, 10);
  assert.equal(calculateScore(3, 2).totalScore, 35);
});

test('score counts cannot become negative or fractional', () => {
  assert.equal(clampCount(-3), 0);
  assert.equal(clampCount(2.9), 2);
  assert.equal(calculateScore(-2, -1).totalScore, 0);
});

test('driver changes at exactly 3:00, 2:00 and 1:00', () => {
  assert.equal(driverFromRemaining(240_000), 0);
  assert.equal(driverFromRemaining(180_001), 0);
  assert.equal(driverFromRemaining(180_000), 1);
  assert.equal(driverFromRemaining(120_000), 2);
  assert.equal(driverFromRemaining(60_000), 3);
  assert.equal(driverFromRemaining(0), 3);
});

test('timer display rounds up while running and ends at zero', () => {
  assert.equal(formatTime(240_000), '4:00');
  assert.equal(formatTime(180_000), '3:00');
  assert.equal(formatTime(59_001), '1:00');
  assert.equal(formatTime(0), '0:00');
});
