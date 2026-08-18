import Fuse from "fuse.js";
import { allArtists, searchableTracks, artistLine } from "./catalogue";
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
  if (aliases.some((a) => normalizeText(a) === q || compact(a) === qc)) return 85;
  if (aliases.some((a) => normalizeText(a).startsWith(q) || compact(a).startsWith(qc)))
    return 78;
  if (n.includes(q) || c.includes(qc)) return 40;
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
  trackFuse ??= new Fuse(searchableTracks(), {
    includeScore: true,
    threshold: 0.42,
    ignoreLocation: true,
    minMatchCharLength: 1,
    keys: [
      { name: "title", weight: 0.6 },
      { name: "normalizedTitle", weight: 0.5 },
      { name: "aliases", weight: 0.45 },
      { name: "artists.name", weight: 0.2 },
    ],
  });
  return trackFuse;
}

function getArtistFuse() {
  artistFuse ??= new Fuse(allArtists(), {
    includeScore: true,
    threshold: 0.42,
    ignoreLocation: true,
    minMatchCharLength: 1,
    keys: [
      { name: "name", weight: 0.6 },
      { name: "normalizedName", weight: 0.5 },
      { name: "aliases", weight: 0.55 },
    ],
  });
  return artistFuse;
}

export function searchTracks(query: string, limit = 8): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const fused = getTrackFuse().search(q);
  const scored = searchableTracks()
    .map((t) => {
      const fuse = fused.find((f) => f.item.id === t.id);
      const fuzzy = fuse ? Math.round((1 - (fuse.score ?? 1)) * 55) : 0;
      const boost = rankBoost(q, t.title, [
        ...t.aliases,
        ...t.artists.map((a) => a.name),
      ]);
      const popularity = 6 - t.difficulty;
      return { t, score: boost + fuzzy + popularity, boost, fuzzy };
    })
    .filter(
      (x) =>
        x.boost >= 70 ||
        (q.length <= 2 && x.boost >= 90) ||
        (x.boost >= 40 && x.fuzzy >= 18) ||
        (q.length >= 4 && x.fuzzy >= 42),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ t }) => ({
    id: t.id,
    title: t.title,
    subtitle: artistLine(t),
    meta: [t.album, t.releaseYear].filter(Boolean).join(" · ") || undefined,
    artistId: t.primaryArtistId,
    artistIds: t.artists.map((a) => a.id),
    highlight: highlightRange(q, t.title),
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
      const fuzzy = fuse ? Math.round((1 - (fuse.score ?? 1)) * 55) : 0;
      const boost = rankBoost(q, a.name, a.aliases);
      return { a, score: boost + fuzzy, boost, fuzzy };
    })
    .filter((x) => x.boost >= 70 || (x.boost >= 40 && x.fuzzy >= 18) || (q.length >= 4 && x.fuzzy >= 42))
    .sort((a, b) => b.score - a.score);

  const hits: SearchHit[] = [];
  for (const { a } of scored) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    hits.push({
      id: a.id,
      title: a.name,
      subtitle: ["DHH", a.country].filter(Boolean).join(" · "),
      highlight: highlightRange(q, a.name),
    });
    if (hits.length >= limit) break;
  }
  return hits;
}
