import type { ArtistTier } from "../types";

const MAINSTREAM = new Set([
  "divine",
  "mc-stan",
  "emiway",
  "raftaar",
  "krsna",
  "seedhe-maut",
  "king",
  "badshah",
  "yo-yo-honey-singh",
  "hanumankind",
  "karan-aujla",
  "sidhu-moose-wala",
  "ap-dhillon",
  "shubh",
  "naezy",
]);

const ESTABLISHED = new Set([
  "ikka",
  "fotty-seven",
  "brodha-v",
  "dino-james",
  "prabh-deep",
  "karma",
  "raga",
  "panther",
  "yashraj",
  "encore-abj",
  "calm",
  "sez",
  "sez-on-the-beat",
  "deep-kalsi",
  "shah-rule",
  "seven-bantai",
  "mc-altaf",
  "hard-kaur",
  "hiphop-tamizha",
  "bohemia",
  "imran-khan",
  "gully-gang",
  "azadi-records",
]);

const RISING = new Set([
  "paradox",
  "bella",
  "qaab",
  "loka",
  "gravity",
  "chaar-diwaari",
  "frappe-ash",
  "bharg",
  "rawal",
  "bhaskar",
  "smokey",
  "ace",
  "dee-mc",
  "mc-square",
  "vedan",
  "dabzee",
  "fejo",
  "thirumali",
  "arivu",
  "dhanji",
  "yungsta",
  "gaush",
  "taj",
]);

const UNDERGROUND = new Set([
  "muhfaad",
  "spectra",
  "bandzo3rd",
  "udbhav",
  "tienas",
  "khayek",
  "nazz",
  "2facebleed",
  "bassick",
  "mc-kode",
  "rebel-7",
  "100rbh",
  "kaam-bhaari",
  "spitfire",
  "slowcheetah",
  "street-academics",
  "mhr",
  "dopeadelicz",
  "khasi-bloodz",
  "moko-koza",
  "ahmer",
  "nanku",
  "epr",
  "baghira",
  "crook",
  "sikander-kahlon",
  "j-trix",
  "phenom",
  "mojojojo",
  "kalmi",
  "byg-byrd",
]);

export function defaultArtistTier(id: string, sceneTags: string[] = []): ArtistTier {
  if (MAINSTREAM.has(id)) return "mainstream";
  if (ESTABLISHED.has(id)) return "established";
  if (RISING.has(id)) return "rising";
  if (UNDERGROUND.has(id)) return "underground";
  if (sceneTags.includes("northeast") || sceneTags.includes("malayalam") || sceneTags.includes("tamil")) {
    return "underground";
  }
  return "new";
}

export const SESSION_SLOTS: ArtistTier[] = [
  "mainstream",
  "established",
  "rising",
  "underground",
  "new",
];
