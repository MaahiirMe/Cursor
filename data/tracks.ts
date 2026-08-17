import { artworkDataUrl, hashString, waveformFromSeed } from "@/lib/art";
import { ARTISTS } from "@/data/artists";
import { SAAVN_DESI_HIP_HOP } from "@/data/saavn-desi-hip-hop";
import { compact } from "@/lib/game/normalize";
import type { Track } from "@/types";

function t(
  partial: Omit<Track, "artworkUrl" | "previewUrl" | "waveformData" | "audioSeed" | "active" | "searchQuery"> & {
    active?: boolean;
    searchQuery?: string;
  },
): Track {
  const seed = hashString(partial.id);
  return {
    ...partial,
    active: partial.active ?? true,
    audioSeed: seed,
    artworkUrl: artworkDataUrl(partial.slug, partial.title),
    previewUrl: `licensed://${partial.id}`,
    waveformData: waveformFromSeed(seed),
    searchQuery: partial.searchQuery ?? `${partial.title}`,
  };
}

export const CORE_TRACKS: Track[] = [
  t({ id: "namastute", title: "Namastute", slug: "namastute", artists: ["seedhe-maut"], primaryArtist: "seedhe-maut", featuredArtists: [], aliases: ["namaste", "namastute sm"], album: "Namastute", releaseYear: 2021, sceneTags: ["Delhi", "Underground", "New Wave"], languageTags: ["Hinglish"], difficulty: 2, searchQuery: "Namastute Seedhe Maut" }),
  t({ id: "11-11", title: "11:11", slug: "11-11", artists: ["seedhe-maut"], primaryArtist: "seedhe-maut", featuredArtists: [], aliases: ["1111", "eleven eleven"], album: "Lunch Break", releaseYear: 2023, sceneTags: ["Delhi", "Underground"], languageTags: ["Hinglish"], difficulty: 2, searchQuery: "11:11 Seedhe Maut" }),
  t({ id: "khatta-flow", title: "Khatta Flow", slug: "khatta-flow", artists: ["seedhe-maut", "krsna"], primaryArtist: "seedhe-maut", featuredArtists: ["krsna"], aliases: ["khattaflow"], album: "Lunch Break", releaseYear: 2023, sceneTags: ["Delhi", "Mainstream"], languageTags: ["Hinglish"], difficulty: 3, searchQuery: "Khatta Flow Seedhe Maut KR$NA" }),
  t({ id: "nanchaku", title: "Nanchaku", slug: "nanchaku", artists: ["seedhe-maut", "mc-stan"], primaryArtist: "seedhe-maut", featuredArtists: ["mc-stan"], aliases: ["nunchaku"], album: "nanchaku", releaseYear: 2023, sceneTags: ["Delhi", "Mumbai", "Mainstream"], languageTags: ["Hindi"], difficulty: 3, searchQuery: "Nanchaku Seedhe Maut MC Stan" }),
  t({ id: "shaktimaan", title: "Shaktimaan", slug: "shaktimaan", artists: ["seedhe-maut"], primaryArtist: "seedhe-maut", featuredArtists: [], aliases: ["shaktiman"], album: "Lunch Break", releaseYear: 2023, sceneTags: ["Delhi", "New Wave"], languageTags: ["Hinglish"], difficulty: 3, searchQuery: "Shaktimaan Seedhe Maut" }),
  t({ id: "hola-amigo", title: "Hola Amigo", slug: "hola-amigo", artists: ["krsna", "seedhe-maut"], primaryArtist: "krsna", featuredArtists: ["seedhe-maut"], aliases: ["holaamigo"], album: "Yours Truly", releaseYear: 2022, sceneTags: ["Delhi", "Mainstream"], languageTags: ["Hinglish"], difficulty: 2, searchQuery: "Hola Amigo KR$NA Seedhe Maut" }),
  t({ id: "roll-up", title: "Roll Up", slug: "roll-up", artists: ["krsna"], primaryArtist: "krsna", featuredArtists: [], aliases: ["rollup"], album: "Yours Truly", releaseYear: 2020, sceneTags: ["Delhi", "Mainstream"], languageTags: ["Hindi"], difficulty: 3, searchQuery: "Roll Up KR$NA" }),
  t({ id: "joota-japani", title: "Joota Japani", slug: "joota-japani", artists: ["krsna"], primaryArtist: "krsna", featuredArtists: [], aliases: ["juta japani"], album: "Yours Truly", releaseYear: 2022, sceneTags: ["Delhi", "Mainstream"], languageTags: ["Hindi"], difficulty: 3, searchQuery: "Joota Japani KR$NA" }),
  t({ id: "i-guess", title: "I Guess", slug: "i-guess", artists: ["krsna"], primaryArtist: "krsna", featuredArtists: [], aliases: ["iguess"], album: "Yours Truly", releaseYear: 2023, sceneTags: ["Delhi", "Mainstream"], languageTags: ["English", "Hindi"], difficulty: 3, searchQuery: "I Guess KR$NA" }),
  t({ id: "prarthana", title: "Prarthana", slug: "prarthana", artists: ["krsna"], primaryArtist: "krsna", featuredArtists: [], aliases: ["prathana"], album: "Yours Truly", releaseYear: 2021, sceneTags: ["Delhi"], languageTags: ["Hindi"], difficulty: 4, searchQuery: "Prarthana KR$NA" }),
  t({ id: "farak", title: "Farak", slug: "farak", artists: ["divine"], primaryArtist: "divine", featuredArtists: [], aliases: ["farq"], album: "Kohinoor", releaseYear: 2018, sceneTags: ["Mumbai", "Mainstream", "Old School"], languageTags: ["Hindi"], difficulty: 3, searchQuery: "Farak DIVINE" }),
  t({ id: "mirchi", title: "Mirchi", slug: "mirchi", artists: ["divine"], primaryArtist: "divine", featuredArtists: [], aliases: ["mirchee"], album: "Gunehgar", releaseYear: 2019, sceneTags: ["Mumbai", "Mainstream"], languageTags: ["Hinglish"], difficulty: 2, searchQuery: "Mirchi DIVINE" }),
  t({ id: "mera-bhai", title: "Mera Bhai", slug: "mera-bhai", artists: ["divine"], primaryArtist: "divine", featuredArtists: [], aliases: ["merabhai"], album: "Kohinoor", releaseYear: 2019, sceneTags: ["Mumbai", "Mainstream"], languageTags: ["Hindi"], difficulty: 2, searchQuery: "Mera Bhai DIVINE" }),
  t({ id: "satya", title: "Satya", slug: "satya", artists: ["divine"], primaryArtist: "divine", featuredArtists: [], aliases: ["saty"], album: "Punya Paap", releaseYear: 2020, sceneTags: ["Mumbai"], languageTags: ["Hindi"], difficulty: 4, searchQuery: "Satya DIVINE" }),
  t({ id: "kaam-25", title: "Kaam 25", slug: "kaam-25", artists: ["divine"], primaryArtist: "divine", featuredArtists: [], aliases: ["kaam25", "kaam"], album: "Gunehgar", releaseYear: 2019, sceneTags: ["Mumbai", "Mainstream"], languageTags: ["Hindi"], difficulty: 3, searchQuery: "Kaam 25 DIVINE" }),
  t({ id: "sheikh-chilli", title: "Sheikh Chilli", slug: "sheikh-chilli", artists: ["raftaar"], primaryArtist: "raftaar", featuredArtists: [], aliases: ["sheikh chili", "sheikhchilli"], album: "Hard Drive Vol 1", releaseYear: 2020, sceneTags: ["Delhi", "Mainstream"], languageTags: ["Hinglish"], difficulty: 3, searchQuery: "Sheikh Chilli Raftaar" }),
  t({ id: "all-black", title: "All Black", slug: "all-black", artists: ["raftaar"], primaryArtist: "raftaar", featuredArtists: [], aliases: ["allblack"], album: "All Black", releaseYear: 2015, sceneTags: ["Delhi", "Mainstream", "Old School"], languageTags: ["Punjabi", "Hindi"], difficulty: 2, searchQuery: "All Black Raftaar" }),
  t({ id: "dhagad", title: "Dhakad", slug: "dhakad", artists: ["raftaar"], primaryArtist: "raftaar", featuredArtists: [], aliases: ["dhagad"], album: "Hard Drive", releaseYear: 2022, sceneTags: ["Delhi", "Mainstream"], languageTags: ["Hindi"], difficulty: 4, searchQuery: "Dhakad Raftaar" }),
  t({ id: "downers-at-dusk", title: "Downers At Dusk", slug: "downers-at-dusk", artists: ["talha-anjum"], primaryArtist: "talha-anjum", featuredArtists: [], aliases: ["downers", "downersatdusk"], album: "Open Letter", releaseYear: 2023, sceneTags: ["Pakistan", "Mainstream"], languageTags: ["English", "Urdu"], difficulty: 2, searchQuery: "Downers At Dusk Talha Anjum" }),
  t({ id: "secrets", title: "Secrets", slug: "secrets", artists: ["talha-anjum"], primaryArtist: "talha-anjum", featuredArtists: [], aliases: ["secret"], album: "Open Letter", releaseYear: 2023, sceneTags: ["Pakistan"], languageTags: ["English"], difficulty: 3, searchQuery: "Secrets Talha Anjum" }),
  t({ id: "two-tone", title: "Two Tone", slug: "two-tone", artists: ["talha-anjum", "talhah-yunus"], primaryArtist: "talha-anjum", featuredArtists: ["talhah-yunus"], aliases: ["twotone"], album: "Open Letter", releaseYear: 2023, sceneTags: ["Pakistan", "Mainstream"], languageTags: ["English"], difficulty: 3, searchQuery: "Two Tone Young Stunners" }),
  t({ id: "why", title: "Why", slug: "why", artists: ["talhah-yunus"], primaryArtist: "talhah-yunus", featuredArtists: [], aliases: ["why ty"], album: "Open Letter", releaseYear: 2023, sceneTags: ["Pakistan"], languageTags: ["English"], difficulty: 4, searchQuery: "Why Talhah Yunus" }),
  t({ id: "class-sikh", title: "Class-Sikh", slug: "class-sikh", artists: ["prabh-deep"], primaryArtist: "prabh-deep", featuredArtists: [], aliases: ["class sikh", "classsikh"], album: "Class-Sikh", releaseYear: 2017, sceneTags: ["Delhi", "Underground", "Old School"], languageTags: ["Punjabi"], difficulty: 4, searchQuery: "Class-Sikh Prabh Deep" }),
  t({ id: "kala-gulab", title: "Kala Gulab", slug: "kala-gulab", artists: ["prabh-deep"], primaryArtist: "prabh-deep", featuredArtists: [], aliases: ["kalagulab"], album: "Tabia", releaseYear: 2021, sceneTags: ["Delhi", "Underground"], languageTags: ["Punjabi", "Hindi"], difficulty: 5, searchQuery: "Kala Gulab Prabh Deep" }),
  t({ id: "dhandho", title: "Dhandho", slug: "dhandho", artists: ["yashraj"], primaryArtist: "yashraj", featuredArtists: [], aliases: ["dhandha"], album: "Dhandho", releaseYear: 2022, sceneTags: ["Delhi", "New Wave"], languageTags: ["Hinglish"], difficulty: 2, searchQuery: "Dhandho Yashraj" }),
  t({ id: "nine-forty-five", title: "9:45", slug: "9-45", artists: ["yashraj"], primaryArtist: "yashraj", featuredArtists: [], aliases: ["945", "nine forty five"], album: "9:45", releaseYear: 2023, sceneTags: ["Delhi", "New Wave"], languageTags: ["Hinglish"], difficulty: 3, searchQuery: "9:45 Yashraj" }),
  t({ id: "saza-e-maut", title: "Saza-E-Maut", slug: "saza-e-maut", artists: ["karma", "krsna"], primaryArtist: "karma", featuredArtists: ["krsna"], aliases: ["saza e maut", "sazae maut"], album: "Saza-E-Maut", releaseYear: 2022, sceneTags: ["Delhi", "Underground"], languageTags: ["Hindi"], difficulty: 3, searchQuery: "Saza-E-Maut Karma KR$NA" }),
  t({ id: "big-dawgs", title: "Big Dawgs", slug: "big-dawgs", artists: ["hanumankind"], primaryArtist: "hanumankind", featuredArtists: [], aliases: ["big dogs", "bigdawgs"], album: "Big Dawgs", releaseYear: 2024, sceneTags: ["Mainstream", "New Wave"], languageTags: ["English"], difficulty: 1, searchQuery: "Big Dawgs Hanumankind" }),
  t({ id: "go-to-sleep", title: "Go To Sleep", slug: "go-to-sleep", artists: ["hanumankind"], primaryArtist: "hanumankind", featuredArtists: [], aliases: ["gotosleep"], album: "Go To Sleep", releaseYear: 2024, sceneTags: ["Mainstream", "New Wave"], languageTags: ["English"], difficulty: 3, searchQuery: "Go To Sleep Hanumankind" }),
  t({ id: "azadi", title: "Azadi", slug: "azadi", artists: ["encore-abj"], primaryArtist: "encore-abj", featuredArtists: [], aliases: ["azaadi"], album: "Azadi", releaseYear: 2020, sceneTags: ["Delhi", "Underground"], languageTags: ["Hindi"], difficulty: 4, searchQuery: "Azadi Encore ABJ" }),
  t({ id: "insaan", title: "Insaan", slug: "insaan", artists: ["mc-stan"], primaryArtist: "mc-stan", featuredArtists: [], aliases: ["insan"], album: "Insaan", releaseYear: 2022, sceneTags: ["Mumbai", "Mainstream"], languageTags: ["Hindi"], difficulty: 2, searchQuery: "Insaan MC Stan" }),
  t({ id: "ek-din-pyaar", title: "Ek Din Pyaar", slug: "ek-din-pyaar", artists: ["mc-stan"], primaryArtist: "mc-stan", featuredArtists: [], aliases: ["ek din pyar"], album: "Insaan", releaseYear: 2022, sceneTags: ["Mumbai", "Mainstream"], languageTags: ["Hindi"], difficulty: 3, searchQuery: "Ek Din Pyaar MC Stan" }),
  t({ id: "khatam", title: "Khatam", slug: "khatam", artists: ["emiway"], primaryArtist: "emiway", featuredArtists: [], aliases: ["khatam bantai"], album: "Khatam", releaseYear: 2021, sceneTags: ["Mumbai", "Mainstream"], languageTags: ["Hinglish"], difficulty: 2, searchQuery: "Khatam Emiway Bantai" }),
  t({ id: "company", title: "Company", slug: "company", artists: ["emiway"], primaryArtist: "emiway", featuredArtists: [], aliases: ["compeny"], album: "Company", releaseYear: 2022, sceneTags: ["Mumbai", "Mainstream"], languageTags: ["Hinglish"], difficulty: 3, searchQuery: "Company Emiway" }),
  t({ id: "maan-meri-jaan", title: "Maan Meri Jaan", slug: "maan-meri-jaan", artists: ["king"], primaryArtist: "king", featuredArtists: [], aliases: ["man meri jaan"], album: "Champagne Talk", releaseYear: 2022, sceneTags: ["Mumbai", "Mainstream"], languageTags: ["Hindi"], difficulty: 1, searchQuery: "Maan Meri Jaan King" }),
  t({ id: "tu-aake-dekhle", title: "Tu Aake Dekhle", slug: "tu-aake-dekhle", artists: ["king"], primaryArtist: "king", featuredArtists: [], aliases: ["tu aake dekh le", "tu ake dekhle"], album: "The Carnival", releaseYear: 2020, sceneTags: ["Mumbai", "Mainstream"], languageTags: ["Hindi"], difficulty: 2, searchQuery: "Tu Aake Dekhle King" }),
  t({ id: "haan-ho-gayi", title: "Haan Ho Gayi Galti", slug: "haan-ho-gayi-galti", artists: ["dino-james"], primaryArtist: "dino-james", featuredArtists: [], aliases: ["ho gayi galti"], album: "Dino James", releaseYear: 2021, sceneTags: ["Mainstream", "Old School"], languageTags: ["Hindi"], difficulty: 3, searchQuery: "Haan Ho Gayi Galti Dino James" }),
  t({ id: "47", title: "47", slug: "47", artists: ["fotty-seven"], primaryArtist: "fotty-seven", featuredArtists: [], aliases: ["forty seven", "fortyseven"], album: "47", releaseYear: 2019, sceneTags: ["Delhi", "Underground"], languageTags: ["Hindi"], difficulty: 4, searchQuery: "47 Fotty Seven" }),
  t({ id: "chhodo-kal", title: "Chhodo Kal Ki Baatein", slug: "chhodo-kal-ki-baatein", artists: ["paradox"], primaryArtist: "paradox", featuredArtists: [], aliases: ["chodo kal ki baatein"], album: "Chhodo Kal Ki Baatein", releaseYear: 2023, sceneTags: ["Mainstream", "New Wave"], languageTags: ["Hindi"], difficulty: 2, searchQuery: "Chhodo Kal Ki Baatein Paradox" }),
  t({ id: "lowkey", title: "Lowkey", slug: "lowkey", artists: ["bella"], primaryArtist: "bella", featuredArtists: [], aliases: ["low key"], album: "Lowkey", releaseYear: 2023, sceneTags: ["Delhi", "New Wave"], languageTags: ["Hinglish"], difficulty: 3, searchQuery: "Lowkey Bella" }),
  t({ id: "click", title: "Click", slug: "click", artists: ["sez"], primaryArtist: "sez", featuredArtists: [], aliases: ["click sez"], album: "Click", releaseYear: 2020, sceneTags: ["Delhi", "Underground"], languageTags: ["Hinglish"], difficulty: 5, searchQuery: "Click Sez on the Beat" }),
  t({ id: "bhaag-milkha", title: "Bhaag Milkha", slug: "bhaag-milkha", artists: ["frappe-ash"], primaryArtist: "frappe-ash", featuredArtists: [], aliases: ["bhag milkha"], album: "Bhaag Milkha", releaseYear: 2022, sceneTags: ["Delhi", "Underground", "New Wave"], languageTags: ["Hinglish"], difficulty: 4, searchQuery: "Bhaag Milkha Frappe Ash" }),
  t({ id: "kya-karu", title: "Kya Karu", slug: "kya-karu", artists: ["bharg"], primaryArtist: "bharg", featuredArtists: [], aliases: ["kya karoon"], album: "Kya Karu", releaseYear: 2023, sceneTags: ["Mumbai", "New Wave"], languageTags: ["Hindi"], difficulty: 3, searchQuery: "Kya Karu Bharg" }),
  t({ id: "nanchaku-wait", title: "No Cap", slug: "no-cap", artists: ["rawal"], primaryArtist: "rawal", featuredArtists: [], aliases: ["nocap"], album: "No Cap", releaseYear: 2022, sceneTags: ["Delhi", "New Wave"], languageTags: ["Hinglish"], difficulty: 4, searchQuery: "No Cap Rawal" }),
  t({ id: "woh", title: "Woh", slug: "woh", artists: ["ikka"], primaryArtist: "ikka", featuredArtists: [], aliases: ["wo"], album: "Woh", releaseYear: 2021, sceneTags: ["Delhi", "Mainstream"], languageTags: ["Hindi"], difficulty: 3, searchQuery: "Woh Ikka" }),
];

function artistIdFor(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/\$/g, "s")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return (
    ARTISTS.find(
      (x) =>
        x.id === slug ||
        compact(x.name) === compact(name) ||
        x.aliases.some((al) => compact(al) === compact(name)),
    )?.id ?? slug
  );
}

const seenTitles = new Set(CORE_TRACKS.map((x) => compact(x.title)));
const playlistTracks: Track[] = SAAVN_DESI_HIP_HOP.filter((row) => !seenTitles.has(compact(row.title))).map((row) => {
  const ids = row.artists.map(artistIdFor);
  const slug = compact(row.title) || "track";
  return t({
    id: `saavn-${slug}`,
    title: row.title,
    slug,
    artists: ids,
    primaryArtist: ids[0],
    featuredArtists: ids.slice(1),
    aliases: [row.title.replace(/\s+/g, "")],
    album: "Desi Hip Hop",
    releaseYear: row.year,
    sceneTags: ["New Wave"],
    languageTags: ["Hinglish"],
    difficulty: 3,
    searchQuery: `${row.title} ${row.artists[0]}`,
  });
});

export const TRACKS: Track[] = [...CORE_TRACKS, ...playlistTracks];

export const tracksById = new Map(TRACKS.map((x) => [x.id, x]));
export const tracksBySlug = new Map(TRACKS.map((x) => [x.slug, x]));
