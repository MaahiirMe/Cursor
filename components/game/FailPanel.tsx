"use client";

import Link from "next/link";
import type { RevealedTrack } from "@/types";

export function FailPanel({
  track,
  pool,
  missPct,
}: {
  track: RevealedTrack;
  pool: number;
  missPct: number;
}) {
  return (
    <section className="space-y-6" aria-live="polite">
      <p className="display text-3xl sm:text-5xl">AAJ SCENE NE HARA DIYA.</p>
      <div className="flex items-end gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={track.artworkUrl} alt="" className="h-28 w-28 border border-ink/20 object-cover" />
        <div>
          <p className="display text-2xl">{track.title}</p>
          <p className="mt-1 text-sm">{track.artists.join(" · ")}</p>
        </div>
      </div>
      <p className="text-sm text-mute">
        {pool.toLocaleString("en-IN")} players mein se {missPct}% bhi nahi pehchaan paaye.
      </p>
      <Link
        href="/play/unlimited"
        className="flex h-12 items-center justify-center bg-acid text-[13px] tracking-[0.16em] text-bg"
      >
        PLAY UNLIMITED
      </Link>
    </section>
  );
}
