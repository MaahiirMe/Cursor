import { compact, normalizeText } from "../normalize";

export type GlobalArtist = {
  id: string;
  name: string;
  normalizedName: string;
  compactName: string;
  aliases: string[];
  genre?: string;
  country?: string;
  popularity: number;
};

export type GlobalTrack = {
  id: string;
  title: string;
  normalizedTitle: string;
  compactTitle: string;
  artistName: string;
  artistId?: string;
  album?: string;
  releaseYear?: number;
  popularity: number;
};

export interface CatalogueSearchProvider {
  id: string;
  searchArtists(query: string): Promise<GlobalArtist[]>;
  searchTracks(query: string): Promise<GlobalTrack[]>;
}

export function artistKey(name: string) {
  return compact(name);
}

export function trackKey(title: string, artist: string) {
  return `${compact(title)}::${compact(artist)}`;
}

export function yearFrom(date?: string) {
  if (!date) return undefined;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) ? y : undefined;
}

export { normalizeText };
