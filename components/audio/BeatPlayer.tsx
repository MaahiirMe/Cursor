"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Waveform } from "@/components/audio/Waveform";
import { api } from "@/lib/guest-client";
import { getAudioProvider } from "@/lib/audio/mock-provider";

type Props = {
  trackId: string;
  audioSeed: number;
  waveform: number[];
  unlocked: number;
  maxDuration?: number;
};

export function BeatPlayer({
  trackId,
  audioSeed,
  waveform,
  unlocked,
  maxDuration = 16,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clock, setClock] = useState(0);

  useEffect(() => {
    let dead = false;
    api<{ url: string }>(`/api/preview?playId=${encodeURIComponent(trackId)}`)
      .then((d) => {
        if (dead) return;
        setUrl(d.url);
        setLoading(false);
      })
      .catch(async () => {
        try {
          const p = await getAudioProvider().getPreviewWithSeed(trackId, audioSeed);
          if (dead) return;
          setUrl(p.objectUrl);
          setLoading(false);
        } catch {
          if (dead) return;
          setError("ISS TRACK KA PREVIEW ABHI AVAILABLE NAHI HAI.");
          setLoading(false);
        }
      });
    return () => {
      dead = true;
    };
  }, [trackId, audioSeed]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    setPlaying(false);
  }, []);

  const play = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    try {
      await a.play();
      setPlaying(true);
    } catch {
      setError("NETWORK GAYA. SCORE NAHI.");
    }
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (a.currentTime >= unlocked - 0.02) {
        a.pause();
        a.currentTime = 0;
        setPlaying(false);
        setProgress(unlocked / maxDuration);
        setClock(unlocked);
        return;
      }
      setProgress(a.currentTime / maxDuration);
      setClock(a.currentTime);
    };
    a.addEventListener("timeupdate", onTime);
    return () => a.removeEventListener("timeupdate", onTime);
  }, [unlocked, maxDuration, url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (playing) stop();
        else void play();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play, playing, stop]);

  if (loading) {
    return <p className="mono py-8 text-center text-[12px] tracking-[0.2em] text-gold">BEAT LOAD HO RAHI HAI...</p>;
  }
  if (error) {
    return (
      <div className="space-y-3 py-6 text-center">
        <p className="text-sm text-err">{error}</p>
        <button type="button" className="border border-gold/40 px-4 py-2 text-xs" onClick={() => location.reload()}>
          TRY AGAIN
        </button>
      </div>
    );
  }

  const mmss = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;

  return (
    <div className="space-y-3">
      {url ? <audio ref={audioRef} src={url} preload="auto" className="hidden" /> : null}
      <Waveform data={waveform} progress={progress} unlocked={unlocked} maxDuration={maxDuration} playing={playing} />
      <div className="player-bar">
        <button type="button" className="play-orb" onClick={() => (playing ? stop() : void play())} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "II" : "▶"}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">Opening beat · {unlocked} sec</p>
          <p className="mono text-[11px] text-mute">
            {mmss(clock)} / {mmss(unlocked)} · start 0:00
          </p>
          <div className="mt-2 h-[2px] bg-ink/15">
            <div className="h-[2px] bg-ink" style={{ width: `${Math.min(100, (clock / unlocked) * 100)}%` }} />
          </div>
        </div>
        <button type="button" onClick={() => void play()} className="text-[11px] tracking-widest text-gold">
          RESTART
        </button>
      </div>
    </div>
  );
}
