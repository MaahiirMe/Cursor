import { canUseLicensed, canUseYouTube } from "./resolver";
import type { PreparedTrack } from "./types";
import type { Track } from "../types";

const okVideos = new Set<string>();
const badVideos = new Set<string>();

async function youtubeEmbeddable(id: string): Promise<boolean> {
  if (okVideos.has(id)) return true;
  if (badVideos.has(id)) return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`,
      { signal: ctrl.signal, headers: { Accept: "application/json" } },
    );
    if (res.ok) okVideos.add(id);
    else badVideos.add(id);
    return res.ok;
  } catch {
    badVideos.add(id);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function itunesPreview(title: string, artist: string): Promise<string | undefined> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    const term = encodeURIComponent(`${title} ${artist}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=8&country=IN`, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      results?: Array<{ trackName?: string; artistName?: string; previewUrl?: string }>;
    };
    const hit = data.results?.find(
      (r) =>
        r.previewUrl &&
        r.trackName &&
        r.trackName.toLowerCase().includes(title.toLowerCase().slice(0, 8)),
    );
    return hit?.previewUrl;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveLivePlayback(track: Track): Promise<PreparedTrack | null> {
  if (canUseLicensed(track) && track.licensedPreviewUrl) {
    return {
      providerId: "licensed",
      trackId: track.id,
      audioUrl: track.licensedPreviewUrl,
      startSeconds: 0,
    };
  }
  if (canUseYouTube(track) && track.youtubeVideoId) {
    if (await youtubeEmbeddable(track.youtubeVideoId)) {
      return {
        providerId: "youtube",
        trackId: track.id,
        youtubeVideoId: track.youtubeVideoId,
        startSeconds: 0,
      };
    }
    const preview = await itunesPreview(track.title, track.artists[0]?.name ?? "");
    if (preview) {
      return {
        providerId: "licensed",
        trackId: track.id,
        audioUrl: preview,
        startSeconds: 0,
      };
    }
    return null;
  }
  const preview = await itunesPreview(track.title, track.artists[0]?.name ?? "");
  if (preview) {
    return {
      providerId: "licensed",
      trackId: track.id,
      audioUrl: preview,
      startSeconds: 0,
    };
  }
  return null;
}
