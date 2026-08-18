import { NextResponse } from "next/server";
import { parsePlaylistSource } from "@/lib/import/playlist";
import { allArtists, allTracksAdmin, getTrack } from "@/lib/catalogue";
import { upsertCatalogue, type CatalogueFile } from "@/lib/catalogue/load";
import { normalizeText, compact } from "@/lib/normalize";
import { resolveLivePlayback } from "@/lib/audio/live";

function authorized(request: Request) {
  const key = process.env.ADMIN_KEY;
  if (!key) return true;
  return request.headers.get("x-admin-key") === key;
}

function slug(title: string, artist: string) {
  return `${compact(title)}-${compact(artist) || "track"}`.slice(0, 48) || crypto.randomUUID();
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  const body = (await request.json()) as { source?: string; activate?: boolean };
  if (!body.source) return NextResponse.json({ error: "need source" }, { status: 400 });
  const imported = await parsePlaylistSource(body.source);
  const tracks = allTracksAdmin();
  const artists = allArtists();
  const review = imported.map((item) => {
    const t = tracks.find(
      (x) =>
        x.normalizedTitle === normalizeText(item.rawTitle) ||
        x.aliases.some((a) => normalizeText(a) === normalizeText(item.rawTitle)) ||
        (item.youtubeVideoId && x.youtubeVideoId === item.youtubeVideoId),
    );
    const matchedArtists = item.rawArtists
      .map((name) =>
        artists.find(
          (a) =>
            a.normalizedName === normalizeText(name) ||
            a.aliases.some((al) => normalizeText(al) === normalizeText(name)),
        ),
      )
      .filter(Boolean);
    return {
      ...item,
      matchedTrackId: t?.id,
      matchedArtistIds: matchedArtists.map((a) => a!.id),
      status: t ? "matched" : "review",
    };
  });

  if (body.activate) {
    const toAdd: CatalogueFile["tracks"] = [];
    for (const row of review) {
      if (row.matchedTrackId) continue;
      if (!row.youtubeVideoId) continue;
      const artistId = row.matchedArtistIds[0] ?? "divine";
      const id = slug(row.rawTitle, artistId);
      if (getTrack(id)) continue;
      const draft = {
        id,
        title: row.rawTitle,
        artistIds: row.matchedArtistIds.length ? row.matchedArtistIds : [artistId],
        primaryArtistId: artistId,
        aliases: [],
        sourcePlaylists: [row.sourcePlaylist],
        sceneTags: [],
        difficulty: 3 as const,
        active: false,
        introQuality: "uncertain" as const,
        youtubeVideoId: row.youtubeVideoId,
        youtubeStartFaithful: false,
        country: "IN" as const,
        genre: "DHH" as const,
      };
      const existing = allTracksAdmin().find((t) => t.id === id) ?? {
        ...draft,
        normalizedTitle: normalizeText(row.rawTitle),
        artists: [{ id: artistId, name: artistId }],
      };
      const live = await resolveLivePlayback({
        ...existing,
        youtubeVideoId: row.youtubeVideoId,
        youtubeStartFaithful: true,
        introQuality: "faithful",
        active: true,
        country: "IN",
        genre: "DHH",
      } as never);
      toAdd.push({
        ...draft,
        active: Boolean(live),
        introQuality: live ? "faithful" : "uncertain",
        youtubeStartFaithful: Boolean(live),
      });
    }
    if (toAdd.length) await upsertCatalogue({ tracks: toAdd });
  }

  return NextResponse.json({ review, imported: review.length });
}
