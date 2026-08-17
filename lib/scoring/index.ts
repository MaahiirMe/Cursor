import type { GameMode } from "@/types";

/** Central scoring table. Tweak here — game + API both import this. */
export const REVEAL_STEPS = [2, 4, 7, 11, 16] as const;
export type RevealSeconds = (typeof REVEAL_STEPS)[number];

export const REVEAL_SCORE: Record<RevealSeconds, number> = {
  2: 1000,
  4: 850,
  7: 700,
  11: 500,
  16: 300,
};

export const WRONG_GUESS_PENALTY = 40;
export const MAX_ATTEMPTS = 5;
export const ONE_SECOND_ATTEMPTS = 3;
export const ONE_SECOND_REVEAL = 1;
export const ONE_SECOND_BASE_SCORE = 1200;
export const ONE_SECOND_XP_MULTIPLIER = 1.75;

export const XP = {
  correct: 40,
  perfectTwoSec: 35,
  dailyBonus: 25,
  streakPerDay: 8,
  hardModeBonus: 20,
  achievement: 50,
};

export function scoreForReveal(seconds: number): number {
  if (seconds <= 1) return ONE_SECOND_BASE_SCORE;
  const step = REVEAL_STEPS.find((s) => s === seconds);
  if (step) return REVEAL_SCORE[step];
  const nearest = [...REVEAL_STEPS].reverse().find((s) => s <= seconds);
  return nearest ? REVEAL_SCORE[nearest] : REVEAL_SCORE[16];
}

export function nextReveal(current: number): number | null {
  const i = REVEAL_STEPS.indexOf(current as RevealSeconds);
  if (i === -1) {
    const n = REVEAL_STEPS.find((s) => s > current);
    return n ?? null;
  }
  return REVEAL_STEPS[i + 1] ?? null;
}

export function computeScore(params: {
  correct: boolean;
  revealDuration: number;
  wrongGuesses: number;
  mode: GameMode;
}): number {
  if (!params.correct) return 0;
  const base = scoreForReveal(params.revealDuration);
  const penalty = params.wrongGuesses * WRONG_GUESS_PENALTY;
  const raw = Math.max(0, base - penalty);
  if (params.mode === "one-second") {
    return Math.round(raw * 1.1);
  }
  return raw;
}

export function computeXp(params: {
  correct: boolean;
  revealDuration: number;
  mode: GameMode;
  streak: number;
  practice?: boolean;
}): number {
  if (params.practice || !params.correct) return 0;
  let xp = XP.correct;
  if (params.revealDuration <= 2) xp += XP.perfectTwoSec;
  if (params.mode === "daily") xp += XP.dailyBonus;
  if (params.mode === "one-second") xp += XP.hardModeBonus;
  if (params.streak > 1) {
    xp += Math.min(40, (params.streak - 1) * XP.streakPerDay);
  }
  if (params.mode === "one-second") {
    xp = Math.round(xp * ONE_SECOND_XP_MULTIPLIER);
  }
  return xp;
}

export function modeConfig(mode: GameMode): {
  mode: GameMode;
  maxAttempts: number;
  reveals: number[];
  xpMultiplier: number;
  allowExtend: boolean;
} {
  if (mode === "one-second") {
    return {
      mode,
      maxAttempts: ONE_SECOND_ATTEMPTS,
      reveals: [ONE_SECOND_REVEAL],
      xpMultiplier: ONE_SECOND_XP_MULTIPLIER,
      allowExtend: false,
    };
  }
  return {
    mode,
    maxAttempts: MAX_ATTEMPTS,
    reveals: [...REVEAL_STEPS],
    xpMultiplier: 1,
    allowExtend: true,
  };
}
