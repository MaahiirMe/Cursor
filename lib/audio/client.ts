"use client";

import type { PreparedTrack } from "./types";

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  loadVideoById: (opts: { videoId: string; startSeconds: number }) => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; UNSTARTED: number };
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
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const wait = () => {
      if (window.YT?.Player) resolve();
      else setTimeout(wait, 40);
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
  private videoId = "";
  private ready: Promise<void> = Promise.resolve();

  attach(host: HTMLElement) {
    this.host = host;
  }

  async prepare(track: PreparedTrack): Promise<PreparedTrack> {
    if (!track.youtubeVideoId) throw new Error("No YouTube source");
    this.videoId = track.youtubeVideoId;
    await loadApi();
    if (!this.host || !window.YT) throw new Error("YouTube player unavailable");
    if (this.player) {
      try {
        this.player.loadVideoById({ videoId: this.videoId, startSeconds: 0 });
        this.player.pauseVideo();
        return track;
      } catch {
        this.reset();
      }
    }
    this.host.innerHTML = "";
    const mount = document.createElement("div");
    this.host.appendChild(mount);
    this.ready = new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("YouTube init timeout")), 8000);
      this.player = new window.YT!.Player(mount, {
        width: 220,
        height: 220,
        videoId: this.videoId,
        playerVars: {
          start: 0,
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          origin: window.location.origin,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            window.clearTimeout(timer);
            this.player?.pauseVideo();
            resolve();
          },
          onError: () => {
            window.clearTimeout(timer);
            reject(new Error("YouTube playback failed"));
          },
        },
      });
    });
    await this.ready.catch(() => undefined);
    return track;
  }

  async playFromStart(track: PreparedTrack, durationSeconds: number): Promise<void> {
    if (!track.youtubeVideoId) throw new Error("YouTube player unavailable");
    if (!this.player || this.videoId !== track.youtubeVideoId) {
      await this.prepare(track);
    }
    await this.ready.catch(() => undefined);
    if (!this.player) throw new Error("YouTube player unavailable");
    if (this.stopTimer) window.clearTimeout(this.stopTimer);
    this.player.seekTo(0, true);
    this.player.playVideo();
    this.stopTimer = window.setTimeout(() => this.pause(), durationSeconds * 1000);
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
    try {
      this.player?.destroy();
    } catch {
      /* ignore */
    }
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
    this.reset();
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.src = track.audioUrl;
    this.audio = audio;
    return track;
  }

  async playFromStart(track: PreparedTrack, durationSeconds: number): Promise<void> {
    if (!track.audioUrl) throw new Error("No audio url");
    if (!this.audio) await this.prepare(track);
    const audio = this.audio!;
    try {
      audio.currentTime = 0;
    } catch {
      /* iOS */
    }
    if (this.stopTimer) window.clearTimeout(this.stopTimer);
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
      this.audio.removeAttribute("src");
      this.audio.load();
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
