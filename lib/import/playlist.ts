export interface PlaylistImporter {
  parse(source: string): Promise<ImportedTrack[]>;
}

export type ImportedTrack = {
  rawTitle: string;
  rawArtists: string[];
  sourcePlaylist: string;
  youtubeVideoId?: string;
  durationSeconds?: number;
  isrc?: string;
  certainty: "high" | "uncertain";
};

export class JsonPlaylistImporter implements PlaylistImporter {
  async parse(source: string): Promise<ImportedTrack[]> {
    const parsed = JSON.parse(source) as unknown;
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      const title = String(r.title ?? r.rawTitle ?? "");
      const artists = Array.isArray(r.artists)
        ? r.artists.map(String)
        : String(r.artist ?? r.rawArtists ?? "")
            .split(/,| x | × /i)
            .map((s) => s.trim())
            .filter(Boolean);
      return {
        rawTitle: title,
        rawArtists: artists,
        sourcePlaylist: String(r.sourcePlaylist ?? "manual"),
        youtubeVideoId: r.youtubeVideoId ? String(r.youtubeVideoId) : undefined,
        durationSeconds: typeof r.durationSeconds === "number" ? r.durationSeconds : undefined,
        isrc: r.isrc ? String(r.isrc) : undefined,
        certainty: title && artists.length ? "high" : "uncertain",
      };
    });
  }
}

export class YoutubePlaylistImporter implements PlaylistImporter {
  async parse(source: string): Promise<ImportedTrack[]> {
    const list = source.match(/[?&]list=([a-zA-Z0-9_-]+)/)?.[1] ?? source.trim();
    if (!list) return [];
    const url = `https://www.youtube.com/playlist?list=${list}`;
    const res = await fetch(url, { headers: { "User-Agent": "DHHUH/1.0" } });
    if (!res.ok) return [];
    const html = await res.text();
    const ids = [...html.matchAll(/videoId":"([a-zA-Z0-9_-]{11})"/g)].map((m) => m[1]);
    const titles = [...html.matchAll(/"title":\{"runs":\[\{"text":"([^"]+)"\}\]/g)].map((m) => m[1]);
    const unique: ImportedTrack[] = [];
    const seen = new Set<string>();
    ids.forEach((id, i) => {
      if (seen.has(id)) return;
      seen.add(id);
      const rawTitle = (titles[i] ?? "Untitled").replace(/\\u0026/g, "&");
      unique.push({
        rawTitle,
        rawArtists: [],
        sourcePlaylist: list,
        youtubeVideoId: id,
        certainty: "uncertain",
      });
    });
    return unique.slice(0, 80);
  }
}

export async function parsePlaylistSource(source: string): Promise<ImportedTrack[]> {
  const trimmed = source.trim();
  if (trimmed.includes("youtube.com") || trimmed.includes("list=")) {
    return dedupeImported(await new YoutubePlaylistImporter().parse(trimmed));
  }
  try {
    return dedupeImported(await new JsonPlaylistImporter().parse(trimmed));
  } catch {
    return [];
  }
}

export function dedupeImported(items: ImportedTrack[]): ImportedTrack[] {
  const seen = new Set<string>();
  const out: ImportedTrack[] = [];
  for (const item of items) {
    const key = `${item.rawTitle.toLowerCase()}::${item.rawArtists.join(",").toLowerCase()}::${item.youtubeVideoId ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
