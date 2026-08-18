"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { HtmlAudioProvider } from "@/lib/audio/client";
import type { SafePlayback } from "@/lib/types";

export type AudioHandle = {
  play: (duration: number) => Promise<void>;
  pause: () => void;
};

export const AudioExperience = forwardRef<
  AudioHandle,
  {
    playback: SafePlayback;
    onUnplayable?: () => Promise<boolean>;
    onReady?: () => void;
    onEnded?: () => void;
  }
>(function AudioExperience({ playback, onUnplayable, onReady, onEnded }, ref) {
  const html = useRef<HtmlAudioProvider | null>(null);
  const unplayableRef = useRef(onUnplayable);
  const onEndedRef = useRef(onEnded);
  unplayableRef.current = onUnplayable;
  onEndedRef.current = onEnded;

  useEffect(() => {
    html.current?.destroy();
    html.current = null;
    if (playback.providerId !== "licensed" || !playback.audioUrl) {
      onReady?.();
      return () => undefined;
    }
    const provider = new HtmlAudioProvider();
    html.current = provider;
    provider
      .prepare({
        providerId: "licensed",
        trackId: "hidden",
        audioUrl: playback.audioUrl,
        startSeconds: playback.clipStartSeconds ?? 0,
      })
      .then(() => onReady?.())
      .catch(() => undefined);
    return () => {
      provider.destroy();
      html.current = null;
    };
  }, [playback.providerId, playback.audioUrl, playback.clipStartSeconds, onReady]);

  useImperativeHandle(ref, () => ({
    async play(duration: number) {
      const p = html.current;
      if (!p || !playback.audioUrl) {
        const swapped = unplayableRef.current ? await unplayableRef.current() : false;
        if (!swapped) throw new Error("No player");
        return;
      }
      try {
        await p.playFromStart(
          {
            providerId: "licensed",
            trackId: "hidden",
            audioUrl: playback.audioUrl,
            startSeconds: playback.clipStartSeconds ?? 0,
          },
          duration,
        );
        window.setTimeout(() => onEndedRef.current?.(), duration * 1000 + 40);
      } catch {
        const swapped = unplayableRef.current ? await unplayableRef.current() : false;
        if (!swapped) throw new Error("Playback failed");
      }
    },
    pause() {
      html.current?.pause();
    },
  }));

  return null;
});
