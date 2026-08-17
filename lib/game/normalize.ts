export function fold(input: string): string {
  return input
    .toLowerCase()
    .replace(/\$/g, "s")
    .replace(/&/g, "and")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function compact(input: string): string {
  return fold(input).replace(/[^a-z0-9]/g, "");
}

export function tokens(input: string): string[] {
  return fold(input)
    .split(/[^a-z0-9$]+/)
    .filter(Boolean);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length];
}

export function fuzzyScore(query: string, target: string, aliases: string[] = []): number {
  const q = compact(query);
  if (!q) return 0;
  const pool = [target, ...aliases];
  let best = 0;
  for (const item of pool) {
    const t = compact(item);
    if (!t) continue;
    if (q === t) return 1;
    if (t.startsWith(q) || q.startsWith(t)) best = Math.max(best, 0.92);
    if (t.includes(q) || q.includes(t)) best = Math.max(best, 0.84);
    const dist = levenshtein(q, t);
    const maxLen = Math.max(q.length, t.length);
    const ratio = 1 - dist / maxLen;
    if (maxLen <= 4 && dist <= 1) best = Math.max(best, 0.9);
    if (maxLen > 4 && dist <= 2) best = Math.max(best, 0.88);
    best = Math.max(best, ratio);
  }
  return best;
}
