import { canUseLicensed, canUseYouTube } from "../audio/resolver";
import { catalogueSync, loadCatalogue, PLAYLIST_SOURCES } from "./load";
import type { Artist, Track } from "../types";

export { PLAYLIST_SOURCES };
export { loadCatalogue };

function lists() {
  return catalogueSync();
}

export function getArtist(id: string): Artist | undefined {
  return lists().artists.find((a) => a.id === id);
}

export function getTrack(id: string): Track | undefined {
  return lists().tracks.find((t) => t.id === id);
}

export function canPlayFromStart(track: Track): boolean {
  return canUseLicensed(track) || canUseYouTube(track);
}

export function playableTracks(): Track[] {
  return lists().tracks.filter(
    (t) => t.active && t.genre === "DHH" && t.country === "IN" && canPlayFromStart(t),
  );
}

export function searchableTracks(): Track[] {
  return lists().tracks.filter((t) => t.active && t.genre === "DHH" && t.country === "IN");
}

export function allArtists(): Artist[] {
  return lists().artists.filter((a) => a.active);
}

export function allArtistsAdmin(): Artist[] {
  return lists().artists;
}

export function allTracksAdmin(): Track[] {
  return lists().tracks;
}

export function creditArtistIds(track: Track): Set<string> {
  return new Set(track.artists.map((a) => a.id));
}

export function artistLine(track: Track): string {
  const names = track.artists.map((a) => a.name);
  if (names.length === 1) return names[0];
  return names.join(", ");
}

export async function refreshCatalogue() {
  await loadCatalogue();
}
