import { DAILY_EPOCH, DAILY_TIMEZONE } from "@/lib/config";
import type { DailyChallenge, Difficulty, Track } from "@/types";

function tzParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    h: Number(parts.hour),
    m: Number(parts.minute),
    s: Number(parts.second),
  };
}

export function calendarDateInZone(date = new Date(), timeZone = DAILY_TIMEZONE): string {
  return tzParts(date, timeZone).date;
}

export function msUntilNextReset(date = new Date(), timeZone = DAILY_TIMEZONE): number {
  const { h, m, s } = tzParts(date, timeZone);
  const elapsed = ((h * 60 + m) * 60 + s) * 1000;
  const day = 24 * 60 * 60 * 1000;
  return day - elapsed;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function challengeNumberForDate(isoDate: string): number {
  const start = Date.parse(`${DAILY_EPOCH}T00:00:00+05:30`);
  const now = Date.parse(`${isoDate}T00:00:00+05:30`);
  const days = Math.floor((now - start) / 86400000);
  return days + 1;
}

function hashDate(isoDate: string): number {
  let h = 2166136261;
  for (let i = 0; i < isoDate.length; i++) {
    h ^= isoDate.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickDailyTrack(tracks: Track[], isoDate: string): Track {
  const active = tracks.filter((t) => t.active);
  const i = hashDate(isoDate) % active.length;
  return active[i];
}

export function buildDailyChallenge(tracks: Track[], isoDate: string): DailyChallenge {
  const track = pickDailyTrack(tracks, isoDate);
  const n = challengeNumberForDate(isoDate);
  return {
    id: `daily-${isoDate}`,
    date: isoDate,
    challengeNumber: n,
    trackId: track.id,
    difficulty: track.difficulty as Difficulty,
  };
}
