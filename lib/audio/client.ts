"use client";

import type { PreparedTrack } from "./types";

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
    if (!this.audio) await this.prepare(track);
    const audio = this.audio!;
    await new Promise<void>((resolve, reject) => {
      if (audio.readyState >= 2) {
        resolve();
        return;
      }
      const ok = () => {
        audio.removeEventListener("error", bad);
        resolve();
      };
      const bad = () => {
        audio.removeEventListener("canplay", ok);
        reject(new Error("Audio failed"));
      };
      audio.addEventListener("canplay", ok, { once: true });
      audio.addEventListener("error", bad, { once: true });
    });
    try {
      audio.currentTime = Math.max(0, track.startSeconds ?? 0);
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
