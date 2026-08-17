"use client";

import { useEffect, useState } from "react";
import { GameScreen, type PublicBeat } from "@/components/game/GameScreen";
import { formatCountdown } from "@/lib/game/daily";
import { api } from "@/lib/guest-client";
import { MAX_ATTEMPTS } from "@/lib/scoring";
import type { DailyChallengePublic, GameResult, RevealedTrack } from "@/types";

type Payload = {
  challenge: DailyChallengePublic;
  track: PublicBeat;
  resetMs: number;
  completed: GameResult | null;
  reveal: RevealedTrack | null;
  profileHint: { username: string; claimed: boolean; streak: number; gamesPlayed: number };
};

export function DailyGame() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [practice, setPractice] = useState(false);
  const [ms, setMs] = useState(0);

  useEffect(() => {
    api<Payload>("/api/daily")
      .then((d) => {
        setData(d);
        setMs(d.resetMs);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "NETWORK GAYA. SCORE NAHI."));
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setMs((v) => Math.max(0, v - 1000)), 1000);
    return () => window.clearInterval(t);
  }, []);

  if (err) {
    return (
      <div className="space-y-3 py-16">
        <p className="text-err">{err}</p>
        <button type="button" onClick={() => location.reload()} className="border border-ink/20 px-4 py-2 text-xs tracking-widest">
          TRY AGAIN
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="mono py-16 text-[12px] tracking-[0.2em] text-mute">BEAT LOAD HO RAHI HAI...</p>
    );
  }

  const n = String(data.challenge.challengeNumber).padStart(3, "0");
  const already = data.completed && !practice;

  return (
    <div className="space-y-10">
      {already && data.reveal && data.completed ? (
        <div className="space-y-6">
          <p className="mono text-[11px] tracking-[0.22em] text-mute">DAILY BEAT #{n}</p>
          {data.completed.correct ? (
            <p className="display text-4xl sm:text-5xl">Aaj ka scene lock.</p>
          ) : (
            <p className="display text-4xl sm:text-5xl">Aaj scene nikal gaya.</p>
          )}
          <p className="text-sm text-mute">
            Score: {data.completed.score} · {data.completed.attempts} tries · {data.completed.revealDuration} sec
          </p>
          <button
            type="button"
            onClick={() => setPractice(true)}
            className="border border-warn px-4 py-3 text-[12px] tracking-[0.16em] text-warn"
          >
            PRACTICE
          </button>
        </div>
      ) : (
        <>
          {practice ? (
            <p className="mono text-[11px] tracking-[0.2em] text-warn">PRACTICE — leaderboard nahi hilega.</p>
          ) : null}
          <GameScreen
            mode="daily"
            daily
            practice={practice}
            eyebrow={`DAILY BEAT #${n}`}
            headline="2 SEC. PEHCHAAN SAKTA HAI?"
            track={data.track}
            challengeId={data.challenge.id}
            challengeNumber={data.challenge.challengeNumber}
            maxAttempts={MAX_ATTEMPTS}
            initialUnlock={2}
            allowExtend
          />
        </>
      )}

      <TodayStats challenge={data.challenge} countdown={formatCountdown(ms)} />
    </div>
  );
}

function TodayStats({
  challenge,
  countdown,
}: {
  challenge: DailyChallengePublic;
  countdown: string;
}) {
  return (
    <aside className="border-t border-ink/10 pt-6">
      <p className="mono text-[10px] tracking-[0.2em] text-mute">TODAY</p>
      <ul className="mt-3 grid grid-cols-2 gap-3 text-sm text-mute sm:grid-cols-4">
        <li>{challenge.playerCount.toLocaleString("en-IN")} playing today</li>
        <li>{Math.round(challenge.successRate * 100)}% solved</li>
        <li>Average reveal: {challenge.averageGuessDuration} sec</li>
        <li>Fastest verified: {challenge.fastestVerified} sec</li>
      </ul>
      <p className="mono mt-4 text-[12px] tracking-[0.16em] text-ink">NEXT BEAT IN {countdown}</p>
    </aside>
  );
}
