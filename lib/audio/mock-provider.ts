import { getGeneratedPreview } from "@/lib/audio/generate-beat";
import type { AudioPreview, AudioProvider } from "@/lib/audio/provider";

/** Client-safe: generates from seed only. Catalog titles stay on the server. */
export class MockAudioProvider implements AudioProvider {
  async getPreview(trackId: string): Promise<AudioPreview> {
    const objectUrl = await getGeneratedPreview(trackId, 1);
    return { trackId, objectUrl, duration: 16 };
  }

  async getPreviewWithSeed(trackId: string, seed: number): Promise<AudioPreview> {
    const objectUrl = await getGeneratedPreview(trackId, seed);
    return { trackId, objectUrl, duration: 16 };
  }
}

let singleton: MockAudioProvider | null = null;

export function getAudioProvider(): MockAudioProvider {
  singleton ??= new MockAudioProvider();
  return singleton;
}
