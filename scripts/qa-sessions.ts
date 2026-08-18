import { loadCatalogue } from "../lib/catalogue";
import { pickSessionTracks } from "../lib/session/pick";

async function main() {
  await loadCatalogue();
  const history = { trackIds: [] as string[], artistIds: [] as string[] };
  const artistDupSessions: number[] = [];
  const trackDupSessions: number[] = [];
  const tiers: Record<string, number> = {};
  for (let i = 0; i < 20; i++) {
    const picked = await pickSessionTracks("standard", history, 1000 + i * 97);
    const artists = picked.map((p) => p.track.primaryArtistId);
    const tracks = picked.map((p) => p.track.id);
    if (new Set(artists).size !== 5) artistDupSessions.push(i);
    if (new Set(tracks).size !== 5) trackDupSessions.push(i);
    for (const row of picked) {
      if (row.prepared.providerId !== "licensed" || !row.prepared.audioUrl) {
        throw new Error(`unlicensed ${row.track.id}`);
      }
      if (row.prepared.startSeconds == null) throw new Error("missing start");
    }
    history.trackIds.push(...tracks);
    history.artistIds.push(...artists);
    console.log(
      i + 1,
      picked.map((p) => `${p.track.primaryArtistId}:${p.track.title.slice(0, 18)}:${p.prepared.startSeconds}`).join(" | "),
    );
  }
  console.log({
    artistDupSessions,
    trackDupSessions,
    uniqueTracks: new Set(history.trackIds).size,
    uniqueArtists: new Set(history.artistIds).size,
  });
  if (artistDupSessions.length || trackDupSessions.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
