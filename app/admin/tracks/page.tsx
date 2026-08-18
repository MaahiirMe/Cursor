"use client";

import { EditorialNav } from "@/components/EditorialNav";
import { YouTubeClip, type YouTubeClipHandle } from "@/components/YouTubeClip";
import { useEffect, useRef, useState } from "react";

type TrackRow = {
  id: string;
  title: string;
  youtubeVideoId?: string;
  licensedPreviewUrl?: string;
  gameStartSeconds?: number;
  startVerified?: boolean;
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
  const [previewUrl, setPreviewUrl] = useState("");
  const [startSec, setStartSec] = useState("0");
  const [artistName, setArtistName] = useState("");
  const [aliases, setAliases] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [fromMerge, setFromMerge] = useState("");
  const [intoMerge, setIntoMerge] = useState("");
  const clip = useRef<YouTubeClipHandle>(null);

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
                  licensedPreviewUrl: previewUrl || undefined,
                  gameStartSeconds: Number(startSec) || 0,
                  active: Boolean(previewUrl),
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
            placeholder="Licensed preview URL (required to go live)"
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
          />
          <input
            className="field"
            placeholder="gameStartSeconds"
            value={startSec}
            onChange={(e) => setStartSec(e.target.value)}
          />
          <input
            className="field"
            placeholder="YouTube video ID (admin reference only)"
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
              body: JSON.stringify({ artist: { name: artistName, aliases: aliases.split(",").map((s) => s.trim()).filter(Boolean) } }),
            });
            setArtistName("");
            setAliases("");
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
          <input
            className="field mt-2"
            placeholder="Aliases (comma)"
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
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
              <span className="col-span-2 font-mono text-xs">
                {t.startVerified ? `START ${t.gameStartSeconds ?? 0}` : "UNVERIFIED"}
              </span>
              <button
                type="button"
                className="col-span-1 font-mono text-xs text-orange"
                onClick={() => {
                  if (!t.licensedPreviewUrl) return;
                  const audio = new Audio(t.licensedPreviewUrl);
                  audio.addEventListener("canplay", () => {
                    audio.currentTime = t.gameStartSeconds ?? 0;
                    void audio.play();
                    window.setTimeout(() => audio.pause(), 4000);
                  }, { once: true });
                }}
              >
                4 SEC
              </button>
              <button
                type="button"
                className="col-span-1 font-mono text-xs"
                onClick={async () => {
                  await fetch("/api/admin/detect-start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: t.id }),
                  });
                  await reload();
                }}
              >
                DETECT
              </button>
              <button
                type="button"
                className="col-span-1 font-mono text-xs"
                onClick={async () => {
                  await fetch("/api/admin/tracks", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: t.id,
                      patch: { active: false, introQuality: "unusable" },
                    }),
                  });
                  await reload();
                }}
              >
                FLAG
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-10 max-w-xl"
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/admin/tracks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ merge: { fromArtistId: fromMerge, intoArtistId: intoMerge } }),
            });
            setFromMerge("");
            setIntoMerge("");
            await reload();
          }}
        >
          <p className="mono text-smoke">MERGE DUPLICATE ARTISTS</p>
          <select className="field mt-2 bg-ink" value={fromMerge} onChange={(e) => setFromMerge(e.target.value)}>
            <option value="">From (deactivate)</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select className="field mt-2 bg-ink" value={intoMerge} onChange={(e) => setIntoMerge(e.target.value)}>
            <option value="">Into (keep)</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <button className="lock mt-4" type="submit" disabled={!fromMerge || !intoMerge || fromMerge === intoMerge}>
            MERGE
          </button>
        </form>
        {previewId ? (
          <div className="mt-10">
            <p className="mono text-smoke">YOUTUBE REFERENCE ONLY · NOT USED IN ROUNDS · {previewId}</p>
            <YouTubeClip ref={clip} videoId={previewId} className="relative mt-3 h-40 w-72 rounded-sm" />
          </div>
        ) : null}
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
