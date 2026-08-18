"use client";

import type { PreparedTrack } from "./types";

function ytSrc(videoId: string, autoplay: boolean) {
  const origin = encodeURIComponent(window.location.origin);
  const params = new URLSearchParams({
    enablejsapi: "1",
    start: "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    controls: "0",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    origin: window.location.origin,
    autoplay: autoplay ? "1" : "0",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}&origin=${origin}`;
}

function command(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
}

export class YouTubeAudioProvider {
  id = "youtube";
  private iframe: HTMLIFrameElement | null = null;
  private host: HTMLElement | null = null;
  private stopTimer: number | null = null;
  private videoId = "";

  attach(host: HTMLElement) {
    this.host = host;
  }

  async prepare(track: PreparedTrack): Promise<PreparedTrack> {
    if (!track.youtubeVideoId) throw new Error("No YouTube source");
    this.videoId = track.youtubeVideoId;
    this.mount(false);
    return track;
  }

  private mount(autoplay: boolean) {
    if (!this.host || !this.videoId) throw new Error("YouTube player unavailable");
    if (this.iframe && this.iframe.dataset.vid === this.videoId && !autoplay) return;
    this.host.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.dataset.vid = this.videoId;
    iframe.width = "220";
    iframe.height = "220";
    iframe.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("playsinline", "true");
    iframe.src = ytSrc(this.videoId, autoplay);
    iframe.style.border = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    this.host.appendChild(iframe);
    this.iframe = iframe;
  }

  async playFromStart(track: PreparedTrack, durationSeconds: number): Promise<void> {
    if (!track.youtubeVideoId) throw new Error("YouTube player unavailable");
    this.videoId = track.youtubeVideoId;
    if (this.stopTimer) window.clearTimeout(this.stopTimer);
    this.mount(true);
    command(this.iframe, "seekTo", [0, true]);
    command(this.iframe, "playVideo");
    this.stopTimer = window.setTimeout(() => this.pause(), durationSeconds * 1000);
  }

  pause() {
    command(this.iframe, "pauseVideo");
    if (this.stopTimer) {
      window.clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
  }

  reset() {
    this.pause();
    if (this.host) this.host.innerHTML = "";
    this.iframe = null;
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
    audio.src = track.audioUrl;
    this.audio = audio;
    return track;
  }

  async playFromStart(track: PreparedTrack, durationSeconds: number): Promise<void> {
    if (!track.audioUrl) throw new Error("No audio url");
    if (!this.audio || this.audio.src !== track.audioUrl) {
      await this.prepare(track);
    }
    const audio = this.audio!;
    audio.currentTime = 0;
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
