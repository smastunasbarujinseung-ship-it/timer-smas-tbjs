import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  parseTimeToSeconds,
  getTimerStatus,
  calculateRemainingSeconds,
  TIME_PRESETS,
  COMPETITION_TITLE_PRESETS,
} from './timerEngine';

test('formatTime formats standard minutes and seconds correctly', () => {
  assert.deepEqual(formatTime(120), {
    minutes: '02',
    seconds: '00',
    formatted: '02:00',
  });

  assert.deepEqual(formatTime(65), {
    minutes: '01',
    seconds: '05',
    formatted: '01:05',
  });

  assert.deepEqual(formatTime(0), {
    minutes: '00',
    seconds: '00',
    formatted: '00:00',
  });
});

test('formatTime handles negative and decimal seconds safely', () => {
  assert.deepEqual(formatTime(-10), {
    minutes: '00',
    seconds: '00',
    formatted: '00:00',
  });

  assert.deepEqual(formatTime(59.9), {
    minutes: '00',
    seconds: '59',
    formatted: '00:59',
  });
});

test('parseTimeToSeconds accurately converts minutes and seconds', () => {
  assert.equal(parseTimeToSeconds(2, 30), 150);
  assert.equal(parseTimeToSeconds(0, 45), 45);
  assert.equal(parseTimeToSeconds(10, 0), 600);
  assert.equal(parseTimeToSeconds(-5, -10), 0);
});

test('getTimerStatus identifies correct competition states', () => {
  // Idle state
  assert.equal(getTimerStatus(120, 120, false, false), 'IDLE');

  // Paused state
  assert.equal(getTimerStatus(95, 120, false, true), 'PAUSED');

  // Normal running state
  assert.equal(getTimerStatus(80, 120, true, false), 'RUNNING');

  // 10 seconds critical countdown
  assert.equal(getTimerStatus(10, 120, true, false), 'CRITICAL_10S');
  assert.equal(getTimerStatus(6, 120, true, false), 'CRITICAL_10S');

  // 5 seconds ultra-critical countdown
  assert.equal(getTimerStatus(5, 120, true, false), 'CRITICAL_5S');
  assert.equal(getTimerStatus(1, 120, true, false), 'CRITICAL_5S');

  // 00:00 time up
  assert.equal(getTimerStatus(0, 120, false, false), 'TIME_UP');
  assert.equal(getTimerStatus(-1, 120, false, false), 'TIME_UP');
  assert.equal(getTimerStatus(120, 120, false, false, true), 'TIME_UP');
});

test('calculateRemainingSeconds handles timestamp elapsed deltas without going negative', () => {
  // Initial 120s with 0ms elapsed
  assert.equal(calculateRemainingSeconds(120, 0), 120);

  // 1.2s elapsed -> remaining is 118.8s which rounds up to 119s display
  assert.equal(calculateRemainingSeconds(120, 1200), 119);

  // 120s elapsed -> exactly 0
  assert.equal(calculateRemainingSeconds(120, 120000), 0);

  // Over-elapsed -> clamps strictly to 0
  assert.equal(calculateRemainingSeconds(120, 130000), 0);
});

test('presets include all required default times and competition categories', () => {
  assert.equal(TIME_PRESETS.length >= 9, true);
  assert.equal(TIME_PRESETS.some((p) => p.seconds === 30), true);
  assert.equal(TIME_PRESETS.some((p) => p.seconds === 120), true);
  assert.equal(TIME_PRESETS.some((p) => p.seconds === 1200), true);

  assert.equal(COMPETITION_TITLE_PRESETS.includes('LOMBA DEBAT KEBANGSAAN'), true);
  assert.equal(COMPETITION_TITLE_PRESETS.includes('LOMBA MUSIKALISASI PUISI'), true);
  assert.equal(COMPETITION_TITLE_PRESETS.includes('LOMBA PIDATO'), true);
  assert.equal(COMPETITION_TITLE_PRESETS.includes('LOMBA CERDAS CERMAT'), true);
});
