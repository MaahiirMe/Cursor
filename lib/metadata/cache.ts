import { promises as fs } from "fs";
import path from "path";
import Fuse from "fuse.js";
import { allArtists, searchableTracks } from "../catalogue";
import { compact, normalizeText } from "../normalize";
import type { GlobalArtist, GlobalTrack } from "./types";

const file = path.join(process.cwd(), "data", "global-catalogue.json");

type DB = {
  artists: Record<string, GlobalArtist>;
  tracks: Record<string, GlobalTrack>;
  queries: Record<string, { kind: "artists" | "tracks"; ids: string[]; at: number }>;
};

let mem: DB | null = null;
let fuseArtists: Fuse<GlobalArtist> | null = null;
let fuseTracks: Fuse<GlobalTrack> | null = null;

function empty(): DB {
  return { artists: {}, tracks: {}, queries: {} };
}

async function load(): Promise<DB> {
  if (mem) return mem;
  try {
    mem = JSON.parse(await fs.readFile(file, "utf8")) as DB;
  } catch {
    mem = empty();
  }
  return mem;
}

let persistQueue: Promise<void> = Promise.resolve();
function persist(db: DB) {
  persistQueue = persistQueue.then(async () => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(db));
  });
}

function rebuildFuse(db: DB) {
  fuseArtists = new Fuse(Object.values(db.artists), {
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 1,
    keys: [
      { name: "name", weight: 0.6 },
      { name: "normalizedName", weight: 0.5 },
      { name: "aliases", weight: 0.45 },
    ],
  });
  fuseTracks = new Fuse(Object.values(db.tracks), {
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 1,
    keys: [
      { name: "title", weight: 0.6 },
      { name: "normalizedTitle", weight: 0.45 },
      { name: "artistName", weight: 0.25 },
    ],
  });
}

function localArtistMatch(name: string) {
  const n = normalizeText(name);
  const c = compact(name);
  return allArtists().find(
    (a) =>
      a.normalizedName === n ||
      compact(a.name) === c ||
      a.aliases.some((al) => normalizeText(al) === n || compact(al) === c),
  );
}

function localTrackMatch(title: string, artistName: string) {
  const tn = normalizeText(title);
  const tc = compact(title);
  const an = normalizeText(artistName);
  return searchableTracks().find((t) => {
    const titleHit = t.normalizedTitle === tn || compact(t.title) === tc || t.aliases.some((a) => compact(a) === tc);
    if (!titleHit) return false;
    return t.artists.some(
      (ar) => normalizeText(ar.name) === an || compact(ar.name) === compact(artistName),
    );
  });
}

export async function ingestArtists(items: GlobalArtist[]) {
  const db = await load();
  for (const item of items) {
    const local = localArtistMatch(item.name);
    const id = local?.id ?? item.id;
    const existing = Object.values(db.artists).find(
      (a) => a.compactName === item.compactName || a.id === id,
    );
    if (existing) {
      const aliases = new Set([...existing.aliases, ...item.aliases, item.name, existing.name]);
      existing.aliases = [...aliases].filter((x) => compact(x) !== existing.compactName);
      existing.popularity = Math.max(existing.popularity, item.popularity);
      existing.genre = existing.genre || item.genre;
      existing.country = existing.country || item.country;
      if (local) existing.id = local.id;
      db.artists[existing.id] = existing;
      continue;
    }
    const stored = { ...item, id, name: local?.name ?? item.name };
    db.artists[id] = stored;
  }
  fuseArtists = null;
  persist(db);
}

export async function ingestTracks(items: GlobalTrack[]) {
  const db = await load();
  for (const item of items) {
    const local = localTrackMatch(item.title, item.artistName);
    const id = local?.id ?? item.id;
    const key = `${item.compactTitle}::${compact(item.artistName)}`;
    const existing = Object.values(db.tracks).find(
      (t) => `${t.compactTitle}::${compact(t.artistName)}` === key || t.id === id,
    );
    if (existing) {
      existing.popularity = Math.max(existing.popularity, item.popularity);
      existing.album = existing.album || item.album;
      existing.releaseYear = existing.releaseYear || item.releaseYear;
      if (local) existing.id = local.id;
      db.tracks[existing.id] = existing;
      continue;
    }
    db.tracks[id] = { ...item, id, title: local?.title ?? item.title };
  }
  fuseTracks = null;
  persist(db);
}

export async function cachedQuery(kind: "artists" | "tracks", q: string) {
  const db = await load();
  return db.queries[`${kind}:${normalizeText(q)}`];
}

export async function rememberQuery(kind: "artists" | "tracks", q: string, ids: string[]) {
  const db = await load();
  db.queries[`${kind}:${normalizeText(q)}`] = { kind, ids, at: Date.now() };
  persist(db);
}

export async function searchCachedArtists(query: string): Promise<GlobalArtist[]> {
  const db = await load();
  if (!fuseArtists) rebuildFuse(db);
  const q = query.trim();
  const n = normalizeText(q);
  const c = compact(q);
  const prefix = Object.values(db.artists).filter(
    (a) => a.normalizedName.startsWith(n) || a.compactName.startsWith(c) || a.aliases.some((al) => normalizeText(al).startsWith(n)),
  );
  const fused = fuseArtists?.search(q) ?? [];
  const map = new Map<string, GlobalArtist>();
  for (const a of prefix) map.set(a.id, a);
  for (const f of fused) {
    if ((f.score ?? 1) < 0.45) map.set(f.item.id, f.item);
  }
  return [...map.values()];
}

export async function resolveLocalArtistId(id: string): Promise<string> {
  if (!id) return id;
  const local = allArtists().find((a) => a.id === id);
  if (local) return local.id;
  const db = await load();
  const row = db.artists[id] ?? Object.values(db.artists).find((a) => a.id === id);
  if (!row) return id;
  return localArtistMatch(row.name)?.id ?? row.id;
}

export async function resolveLocalTrackId(id: string): Promise<string> {
  if (!id) return id;
  const known = searchableTracks().find((t) => t.id === id);
  if (known) return known.id;
  const db = await load();
  const row = db.tracks[id] ?? Object.values(db.tracks).find((t) => t.id === id);
  if (!row) return id;
  return localTrackMatch(row.title, row.artistName)?.id ?? row.id;
}

export async function searchCachedTracks(query: string): Promise<GlobalTrack[]> {
  const db = await load();
  if (!fuseTracks) rebuildFuse(db);
  const q = query.trim();
  const n = normalizeText(q);
  const c = compact(q);
  const prefix = Object.values(db.tracks).filter(
    (t) => t.normalizedTitle.startsWith(n) || t.compactTitle.startsWith(c),
  );
  const fused = fuseTracks?.search(q) ?? [];
  const map = new Map<string, GlobalTrack>();
  for (const t of prefix) map.set(t.id, t);
  for (const f of fused) {
    if ((f.score ?? 1) < 0.45) map.set(f.item.id, f.item);
  }
  return [...map.values()];
}
