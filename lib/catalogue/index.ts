import { canUseLicensed, canUseYouTube } from "../audio/resolver";
import { ARTISTS, TRACKS } from "./data";
import type { Artist, Track } from "../types";

const artistById = new Map(ARTISTS.map((a) => [a.id, a]));
const trackById = new Map(TRACKS.map((t) => [t.id, t]));

export function getArtist(id: string): Artist | undefined {
  return artistById.get(id);
}

export function getTrack(id: string): Track | undefined {
  return trackById.get(id);
}

export function canPlayFromStart(track: Track): boolean {
  return canUseLicensed(track) || canUseYouTube(track);
}

export function playableTracks(): Track[] {
  return TRACKS.filter(
    (t) => t.active && t.genre === "DHH" && t.country === "IN" && canPlayFromStart(t),
  );
}

export function searchableTracks(): Track[] {
  return TRACKS.filter((t) => t.active && t.genre === "DHH" && t.country === "IN");
}

export function allArtists(): Artist[] {
  return ARTISTS.filter((a) => a.active);
}

export function allTracksAdmin(): Track[] {
  return TRACKS;
}

export function creditArtistIds(track: Track): Set<string> {
  return new Set(track.artists.map((a) => a.id));
}

export function artistLine(track: Track): string {
  const names = track.artists.map((a) => a.name);
  if (names.length === 1) return names[0];
  return names.join(", ");
}
