import { hybridSearchArtists, hybridSearchTracks } from "@/lib/metadata/search";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const kind = searchParams.get("kind") ?? "tracks";
  try {
    const hits = kind === "artists" ? await hybridSearchArtists(q) : await hybridSearchTracks(q);
    return NextResponse.json({ hits });
  } catch {
    const { searchArtists, searchTracks } = await import("@/lib/search");
    const hits = kind === "artists" ? searchArtists(q) : searchTracks(q);
    return NextResponse.json({ hits });
  }
}
