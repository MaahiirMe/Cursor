"use client";

import type { PreparedTrack } from "./types";

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: Record<string, unknown>,
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    window.onYouTubeIframeAPIReady = () => resolve();
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const wait = () => {
      if (window.YT?.Player) resolve();
      else setTimeout(wait, 50);
    };
    wait();
  });
  return apiPromise;
}

export class YouTubeAudioProvider {
  id = "youtube";
  private player: YTPlayer | null = null;
  private host: HTMLElement | null = null;
  private stopTimer: number | null = null;

  async prepare(track: PreparedTrack): Promise<PreparedTrack> {
    if (!track.youtubeVideoId) throw new Error("No YouTube source");
    await loadApi();
    return track;
  }

  attach(host: HTMLElement) {
    this.host = host;
  }

  async playFromStart(track: PreparedTrack, durationSeconds: number): Promise<void> {
    if (!track.youtubeVideoId || !this.host || !window.YT) {
      throw new Error("YouTube player unavailable");
    }
    this.reset();
    await new Promise<void>((resolve, reject) => {
      try {
        this.player = new window.YT!.Player(this.host!, {
          width: 220,
          height: 220,
          videoId: track.youtubeVideoId,
          playerVars: {
            start: 0,
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              this.player?.seekTo(0, true);
              this.player?.playVideo();
              this.stopTimer = window.setTimeout(() => {
                this.pause();
              }, durationSeconds * 1000);
              resolve();
            },
            onError: () => reject(new Error("YouTube playback failed")),
          },
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  pause() {
    this.player?.pauseVideo();
    if (this.stopTimer) {
      window.clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
  }

  reset() {
    this.pause();
    this.player?.destroy();
    this.player = null;
    if (this.host) this.host.innerHTML = "";
  }

  destroy() {
    this.reset();
  }
}

export class HtmlAudioProvider {
  id = "licensed";
  private audio: HTMLAudioElement | null = null;
  private stopTimer: number | null = null;

  async prepare(track: PreparedTrack): Promise<PreparedTrack> {
    if (!track.audioUrl) throw new Error("No audio url");
    return track;
  }

  async playFromStart(track: PreparedTrack, durationSeconds: number): Promise<void> {
    this.reset();
    if (!track.audioUrl) throw new Error("No audio url");
    const audio = new Audio(track.audioUrl);
    this.audio = audio;
    audio.currentTime = 0;
    await audio.play();
    this.stopTimer = window.setTimeout(() => this.pause(), durationSeconds * 1000);
  }

  pause() {
    this.audio?.pause();
    if (this.stopTimer) {
      window.clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
  }

  reset() {
    this.pause();
    if (this.audio) {
      this.audio.src = "";
      this.audio = null;
    }
  }

  destroy() {
    this.reset();
  }
}

export class MockAudioProvider extends HtmlAudioProvider {
  id = "mock";
}
