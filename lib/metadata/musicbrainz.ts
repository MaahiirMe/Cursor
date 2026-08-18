import { compact, normalizeText } from "../normalize";
import type { CatalogueSearchProvider, GlobalArtist, GlobalTrack } from "./types";

const UA = "DHHUH/1.0 (https://github.com/MaahiirMe/Cursor)";

async function mb<T>(path: string): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1800);
  try {
    const res = await fetch(`https://musicbrainz.org/ws/2/${path}`, {
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

export class MusicBrainzMetadataProvider implements CatalogueSearchProvider {
  id = "musicbrainz";

  async searchArtists(query: string): Promise<GlobalArtist[]> {
    const data = await mb<{ artists?: Array<{ id: string; name: string; country?: string; disambiguation?: string; tags?: { name: string }[] }> }>(
      `artist/?query=${encodeURIComponent(query)}&fmt=json&limit=12`,
    );
    if (!data?.artists) return [];
    return data.artists.map((a, i) => ({
      id: `ext:mb:artist:${a.id}`,
      name: a.name,
      normalizedName: normalizeText(a.name),
      compactName: compact(a.name),
      aliases: a.disambiguation ? [a.disambiguation] : [],
      genre: a.tags?.[0]?.name,
      country: a.country,
      popularity: 24 - i,
    }));
  }

  async searchTracks(query: string): Promise<GlobalTrack[]> {
    const data = await mb<{
      recordings?: Array<{
        id: string;
        title: string;
        "artist-credit"?: { name: string }[];
        releases?: { title: string; date?: string }[];
      }>;
    }>(`recording/?query=${encodeURIComponent(query)}&fmt=json&limit=12`);
    if (!data?.recordings) return [];
    return data.recordings.map((r, i) => {
      const artistName = r["artist-credit"]?.map((c) => c.name).join(", ") || "Unknown";
      const year = r.releases?.[0]?.date ? Number(r.releases[0].date.slice(0, 4)) : undefined;
      return {
        id: `ext:mb:track:${r.id}`,
        title: r.title,
        normalizedTitle: normalizeText(r.title),
        compactTitle: compact(r.title),
        artistName,
        album: r.releases?.[0]?.title,
        releaseYear: Number.isFinite(year) ? year : undefined,
        popularity: 18 - i,
      };
    });
  }
}
