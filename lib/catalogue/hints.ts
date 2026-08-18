import type { Track } from "../types";

export function hintsFor(track: Track): [string, string, string] {
  if (track.hints?.length === 3) return track.hints;
  const collab = track.artists.length > 1;
  const city = sceneCity(track.sceneTags[0]);
  const year = track.releaseYear;
  const letter = track.title.replace(/[^a-zA-Z0-9]/g, "").charAt(0).toUpperCase();
  const subtle = collab
    ? `This track features another major ${city ?? "DHH"} rapper.`
    : city
      ? `This one's from the ${city} scene.`
      : "Indian DHH. Not a film song.";
  const useful = year
    ? `Released between ${year - 1}–${year + 1}.`
    : track.album
      ? "It's from a known project, not a random freestyle."
      : "It's a proper release, not a cypher clip.";
  const strong = letter ? `The title starts with “${letter}”.` : "The title is one punchy word.";
  return [subtle, useful, strong];
}

function sceneCity(tag?: string) {
  const map: Record<string, string> = {
    delhi: "Delhi",
    mumbai: "Mumbai",
    pune: "Pune",
    bengaluru: "Bengaluru",
    bhopal: "Bhopal",
    kochi: "Kochi",
  };
  return tag ? map[tag] : undefined;
}
