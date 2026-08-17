import { getDailyPayload } from "@/lib/game/engine";
import { errorJson, json, resolveUserId } from "@/lib/api/session";

export async function GET(req: Request) {
  try {
    const userId = await resolveUserId(req);
    return json(await getDailyPayload(userId));
  } catch {
    return errorJson("NETWORK GAYA. SCORE NAHI.", 500);
  }
}
