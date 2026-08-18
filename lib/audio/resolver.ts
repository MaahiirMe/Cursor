import type { Track } from "../types";
import type { PreparedTrack } from "./types";
import { resolvedGameStart } from "./onset";

export function canUseLicensed(track: Track): boolean {
  return Boolean(track.licensedPreviewUrl && track.startVerified);
}

export function canUseYouTube(track: Track): boolean {
  return Boolean(track.youtubeVideoId);
}

export function resolveAudioProvider(track: Track): PreparedTrack {
  if (canUseLicensed(track) && track.licensedPreviewUrl) {
    return {
      providerId: "licensed",
      trackId: track.id,
      audioUrl: track.licensedPreviewUrl,
      startSeconds: resolvedGameStart(track),
    };
  }
  return {
    providerId: "none",
    trackId: track.id,
    startSeconds: 0,
  };
}
