import type { GameMode } from "./types";

export const COPY = {
  brand: "DHHUH?",
  tagline: "SUNKE BATA.",
  supporting: "5 gaane. 5 chances each. Kitna DHH jaanta hai?",
  play: "SUN.",
  pause: "RUK.",
  submit: "LOCK KAR.",
  more: "AUR SUNNA HAI?",
  skip: "NO CLUE →",
  skipConfirm: "PAKKA?",
  skipYes: "HAAN",
  skipNo: "EK BAAR AUR SUN",
  correct: "HAAN BHAI.",
  correctLate: "CHALO, YAAD AA GAYA.",
  wrong: "NAH.",
  artistOnly: "ARTIST MIL GAYA. GAANA NAHI.",
  last: "LAST HAI.",
  skipped: "YEH THA BHAI.",
  introEnough: "INTRO HI KAAFI THA.",
  perfectSession: "TU REHNE DE. AUX TERA.",
  zeroSession: "PLAYLIST UPDATE KAR BHAI.",
  tip: "Sahi jawaab pe freeze. Galat pe next try. Khelte raho.",
  moreNote: "Zyada sunoge, zyada aasaan hoga.",
  only: "INDIAN DESI HIP-HOP ONLY",
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

export function modeLabel(mode: GameMode): string {
  if (mode === "daily") return "DAILY 5";
  if (mode === "hard") return "HARD?";
  return "STANDARD";
}
