"use client";

import { useCallback, useEffect, useState } from "react";
import { GameScreen, type PublicBeat } from "@/components/game/GameScreen";
import { api } from "@/lib/guest-client";
import { modeConfig } from "@/lib/scoring";
import type { GameMode } from "@/types";

type Stats = {
  currentRun: number;
  bestRun: number;
  accuracy: number;
  averageGuessTime: number;
};

export function RunGame({
  mode,
  eyebrow,
  headline,
  artistId,
  scene,
}: {
  mode: GameMode;
  eyebrow: string;
  headline: string;
  artistId?: string;
  scene?: string;
}) {
  const cfg = modeConfig(mode);
  const [track, setTrack] = useState<PublicBeat | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [key, setKey] = useState(0);

  const apply = useCallback((data: { track: PublicBeat; stats: Stats }) => {
    setTrack(data.track);
    setStats(data.stats);
    setSeen((s) => [...s, data.track.id].slice(-30));
    setKey((k) => k + 1);
    setErr(null);
  }, []);

  useEffect(() => {
    let dead = false;
    api<{ track: PublicBeat; stats: Stats }>("/api/play", {
      method: "POST",
      body: JSON.stringify({ mode, exclude: [], artistId, scene }),
    })
      .then((data) => {
        if (!dead) apply(data);
      })
      .catch((e) => {
        if (!dead) setErr(e instanceof Error ? e.message : "NETWORK GAYA. SCORE NAHI.");
      });
    return () => {
      dead = true;
    };
  }, [apply, artistId, mode, scene]);

  const loadNext = async () => {
    try {
      const data = await api<{ track: PublicBeat; stats: Stats }>("/api/play", {
        method: "POST",
        body: JSON.stringify({ mode, exclude: seen, artistId, scene }),
      });
      apply(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "NETWORK GAYA. SCORE NAHI.");
    }
  };

  if (err) {
    return (
      <div className="space-y-3 py-10">
        <p className="text-err">{err}</p>
        <button type="button" onClick={() => void loadNext()} className="border border-ink/20 px-4 py-2 text-xs tracking-widest">
          TRY AGAIN
        </button>
      </div>
    );
  }

  if (!track) {
    return <p className="mono py-16 text-[12px] tracking-[0.2em] text-mute">BEAT LOAD HO RAHI HAI...</p>;
  }

  return (
    <div className="space-y-8">
      {stats ? (
        <p className="mono text-[11px] text-mute">
          Run {stats.currentRun} · Best {stats.bestRun} · {Math.round(stats.accuracy * 100)}% · avg {stats.averageGuessTime.toFixed(1)}s
        </p>
      ) : null}
      <GameScreen
        key={key}
        mode={mode}
        eyebrow={eyebrow}
        headline={headline}
        track={track}
        maxAttempts={cfg.maxAttempts}
        initialUnlock={cfg.reveals[0]}
        allowExtend={cfg.allowExtend}
        filterArtistId={artistId}
        filterScene={scene}
        onNext={() => void loadNext()}
      />
    </div>
  );
}
