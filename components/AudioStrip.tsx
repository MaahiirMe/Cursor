"use client";

import type { RevealedRound } from "@/lib/types";

const labels = ["01", "02", "03", "04", "05"];

export function AudioStrip({
  rounds,
  current,
}: {
  rounds: RevealedRound[];
  current: number;
}) {
  return (
    <div className="strip mt-8 px-4 md:px-8" aria-hidden>
      {labels.map((label, i) => {
        const round = rounds[i];
        const state =
          round?.outcome === "correct"
            ? "solved"
            : round?.outcome === "failed" || round?.outcome === "skipped"
              ? "miss"
              : i === current
                ? "now"
                : "wait";
        return (
          <div key={label} className="blob" data-shape={i} data-state={state}>
            <div className="tex" />
            <div className="absolute inset-x-3 top-3 flex justify-between font-mono text-[0.58rem] tracking-[0.14em] text-paper/80">
              <span>{label}</span>
              <span>
                {state === "now" ? "NOW PLAYING" : state === "solved" ? round.title : state === "miss" ? "—" : "LOCKED"}
              </span>
            </div>
            {state === "wait" || state === "now" ? (
              <div className="absolute bottom-3 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-paper/30 text-[0.65rem]">
                {state === "now" ? "♪" : "🔒"}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
