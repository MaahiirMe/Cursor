import { readFileSync, writeFileSync } from "fs";
import { spawn } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const seedPath = new URL("../catalogue/seed.json", import.meta.url);
const seed = JSON.parse(readFileSync(seedPath, "utf8"));

const MAINSTREAM = new Set([
  "divine","mc-stan","emiway","raftaar","krsna","seedhe-maut","king","badshah",
  "yo-yo-honey-singh","hanumankind","karan-aujla","sidhu-moose-wala","ap-dhillon","shubh","naezy",
]);
const ESTABLISHED = new Set([
  "ikka","fotty-seven","brodha-v","dino-james","prabh-deep","karma","raga","panther","yashraj",
  "encore-abj","calm","sez","deep-kalsi","shah-rule","seven-bantai","mc-altaf","hard-kaur",
  "hiphop-tamizha","bohemia","gully-gang","azadi-records",
]);
const RISING = new Set([
  "paradox","bella","qaab","loka","gravity","chaar-diwaari","frappe-ash","bharg","rawal",
  "bhaskar","smokey","ace","dee-mc","mc-square","vedan","dabzee","fejo","thirumali","arivu",
  "dhanji","yungsta","gaush","taj",
]);
const UNDERGROUND = new Set([
  "muhfaad","spectra","bandzo3rd","udbhav","tienas","khayek","nazz","2facebleed","bassick",
  "mc-kode","rebel-7","100rbh","kaam-bhaari","spitfire","slowcheetah","street-academics","mhr",
  "dopeadelicz","khasi-bloodz","moko-koza","ahmer","nanku","epr","baghira","crook",
  "sikander-kahlon","j-trix","phenom","mojojojo","kalmi","byg-byrd",
]);

function tier(id, tags = []) {
  if (MAINSTREAM.has(id)) return "mainstream";
  if (ESTABLISHED.has(id)) return "established";
  if (RISING.has(id)) return "rising";
  if (UNDERGROUND.has(id)) return "underground";
  if (tags.includes("northeast") || tags.includes("malayalam") || tags.includes("tamil")) return "underground";
  return "new";
}

function compact(s) {
  return String(s).toLowerCase().replace(/\$/g, "s").replace(/[^a-z0-9]+/g, "");
}
function norm(s) {
  return String(s).toLowerCase().replace(/\$/g, "s").replace(/[^a-z0-9]+/g, " ").trim();
}

function ffmpegPcm(url) {
  return new Promise((resolve) => {
    const child = spawn("ffmpeg", [
      "-hide_banner","-loglevel","error","-i", url, "-t","18","-ac","1","-ar","8000","-f","f32le","pipe:1",
    ], { stdio: ["ignore", "pipe", "pipe"] });
    const chunks = [];
    child.stdout.on("data", (c) => chunks.push(c));
    child.on("error", () => resolve(null));
    child.on("close", (code) => resolve(code === 0 ? Buffer.concat(chunks) : null));
  });
}

function onset(buf) {
  if (!buf || buf.length < 8000) return null;
  const samples = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
  const sampleRate = 8000;
  const frame = 160;
  const hop = 80;
  const energies = [];
  for (let i = 0; i + frame < samples.length; i += hop) {
    let sum = 0;
    for (let j = 0; j < frame; j++) sum += samples[i + j] * samples[i + j];
    energies.push(Math.sqrt(sum / frame));
  }
  if (!energies.length) return 0;
  const sorted = [...energies].sort((a, b) => a - b);
  const noise = sorted[Math.floor(sorted.length * 0.2)] || 0.0001;
  const peak = sorted[Math.floor(sorted.length * 0.9)] || 0.001;
  const threshold = Math.max(noise * 8, peak * 0.18, 0.012);
  const sustain = 9;
  for (let i = 0; i < energies.length - sustain; i++) {
    if (energies[i] < threshold) continue;
    let ok = 0;
    for (let k = 0; k < sustain; k++) if (energies[i + k] >= threshold * 0.7) ok += 1;
    if (ok >= sustain - 1) return Math.round(((i * hop) / sampleRate) * 10) / 10;
  }
  return 0;
}

async function itunesSong(term) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=12&country=IN`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

async function previewFor(title, artist) {
  const rows = await itunesSong(`${title} ${artist}`);
  const wantT = norm(title);
  const wantA = compact(artist);
  let best = null;
  let bestScore = -1;
  rows.forEach((r, i) => {
    if (!r.previewUrl || !r.trackName) return;
    let score = 60 - i * 3;
    const t = norm(r.trackName);
    const a = compact(r.artistName ?? "");
    if (t === wantT) score += 40;
    else if (t.includes(wantT.slice(0, 7))) score += 14;
    if (wantA && (a.includes(wantA.slice(0, 6)) || wantA.includes(a.slice(0, 6)))) score += 22;
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  });
  if (!best) return null;
  return {
    previewUrl: best.previewUrl,
    artworkUrl: best.artworkUrl100?.replace("100x100bb", "600x600bb"),
    album: best.collectionName,
    releaseYear: best.releaseDate ? Number(String(best.releaseDate).slice(0, 4)) : undefined,
    recognitionScore: Math.max(28, Math.min(96, bestScore)),
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (const a of seed.artists) {
  a.tier = a.tier || tier(a.id, a.sceneTags);
}

const byId = new Map(seed.artists.map((a) => [a.id, a]));
let previewed = 0;
let detected = 0;

for (const t of seed.tracks) {
  const artist = byId.get(t.primaryArtistId);
  if (!t.licensedPreviewUrl) {
    const hit = await previewFor(t.title, artist?.name ?? "");
    await sleep(80);
    if (hit) {
      t.licensedPreviewUrl = hit.previewUrl;
      t.artworkUrl = t.artworkUrl || hit.artworkUrl;
      t.album = t.album || hit.album;
      t.releaseYear = t.releaseYear || hit.releaseYear;
      t.recognitionScore = hit.recognitionScore;
      previewed += 1;
    }
  }
  t.recognitionScore = t.recognitionScore ?? 55;
  if (t.licensedPreviewUrl && t.detectedStartSeconds == null) {
    const pcm = await ffmpegPcm(t.licensedPreviewUrl);
    const start = onset(pcm);
    if (start != null) {
      t.detectedStartSeconds = start;
      if (t.gameStartSeconds == null) t.gameStartSeconds = start;
      t.startVerified = true;
      t.introQuality = "faithful";
      detected += 1;
    } else {
      t.startVerified = false;
    }
  } else if (t.licensedPreviewUrl && (t.gameStartSeconds != null || t.detectedStartSeconds != null)) {
    t.gameStartSeconds = t.gameStartSeconds ?? t.detectedStartSeconds ?? 0;
    t.startVerified = true;
  }
}

const haveTitle = new Set(seed.tracks.map((t) => `${t.primaryArtistId}::${norm(t.title)}`));
const inArtists = seed.artists.filter((a) => a.country !== "PK" && a.active !== false);
let added = 0;
for (const a of inArtists) {
  if (added > 80) break;
  const owned = seed.tracks.filter((t) => t.primaryArtistId === a.id).length;
  if (owned >= 2) continue;
  const rows = await itunesSong(a.name);
  await sleep(90);
  let got = 0;
  for (const [i, r] of rows.entries()) {
    if (got >= (owned === 0 ? 2 : 1)) break;
    if (!r.previewUrl || !r.trackName) continue;
    if (!compact(r.artistName ?? "").includes(compact(a.name).slice(0, 5))) continue;
    const key = `${a.id}::${norm(r.trackName)}`;
    if (haveTitle.has(key)) continue;
    const pcm = await ffmpegPcm(r.previewUrl);
    const start = onset(pcm);
    if (start == null) continue;
    const id = `${compact(r.trackName)}-${a.id}`.slice(0, 48);
    if (seed.tracks.some((t) => t.id === id)) continue;
    seed.tracks.push({
      id,
      title: r.trackName,
      artistIds: [a.id],
      primaryArtistId: a.id,
      aliases: [],
      album: r.collectionName,
      releaseYear: r.releaseDate ? Number(String(r.releaseDate).slice(0, 4)) : undefined,
      licensedPreviewUrl: r.previewUrl,
      artworkUrl: r.artworkUrl100?.replace("100x100bb", "600x600bb"),
      detectedStartSeconds: start,
      gameStartSeconds: start,
      startVerified: true,
      recognitionScore: Math.max(30, 86 - i * 7),
      sourcePlaylists: ["itunes-ingest"],
      sceneTags: a.sceneTags ?? [],
      difficulty: a.tier === "underground" || a.tier === "new" ? 4 : 3,
      active: true,
      introQuality: "faithful",
      country: "IN",
      genre: "DHH",
    });
    haveTitle.add(key);
    added += 1;
    got += 1;
    detected += 1;
  }
}

writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n");
const playable = seed.tracks.filter((t) => t.startVerified && t.licensedPreviewUrl && t.active);
const primaries = new Set(playable.map((t) => t.primaryArtistId));
console.log({
  artists: seed.artists.length,
  tracks: seed.tracks.length,
  previewed,
  detected,
  added,
  playable: playable.length,
  uniquePrimaries: primaries.size,
});
