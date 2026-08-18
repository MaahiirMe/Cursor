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
  artists: { name: string; id: string }[];
};

type ArtistRow = { id: string; name: string };

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [source, setSource] = useState("");
  const [review, setReview] = useState<unknown>(null);
  const [title, setTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [youtube, setYoutube] = useState("");
  const [artistName, setArtistName] = useState("");

  async function reload() {
    const res = await fetch("/api/admin/tracks");
    const j = (await res.json()) as { tracks: TrackRow[]; artists: ArtistRow[] };
    setTracks(j.tracks);
    setArtists(j.artists);
    if (j.artists[0] && !artistId) setArtistId(j.artists[0].id);
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <>
      <EditorialNav />
      <main className="px-4 py-10 md:px-10">
        <p className="mono text-orange">ADMIN / CATALOGUE</p>
        <h1 className="mt-2 font-serif text-6xl tracking-tight md:text-8xl">TRACKS</h1>
        <p className="mt-4 max-w-xl text-smoke">
          Playlist URLs import metadata. A track only goes live after a valid 00:00 YouTube (or licensed)
          source is attached. {tracks.length} tracks · {artists.length} artists.
        </p>

        <form
          className="mt-10 grid max-w-xl gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/admin/tracks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                track: {
                  title,
                  artistIds: [artistId],
                  youtubeVideoId: youtube || undefined,
                  active: Boolean(youtube),
                },
              }),
            });
            setTitle("");
            setYoutube("");
            await reload();
          }}
        >
          <p className="mono text-smoke">ADD TRACK</p>
          <input className="field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select
            className="field bg-ink"
            value={artistId}
            onChange={(e) => setArtistId(e.target.value)}
          >
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            className="field"
            placeholder="YouTube video ID"
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
          />
          <button className="lock w-fit" type="submit">
            SAVE TRACK
          </button>
        </form>

        <form
          className="mt-10 max-w-xl"
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/admin/tracks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ artist: { name: artistName } }),
            });
            setArtistName("");
            await reload();
          }}
        >
          <p className="mono text-smoke">ADD ARTIST</p>
          <input
            className="field mt-2"
            placeholder="Canonical name"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
          />
          <button className="lock mt-4" type="submit">
            SAVE ARTIST
          </button>
        </form>

        <ul className="mt-10 space-y-5">
          {tracks.map((t) => (
            <li key={t.id} className="grid grid-cols-12 items-baseline gap-3 border-b border-paper/10 pb-3">
              <span className="col-span-4 font-serif text-2xl">{t.title}</span>
              <span className="col-span-3 font-mono text-xs text-smoke">
                {t.artists.map((a) => a.name).join(", ")}
              </span>
              <span className="col-span-2 font-mono text-xs">{t.introQuality}</span>
              <button
                type="button"
                className="col-span-1 font-mono text-xs"
                onClick={async () => {
                  await fetch("/api/admin/tracks", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: t.id, patch: { active: !t.active } }),
                  });
                  await reload();
                }}
              >
                {t.active ? "ON" : "OFF"}
              </button>
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
              body: JSON.stringify({ source, activate: true }),
            });
            setReview(await res.json());
            await reload();
          }}
        >
          <label className="mono text-smoke">YouTube playlist URL or JSON</label>
          <textarea
            className="mt-3 h-32 w-full bg-transparent font-mono text-xs outline-none"
            value={source}
            placeholder="https://www.youtube.com/playlist?list=…"
            onChange={(e) => setSource(e.target.value)}
          />
          <button className="lock mt-4" type="submit">
            IMPORT
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
