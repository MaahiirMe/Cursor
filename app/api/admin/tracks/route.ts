import { NextResponse } from "next/server";
import { allTracksAdmin, allArtistsAdmin, loadCatalogue } from "@/lib/catalogue";
import { PLAYLIST_SOURCES, upsertCatalogue } from "@/lib/catalogue/load";
import { resetSearchIndex } from "@/lib/search";
import { compact, normalizeText } from "@/lib/normalize";

function authorized(request: Request) {
  const key = process.env.ADMIN_KEY;
  if (!key) return true;
  return request.headers.get("x-admin-key") === key;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  await loadCatalogue();
  return NextResponse.json({
    tracks: allTracksAdmin(),
    artists: allArtistsAdmin(),
    playlists: PLAYLIST_SOURCES,
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  const body = (await request.json()) as {
    artist?: { id?: string; name: string; aliases?: string[]; sceneTags?: string[] };
    track?: {
      id?: string;
      title: string;
      artistIds: string[];
      youtubeVideoId?: string;
      aliases?: string[];
      difficulty?: 1 | 2 | 3 | 4 | 5;
      active?: boolean;
      introQuality?: "faithful" | "uncertain" | "unusable";
      album?: string;
      releaseYear?: number;
      hints?: [string, string, string];
    };
  };
  if (body.artist) {
    const id = body.artist.id || compact(body.artist.name) || crypto.randomUUID();
    await upsertCatalogue({
      artists: [
        {
          id,
          name: body.artist.name,
          aliases: body.artist.aliases ?? [],
          sceneTags: body.artist.sceneTags ?? [],
          country: "IN",
          active: true,
        },
      ],
    });
  }
  if (body.track) {
    const id = body.track.id || compact(body.track.title) || crypto.randomUUID();
    await upsertCatalogue({
      tracks: [
        {
          id,
          title: body.track.title,
          artistIds: body.track.artistIds,
          primaryArtistId: body.track.artistIds[0],
          aliases: body.track.aliases ?? [],
          youtubeVideoId: body.track.youtubeVideoId,
          youtubeStartFaithful: Boolean(body.track.youtubeVideoId),
          sourcePlaylists: ["manual"],
          sceneTags: [],
          difficulty: body.track.difficulty ?? 3,
          active: body.track.active ?? false,
          introQuality: body.track.introQuality ?? (body.track.youtubeVideoId ? "faithful" : "uncertain"),
          album: body.track.album,
          releaseYear: body.track.releaseYear,
          hints: body.track.hints,
          country: "IN",
          genre: "DHH",
        },
      ],
    });
  }
  resetSearchIndex();
  await loadCatalogue();
  return NextResponse.json({ ok: true, tracks: allTracksAdmin().length, artists: allArtistsAdmin().length });
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  const body = (await request.json()) as {
    id: string;
    patch: Record<string, unknown>;
  };
  const existing = allTracksAdmin().find((t) => t.id === body.id);
  if (!existing) return NextResponse.json({ error: "missing" }, { status: 404 });
  await upsertCatalogue({
    tracks: [
      {
        id: existing.id,
        title: existing.title,
        artistIds: existing.artists.map((a) => a.id),
        primaryArtistId: existing.primaryArtistId,
        aliases: existing.aliases,
        album: existing.album,
        releaseYear: existing.releaseYear,
        youtubeVideoId: existing.youtubeVideoId,
        youtubeStartFaithful: existing.youtubeStartFaithful,
        licensedPreviewUrl: existing.licensedPreviewUrl,
        sourcePlaylists: existing.sourcePlaylists,
        sceneTags: existing.sceneTags,
        difficulty: existing.difficulty,
        active: existing.active,
        introQuality: existing.introQuality,
        artworkUrl: existing.artworkUrl,
        hints: existing.hints,
        country: "IN",
        genre: "DHH",
        ...body.patch,
      },
    ],
  });
  resetSearchIndex();
  return NextResponse.json({ ok: true });
}

export { normalizeText };
