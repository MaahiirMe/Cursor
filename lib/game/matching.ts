import type { Artist, GuessVerdict, Track } from "@/types";
import { compact, fuzzyScore } from "@/lib/game/normalize";

const MATCH = 0.86;

export function verdictMessage(verdict: GuessVerdict): string {
  switch (verdict) {
    case "full":
      return "BHAI. HO GAYA.";
    case "artist-only":
      return "ARTIST SAHI. TRACK GALAT.";
    case "song-only":
      return "TRACK SAHI. ARTIST CHECK KAR.";
    case "song-artist-variation":
      return "TRACK LOCKED. CREDIT THODA OFF HAI.";
    default:
      return "NAH. DOBARA SOCH.";
  }
}

export function matchSong(track: Track, songText: string, songId?: string): boolean {
  if (songId && songId === track.id) return true;
  const aliases = [track.title, track.slug, ...track.aliases];
  return fuzzyScore(songText, track.title, aliases) >= MATCH;
}

export function matchArtist(
  artist: Artist,
  artistText: string,
  artistId?: string,
): boolean {
  if (artistId && artistId === artist.id) return true;
  return fuzzyScore(artistText, artist.name, artist.aliases) >= MATCH;
}

export function evaluateGuess(params: {
  track: Track;
  artistsById: Map<string, Artist>;
  songText: string;
  artistText: string;
  songId?: string;
  artistId?: string;
}): {
  songCorrect: boolean;
  artistCorrect: boolean;
  artistPartial: boolean;
  verdict: GuessVerdict;
  message: string;
} {
  const { track, artistsById } = params;
  const songCorrect = matchSong(track, params.songText, params.songId);

  const involvedIds = [track.primaryArtist, ...track.featuredArtists];
  const involved = involvedIds
    .map((id) => artistsById.get(id))
    .filter((a): a is Artist => Boolean(a));

  let artistCorrect = false;
  let artistPartial = false;
  let matchedFeatured = false;
  let matchedPrimary = false;

  for (const artist of involved) {
    const hit = matchArtist(artist, params.artistText, params.artistId);
    if (!hit) continue;
    if (artist.id === track.primaryArtist) matchedPrimary = true;
    else matchedFeatured = true;
  }

  if (matchedPrimary) artistCorrect = true;
  if (matchedFeatured) {
    artistPartial = true;
    if (track.featuredArtists.length > 0) artistCorrect = true;
  }

  if (!artistCorrect && params.artistText) {
    const compactGuess = compact(params.artistText);
    for (const artist of involved) {
      if (artist.aliases.some((a) => compact(a) === compactGuess)) {
        artistCorrect = true;
        if (artist.id !== track.primaryArtist) artistPartial = true;
      }
    }
  }

  let verdict: GuessVerdict;
  if (songCorrect && artistCorrect && !artistPartial) verdict = "full";
  else if (songCorrect && artistCorrect && artistPartial) {
    verdict = matchedPrimary ? "full" : "song-artist-variation";
    if (matchedPrimary) verdict = "full";
  } else if (songCorrect && artistPartial) verdict = "song-artist-variation";
  else if (songCorrect) verdict = "song-only";
  else if (artistCorrect) verdict = "artist-only";
  else verdict = "miss";

  if (verdict === "song-artist-variation" && songCorrect && artistCorrect) {
    // collab credited via featured artist — count as a win
    verdict = "full";
  }

  return {
    songCorrect,
    artistCorrect,
    artistPartial,
    verdict,
    message: verdictMessage(verdict),
  };
}

export function searchList<T extends { name?: string; title?: string; aliases: string[] }>(
  query: string,
  items: T[],
  limit = 8,
): T[] {
  if (!query.trim()) return [];
  return items
    .map((item) => {
      const label = "title" in item && item.title ? item.title : (item.name ?? "");
      return { item, score: fuzzyScore(query, label, item.aliases) };
    })
    .filter((x) => x.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}
