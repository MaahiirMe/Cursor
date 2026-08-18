export interface MusicMetadataProvider {
  id: string;
  enrich(query: { title: string; artists: string[] }): Promise<{
    aliases?: string[];
    releaseYear?: number;
    album?: string;
    isrc?: string;
  } | null>;
}

/** Catalogue enrichment only — never called per keystroke. */
export class NoopMetadataProvider implements MusicMetadataProvider {
  id = "noop";
  async enrich() {
    return null;
  }
}
