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
  const [source, setSource] = useState<"live" | "mock">("live");

  useEffect(() => {
    let dead = false;
    api<{ url: string }>(`/api/preview?playId=${encodeURIComponent(trackId)}`)
      .then((d) => {
        if (dead) return;
        setUrl(d.url);
        setSource("live");
        setLoading(false);
      })
      .catch(async () => {
        try {
          const p = await getAudioProvider().getPreviewWithSeed(trackId, audioSeed);
          if (dead) return;
          setUrl(p.objectUrl);
          setSource("mock");
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
        return;
      }
      setProgress(a.currentTime / maxDuration);
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
    };
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
    return (
      <p className="mono py-10 text-center text-[12px] tracking-[0.2em] text-gold">
        BEAT LOAD HO RAHI HAI...
      </p>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 py-8 text-center">
        <p className="text-sm text-err">{error}</p>
        <button
          type="button"
          className="border border-gold/40 px-4 py-2 text-xs uppercase tracking-widest"
          onClick={() => location.reload()}
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 border border-gold/25 bg-bg2 p-3 sm:p-4">
      {url ? <audio ref={audioRef} src={url} preload="auto" className="hidden" /> : null}
      <Waveform
        data={waveform}
        progress={progress}
        unlocked={unlocked}
        maxDuration={maxDuration}
        playing={playing}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="mono text-[11px] tracking-[0.18em] text-gold">{unlocked} SEC UNLOCKED</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void play()}
            className="border border-ink/20 px-3 py-3 text-[11px] uppercase tracking-widest hover:border-gold"
            aria-label="Restart beat"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={() => (playing ? stop() : void play())}
            className="min-w-36 bg-acid px-6 py-3 text-[15px] font-medium tracking-[0.14em] text-bg active:translate-y-px"
            aria-label={playing ? "Pause beat" : "Play beat"}
          >
            {playing ? "PAUSE" : "PLAY BEAT"}
          </button>
        </div>
      </div>
      {source === "mock" ? (
        <p className="text-[11px] text-mute">Official preview nahi mila. Placeholder beat chal rahi hai.</p>
      ) : (
        <p className="text-[11px] text-mute">Original track ka licensed 30-sec preview. Game sirf unlocked seconds sunati hai.</p>
      )}
    </div>
  );
}
