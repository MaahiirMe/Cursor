export const START_SCORE = 1000;
export const MIN_CORRECT = 100;
export const WRONG_PENALTY = 50;
export const LISTEN_STEP = 2;
export const LISTEN_PENALTY = 75;
export const MAX_SECONDS = 16;
export const HINT_COSTS = [75, 125, 200] as const;
export const MAX_HINTS = 3;
export const MAX_ATTEMPTS = 5;

export function extraListenSteps(revealSeconds: number, initialSeconds: number): number {
  return Math.max(0, Math.round((revealSeconds - initialSeconds) / LISTEN_STEP));
}

export function possibleScore(opts: {
  initialSeconds: number;
  revealSeconds: number;
  wrongGuesses: number;
  hintsPurchased: number;
}): number {
  let score = START_SCORE;
  score -= extraListenSteps(opts.revealSeconds, opts.initialSeconds) * LISTEN_PENALTY;
  score -= opts.wrongGuesses * WRONG_PENALTY;
  for (let i = 0; i < opts.hintsPurchased; i++) score -= HINT_COSTS[i] ?? 0;
  return Math.max(MIN_CORRECT, score);
}

export function nextSeconds(current: number): number | null {
  const next = current + LISTEN_STEP;
  return next <= MAX_SECONDS ? next : null;
}
