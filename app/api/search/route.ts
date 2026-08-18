import { searchArtists, searchTracks } from "@/lib/search";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const kind = searchParams.get("kind") ?? "tracks";
  const hits = kind === "artists" ? searchArtists(q) : searchTracks(q);
  return NextResponse.json({ hits });
}
