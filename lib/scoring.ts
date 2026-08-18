import type { RevealSeconds } from "./types";

export const REVEAL_BASE: Record<RevealSeconds, number> = {
  1: 1000,
  2: 1000,
  4: 850,
  7: 700,
  11: 500,
  16: 300,
};

export const NEXT_REVEAL: Record<RevealSeconds, RevealSeconds | null> = {
  1: 2,
  2: 4,
  4: 7,
  7: 11,
  11: 16,
  16: null,
};

export const REVEAL_LADDER: RevealSeconds[] = [2, 4, 7, 11, 16];
export const HARD_LADDER: RevealSeconds[] = [1, 2, 4, 7, 11];

export function scoreCorrect(revealSeconds: RevealSeconds, wrongGuesses: number): number {
  const base = REVEAL_BASE[revealSeconds];
  return Math.max(100, base - wrongGuesses * 50);
}

export function previewScore(revealSeconds: RevealSeconds, wrongGuesses: number): number {
  return scoreCorrect(revealSeconds, wrongGuesses);
}
