import type { Artist } from "@/types";
import { artworkDataUrl } from "@/lib/art";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/\$/g, "s")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function extraArtist(name: string, tags: Artist["sceneTags"] = ["New Wave"]): Artist {
  const slug = slugify(name);
  return {
    id: slug,
    name,
    slug,
    aliases: [name, name.replace(/\s+/g, "")],
    imageUrl: artworkDataUrl(`artist-${slug}`, name),
    sceneTags: tags,
  };
}

/** Titles from JioSaavn featured playlist “Desi Hip Hop” (metadata only). */
export const SAAVN_DESI_HIP_HOP: { title: string; artists: string[]; year: number }[] = [
  { title: "FACHADI", artists: ["YUNG DSA", "COSMO DROP"], year: 2026 },
  { title: "Big Moves", artists: ["Raga", "THE U.D"], year: 2026 },
  { title: "700", artists: ["Visual G"], year: 2026 },
  { title: "About Time", artists: ["Thugs from Overseas"], year: 2026 },
  { title: "Enigma 2 Icon", artists: ["Ikka", "Sez on the Beat"], year: 2026 },
  { title: "Haseen Raatein", artists: ["Sunil Tiu"], year: 2026 },
  { title: "Dil Pe Zakham", artists: ["Prakhar Gupta", "BAD Junkie"], year: 2026 },
  { title: "City Won't Stop", artists: ["DEADALIVE", "Karnamey"], year: 2026 },
  { title: "Udta Teer", artists: ["Wicked Sunny", "Cyril Gabriel"], year: 2026 },
  { title: "Boom Shaka", artists: ["Dhanda Nyoliwala", "KR$NA"], year: 2026 },
  { title: "Side Ho", artists: ["Mic Pe Devil"], year: 2026 },
  { title: "Pension", artists: ["Lil 41"], year: 2026 },
  { title: "Legacy Bars", artists: ["Razz"], year: 2026 },
  { title: "Dhundhala", artists: ["Yashraj", "Talwiinder"], year: 2023 },
  { title: "Bewafa Drill", artists: ["Razz", "Aryan Thakur"], year: 2026 },
  { title: "KUAN", artists: ["citimall", "Yashraj"], year: 2026 },
  { title: "Hacker", artists: ["Sumit Gupta", "Aarrvan Rosh"], year: 2026 },
  { title: "KAAL", artists: ["MC PILOT"], year: 2026 },
  { title: "Destruction", artists: ["Vidooshak"], year: 2026 },
  { title: "Katega Katega", artists: ["Nkul"], year: 2026 },
  { title: "Bhaago", artists: ["Naam Sujal", "Gravity"], year: 2026 },
  { title: "Khoj", artists: ["Mic Pe Devil"], year: 2026 },
  { title: "Barabari", artists: ["Naezy"], year: 2025 },
  { title: "Boom", artists: ["DIVINE"], year: 2025 },
  { title: "Till I Die", artists: ["Muhfaad"], year: 2025 },
  { title: "Bombay Ki Vibe", artists: ["Oldrice Aiba"], year: 2025 },
  { title: "Saaf Sutra", artists: ["Naezy"], year: 2025 },
  { title: "Raj Kumar", artists: ["Navin", "Poztve"], year: 2025 },
  { title: "Change", artists: ["Lashcurry", "Xolo"], year: 2025 },
  { title: "Rawas", artists: ["Naezy"], year: 2025 },
  { title: "Fly", artists: ["ODN Beats", "Blo V"], year: 2025 },
  { title: "Dua", artists: ["Blo V", "Davyx"], year: 2025 },
];
