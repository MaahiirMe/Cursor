import type { RankDef } from "@/types";

/** Rank ladder is data, not copy baked into UI. */
export const RANKS: RankDef[] = [
  { id: "passenger", name: "Playlist Passenger", minXp: 0 },
  { id: "aux", name: "Aux Wala Banda", minXp: 400 },
  { id: "regular", name: "Scene Regular", minXp: 1200 },
  { id: "detective", name: "Beat Detective", minXp: 2800 },
  { id: "archivist", name: "DHH Archivist", minXp: 5500 },
  { id: "genius", name: "Walking Genius Page", minXp: 10000 },
];

export function rankForXp(xp: number): RankDef {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXp) current = rank;
  }
  return current;
}

export function rankProgress(xp: number): { rank: RankDef; next: RankDef | null; pct: number } {
  const rank = rankForXp(xp);
  const idx = RANKS.findIndex((r) => r.id === rank.id);
  const next = RANKS[idx + 1] ?? null;
  if (!next) return { rank, next: null, pct: 1 };
  const span = next.minXp - rank.minXp;
  const pct = Math.min(1, Math.max(0, (xp - rank.minXp) / span));
  return { rank, next, pct };
}
