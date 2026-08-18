"use client";

import { EditorialNav } from "@/components/EditorialNav";
import { useEffect, useState } from "react";

type TrackRow = {
  id: string;
  title: string;
  youtubeVideoId?: string;
  introQuality: string;
  active: boolean;
  difficulty: number;
  artists: { name: string }[];
};

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [source, setSource] = useState("[]");
  const [review, setReview] = useState<unknown>(null);

  useEffect(() => {
    fetch("/api/admin/tracks")
      .then((r) => r.json())
      .then((j: { tracks: TrackRow[] }) => setTracks(j.tracks));
  }, []);

  return (
    <>
      <EditorialNav />
      <main className="px-4 py-10 md:px-10">
        <p className="mono text-orange">ADMIN / CATALOGUE</p>
        <h1 className="mt-2 font-serif text-6xl tracking-tight md:text-8xl">TRACKS</h1>
        <p className="mt-4 max-w-xl text-smoke">
          Uncertain intros stay inactive for YouTube. Game never jumps to the hook. Import lands in
          review — never auto-publish.
        </p>
        <ul className="mt-10 space-y-5">
          {tracks.map((t) => (
            <li key={t.id} className="grid grid-cols-12 items-baseline gap-3 border-b border-paper/10 pb-3">
              <span className="col-span-4 font-serif text-2xl">{t.title}</span>
              <span className="col-span-3 font-mono text-xs text-smoke">
                {t.artists.map((a) => a.name).join(" × ")}
              </span>
              <span className="col-span-2 font-mono text-xs">{t.introQuality}</span>
              <span className="col-span-1 font-mono text-xs">{t.active ? "ON" : "OFF"}</span>
              <span className="col-span-2 font-mono text-xs">{t.youtubeVideoId ?? "—"}</span>
            </li>
          ))}
        </ul>
        <form
          className="mt-16"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/admin/import", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ source }),
            });
            setReview(await res.json());
          }}
        >
          <label className="mono text-smoke">Playlist JSON import</label>
          <textarea
            className="mt-3 h-40 w-full bg-transparent font-mono text-xs outline-none"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <button className="lock mt-4" type="submit">
            PARSE
          </button>
        </form>
        {review ? (
          <pre className="mt-6 overflow-auto font-mono text-xs text-smoke">
            {JSON.stringify(review, null, 2)}
          </pre>
        ) : null}
      </main>
    </>
  );
}
