import { compact, normalizeText } from "../normalize";
import type { CatalogueSearchProvider, GlobalArtist, GlobalTrack } from "./types";
import { yearFrom } from "./types";

const UA = "DHHUH/1.0 (music-recognition game)";

async function itunes<T>(params: string): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2800);
  try {
    const res = await fetch(`https://itunes.apple.com/search?${params}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type ItunesArtist = {
  artistId?: number;
  artistName?: string;
  primaryGenreName?: string;
  artistType?: string;
};

type ItunesSong = {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  artistId?: number;
  collectionName?: string;
  releaseDate?: string;
};

export class ITunesMetadataProvider implements CatalogueSearchProvider {
  id = "itunes";

  async searchArtists(query: string): Promise<GlobalArtist[]> {
    const data = await itunes<{ results?: ItunesArtist[] }>(
      `term=${encodeURIComponent(query)}&entity=musicArtist&limit=20`,
    );
    if (!data?.results) return [];
    return data.results
      .filter((r) => r.artistId && r.artistName)
      .map((r, i) => ({
        id: `ext:itunes:artist:${r.artistId}`,
        name: r.artistName!,
        normalizedName: normalizeText(r.artistName!),
        compactName: compact(r.artistName!),
        aliases: [],
        genre: r.primaryGenreName,
        popularity: 40 - i,
      }));
  }

  async searchTracks(query: string): Promise<GlobalTrack[]> {
    const data = await itunes<{ results?: ItunesSong[] }>(
      `term=${encodeURIComponent(query)}&entity=song&limit=20`,
    );
    if (!data?.results) return [];
    return data.results
      .filter((r) => r.trackId && r.trackName && r.artistName)
      .map((r, i) => ({
        id: `ext:itunes:track:${r.trackId}`,
        title: r.trackName!,
        normalizedTitle: normalizeText(r.trackName!),
        compactTitle: compact(r.trackName!),
        artistName: r.artistName!,
        artistId: r.artistId ? `ext:itunes:artist:${r.artistId}` : undefined,
        album: r.collectionName,
        releaseYear: yearFrom(r.releaseDate),
        popularity: 40 - i,
      }));
  }
}
