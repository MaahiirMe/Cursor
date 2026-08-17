import { errorJson, json, resolveUserId } from "@/lib/api/session";
import { getPlayer, toProfile } from "@/lib/store";

export async function GET(req: Request) {
  try {
    const userId = await resolveUserId(req);
    const player = await getPlayer(userId);
    return json({ profile: toProfile(player), claimed: player.claimed });
  } catch {
    return errorJson("NETWORK GAYA. SCORE NAHI.", 500);
  }
}
