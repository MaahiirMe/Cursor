import { canUseLicensed } from "./resolver";
import { resolvedGameStart } from "./onset";
import type { PreparedTrack } from "./types";
import type { Track } from "../types";

const okPreviews = new Set<string>();
const badPreviews = new Set<string>();

async function previewReachable(url: string): Promise<boolean> {
  if (okPreviews.has(url)) return true;
  if (badPreviews.has(url)) return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: ctrl.signal,
      redirect: "follow",
    });
    const ok = res.ok || res.status === 206 || res.status === 405;
    if (ok) okPreviews.add(url);
    else badPreviews.add(url);
    return ok;
  } catch {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-64" },
        signal: ctrl.signal,
      });
      const ok = res.ok || res.status === 206;
      if (ok) okPreviews.add(url);
      else badPreviews.add(url);
      return ok;
    } catch {
      badPreviews.add(url);
      return false;
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveLivePlayback(track: Track): Promise<PreparedTrack | null> {
  if (!canUseLicensed(track) || !track.licensedPreviewUrl) return null;
  if (!(await previewReachable(track.licensedPreviewUrl))) return null;
  return {
    providerId: "licensed",
    trackId: track.id,
    audioUrl: track.licensedPreviewUrl,
    startSeconds: resolvedGameStart(track),
  };
}
