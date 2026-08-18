import type { Track } from "../types";
import type { PreparedTrack } from "./types";

export function canUseLicensed(track: Track): boolean {
  return Boolean(track.licensedPreviewUrl);
}

export function canUseYouTube(track: Track): boolean {
  return Boolean(
    track.youtubeVideoId &&
      track.youtubeStartFaithful &&
      track.introQuality === "faithful",
  );
}

export function resolveAudioProvider(track: Track): PreparedTrack {
  if (canUseLicensed(track) && track.licensedPreviewUrl) {
    return {
      providerId: "licensed",
      trackId: track.id,
      audioUrl: track.licensedPreviewUrl,
      startSeconds: 0,
    };
  }
  if (canUseYouTube(track) && track.youtubeVideoId) {
    return {
      providerId: "youtube",
      trackId: track.id,
      youtubeVideoId: track.youtubeVideoId,
      startSeconds: 0,
    };
  }
  return {
    providerId: "mock",
    trackId: track.id,
    startSeconds: 0,
  };
}
