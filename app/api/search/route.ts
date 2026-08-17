import { json } from "@/lib/api/session";
import { liveSearch } from "@/lib/search/live";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") === "artist" ? "artist" : "song";
  const items = await liveSearch(q, type);
  return json({ items });
}
