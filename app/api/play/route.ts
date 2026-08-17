import { publicBeat } from "@/data/catalog";
import { TRACKS } from "@/data/tracks";
import { errorJson, json, resolveUserId } from "@/lib/api/session";
import { pickRandomTrack } from "@/lib/game/engine";
import { issuePlayToken, resolvePlayToken } from "@/lib/game/tokens";
import { getPlayer, unlimitedStats } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const userId = await resolveUserId(req);
    const body = await req.json().catch(() => ({}));
    const mode = body.mode ?? "unlimited";
    const exclude: string[] = Array.isArray(body.exclude)
      ? (body.exclude as string[])
          .map((id) => resolvePlayToken(id))
          .filter((id): id is string => Boolean(id))
      : [];
    const track = pickRandomTrack(exclude, body.artistId, body.scene);
    const playId = issuePlayToken(track.id);
    const player = await getPlayer(userId);
    return json({
      track: publicBeat(track.id, playId),
      stats: unlimitedStats(player, mode),
      catalogSize: TRACKS.length,
    });
  } catch {
    return errorJson("NETWORK GAYA. SCORE NAHI.", 500);
  }
}
