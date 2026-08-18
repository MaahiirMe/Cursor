import { NextResponse } from "next/server";
import { dedupeImported, JsonPlaylistImporter } from "@/lib/import/playlist";
import { playableTracks, allArtists } from "@/lib/catalogue";
import { normalizeText } from "@/lib/normalize";

export async function POST(request: Request) {
  const key = process.env.ADMIN_KEY;
  if (key && request.headers.get("x-admin-key") !== key) {
    return NextResponse.json({ error: "nope" }, { status: 401 });
  }
  const body = (await request.json()) as { source?: string };
  if (!body.source) return NextResponse.json({ error: "need source" }, { status: 400 });
  const importer = new JsonPlaylistImporter();
  const imported = dedupeImported(await importer.parse(body.source));
  const tracks = playableTracks();
  const artists = allArtists();
  const review = imported.map((item) => {
    const t = tracks.find(
      (x) =>
        x.normalizedTitle === normalizeText(item.rawTitle) ||
        x.aliases.some((a) => normalizeText(a) === normalizeText(item.rawTitle)),
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
      status: t && matchedArtists.length ? "matched" : "review",
    };
  });
  return NextResponse.json({ review });
}
