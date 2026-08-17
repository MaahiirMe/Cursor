/**
 * Original placeholder instrumentals. Not commercial DHH recordings.
 * Swap this module for a licensed preview provider later.
 */
const cache = new Map<string, string>();

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function generateBeatWav(seed: number, duration = 16): Promise<Blob> {
  const sampleRate = 22050;
  const length = Math.floor(sampleRate * duration);
  const ctx = new OfflineAudioContext(1, length, sampleRate);
  const rand = mulberry32(seed);
  const bpm = 84 + Math.floor(rand() * 36);
  const beat = 60 / bpm;
  const swing = 0.012 + rand() * 0.03;

  const master = ctx.createGain();
  master.gain.value = 0.85;
  master.connect(ctx.destination);

  function tone(
    type: OscillatorType,
    freq: number,
    start: number,
    dur: number,
    gain: number,
    decay = 0.08,
  ) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(start);
    osc.stop(start + dur + decay);
  }

  function noiseHit(start: number, dur: number, gain: number, hp = 800) {
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * dur), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (rand() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(start);
  }

  const kickTune = 48 + rand() * 30;
  const bassTune = 38 + rand() * 22;
  const snareHp = 900 + rand() * 1400;
  const pattern = Math.floor(rand() * 3);

  for (let t = 0; t < duration; t += beat) {
    const i = Math.round(t / beat);
    const swingT = i % 2 === 1 ? t + swing : t;
    if (i % 4 === 0 || (pattern === 1 && i % 8 === 6)) {
      tone("sine", kickTune * 2, swingT, 0.12, 0.9, 0.12);
      tone("triangle", kickTune, swingT, 0.18, 0.5, 0.1);
    }
    if (i % 4 === 2) {
      noiseHit(swingT, 0.12, 0.45, snareHp);
      tone("triangle", 180, swingT, 0.05, 0.2);
    }
    if (i % 2 === 0) noiseHit(swingT, 0.03, 0.12, 4000);
    else noiseHit(swingT + swing, 0.02, 0.08, 6000);
    if (i % 8 === 0) {
      tone("sawtooth", bassTune, swingT, 0.4, 0.12, 0.2);
    }
    if (pattern === 2 && i % 16 === 12) {
      tone("square", kickTune * 4, swingT, 0.05, 0.08);
    }
  }

  const rendered = await ctx.startRendering();
  const ch = rendered.getChannelData(0);
  const pcm = new Int16Array(ch.length);
  for (let i = 0; i < ch.length; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return encodeWav(pcm, sampleRate);
}

function encodeWav(samples: Int16Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export async function getGeneratedPreview(trackId: string, seed: number): Promise<string> {
  const hit = cache.get(trackId);
  if (hit) return hit;
  const blob = await generateBeatWav(seed, 16);
  const url = URL.createObjectURL(blob);
  cache.set(trackId, url);
  return url;
}
