import { tracksById } from "@/data/tracks";
import { errorJson, json, resolveUserId } from "@/lib/api/session";
import { lookupLicensedPreview } from "@/lib/audio/catalog-preview";
import { buildDailyChallenge, calendarDateInZone } from "@/lib/game/daily";
import { TRACKS } from "@/data/tracks";
import { resolvePlayToken } from "@/lib/game/tokens";

export async function GET(req: Request) {
  try {
    await resolveUserId(req);
    const playId = new URL(req.url).searchParams.get("playId") ?? "";
    let trackId = resolvePlayToken(playId);
    if (!trackId) {
      const daily = buildDailyChallenge(TRACKS, calendarDateInZone());
      if (playId === daily.id) trackId = daily.trackId;
    }
    const track = trackId ? tracksById.get(trackId) : undefined;
    if (!track) return errorJson("ISS TRACK KA PREVIEW ABHI AVAILABLE NAHI HAI.", 404);
    const licensed = await lookupLicensedPreview(track);
    if (!licensed) return errorJson("ISS TRACK KA PREVIEW ABHI AVAILABLE NAHI HAI.", 404);
    return json({
      url: licensed.previewUrl,
      duration: 30,
      source: licensed.source,
    });
  } catch {
    return errorJson("NETWORK GAYA. SCORE NAHI.", 500);
  }
}
