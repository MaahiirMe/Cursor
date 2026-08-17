import { ARTISTS } from "@/data/artists";
import { TRACKS } from "@/data/tracks";
import type { CatalogArtist, CatalogSong, SceneTag } from "@/types";

export const SCENE_TAGS: SceneTag[] = [
  "Delhi",
  "Mumbai",
  "Pakistan",
  "Underground",
  "Mainstream",
  "Old School",
  "New Wave",
];

export function catalogSongs(): CatalogSong[] {
  return TRACKS.filter((t) => t.active).map((t) => ({
    id: t.id,
    title: t.title,
    album: t.album,
    aliases: t.aliases,
    primaryArtistName: ARTISTS.find((a) => a.id === t.primaryArtist)?.name ?? "",
    artistIds: t.artists,
  }));
}

export function catalogArtists(): CatalogArtist[] {
  return ARTISTS.map((a) => ({
    id: a.id,
    name: a.name,
    aliases: a.aliases,
  }));
}

export function publicBeat(trackId: string, playId: string) {
  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) return null;
  return {
    id: playId,
    waveformData: track.waveformData,
    difficulty: track.difficulty,
    audioSeed: track.audioSeed,
  };
}

export function revealTrack(trackId: string) {
  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) return null;
  const names = track.artists
    .map((id) => ARTISTS.find((a) => a.id === id)?.name)
    .filter(Boolean) as string[];
  return {
    id: track.id,
    title: track.title,
    artists: names,
    primaryArtist: ARTISTS.find((a) => a.id === track.primaryArtist)?.name ?? "",
    featuredArtists: track.featuredArtists
      .map((id) => ARTISTS.find((a) => a.id === id)?.name)
      .filter(Boolean) as string[],
    album: track.album,
    artworkUrl: track.artworkUrl,
    releaseYear: track.releaseYear,
  };
}
