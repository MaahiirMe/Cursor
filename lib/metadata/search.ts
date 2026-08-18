import { searchArtists as searchLocalArtists, searchTracks as searchLocalTracks } from "../search";
import type { SearchHit } from "../types";
import {
  cachedQuery,
  ingestArtists,
  ingestTracks,
  rememberQuery,
  searchCachedArtists,
  searchCachedTracks,
} from "./cache";
import { ITunesMetadataProvider } from "./itunes";
import { MusicBrainzMetadataProvider } from "./musicbrainz";
import { compact, normalizeText } from "../normalize";

const itunes = new ITunesMetadataProvider();
const musicbrainz = new MusicBrainzMetadataProvider();
const inflight = new Map<string, Promise<void>>();

function highlight(query: string, title: string): [number, number] | null {
  const q = query.trim();
  if (!q) return null;
  const idx = title.toLowerCase().indexOf(q.toLowerCase());
  if (idx >= 0) return [idx, idx + q.length];
  return null;
}

function rankName(query: string, name: string, aliases: string[] = []) {
  const q = normalizeText(query);
  const n = normalizeText(name);
  const c = compact(name);
  const qc = compact(query);
  if (!q) return 0;
  if (n === q) return 1000;
  if (c === qc) return name.replace(/\s+/g, "").length > q.length + 2 ? 1000 : 840;
  const first = n.split(" ")[0] ?? "";
  if (first.startsWith(q) && n.length > q.length + 2) return 940;
  if (n.startsWith(q) || c.startsWith(qc)) return 900;
  if (n.split(" ").some((t) => t.startsWith(q))) return 800;
  if (aliases.some((a) => normalizeText(a) === q || compact(a).startsWith(qc))) return 780;
  if (n.includes(q) || c.includes(qc)) return 400;
  return 120;
}

async function fillExternal(kind: "artists" | "tracks", q: string) {
  const key = `${kind}:${normalizeText(q)}`;
  const remembered = await cachedQuery(kind, q);
  if (remembered && Date.now() - remembered.at < 1000 * 60 * 60 * 6) return;
  if (inflight.has(key)) {
    await inflight.get(key);
    return;
  }
  const job = (async () => {
    try {
      if (kind === "artists") {
        let rows = await itunes.searchArtists(q);
        if (rows.length < 4) {
          const extra = await musicbrainz.searchArtists(q);
          rows = [...rows, ...extra];
        }
        await ingestArtists(rows);
        await rememberQuery("artists", q, rows.map((r) => r.id));
      } else {
        let rows = await itunes.searchTracks(q);
        if (rows.length < 4) {
          const extra = await musicbrainz.searchTracks(q);
          rows = [...rows, ...extra];
        }
        await ingestTracks(rows);
        await rememberQuery("tracks", q, rows.map((r) => r.id));
      }
    } catch {
      /* keep local results */
    }
  })();
  inflight.set(key, job);
  try {
    await job;
  } finally {
    inflight.delete(key);
  }
}

export async function hybridSearchArtists(query: string, limit = 8): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const local = searchLocalArtists(q);
  const cached = await searchCachedArtists(q);
  if (q.length >= 4) void fillExternal("artists", q);
  const seen = new Set<string>();
  const merged: Array<SearchHit & { rank: number }> = [];
  for (const hit of local) {
    seen.add(compact(hit.title));
    seen.add(hit.id);
    merged.push({
      ...hit,
      meta: hit.subtitle,
      local: true,
      rank: 2000 + (hit.highlight ? 20 : 0),
    });
  }
  for (const a of cached) {
    const key = a.compactName;
    if (seen.has(key) || seen.has(a.id)) continue;
    seen.add(key);
    seen.add(a.id);
    merged.push({
      id: a.id,
      title: a.name,
      subtitle: [a.genre, a.country].filter(Boolean).join(" · "),
      meta: [a.genre, a.country].filter(Boolean).join(" · "),
      highlight: highlight(q, a.name),
      local: false,
      rank: rankName(q, a.name, a.aliases) + a.popularity,
    });
  }
  return merged
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
    .map((hit) => ({
      id: hit.id,
      title: hit.title,
      subtitle: hit.subtitle,
      meta: hit.meta,
      local: hit.local,
      artistId: hit.artistId,
      artistIds: hit.artistIds,
      highlight: hit.highlight,
    }));
}

export async function hybridSearchTracks(query: string, limit = 8): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const local = searchLocalTracks(q);
  const cached = await searchCachedTracks(q);
  if (q.length >= 4) void fillExternal("tracks", q);
  const seen = new Set<string>();
  const merged: Array<SearchHit & { rank: number }> = [];
  for (const hit of local) {
    seen.add(`${compact(hit.title)}::${compact(hit.subtitle)}`);
    seen.add(hit.id);
    merged.push({
      ...hit,
      meta: hit.subtitle,
      local: true,
      rank: 2000,
    });
  }
  for (const t of cached) {
    const key = `${t.compactTitle}::${compact(t.artistName)}`;
    if (seen.has(key) || seen.has(t.id)) continue;
    seen.add(key);
    seen.add(t.id);
    const meta = [t.album, t.releaseYear].filter(Boolean).join(" · ");
    merged.push({
      id: t.id,
      title: t.title,
      subtitle: t.artistName,
      meta,
      artistId: t.artistId,
      highlight: highlight(q, t.title),
      local: false,
      rank: rankName(q, t.title) + t.popularity,
    });
  }
  return merged
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
    .map((hit) => ({
      id: hit.id,
      title: hit.title,
      subtitle: hit.subtitle,
      meta: hit.meta,
      local: hit.local,
      artistId: hit.artistId,
      artistIds: hit.artistIds,
      highlight: hit.highlight,
    }));
}
