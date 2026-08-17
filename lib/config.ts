export const SITE = {
  name: "BEAT PEHCHAAN",
  tagline: "PEHCHAAN BEAT SE.",
  sub: "Lyrics ke bina gaana pehchaan ke dikha.",
  domain: "beatpehchaan.in",
  instagram: "https://instagram.com/beatpehchaan",
  x: "https://x.com/beatpehchaan",
} as const;

/** Daily challenge reset timezone. Keep explicit so IST vs UTC never silently drifts. */
export const DAILY_TIMEZONE = "Asia/Kolkata";

/** Challenge #1 lands on this calendar date in DAILY_TIMEZONE. */
export const DAILY_EPOCH = "2026-07-22";

export const GUEST_COOKIE = "bp_guest";
export const GUEST_STORAGE_KEY = "beat-pehchaan-guest";
