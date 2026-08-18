"use client";

import { EditorialNav } from "@/components/EditorialNav";
import type { Identity } from "@/lib/identity";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MePage() {
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((p: { identity?: Identity | null }) => setIdentity(p.identity ?? null));
  }, []);

  const stats = identity?.kind === "registered" ? identity.stats : null;

  return (
    <>
      <EditorialNav identity={identity} />
      <main className="px-4 py-16 md:px-10">
        <p className="mono text-smoke">
          {identity?.kind === "registered" ? "REGISTERED" : "GUEST"}
        </p>
        <h1 className="mt-4 font-serif text-[clamp(4rem,14vw,10rem)] leading-[0.8] tracking-[-0.06em]">
          {identity?.kind === "registered"
            ? identity.username
            : identity?.kind === "guest"
              ? identity.displayName
              : "KAUN HAI?"}
        </h1>
        {stats ? (
          <dl className="mt-12 grid max-w-xl grid-cols-2 gap-y-5 font-mono text-sm tracking-[0.08em]">
            <dt className="text-smoke">SESSIONS</dt>
            <dd>{stats.sessions}</dd>
            <dt className="text-smoke">TRACKS</dt>
            <dd>{stats.tracksAttempted}</dd>
            <dt className="text-smoke">CORRECT</dt>
            <dd>{stats.correct}</dd>
            <dt className="text-smoke">ACCURACY</dt>
            <dd>{stats.accuracy}%</dd>
            <dt className="text-smoke">TOTAL</dt>
            <dd>{stats.totalScore.toLocaleString("en-IN")} PTS</dd>
            <dt className="text-smoke">BEST</dt>
            <dd>{stats.bestScore.toLocaleString("en-IN")} PTS</dd>
            <dt className="text-smoke">AVG LISTEN</dt>
            <dd>{stats.averageListen ?? "—"} SEC</dd>
            <dt className="text-smoke">2 SEC HITS</dt>
            <dd>{stats.perfectTwoSecond}</dd>
            <dt className="text-smoke">STREAK</dt>
            <dd>{stats.streak}</dd>
            <dt className="text-smoke">BEST STREAK</dt>
            <dd>{stats.bestStreak}</dd>
          </dl>
        ) : (
          <p className="mt-10 max-w-md text-smoke">
            Guest scores stay on this device. Leaderboard ke liye CREATE USERNAME.
          </p>
        )}
        <div className="mt-10 flex gap-8 font-mono text-sm">
          <Link href="/">PLAY</Link>
          <Link href="/daily">DAILY 5</Link>
          <Link href="/hard">HARD?</Link>
        </div>
      </main>
    </>
  );
}
