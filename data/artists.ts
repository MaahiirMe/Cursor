import type { Artist } from "@/types";
import { artworkDataUrl } from "@/lib/art";

function a(
  id: string,
  name: string,
  slug: string,
  aliases: string[],
  sceneTags: Artist["sceneTags"],
): Artist {
  return {
    id,
    name,
    slug,
    aliases,
    imageUrl: artworkDataUrl(`artist-${slug}`, name),
    sceneTags,
  };
}

export const ARTISTS: Artist[] = [
  a("seedhe-maut", "Seedhe Maut", "seedhe-maut", ["SM", "seedhemaut", "seedhe maut", "S M"], ["Delhi", "Underground", "New Wave"]),
  a("krsna", "KR$NA", "krsna", ["Krsna", "KR$NA", "KRSNA", "KrSna", "Young Galib"], ["Delhi", "Mainstream"]),
  a("divine", "DIVINE", "divine", ["Divine", "divyne"], ["Mumbai", "Mainstream"]),
  a("raftaar", "Raftaar", "raftaar", ["raftar", "Raftar"], ["Delhi", "Mainstream"]),
  a("talha-anjum", "Talha Anjum", "talha-anjum", ["Anjum", "TA", "talha"], ["Pakistan", "Mainstream"]),
  a("prabh-deep", "Prabh Deep", "prabh-deep", ["Prabhdeep", "prabh"], ["Delhi", "Underground"]),
  a("yashraj", "Yashraj", "yashraj", ["Yash Raj", "yashraaj"], ["Delhi", "New Wave"]),
  a("karma", "Karma", "karma", ["karmaa"], ["Delhi", "Underground"]),
  a("hanumankind", "Hanumankind", "hanumankind", ["HK", "hanuman kind"], ["Mainstream", "New Wave"]),
  a("encore-abj", "Encore ABJ", "encore-abj", ["ABJ", "Encore", "encoreabj"], ["Delhi", "Underground"]),
  a("calm", "Calm", "calm", ["calm delhi"], ["Delhi", "Old School", "Underground"]),
  a("mc-stan", "MC Stan", "mc-stan", ["Stan", "mcstan", "MCSTAN"], ["Mumbai", "Mainstream"]),
  a("emiway", "Emiway Bantai", "emiway", ["Emiway", "bantai"], ["Mumbai", "Mainstream"]),
  a("king", "King", "king", ["king singh"], ["Mumbai", "Mainstream"]),
  a("dino-james", "Dino James", "dino-james", ["Dino", "DJ"], ["Mainstream"]),
  a("ikka", "Ikka", "ikka", ["ikka singh"], ["Delhi", "Mainstream"]),
  a("bella", "Bella", "bella", ["bella sm"], ["Delhi", "New Wave"]),
  a("talhah-yunus", "Talhah Yunus", "talhah-yunus", ["Yunus", "TY"], ["Pakistan", "Mainstream"]),
  a("fotty-seven", "Fotty Seven", "fotty-seven", ["FS", "fotty", "47"], ["Delhi", "Underground"]),
  a("sez", "Sez on the Beat", "sez", ["Sez", "sezonthebeat"], ["Delhi", "Underground"]),
  a("frappe-ash", "Frappe Ash", "frappe-ash", ["Frappe", "ash"], ["Delhi", "Underground"]),
  a("rawal", "Rawal", "rawal", ["rawal sm"], ["Delhi", "New Wave"]),
  a("bharg", "Bharg", "bharg", ["bharg mumbai"], ["Mumbai", "New Wave"]),
  a("paradox", "Paradox", "paradox", ["para"], ["Mainstream", "New Wave"]),
  a("jani", "Jani", "jani", ["jani pk"], ["Pakistan", "Underground"]),
  a("panther", "Panther", "panther", ["panther delhi"], ["Delhi", "Underground"]),
];

export const artistsById = new Map(ARTISTS.map((x) => [x.id, x]));
export const artistsBySlug = new Map(ARTISTS.map((x) => [x.slug, x]));
