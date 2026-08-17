import { notFound } from "next/navigation";
import { artistsBySlug } from "@/data/artists";
import { RunGame } from "@/components/game/RunGame";

export default async function ArtistRunPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = artistsBySlug.get(slug);
  if (!artist) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <RunGame
        mode="artist-run"
        artistId={artist.id}
        eyebrow="ARTIST RUN"
        headline={artist.name.toUpperCase()}
      />
    </div>
  );
}
