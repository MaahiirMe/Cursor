import { compact, normalizeText } from "../normalize";

type ItunesSong = {
  trackName?: string;
  artistName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
  collectionName?: string;
  releaseDate?: string;
  primaryGenreName?: string;
};

export async function findItunesPreview(title: string, artist: string): Promise<{
  previewUrl: string;
  artworkUrl?: string;
  album?: string;
  releaseYear?: number;
  recognitionScore: number;
} | null> {
  const term = encodeURIComponent(`${title} ${artist}`);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${term}&entity=song&limit=12&country=IN`,
      { signal: ctrl.signal, headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: ItunesSong[] };
    const wantTitle = normalizeText(title);
    const wantArtist = compact(artist);
    const ranked = (data.results ?? [])
      .map((r, i) => {
        if (!r.previewUrl || !r.trackName) return null;
        const t = normalizeText(r.trackName);
        const a = compact(r.artistName ?? "");
        let score = 70 - i * 3;
        if (t === wantTitle) score += 40;
        else if (t.includes(wantTitle.slice(0, 8)) || wantTitle.includes(t.slice(0, 8))) score += 18;
        if (a.includes(wantArtist.slice(0, 6)) || wantArtist.includes(a.slice(0, 6))) score += 20;
        return { r, score };
      })
      .filter(Boolean) as Array<{ r: ItunesSong; score: number }>;
    ranked.sort((x, y) => y.score - x.score);
    const hit = ranked[0]?.r;
    if (!hit?.previewUrl) return null;
    const year = hit.releaseDate ? Number(hit.releaseDate.slice(0, 4)) : undefined;
    return {
      previewUrl: hit.previewUrl,
      artworkUrl: hit.artworkUrl100?.replace("100x100bb", "600x600bb"),
      album: hit.collectionName,
      releaseYear: Number.isFinite(year) ? year : undefined,
      recognitionScore: Math.max(25, Math.min(96, ranked[0].score)),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function findItunesTracksForArtist(artist: string, limit = 6): Promise<
  Array<{
    title: string;
    previewUrl: string;
    artworkUrl?: string;
    album?: string;
    releaseYear?: number;
    recognitionScore: number;
  }>
> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=20&country=IN`,
      { signal: ctrl.signal, headers: { Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: ItunesSong[] };
    const artistC = compact(artist);
    const out = [];
    const seen = new Set<string>();
    for (const [i, r] of (data.results ?? []).entries()) {
      if (!r.previewUrl || !r.trackName) continue;
      if (!compact(r.artistName ?? "").includes(artistC.slice(0, 6))) continue;
      const key = normalizeText(r.trackName);
      if (seen.has(key)) continue;
      seen.add(key);
      const year = r.releaseDate ? Number(r.releaseDate.slice(0, 4)) : undefined;
      out.push({
        title: r.trackName,
        previewUrl: r.previewUrl,
        artworkUrl: r.artworkUrl100?.replace("100x100bb", "600x600bb"),
        album: r.collectionName,
        releaseYear: Number.isFinite(year) ? year : undefined,
        recognitionScore: Math.max(28, 88 - i * 6),
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
