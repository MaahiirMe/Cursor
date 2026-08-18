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

export function dedupeImported(items: ImportedTrack[]): ImportedTrack[] {
  const seen = new Set<string>();
  const out: ImportedTrack[] = [];
  for (const item of items) {
    const key = `${item.rawTitle.toLowerCase()}::${item.rawArtists.join(",").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
