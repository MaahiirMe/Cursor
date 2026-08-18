import { resolveLivePlayback } from "../audio/live";
import { getArtist, playableTracks } from "../catalogue";
import { SESSION_SLOTS } from "../catalogue/tiers";
import { hintsFor } from "../catalogue/hints";
import type { ArtistTier, GameMode, Track } from "../types";
import type { PreparedTrack } from "../audio/types";

export type ServeHistory = {
  trackIds: string[];
  artistIds: string[];
};

const TRACK_COOLDOWN = 36;
const ARTIST_COOLDOWN = 10;

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function competitive(track: Track) {
  if (!track.active || track.genre !== "DHH" || track.country !== "IN") return false;
  if (!track.licensedPreviewUrl) return false;
  if (!track.startVerified) return false;
  if (/\(from\s/i.test(track.title)) return false;
  const hints = hintsFor(track);
  return hints.length === 3 && hints.every(Boolean);
}

function weight(track: Track, mode: GameMode) {
  const rec = track.recognitionScore ?? 40;
  const diff = track.difficulty;
  const recBoost = rec >= 45 ? rec : rec * 0.45;
  const modeBias =
    mode === "hard" ? (diff >= 4 ? 18 : 4) : mode === "daily" ? (diff === 3 ? 12 : 6) : 10 - Math.abs(diff - 3) * 3;
  return Math.max(1, recBoost + modeBias);
}

function pickWeighted(rows: Track[], rand: () => number, w: (t: Track) => number) {
  const total = rows.reduce((s, t) => s + w(t), 0);
  let needle = rand() * total;
  for (const t of rows) {
    needle -= w(t);
    if (needle <= 0) return t;
  }
  return rows[rows.length - 1];
}

function recognizable(rows: Track[]) {
  const strong = rows.filter((t) => (t.recognitionScore ?? 0) >= 45);
  if (strong.length) return strong;
  return [...rows].sort((a, b) => (b.recognitionScore ?? 0) - (a.recognitionScore ?? 0)).slice(0, 6);
}

export async function pickSessionTracks(
  mode: GameMode,
  history: ServeHistory,
  seed: number,
): Promise<Array<{ track: Track; prepared: NonNullable<Awaited<ReturnType<typeof resolveLivePlayback>>> }>> {
  const rand = mulberry32(seed);
  const recentTracks = new Set(history.trackIds.slice(-TRACK_COOLDOWN));
  const recentArtists = new Set(history.artistIds.slice(-ARTIST_COOLDOWN));
  const pool = playableTracks().filter(competitive);
  const byTier = new Map<ArtistTier, Track[]>();
  for (const t of pool) {
    const artist = getArtist(t.primaryArtistId);
    const tier = artist?.tier ?? "new";
    const list = byTier.get(tier) ?? [];
    list.push(t);
    byTier.set(tier, list);
  }

  const chosen: Track[] = [];
  const usedArtists = new Set<string>();
  const usedTracks = new Set<string>();

  const take = (candidates: Track[]) => {
    const open = candidates.filter(
      (t) =>
        !usedTracks.has(t.id) &&
        !usedArtists.has(t.primaryArtistId) &&
        !recentTracks.has(t.id),
    );
    const fresh = open.filter((t) => !recentArtists.has(t.primaryArtistId));
    const source = recognizable(fresh.length ? fresh : open);
    if (!source.length) return null;
    return pickWeighted(source, rand, (t) => weight(t, mode));
  };

  for (const slot of SESSION_SLOTS) {
    if (chosen.length >= 5) break;
    const hit = take(byTier.get(slot) ?? []);
    if (!hit) continue;
    chosen.push(hit);
    usedTracks.add(hit.id);
    usedArtists.add(hit.primaryArtistId);
  }

  while (chosen.length < 5) {
    const hit = take(pool);
    if (!hit) break;
    chosen.push(hit);
    usedTracks.add(hit.id);
    usedArtists.add(hit.primaryArtistId);
  }

  const prepared: Array<{ track: Track; prepared: PreparedTrack }> = [];
  for (const track of chosen) {
    const live = await resolveLivePlayback(track);
    if (!live || live.providerId !== "licensed" || !live.audioUrl) continue;
    prepared.push({ track, prepared: live });
  }

  if (prepared.length < 5) {
    for (const t of pool.sort(() => rand() - 0.5)) {
      if (prepared.length >= 5) break;
      if (prepared.some((p) => p.track.id === t.id || p.track.primaryArtistId === t.primaryArtistId)) continue;
      const live = await resolveLivePlayback(t);
      if (!live || live.providerId !== "licensed") continue;
      prepared.push({ track: t, prepared: live });
    }
  }

  if (prepared.length < 5) {
    throw new Error("Not enough blind-playable DHH tracks");
  }

  return prepared.slice(0, 5);
}
