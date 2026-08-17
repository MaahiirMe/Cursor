import { compact } from "@/lib/game/normalize";
import type { Track } from "@/types";
import { ARTISTS } from "@/data/artists";

export type LicensedPreview = {
  previewUrl: string;
  artworkUrl: string | null;
  source: "itunes" | "deezer";
};

const cache = new Map<string, LicensedPreview | null>();

type ItunesHit = {
  artistName?: string;
  trackName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
};

type DeezerHit = {
  title?: string;
  preview?: string;
  artist?: { name?: string };
  album?: { cover_medium?: string; cover_xl?: string };
};

export async function lookupLicensedPreview(track: Track): Promise<LicensedPreview | null> {
  if (cache.has(track.id)) return cache.get(track.id) ?? null;
  const artist = ARTISTS.find((a) => a.id === track.primaryArtist)?.name ?? "";
  const itunes = await fromItunes(track, artist);
  const hit = itunes ?? (await fromDeezer(track, artist));
  cache.set(track.id, hit);
  return hit;
}

async function fromItunes(track: Track, artist: string): Promise<LicensedPreview | null> {
  const q = encodeURIComponent(track.searchQuery || `${track.title} ${artist}`);
  const url = `https://itunes.apple.com/search?term=${q}&entity=song&limit=8&country=IN`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: ItunesHit[] };
  const rows = data.results ?? [];
  const picked =
    rows.find((r) => namesMatch(r.trackName, track.title) && namesMatch(r.artistName, artist, track)) ??
    rows.find((r) => namesMatch(r.trackName, track.title) && r.previewUrl) ??
    rows.find((r) => r.previewUrl);
  if (!picked?.previewUrl) return null;
  return {
    previewUrl: picked.previewUrl,
    artworkUrl: picked.artworkUrl100 ? picked.artworkUrl100.replace("100x100", "600x600") : null,
    source: "itunes",
  };
}

async function fromDeezer(track: Track, artist: string): Promise<LicensedPreview | null> {
  const q = encodeURIComponent(`track:"${track.title}" artist:"${artist}"`);
  const res = await fetch(`https://api.deezer.com/search?q=${q}&limit=5`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { data?: DeezerHit[] };
  const rows = data.data ?? [];
  const picked =
    rows.find((r) => namesMatch(r.title, track.title) && namesMatch(r.artist?.name, artist, track) && r.preview) ??
    rows.find((r) => r.preview);
  if (!picked?.preview) return null;
  return {
    previewUrl: picked.preview,
    artworkUrl: picked.album?.cover_xl ?? picked.album?.cover_medium ?? null,
    source: "deezer",
  };
}

function namesMatch(got: string | undefined, want: string, track?: Track): boolean {
  if (!got) return false;
  const g = compact(got);
  const w = compact(want);
  if (g.includes(w) || w.includes(g)) return true;
  if (!track) return false;
  const aliases = [track.primaryArtist, ...track.featuredArtists]
    .map((id) => ARTISTS.find((a) => a.id === id))
    .flatMap((a) => (a ? [a.name, ...a.aliases] : []));
  return aliases.some((a) => compact(got).includes(compact(a)));
}
