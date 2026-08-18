import type { GameMode } from "./types";

export const COPY = {
  brand: "DHHUH?",
  tagline: "SUNKE BATA.",
  loop: "SUN → PEHCHAAN → SELECT → LOCK KAR.",
  supporting: "5 gaane. 5 chances each. Kitna DHH jaanta hai?",
  play: "PLAY",
  pause: "PAUSE",
  submit: "LOCK KAR.",
  plus2: "+2 SEC",
  hint: "HINT",
  skip: "NO CLUE →",
  skipConfirm: "PAKKA?",
  skipYes: "SKIP",
  skipNo: "EK BAAR AUR SUN",
  searchSong: "Search song...",
  searchArtist: "Search artist...",
  correct: "HAAN BHAI.",
  correctLate: "CHALO, YAAD AA GAYA.",
  artistOnly: "ARTIST SAHI. GAANA NAHI.",
  last: "LAST HAI.",
  skipped: "YEH THA BHAI.",
  introEnough: "INTRO HI KAAFI THA.",
  only: "INDIAN DESI HIP-HOP ONLY",
  error: "Kuch toot gaya. Phir se try kar.",
} as const;

export function resultHeadline(solved: number): string {
  switch (solved) {
    case 5:
      return "AUX TERA.";
    case 4:
      return "SCENE PAKKI HAI.";
    case 3:
      return "THEEK HAI BHAI.";
    case 2:
      return "THODA AUR SUN.";
    case 1:
      return "ALGORITHM NE DHOKHA DIYA.";
    default:
      return "PLAYLIST UPDATE KAR.";
  }
}

export function correctCopy(opts: {
  attemptsUsed: number;
  revealSeconds: number;
}): string {
  if (opts.revealSeconds <= 2 && opts.attemptsUsed <= 1) return COPY.introEnough;
  if (opts.attemptsUsed >= 3) return COPY.correctLate;
  return COPY.correct;
}

export function wrongCopy(attemptsLeft: number): string {
  if (attemptsLeft <= 0) return COPY.skipped;
  if (attemptsLeft === 1) return `NAH. LAST CHANCE.`;
  return `NAH. ${attemptsLeft} CHANCES LEFT.`;
}

export function modeLabel(mode: GameMode): string {
  if (mode === "daily") return "DAILY 5";
  if (mode === "hard") return "HARD?";
  return "STANDARD";
}
