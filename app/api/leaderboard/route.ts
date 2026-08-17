import { errorJson, json, resolveUserId } from "@/lib/api/session";
import { leaderboard } from "@/lib/store";

export async function GET(req: Request) {
  try {
    await resolveUserId(req);
    const period = new URL(req.url).searchParams.get("period") ?? "daily";
    const p = period === "weekly" || period === "all" ? period : "daily";
    return json({ rows: await leaderboard(p) });
  } catch {
    return errorJson("SCENE ABHI KHAALI HAI.", 500);
  }
}
