import { catalogArtists, catalogSongs } from "@/lib/game/engine";
import { searchList } from "@/lib/game/matching";
import { compact } from "@/lib/game/normalize";

export type SearchHit = {
  id: string;
  title?: string;
  name?: string;
  primaryArtistName?: string;
  source: "local" | "live";
};

type ItunesSong = {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  artistId?: number;
};

export async function liveSearch(query: string, type: "song" | "artist"): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const local: SearchHit[] =
    type === "artist"
      ? searchList(q, catalogArtists(), 6).map((a) => ({
          id: a.id,
          name: a.name,
          source: "local" as const,
        }))
      : searchList(q, catalogSongs(), 6).map((s) => ({
          id: s.id,
          title: s.title,
          primaryArtistName: s.primaryArtistName,
          source: "local" as const,
        }));

  const remote = await itunes(q, type);
  const seen = new Set(local.map((x) => compact(x.title ?? x.name ?? "")));
  const merged = [...local];
  for (const row of remote) {
    const key = compact(row.title ?? row.name ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }
  return merged.slice(0, 10);
}

async function itunes(q: string, type: "song" | "artist"): Promise<SearchHit[]> {
  const entity = type === "artist" ? "musicArtist" : "song";
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=${entity}&limit=8&country=IN`;
  try {
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: ItunesSong[] };
    const hits: SearchHit[] = [];
    for (const r of data.results ?? []) {
      if (type === "artist") {
        if (!r.artistName) continue;
        hits.push({
          id: `live-artist-${r.artistId ?? compact(r.artistName)}`,
          name: r.artistName,
          source: "live",
        });
      } else if (r.trackName) {
        hits.push({
          id: `live-song-${r.trackId ?? compact(r.trackName)}`,
          title: r.trackName,
          primaryArtistName: r.artistName,
          source: "live",
        });
      }
    }
    return hits;
  } catch {
    return [];
  }
}
