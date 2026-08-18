import { promises as fs } from "fs";
import path from "path";
import type { Artist, Track } from "../types";
import { normalizeText } from "../normalize";
import { defaultArtistTier } from "./tiers";
import { hintsFor } from "./hints";
import seed from "../../catalogue/seed.json";

export type PlaylistSource = {
  id: string;
  name: string;
  kind: string;
  note: string;
};

export type CatalogueFile = {
  artists: Array<{
    id: string;
    name: string;
    aliases: string[];
    sceneTags: string[];
    country?: "IN" | "PK";
    active?: boolean;
    imageUrl?: string;
    tier?: "mainstream" | "established" | "rising" | "underground" | "new";
  }>;
  tracks: Array<{
    id: string;
    title: string;
    artistIds: string[];
    primaryArtistId: string;
    aliases: string[];
    album?: string;
    releaseYear?: number;
    youtubeVideoId?: string;
    youtubeStartFaithful?: boolean;
    licensedPreviewUrl?: string;
    detectedStartSeconds?: number;
    gameStartSeconds?: number;
    startVerified?: boolean;
    recognitionScore?: number;
    sourcePlaylists: string[];
    sceneTags: string[];
    difficulty: 1 | 2 | 3 | 4 | 5;
    active: boolean;
    introQuality: "faithful" | "uncertain" | "unusable";
    artworkUrl?: string;
    hints?: [string, string, string];
    country?: "IN";
    genre?: "DHH";
  }>;
  playlists: PlaylistSource[];
};

const overrideFile = path.join(process.cwd(), "data", "catalogue-overrides.json");

let mem: { artists: Artist[]; tracks: Track[]; playlists: PlaylistSource[] } | null = null;

function hydrate(file: CatalogueFile) {
  const artists: Artist[] = file.artists.map((a) => ({
    id: a.id,
    name: a.name,
    normalizedName: normalizeText(a.name),
    aliases: a.aliases,
    country: a.country ?? "IN",
    sceneTags: a.sceneTags,
    active: a.active !== false,
    tier: a.tier ?? defaultArtistTier(a.id, a.sceneTags),
  }));
  const byId = new Map(artists.map((a) => [a.id, a]));
  const tracks: Track[] = file.tracks.map((t) => {
    const refs = t.artistIds.map((id) => {
      const a = byId.get(id);
      if (!a) throw new Error(`Unknown artist ${id} on ${t.id}`);
      return {
        id,
        name: a.name,
        role: (id === t.primaryArtistId ? "primary" : "feature") as "primary" | "feature",
      };
    });
    const track: Track = {
      id: t.id,
      title: t.title,
      normalizedTitle: normalizeText(t.title),
      artists: refs,
      primaryArtistId: t.primaryArtistId,
      aliases: t.aliases,
      album: t.album,
      releaseYear: t.releaseYear,
      artworkUrl: t.artworkUrl,
      youtubeVideoId: t.youtubeVideoId,
      youtubeStartFaithful: t.youtubeStartFaithful,
      licensedPreviewUrl: t.licensedPreviewUrl,
      detectedStartSeconds: t.detectedStartSeconds,
      gameStartSeconds: t.gameStartSeconds,
      startVerified: Boolean(t.startVerified && t.licensedPreviewUrl),
      recognitionScore: t.recognitionScore ?? 50,
      sourcePlaylists: t.sourcePlaylists,
      country: "IN",
      genre: "DHH",
      sceneTags: t.sceneTags,
      difficulty: t.difficulty,
      active: t.active,
      introQuality: t.introQuality,
      hints: t.hints,
    };
    if (!track.hints) track.hints = hintsFor(track);
    return track;
  });
  return { artists, tracks, playlists: file.playlists };
}

function merge(base: CatalogueFile, over?: Partial<CatalogueFile>): CatalogueFile {
  if (!over) return base;
  const artists = [...base.artists];
  for (const a of over.artists ?? []) {
    const i = artists.findIndex((x) => x.id === a.id);
    if (i >= 0) artists[i] = { ...artists[i], ...a };
    else artists.push(a);
  }
  const tracks = [...base.tracks];
  for (const t of over.tracks ?? []) {
    const i = tracks.findIndex((x) => x.id === t.id);
    if (i >= 0) tracks[i] = { ...tracks[i], ...t };
    else tracks.push(t);
  }
  return {
    artists,
    tracks,
    playlists: over.playlists ?? base.playlists,
  };
}

async function readOverride(): Promise<Partial<CatalogueFile> | undefined> {
  try {
    return JSON.parse(await fs.readFile(overrideFile, "utf8")) as Partial<CatalogueFile>;
  } catch {
    return undefined;
  }
}

export async function loadCatalogue() {
  const over = await readOverride();
  mem = hydrate(merge(seed as CatalogueFile, over));
  return mem;
}

export async function upsertCatalogue(input: {
  artists?: CatalogueFile["artists"];
  tracks?: CatalogueFile["tracks"];
}) {
  await fs.mkdir(path.dirname(overrideFile), { recursive: true });
  const current = (await readOverride()) ?? {};
  const artists = [...(current.artists ?? [])];
  for (const a of input.artists ?? []) {
    const i = artists.findIndex((x) => x.id === a.id);
    if (i >= 0) artists[i] = { ...artists[i], ...a };
    else artists.push(a);
  }
  const tracks = [...(current.tracks ?? [])];
  for (const t of input.tracks ?? []) {
    const i = tracks.findIndex((x) => x.id === t.id);
    if (i >= 0) tracks[i] = { ...tracks[i], ...t };
    else tracks.push(t);
  }
  await fs.writeFile(overrideFile, JSON.stringify({ artists, tracks, playlists: current.playlists ?? [] }, null, 2));
  mem = null;
  return loadCatalogue();
}

export function catalogueSync() {
  if (!mem) mem = hydrate(seed as CatalogueFile);
  return mem;
}

export const PLAYLIST_SOURCES: PlaylistSource[] = (seed as CatalogueFile).playlists;
