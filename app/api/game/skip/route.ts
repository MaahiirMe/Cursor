import { NextResponse } from "next/server";
import { skipRound } from "@/lib/game";
import { getPlayerId, getSessionId } from "@/lib/player";

export async function POST() {
  const playerId = await getPlayerId();
  const sessionId = await getSessionId();
  if (!sessionId) return NextResponse.json({ error: "no session" }, { status: 400 });
  try {
    const result = await skipRound(sessionId, playerId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
