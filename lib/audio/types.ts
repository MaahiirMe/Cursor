import type { Track } from "../types";

export interface PreparedTrack {
  providerId: string;
  trackId: string;
  youtubeVideoId?: string;
  audioUrl?: string;
  startSeconds: 0;
}

export interface AudioProvider {
  id: string;
  prepare(track: Track): Promise<PreparedTrack | null>;
  playFromStart(track: PreparedTrack, durationSeconds: number): Promise<void>;
  pause(): void;
  reset(): void;
  destroy(): void;
}

export type ProviderPriority = "licensed" | "youtube" | "mock";

export const DEFAULT_PRIORITY: ProviderPriority[] = [
  "licensed",
  "youtube",
  "mock",
];
