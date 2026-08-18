"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  HtmlAudioProvider,
  MockAudioProvider,
  YouTubeAudioProvider,
} from "@/lib/audio/client";
import type { SafePlayback } from "@/lib/types";

type AnyProvider = YouTubeAudioProvider | HtmlAudioProvider | MockAudioProvider;

export type AudioHandle = {
  play: (duration: number) => Promise<void>;
  pause: () => void;
};

export const AudioExperience = forwardRef<
  AudioHandle,
  {
    playback: SafePlayback;
    onUnplayable?: () => Promise<boolean>;
  }
>(function AudioExperience({ playback, onUnplayable }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const provider = useRef<AnyProvider | null>(null);
  const unplayableRef = useRef(onUnplayable);
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
    const prepared = {
      providerId: playback.providerId,
      trackId: "hidden",
      youtubeVideoId: playback.youtubeVideoId,
      audioUrl: playback.audioUrl,
      startSeconds: 0 as const,
    };
    provider.current.prepare(prepared).catch(() => undefined);
    return () => provider.current?.destroy();
  }, [playback.providerId, playback.youtubeVideoId, playback.audioUrl]);

  useImperativeHandle(ref, () => ({
    async play(duration: number) {
      const p = provider.current;
      if (!p) throw new Error("No player");
      const prepared = {
        providerId: playback.providerId,
        trackId: "hidden",
        youtubeVideoId: playback.youtubeVideoId,
        audioUrl: playback.audioUrl,
        startSeconds: 0 as const,
      };
      try {
        await p.playFromStart(prepared, duration);
      } catch {
        const swapped = unplayableRef.current ? await unplayableRef.current() : false;
        if (swapped) return;
        if (playback.audioUrl && playback.providerId === "youtube") {
          const fallback = new MockAudioProvider();
          provider.current = fallback;
          await fallback.playFromStart({ ...prepared, providerId: "mock" }, duration);
          return;
        }
        throw new Error("Playback failed");
      }
    },
    pause() {
      provider.current?.pause();
    },
  }));

  return (
    <div className="yt-mask" aria-hidden>
      <div ref={host} className="h-full w-full" />
    </div>
  );
});
