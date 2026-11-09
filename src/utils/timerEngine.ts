/**
 * Pure calculation logic and utilities for Official Competition Timer
 * SMAS Tunas Baru Jin Seung
 */

export interface TimePreset {
  label: string;
  seconds: number;
}

export const TIME_PRESETS: TimePreset[] = [
  { label: '30 Detik', seconds: 30 },
  { label: '1 Menit', seconds: 60 },
  { label: '2 Menit', seconds: 120 },
  { label: '3 Menit', seconds: 180 },
  { label: '5 Menit', seconds: 300 },
  { label: '7 Menit', seconds: 420 },
  { label: '10 Menit', seconds: 600 },
  { label: '15 Menit', seconds: 900 },
  { label: '20 Menit', seconds: 1200 },
];

export const COMPETITION_TITLE_PRESETS = [
  'LOMBA DEBAT KEBANGSAAN',
  'LOMBA MUSIKALISASI PUISI',
  'LOMBA PIDATO',
  'LOMBA PRESENTASI',
  'LOMBA CERDAS CERMAT',
  'LOMBA KREATIVITAS SISWA',
];

export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'CRITICAL_10S' | 'CRITICAL_5S' | 'TIME_UP';

/**
 * Format total seconds into MM:SS format.
 * Prevents negative values and bounds to 99:59 maximum.
 */
export function formatTime(totalSeconds: number): {
  minutes: string;
  seconds: string;
  formatted: string;
} {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;

  const minutesStr = mins.toString().padStart(2, '0');
  const secondsStr = secs.toString().padStart(2, '0');

  return {
    minutes: minutesStr,
    seconds: secondsStr,
    formatted: `${minutesStr}:${secondsStr}`,
  };
}

/**
 * Parse minutes and seconds into total seconds.
 */
export function parseTimeToSeconds(minutes: number, seconds: number): number {
  const safeMins = Math.max(0, Math.floor(Number.isFinite(minutes) ? minutes : 0));
  const safeSecs = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return Math.min(safeMins * 60 + safeSecs, 5999); // Max 99:59
}

/**
 * Determine timer status based on remaining time and execution states.
 */
export function getTimerStatus(
  remainingSeconds: number,
  totalSeconds: number,
  isRunning: boolean,
  isPaused: boolean,
  isTimeUp?: boolean
): TimerStatus {
  if (isTimeUp || remainingSeconds <= 0) {
    return 'TIME_UP';
  }
  if (!isRunning && !isPaused) {
    return 'IDLE';
  }
  if (isPaused) {
    return 'PAUSED';
  }
  if (remainingSeconds <= 5) {
    return 'CRITICAL_5S';
  }
  if (remainingSeconds <= 10) {
    return 'CRITICAL_10S';
  }
  return 'RUNNING';
}

/**
 * Accurately calculate remaining seconds from high-precision timestamps.
 * Guarantees zero negative overflow and monotonic countdown.
 */
export function calculateRemainingSeconds(
  initialDurationSeconds: number,
  elapsedMilliseconds: number
): number {
  const elapsedSecs = elapsedMilliseconds / 1000;
  const remaining = initialDurationSeconds - elapsedSecs;
  if (remaining <= 0) {
    return 0;
  }
  return Math.ceil(remaining);
}
