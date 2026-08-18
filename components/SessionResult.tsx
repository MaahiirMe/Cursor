"use client";

import { useState } from "react";
import { resultHeadline } from "@/lib/copy";
import type { SessionPublic } from "@/lib/types";
import { ShareResult } from "./ShareResult";

export function SessionResult({
  session,
  onReplay,
  onName,
}: {
  session: SessionPublic;
  onReplay: () => void;
  onName: (name: string) => void;
}) {
  const solved = session.stats?.solved ?? 0;
  const [name, setName] = useState("");
  return (
    <section className="grid min-h-[80vh] grid-cols-12 items-end gap-6 px-4 py-10 md:px-8">
      <div className="col-span-12 md:col-span-7">
        <p className="mono text-smoke">SESSION {String(session.number).padStart(4, "0")}</p>
        <h1 className="font-serif text-[clamp(6rem,22vw,16rem)] leading-[0.78] tracking-[-0.07em]">
          {solved}/5
        </h1>
      </div>
      <div className="col-span-12 pb-6 md:col-span-5">
        <p className="max-w-sm text-2xl font-medium tracking-tight md:text-4xl">
          {session.resultCopy ?? resultHeadline(solved)}
        </p>
        <dl className="mt-10 grid grid-cols-2 gap-y-6">
          <div>
            <dt className="mono text-smoke">Total score</dt>
            <dd className="font-mono text-3xl">{session.totalScore.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="mono text-smoke">Average reveal</dt>
            <dd className="font-mono text-3xl">
              {session.stats?.averageReveal ? `${session.stats.averageReveal}s` : "—"}
            </dd>
          </div>
          <div>
            <dt className="mono text-smoke">First-try</dt>
            <dd className="font-mono text-3xl">{session.stats?.firstTry ?? 0}</dd>
          </div>
          <div>
            <dt className="mono text-smoke">Best track</dt>
            <dd className="font-mono text-3xl">
              {session.stats?.bestTrackIndex != null
                ? String(session.stats.bestTrackIndex + 1).padStart(2, "0")
                : "—"}
            </dd>
          </div>
        </dl>
        <div className="mt-10 flex flex-wrap items-baseline gap-8">
          <ShareResult session={session} />
          <button type="button" className="font-serif text-4xl" onClick={onReplay}>
            PHIR SE?
          </button>
        </div>
        <form
          className="mt-12"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onName(name.trim());
          }}
        >
          <label className="mono text-smoke">Naam rakh le?</label>
          <input
            className="field mt-2 max-w-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
          />
        </form>
      </div>
    </section>
  );
}
