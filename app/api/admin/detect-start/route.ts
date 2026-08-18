import { NextResponse } from "next/server";
import { allTracksAdmin, getTrack, loadCatalogue } from "@/lib/catalogue";
import { upsertCatalogue } from "@/lib/catalogue/load";
import { detectMusicStartSeconds, resolvedGameStart } from "@/lib/audio/onset";
import { resetSearchIndex } from "@/lib/search";

function authorized(request: Request) {
  const key = process.env.ADMIN_KEY;
  if (!key) return true;
  return request.headers.get("x-admin-key") === key;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  const body = (await request.json()) as { id?: string; gameStartSeconds?: number };
  await loadCatalogue();
  const track = body.id ? getTrack(body.id) : undefined;
  if (!track) return NextResponse.json({ error: "missing" }, { status: 404 });
  if (!track.licensedPreviewUrl) {
    return NextResponse.json({ error: "Need licensed preview audio first" }, { status: 400 });
  }
  const detected = await detectMusicStartSeconds(track.licensedPreviewUrl);
  const gameStartSeconds =
    typeof body.gameStartSeconds === "number" ? body.gameStartSeconds : resolvedGameStart({
      gameStartSeconds: track.gameStartSeconds,
      detectedStartSeconds: detected ?? track.detectedStartSeconds,
    });
  await upsertCatalogue({
    tracks: [
      {
        id: track.id,
        title: track.title,
        artistIds: track.artists.map((a) => a.id),
        primaryArtistId: track.primaryArtistId,
        aliases: track.aliases,
        album: track.album,
        releaseYear: track.releaseYear,
        youtubeVideoId: track.youtubeVideoId,
        youtubeStartFaithful: false,
        licensedPreviewUrl: track.licensedPreviewUrl,
        detectedStartSeconds: detected ?? track.detectedStartSeconds,
        gameStartSeconds,
        startVerified: detected != null || typeof body.gameStartSeconds === "number" || track.startVerified,
        recognitionScore: track.recognitionScore,
        sourcePlaylists: track.sourcePlaylists,
        sceneTags: track.sceneTags,
        difficulty: track.difficulty,
        active: track.active,
        introQuality: track.introQuality,
        artworkUrl: track.artworkUrl,
        hints: track.hints,
        country: "IN",
        genre: "DHH",
      },
    ],
  });
  resetSearchIndex();
  return NextResponse.json({
    id: track.id,
    detectedStartSeconds: detected,
    gameStartSeconds,
    startVerified: true,
    tracks: allTracksAdmin().length,
  });
}
