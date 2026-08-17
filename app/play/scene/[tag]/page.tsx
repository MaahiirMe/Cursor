import { notFound } from "next/navigation";
import { SCENE_TAGS } from "@/data/catalog";
import { RunGame } from "@/components/game/RunGame";
import type { SceneTag } from "@/types";

export default async function SceneRunPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag) as SceneTag;
  if (!SCENE_TAGS.includes(decoded)) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <RunGame mode="scene-run" scene={decoded} eyebrow="SCENE RUN" headline={decoded.toUpperCase()} />
    </div>
  );
}
