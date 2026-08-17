import { catalogArtists, catalogSongs } from "@/lib/game/engine";
import { searchList } from "@/lib/game/matching";
import { json } from "@/lib/api/session";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "song";
  if (type === "artist") {
    return json({ items: searchList(q, catalogArtists(), 8) });
  }
  return json({ items: searchList(q, catalogSongs(), 8) });
}
