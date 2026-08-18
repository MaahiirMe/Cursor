import { NextResponse } from "next/server";
import { parsePlaylistSource } from "@/lib/import/playlist";
import { allArtists, allTracksAdmin, getTrack } from "@/lib/catalogue";
import { upsertCatalogue, type CatalogueFile } from "@/lib/catalogue/load";
import { normalizeText, compact } from "@/lib/normalize";

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
    const { findItunesPreview } = await import("@/lib/audio/itunes-preview");
    const { detectMusicStartSeconds } = await import("@/lib/audio/onset");
    for (const row of review) {
      if (row.matchedTrackId) continue;
      const artistId = row.matchedArtistIds[0];
      if (!artistId) continue;
      const artistName = artists.find((a) => a.id === artistId)?.name ?? row.rawArtists[0] ?? "";
      const preview = await findItunesPreview(row.rawTitle, artistName);
      if (!preview) continue;
      const id = slug(row.rawTitle, artistId);
      if (getTrack(id)) continue;
      const detected = await detectMusicStartSeconds(preview.previewUrl);
      toAdd.push({
        id,
        title: row.rawTitle,
        artistIds: row.matchedArtistIds.length ? row.matchedArtistIds : [artistId],
        primaryArtistId: artistId,
        aliases: [],
        sourcePlaylists: [row.sourcePlaylist],
        sceneTags: [],
        difficulty: 3,
        active: detected != null,
        introQuality: detected != null ? "faithful" : "uncertain",
        youtubeVideoId: row.youtubeVideoId,
        youtubeStartFaithful: false,
        licensedPreviewUrl: preview.previewUrl,
        detectedStartSeconds: detected ?? undefined,
        gameStartSeconds: detected ?? 0,
        startVerified: detected != null,
        recognitionScore: preview.recognitionScore,
        artworkUrl: preview.artworkUrl,
        album: preview.album,
        releaseYear: preview.releaseYear,
        country: "IN",
        genre: "DHH",
      });
    }
    if (toAdd.length) await upsertCatalogue({ tracks: toAdd });
  }

  return NextResponse.json({ review, imported: review.length });
}
