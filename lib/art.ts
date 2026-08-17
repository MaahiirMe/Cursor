export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function waveformFromSeed(seed: number, bars = 96): number[] {
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    const a = Math.abs(Math.sin(i * 0.37 + seed * 0.001));
    const b = Math.abs(Math.sin(i * 0.13 + seed * 0.002));
    const kick = i % 8 < 1 ? 0.35 : 0;
    const hat = i % 2 === 0 ? 0.12 : 0;
    const n = ((seed * (i + 3)) % 17) / 17 * 0.18;
    out.push(Math.min(1, 0.18 + a * 0.45 + b * 0.25 + kick + hat + n));
  }
  return out;
}

const PALETTES = [
  ["#1c1408", "#c8ff00", "#f3f0e8"],
  ["#140808", "#ff4d3d", "#f3f0e8"],
  ["#081414", "#8d8d86", "#c8ff00"],
  ["#10100a", "#ffb800", "#f3f0e8"],
  ["#0c0c14", "#f3f0e8", "#c8ff00"],
  ["#1a1008", "#ff4d3d", "#ffb800"],
  ["#0a120a", "#c8ff00", "#8d8d86"],
  ["#12100c", "#f3f0e8", "#ff4d3d"],
];

export function artworkSvg(slug: string, title: string): string {
  const h = hashString(slug);
  const [bg, a, b] = PALETTES[h % PALETTES.length];
  const rot = (h % 18) - 9;
  const x = 40 + (h % 80);
  const y = 60 + ((h >> 5) % 90);
  const safeTitle = title.replace(/[<>&]/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="${safeTitle}">
  <rect width="800" height="800" fill="${bg}"/>
  <rect x="28" y="28" width="744" height="744" fill="none" stroke="${a}" stroke-width="3"/>
  <g transform="translate(400 400) rotate(${rot})">
    <rect x="-260" y="-40" width="520" height="80" fill="${a}"/>
    <rect x="-40" y="-260" width="80" height="520" fill="${b}" opacity="0.85"/>
  </g>
  <circle cx="${x + 200}" cy="${y + 220}" r="${80 + (h % 40)}" fill="none" stroke="${b}" stroke-width="8"/>
  <text x="48" y="740" fill="${b}" font-family="Arial Black, sans-serif" font-size="28" letter-spacing="4">${safeTitle.slice(0, 18).toUpperCase()}</text>
</svg>`;
}

export function artworkDataUrl(slug: string, title: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(artworkSvg(slug, title))}`;
}
