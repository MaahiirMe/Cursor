export interface PreparedTrack {
  providerId: string;
  trackId: string;
  audioUrl?: string;
  startSeconds: number;
}

export interface AudioProvider {
  id: string;
  prepare(track: PreparedTrack): Promise<PreparedTrack | null>;
  playFromStart(track: PreparedTrack, durationSeconds: number): Promise<void>;
  pause(): void;
  reset(): void;
  destroy(): void;
}

export type ProviderPriority = "licensed" | "youtube" | "mock";

export const DEFAULT_PRIORITY: ProviderPriority[] = ["licensed", "youtube", "mock"];
