"use client";

import { EditorialNav } from "@/components/EditorialNav";
import { useEffect, useState } from "react";

type Row = {
  username: string;
  score: number;
};

export default function ScoresPage() {
  const [range, setRange] = useState<"today" | "week" | "all">("today");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch(`/api/leaderboard?range=${range}`)
      .then((r) => r.json())
      .then((j: { rows: Row[] }) => setRows(j.rows));
  }, [range]);

  return (
    <>
      <EditorialNav />
      <main className="px-4 py-10 md:px-10">
        <div className="flex gap-6 font-mono text-sm tracking-[0.18em]">
          {(["today", "week", "all"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={range === r ? "text-orange" : "text-smoke"}
            >
              {r === "today" ? "TODAY" : r === "week" ? "WEEK" : "ALL TIME"}
            </button>
          ))}
        </div>
        <ol className="mt-10 space-y-8">
          {rows.length === 0 ? (
            <p className="text-smoke">Abhi koi verified score nahi. Khel ke aa.</p>
          ) : (
            rows.map((row, i) => (
              <li key={`${row.username}-${i}`} className="grid grid-cols-12 items-baseline gap-4">
                <span className="col-span-2 font-serif text-6xl tracking-tight md:text-8xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="col-span-6 text-2xl tracking-[0.08em] md:text-4xl">
                  {row.username}
                </span>
                <span className="col-span-4 text-right font-mono text-2xl md:text-4xl">
                  {row.score.toLocaleString("en-IN")}
                </span>
              </li>
            ))
          )}
        </ol>
      </main>
    </>
  );
}
