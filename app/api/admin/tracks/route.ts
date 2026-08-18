import { NextResponse } from "next/server";
import { allTracksAdmin, allArtists } from "@/lib/catalogue";
import { PLAYLIST_SOURCES } from "@/lib/catalogue/data";

function authorized(request: Request) {
  const key = process.env.ADMIN_KEY;
  if (!key) return true;
  return request.headers.get("x-admin-key") === key;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return NextResponse.json({
    tracks: allTracksAdmin(),
    artists: allArtists(),
    playlists: PLAYLIST_SOURCES,
  });
}
