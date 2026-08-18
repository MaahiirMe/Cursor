import { spawn } from "child_process";

/**
 * Ingestion-time onset detection for licensed/direct audio.
 * Never run this on the gameplay path.
 */
export async function detectMusicStartSeconds(audioUrl: string): Promise<number | null> {
  const pcm = await decodeMonoPcm(audioUrl);
  if (!pcm) return null;
  return findOnset(pcm.samples, pcm.sampleRate);
}

async function decodeMonoPcm(
  audioUrl: string,
): Promise<{ samples: Float32Array; sampleRate: number } | null> {
  const sampleRate = 8000;
  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    audioUrl,
    "-t",
    "20",
    "-ac",
    "1",
    "-ar",
    String(sampleRate),
    "-f",
    "f32le",
    "pipe:1",
  ];
  try {
    const buf = await runFfmpeg(args);
    if (buf.length < sampleRate * 0.2 * 4) return null;
    const samples = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
    return { samples, sampleRate };
  } catch {
    return null;
  }
}

function runFfmpeg(args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on("data", (c: Buffer) => chunks.push(c));
    child.stderr.on("data", (c: Buffer) => err.push(c));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(Buffer.concat(err).toString() || `ffmpeg ${code}`));
    });
  });
}

export function findOnset(samples: Float32Array, sampleRate: number): number {
  const frame = Math.max(64, Math.round(sampleRate * 0.02));
  const hop = Math.max(32, Math.round(frame / 2));
  const energies: number[] = [];
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
  const sustainFrames = Math.max(4, Math.round(0.18 / (hop / sampleRate)));
  for (let i = 0; i < energies.length - sustainFrames; i++) {
    if (energies[i] < threshold) continue;
    let ok = 0;
    for (let k = 0; k < sustainFrames; k++) {
      if (energies[i + k] >= threshold * 0.7) ok += 1;
    }
    if (ok >= sustainFrames - 1) {
      return Math.round(((i * hop) / sampleRate) * 10) / 10;
    }
  }
  return 0;
}

export function resolvedGameStart(track: {
  gameStartSeconds?: number;
  detectedStartSeconds?: number;
}): number {
  const raw =
    typeof track.gameStartSeconds === "number" && Number.isFinite(track.gameStartSeconds)
      ? track.gameStartSeconds
      : typeof track.detectedStartSeconds === "number" && Number.isFinite(track.detectedStartSeconds)
        ? track.detectedStartSeconds
        : 0;
  return Math.min(14, Math.max(0, raw));
}
