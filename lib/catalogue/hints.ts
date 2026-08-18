import type { Track } from "../types";

const CITY: Record<string, string> = {
  delhi: "Delhi",
  mumbai: "Mumbai",
  pune: "Pune",
  bengaluru: "Bengaluru",
  bhopal: "Bhopal",
  kochi: "Kochi",
};

function era(year?: number) {
  if (!year) return null;
  if (year <= 2016) return "the mid 2010s";
  if (year <= 2019) return "the late 2010s";
  if (year <= 2022) return "the early 2020s";
  return "the mid 2020s";
}

function initials(title: string) {
  const words = title.split(/[\s:/-]+/).filter((w) => /[a-zA-Z0-9]/.test(w));
  if (!words.length) return null;
  return words.map((w) => w.replace(/[^a-zA-Z0-9$]/g, "").charAt(0).toUpperCase()).join(".");
}

function wordCount(title: string) {
  return title.split(/[\s:/-]+/).filter(Boolean).length;
}

export function hintsFor(track: Track): [string, string, string] {
  if (track.hints?.length === 3) return track.hints;
  const city = CITY[track.sceneTags[0] ?? ""] ?? null;
  const collab = track.artists.length > 1;
  const when = era(track.releaseYear);
  const init = initials(track.title);
  const words = wordCount(track.title);

  const hard = when
    ? `This track came from a project released in ${when}.`
    : city
      ? `One of the artists is strongly associated with ${city}'s DHH scene.`
      : "This is from the independent DHH circuit, not a film soundtrack.";

  const medium = collab
    ? city
      ? `It's a ${city} collaboration — more than one credited rapper is on the record.`
      : "It's a collaboration — more than one credited rapper is on the record."
    : track.album
      ? `It sits on a named project${track.releaseYear ? `, not a random ${track.releaseYear} freestyle` : ""}.`
      : city
        ? `The record is tied to the ${city} scene.`
        : "Think core DHH catalogue, not a comic viral clip.";

  const strong = [
    init ? `Title initials: ${init}.` : null,
    words ? `${words} word${words === 1 ? "" : "s"} in the title.` : null,
    collab ? `A featured name on this one is part of the usual DHH circuit.` : null,
    track.releaseYear ? `Narrower window: around ${track.releaseYear}.` : null,
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  return [hard, medium, strong || "The title is short and gets said like a punchline."];
}
