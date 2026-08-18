import { NextResponse } from "next/server";
import { allTracksAdmin, allArtistsAdmin, loadCatalogue } from "@/lib/catalogue";
import { PLAYLIST_SOURCES, upsertCatalogue } from "@/lib/catalogue/load";
import { resetSearchIndex } from "@/lib/search";
import { compact } from "@/lib/normalize";

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
      licensedPreviewUrl?: string;
      gameStartSeconds?: number;
      aliases?: string[];
      difficulty?: 1 | 2 | 3 | 4 | 5;
      active?: boolean;
      introQuality?: "faithful" | "uncertain" | "unusable";
      album?: string;
      releaseYear?: number;
      hints?: [string, string, string];
      recognitionScore?: number;
    };
    merge?: { fromArtistId: string; intoArtistId: string };
  };
  if (body.merge) {
    const from = allArtistsAdmin().find((a) => a.id === body.merge!.fromArtistId);
    const into = allArtistsAdmin().find((a) => a.id === body.merge!.intoArtistId);
    if (!from || !into) return NextResponse.json({ error: "missing artist" }, { status: 404 });
    const tracks = allTracksAdmin().map((t) => {
      const ids = t.artists.map((a) => (a.id === from.id ? into.id : a.id));
      const unique = [...new Set(ids)];
      return {
        id: t.id,
        title: t.title,
        artistIds: unique,
        primaryArtistId: t.primaryArtistId === from.id ? into.id : t.primaryArtistId,
        aliases: t.aliases,
        album: t.album,
        releaseYear: t.releaseYear,
        youtubeVideoId: t.youtubeVideoId,
        youtubeStartFaithful: t.youtubeStartFaithful,
        licensedPreviewUrl: t.licensedPreviewUrl,
        detectedStartSeconds: t.detectedStartSeconds,
        gameStartSeconds: t.gameStartSeconds,
        startVerified: t.startVerified,
        recognitionScore: t.recognitionScore,
        sourcePlaylists: t.sourcePlaylists,
        sceneTags: t.sceneTags,
        difficulty: t.difficulty,
        active: t.active,
        introQuality: t.introQuality,
        artworkUrl: t.artworkUrl,
        hints: t.hints,
        country: "IN" as const,
        genre: "DHH" as const,
      };
    });
    await upsertCatalogue({
      artists: [
        {
          id: into.id,
          name: into.name,
          aliases: [...new Set([...into.aliases, from.name, ...from.aliases])],
          sceneTags: [...new Set([...into.sceneTags, ...from.sceneTags])],
          country: into.country,
          active: true,
        },
        {
          id: from.id,
          name: from.name,
          aliases: from.aliases,
          sceneTags: from.sceneTags,
          country: from.country,
          active: false,
        },
      ],
      tracks,
    });
    resetSearchIndex();
    await loadCatalogue();
    return NextResponse.json({ ok: true, merged: `${from.id} → ${into.id}` });
  }
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
          youtubeStartFaithful: false,
          licensedPreviewUrl: body.track.licensedPreviewUrl,
          gameStartSeconds: body.track.gameStartSeconds ?? 0,
          startVerified: Boolean(body.track.licensedPreviewUrl),
          recognitionScore: body.track.recognitionScore ?? 50,
          sourcePlaylists: ["manual"],
          sceneTags: [],
          difficulty: body.track.difficulty ?? 3,
          active: Boolean(body.track.licensedPreviewUrl) && (body.track.active ?? true),
          introQuality: body.track.introQuality ?? (body.track.licensedPreviewUrl ? "faithful" : "uncertain"),
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
  if (!existing) {
    const artist = allArtistsAdmin().find((a) => a.id === body.id);
    if (!artist) return NextResponse.json({ error: "missing" }, { status: 404 });
    await upsertCatalogue({
      artists: [
        {
          id: artist.id,
          name: (body.patch.name as string) ?? artist.name,
          aliases: (body.patch.aliases as string[]) ?? artist.aliases,
          sceneTags: (body.patch.sceneTags as string[]) ?? artist.sceneTags,
          country: artist.country,
          active: (body.patch.active as boolean) ?? artist.active,
        },
      ],
    });
    resetSearchIndex();
    return NextResponse.json({ ok: true });
  }
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
        detectedStartSeconds: existing.detectedStartSeconds,
        gameStartSeconds: existing.gameStartSeconds,
        startVerified: existing.startVerified,
        recognitionScore: existing.recognitionScore,
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

export { compact };
