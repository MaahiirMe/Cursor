import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "dhhuh-dev-secret-change-me";

export function signPlayback(sessionId: string, index: number): string {
  const payload = `${sessionId}:${index}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 24);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyPlayback(token: string): { sessionId: string; index: number } | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [sessionId, indexStr, sig] = raw.split(":");
    if (!sessionId || !indexStr || !sig) return null;
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(`${sessionId}:${indexStr}`)
      .digest("hex")
      .slice(0, 24);
    if (expected !== sig) return null;
    return { sessionId, index: Number(indexStr) };
  } catch {
    return null;
  }
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Generate a unique 16s intro-like PCM wav. Not the licensed track — fallback only. */
export function mockWav(seed: string, seconds = 16): Buffer {
  const sampleRate = 22050;
  const n = sampleRate * seconds;
  const pcm = Buffer.alloc(n * 2);
  const s = hashSeed(seed);
  const root = 110 + (s % 40);
  const pattern = [0, 3, 5, 7, 10, 7, 5, 3];
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const step = Math.floor(t * 4) % pattern.length;
    const freq = root * Math.pow(2, pattern[step] / 12);
    const kick = Math.sin(Math.PI * 80 * (t % 0.5)) * Math.exp(-8 * (t % 0.5));
    const hat = (s % 2 === 0 ? 1 : 0.4) * ((i % 1102 < 80 ? 1 : 0) * (Math.random() * 0.08));
    const tone = Math.sin(2 * Math.PI * freq * t) * 0.18 * (0.6 + 0.4 * Math.sin(t * 2));
    const bass = Math.sin(2 * Math.PI * (root / 2) * t) * 0.12;
    const sample = Math.max(-1, Math.min(1, tone + bass + kick * 0.35 + hat));
    pcm.writeInt16LE(sample * 32767, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
