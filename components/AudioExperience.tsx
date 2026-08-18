"use client";

import { useEffect, useRef } from "react";
import {
  HtmlAudioProvider,
  MockAudioProvider,
  YouTubeAudioProvider,
} from "@/lib/audio/client";
import type { SafePlayback } from "@/lib/types";

type AnyProvider = YouTubeAudioProvider | HtmlAudioProvider | MockAudioProvider;

export function AudioExperience({
  playback,
  duration,
  playing,
  replayKey,
  onStopped,
  onUnplayable,
}: {
  playback: SafePlayback;
  duration: number;
  playing: boolean;
  replayKey: number;
  onStopped: () => void;
  onUnplayable?: () => Promise<boolean>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const provider = useRef<AnyProvider | null>(null);
  const stopRef = useRef(onStopped);
  const unplayableRef = useRef(onUnplayable);
  stopRef.current = onStopped;
  unplayableRef.current = onUnplayable;

  useEffect(() => {
    provider.current?.destroy();
    if (playback.providerId === "youtube") {
      const yt = new YouTubeAudioProvider();
      if (host.current) yt.attach(host.current);
      provider.current = yt;
    } else {
      provider.current =
        playback.providerId === "licensed" ? new HtmlAudioProvider() : new MockAudioProvider();
    }
    return () => provider.current?.destroy();
  }, [playback.providerId, playback.youtubeVideoId, playback.audioUrl]);

  useEffect(() => {
    const p = provider.current;
    if (!p || !playing) {
      p?.pause();
      return;
    }
    const prepared = {
      providerId: playback.providerId,
      trackId: "hidden",
      youtubeVideoId: playback.youtubeVideoId,
      audioUrl: playback.audioUrl,
      startSeconds: 0 as const,
    };
    let cancelled = false;
    (async () => {
      try {
        await p.prepare(prepared);
        await p.playFromStart(prepared, duration);
        window.setTimeout(() => {
          if (!cancelled) {
            p.pause();
            stopRef.current();
          }
        }, duration * 1000 + 40);
      } catch {
        if (cancelled) return;
        const swapped = unplayableRef.current ? await unplayableRef.current() : false;
        if (swapped || cancelled) return;
        if (playback.audioUrl) {
          const fallback = new MockAudioProvider();
          provider.current = fallback;
          try {
            await fallback.playFromStart(
              { ...prepared, providerId: "mock", audioUrl: playback.audioUrl },
              duration,
            );
            window.setTimeout(() => {
              if (!cancelled) {
                fallback.pause();
                stopRef.current();
              }
            }, duration * 1000 + 40);
            return;
          } catch {
            /* keep going */
          }
        }
        stopRef.current();
      }
    })();
    return () => {
      cancelled = true;
      p.pause();
    };
  }, [playing, duration, playback, replayKey]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-10 h-[220px] w-[220px] overflow-hidden rounded-full opacity-[0.04]">
      <div ref={host} className="h-full w-full" />
    </div>
  );
}
