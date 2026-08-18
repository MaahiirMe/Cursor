import { NextResponse } from "next/server";
import { unlockMore } from "@/lib/game";
import { getPlayerId, getSessionId } from "@/lib/player";

export async function POST(request: Request) {
  const playerId = await getPlayerId();
  const sessionId = await getSessionId();
  if (!sessionId) return NextResponse.json({ error: "no session" }, { status: 400 });
  const body = (await request.json().catch(() => ({}))) as { seconds?: number };
  try {
    const session = await unlockMore(sessionId, playerId, body.seconds);
    return NextResponse.json({ session });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
