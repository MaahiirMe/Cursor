import { errorJson, json, resolveUserId } from "@/lib/api/session";
import { claimName } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const userId = await resolveUserId(req);
    const { username } = await req.json();
    const player = await claimName(userId, username ?? "");
    return json({ ok: true, username: player.username });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "NETWORK GAYA. SCORE NAHI.";
    return errorJson(msg);
  }
}
