import { readFileSync, writeFileSync } from "fs";
import { spawn } from "child_process";

const seedPath = new URL("../catalogue/seed.json", import.meta.url);
const seed = JSON.parse(readFileSync(seedPath, "utf8"));

function compact(s) {
  return String(s).toLowerCase().replace(/\$/g, "s").replace(/[^a-z0-9]+/g, "");
}
function norm(s) {
  return String(s).toLowerCase().replace(/\$/g, "s").replace(/[^a-z0-9]+/g, " ").trim();
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=20&country=IN`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

function artistMatch(rowName, artist) {
  const a = compact(artist.name);
  const r = compact(rowName);
  if (!a || !r) return false;
  if (r.includes(a) || a.includes(r)) return true;
  const tokens = artist.name.toLowerCase().split(/\s+/).filter((x) => x.length > 2);
  return tokens.some((t) => r.includes(compact(t)));
}

const playableIds = new Set(
  seed.tracks.filter((t) => t.startVerified && t.licensedPreviewUrl).map((t) => t.primaryArtistId),
);
const haveTitle = new Set(seed.tracks.map((t) => `${t.primaryArtistId}::${norm(t.title)}`));
const targets = seed.artists.filter(
  (a) => a.country !== "PK" && a.active !== false && !playableIds.has(a.id),
);

let added = 0;
for (const a of targets) {
  if (added >= 70) break;
  const queries = [a.name, ...(a.aliases ?? []).slice(0, 2)];
  let got = 0;
  for (const q of queries) {
    if (got >= 2) break;
    const rows = await itunesSong(`${q} hip hop`);
    await sleep(70);
    for (const [i, r] of rows.entries()) {
      if (got >= 2) break;
      if (!r.previewUrl || !r.trackName) continue;
      if (!artistMatch(r.artistName ?? "", a)) continue;
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
        recognitionScore: Math.max(32, 84 - i * 6),
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
    }
  }
}

writeFileSync(seedPath, JSON.stringify(seed, null, 2) + "\n");
const playable = seed.tracks.filter((t) => t.startVerified && t.licensedPreviewUrl && t.active);
console.log({
  added,
  tracks: seed.tracks.length,
  playable: playable.length,
  uniquePrimaries: new Set(playable.map((t) => t.primaryArtistId)).size,
});
