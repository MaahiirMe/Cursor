"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/guest-client";
import type { LeaderboardRow } from "@/types";

const PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "all", label: "All-Time" },
] as const;

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("daily");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<{ rows: LeaderboardRow[] }>(`/api/leaderboard?period=${period}`)
      .then((d) => {
        setRows(d.rows);
        setErr(null);
      })
      .catch(() => setErr("SCENE ABHI KHAALI HAI."));
  }, [period]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="mono text-[11px] tracking-[0.2em] text-mute">BOARD</p>
      <h1 className="display mt-2 text-5xl">KAUN AAGE HAI</h1>
      <div className="mt-6 flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`h-10 px-4 text-[12px] tracking-[0.14em] ${period === p.id ? "bg-ink text-bg" : "border border-ink/20"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {err ? <p className="mt-8 text-mute">{err}</p> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="mono text-[10px] tracking-[0.16em] text-mute">
            <tr>
              <th className="py-2">RANK</th>
              <th>USERNAME</th>
              <th>SCORE</th>
              <th>AVG REVEAL</th>
              <th>ACC</th>
              <th>STREAK</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-t border-ink/10">
                <td className="py-3 mono text-mute">{String(r.rank).padStart(2, "0")}</td>
                <td>{r.username}</td>
                <td className="mono">{r.score}</td>
                <td className="mono text-mute">{r.averageRevealTime}s</td>
                <td className="mono text-mute">{Math.round(r.accuracy * 100)}%</td>
                <td className="mono">{r.streak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
