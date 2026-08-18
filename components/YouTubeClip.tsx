"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type YouTubeClipHandle = {
  play: (durationSeconds: number) => void;
  pause: () => void;
};

function command(win: Window | null | undefined, func: string, args: unknown[] = []) {
  win?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
}

/**
 * Official YouTube iframe, mounted before SUN. so the click can start
 * playback under the browser's user-gesture autoplay rules.
 * Always seeks to 00:00. Clips after the unlocked duration.
 */
export const YouTubeClip = forwardRef<
  YouTubeClipHandle,
  {
    videoId: string;
    className?: string;
    onReady?: () => void;
    onEnded?: () => void;
  }
>(function YouTubeClip({ videoId, className, onReady, onEnded }, ref) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stopTimer = useRef<number | null>(null);
  const queued = useRef<number | null>(null);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.youtube.com";
  const src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?enablejsapi=1&origin=${encodeURIComponent(origin)}&autoplay=0&start=0&rel=0&modestbranding=1&playsinline=1&controls=0&disablekb=1&fs=0&iv_load_policy=3`;

  const pauseNow = () => {
    if (stopTimer.current) {
      window.clearTimeout(stopTimer.current);
      stopTimer.current = null;
    }
    const win = iframeRef.current?.contentWindow;
    command(win, "pauseVideo");
    command(win, "seekTo", [0, true]);
  };

  const startClip = (durationSeconds: number) => {
    const win = iframeRef.current?.contentWindow;
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    command(win, "seekTo", [0, true]);
    command(win, "playVideo");
    command(win, "unMute");
    command(win, "setVolume", [100]);
    stopTimer.current = window.setTimeout(() => {
      pauseNow();
      onEnded?.();
    }, Math.max(0.4, durationSeconds) * 1000);
  };

  useImperativeHandle(ref, () => ({
    play(durationSeconds: number) {
      queued.current = durationSeconds;
      startClip(durationSeconds);
    },
    pause() {
      queued.current = null;
      pauseNow();
    },
  }));

  useEffect(() => {
    return () => {
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
    };
  }, [videoId]);

  return (
    <iframe
      ref={iframeRef}
      key={videoId}
      title="DHHUH clip"
      className={className ?? "yt-mask"}
      src={src}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen={false}
      onLoad={() => {
        onReady?.();
        if (queued.current != null) startClip(queued.current);
      }}
    />
  );
});
