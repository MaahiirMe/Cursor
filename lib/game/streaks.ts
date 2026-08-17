import type { GameResult } from "@/types";

export function nextStreak(params: {
  current: number;
  lastDailyDate: string | null;
  today: string;
  wonDaily: boolean;
}): { current: number; longestBump: boolean } {
  if (!params.wonDaily) {
    return { current: 0, longestBump: false };
  }
  if (params.lastDailyDate === params.today) {
    return { current: Math.max(params.current, 1), longestBump: false };
  }
  const yesterday = shiftDate(params.today, -1);
  if (params.lastDailyDate === yesterday) {
    return { current: params.current + 1, longestBump: true };
  }
  return { current: 1, longestBump: true };
}

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function favouriteMode(results: GameResult[]): GameResult["mode"] | null {
  if (!results.length) return null;
  const counts = new Map<string, number>();
  for (const r of results) {
    counts.set(r.mode, (counts.get(r.mode) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as GameResult["mode"];
}
