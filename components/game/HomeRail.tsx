"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/guest-client";
import type { LeaderboardRow } from "@/types";

export function HomeRail() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    api<{ rows: LeaderboardRow[] }>("/api/leaderboard?period=daily")
      .then((d) => {
        setRows(d.rows.slice(0, 5));
        setEmpty(d.rows.length === 0);
      })
      .catch(() => setEmpty(true));
  }, []);

  return (
    <aside className="space-y-10 lg:border-l lg:border-ink/10 lg:pl-8">
      <section>
        <p className="mono text-[10px] tracking-[0.2em] text-mute">LEADERBOARD</p>
        {empty && rows.length === 0 ? (
          <p className="mt-3 text-sm text-mute">SCENE ABHI KHAALI HAI.</p>
        ) : (
          <ol className="mt-3 space-y-2 text-sm">
            {rows.map((r) => (
              <li key={r.userId} className="flex justify-between gap-3 border-b border-ink/10 pb-2">
                <span>
                  <span className="mono text-mute">{String(r.rank).padStart(2, "0")}</span> {r.username}
                </span>
                <span className="mono">{r.score}</span>
              </li>
            ))}
          </ol>
        )}
        <Link href="/leaderboard" className="mt-3 inline-block text-[12px] tracking-[0.14em] text-mute">
          FULL BOARD →
        </Link>
      </section>
      <section className="space-y-2 text-sm">
        <p className="mono text-[10px] tracking-[0.2em] text-mute">MODES</p>
        <Link href="/modes" className="block hover:text-acid">
          Daily — the main event
        </Link>
        <Link href="/play/unlimited" className="block hover:text-acid">
          Unlimited
        </Link>
        <Link href="/play/one-second" className="block hover:text-acid">
          1 Second — ego check
        </Link>
      </section>
    </aside>
  );
}
