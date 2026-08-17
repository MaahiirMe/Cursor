"use client";

import { useEffect, useState } from "react";
import type { RevealedTrack } from "@/types";
import { ordinalAttempt } from "@/lib/share";

type Props = {
  track: RevealedTrack;
  attempts: number;
  revealDuration: number;
  score: number;
  streak: number;
  fasterThan: number | null;
  daily?: boolean;
  practice?: boolean;
  onShare: () => void;
  onNext?: () => void;
};

export function ResultPanel({
  track,
  attempts,
  revealDuration,
  score,
  streak,
  fasterThan,
  daily,
  practice,
  onShare,
  onNext,
}: Props) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let n = 0;
    const tick = window.setInterval(() => {
      n += Math.max(1, Math.round(score / 24));
      if (n >= score) {
        setShown(score);
        window.clearInterval(tick);
      } else setShown(n);
    }, 24);
    return () => window.clearInterval(tick);
  }, [score]);

  return (
    <section className="punch flash-edge space-y-6" aria-live="polite">
      <p className="display text-4xl sm:text-6xl">BHAI. HO GAYA.</p>
      <div className="flex items-end gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={track.artworkUrl}
          alt=""
          className="h-28 w-28 border border-ink/20 object-cover sm:h-36 sm:w-36"
        />
        <div>
          <p className="display text-2xl sm:text-4xl">{track.title}</p>
          <p className="mt-1 text-sm text-ink/80">{track.artists.join(" · ")}</p>
          <p className="mono mt-2 text-[11px] tracking-[0.16em] text-mute">
            {track.album} · {track.releaseYear}
          </p>
        </div>
      </div>
      <dl className="mono grid grid-cols-2 gap-2 text-[12px] text-mute sm:grid-cols-4">
        <div>
          <dt className="sr-only">Attempt</dt>
          <dd>{ordinalAttempt(attempts)}</dd>
        </div>
        <div>
          <dt className="sr-only">Reveal</dt>
          <dd>{revealDuration} sec</dd>
        </div>
        <div>
          <dt className="sr-only">Score</dt>
          <dd className="text-ink">Score: {shown}</dd>
        </div>
        <div>
          <dt className="sr-only">Streak</dt>
          <dd>{streak ? `🔥 ${streak} day streak` : "Streak start"}</dd>
        </div>
      </dl>
      {practice ? (
        <p className="mono text-[11px] tracking-[0.2em] text-warn">PRACTICE — official score nahi chhoda.</p>
      ) : null}
      {fasterThan != null ? (
        <p className="text-sm text-mute">Aaj ke {fasterThan}% players se faster.</p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onShare}
          className="h-12 flex-1 bg-acid text-[13px] tracking-[0.16em] text-bg"
        >
          SHARE RESULT
        </button>
        {daily ? (
          <p className="flex h-12 flex-1 items-center justify-center border border-ink/20 text-[12px] tracking-[0.14em]">
            COME BACK TOMORROW
          </p>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="h-12 flex-1 border border-ink/20 text-[12px] tracking-[0.14em]"
          >
            NEXT BEAT
          </button>
        )}
      </div>
    </section>
  );
}
