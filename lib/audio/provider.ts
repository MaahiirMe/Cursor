export interface AudioPreview {
  trackId: string;
  objectUrl: string;
  duration: number;
}

export interface AudioProvider {
  getPreview(trackId: string): Promise<AudioPreview>;
  dispose?(trackId: string): void;
}

export const AUDIO_PROVIDER_NAME = "mock";
