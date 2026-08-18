import Fuse from "fuse.js";
import { allArtists, playableTracks, artistLine } from "./catalogue";
import { compact, normalizeText, tokens } from "./normalize";
import type { Artist, SearchHit, Track } from "./types";

function rankBoost(query: string, text: string, aliases: string[]): number {
  const q = normalizeText(query);
  const n = normalizeText(text);
  const c = compact(text);
  const qc = compact(query);
  if (!q) return 0;
  if (n === q || c === qc) return 100;
  if (n.startsWith(q) || c.startsWith(qc)) return 90;
  if (tokens(n).some((t) => t.startsWith(q))) return 80;
  if (aliases.some((a) => normalizeText(a) === q || compact(a) === qc)) return 75;
  if (aliases.some((a) => normalizeText(a).startsWith(q) || compact(a).startsWith(qc)))
    return 70;
  return 0;
}

function highlightRange(query: string, title: string): [number, number] | null {
  const q = query.trim();
  if (!q) return null;
  const idx = title.toLowerCase().indexOf(q.toLowerCase());
  if (idx >= 0) return [idx, idx + q.length];
  return null;
}

let trackFuse: Fuse<Track> | null = null;
let artistFuse: Fuse<Artist> | null = null;

function getTrackFuse() {
  trackFuse ??= new Fuse(playableTracks(), {
    includeScore: true,
    threshold: 0.38,
    ignoreLocation: true,
    keys: [
      { name: "title", weight: 0.6 },
      { name: "normalizedTitle", weight: 0.5 },
      { name: "aliases", weight: 0.4 },
      { name: "artists.name", weight: 0.2 },
    ],
  });
  return trackFuse;
}

function getArtistFuse() {
  artistFuse ??= new Fuse(allArtists(), {
    includeScore: true,
    threshold: 0.38,
    ignoreLocation: true,
    keys: [
      { name: "name", weight: 0.6 },
      { name: "normalizedName", weight: 0.5 },
      { name: "aliases", weight: 0.5 },
    ],
  });
  return artistFuse;
}

export function searchTracks(query: string, limit = 8): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const fused = getTrackFuse().search(q);
  const scored = playableTracks()
    .map((t) => {
      const fuse = fused.find((f) => f.item.id === t.id);
      const fuzzy = fuse ? Math.round((1 - (fuse.score ?? 1)) * 50) : 0;
      const boost = rankBoost(q, t.title, t.aliases);
      const popularity = 6 - t.difficulty;
      return { t, score: boost + fuzzy + popularity };
    })
    .filter((x) => x.score > 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ t }, i) => ({
    id: t.id,
    title: t.title.toUpperCase(),
    subtitle: artistLine(t).toUpperCase(),
    highlight: i === 0 ? highlightRange(q, t.title.toUpperCase()) : highlightRange(q, t.title.toUpperCase()),
  }));
}

export function searchArtists(query: string, limit = 8): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const fused = getArtistFuse().search(q);
  const seen = new Set<string>();
  const scored = allArtists()
    .map((a) => {
      const fuse = fused.find((f) => f.item.id === a.id);
      const fuzzy = fuse ? Math.round((1 - (fuse.score ?? 1)) * 50) : 0;
      const boost = rankBoost(q, a.name, a.aliases);
      return { a, score: boost + fuzzy };
    })
    .filter((x) => x.score > 8)
    .sort((a, b) => b.score - a.score);

  const hits: SearchHit[] = [];
  for (const { a } of scored) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    hits.push({
      id: a.id,
      title: a.name.toUpperCase(),
      subtitle: a.aliases[0]?.toUpperCase() ?? a.sceneTags.join(" · ").toUpperCase(),
      highlight: highlightRange(q, a.name.toUpperCase()),
    });
    if (hits.length >= limit) break;
  }
  return hits;
}
