import { ARTISTS } from "@/data/artists";
import { SCENE_TAGS } from "@/data/catalog";
import { json } from "@/lib/api/session";

export async function GET() {
  return json({
    artists: ARTISTS.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      sceneTags: a.sceneTags,
    })),
    scenes: SCENE_TAGS,
  });
}
