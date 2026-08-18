import { NextResponse } from "next/server";
import { buyHint } from "@/lib/game";
import { getPlayerId, getSessionId } from "@/lib/player";

export async function POST() {
  const playerId = await getPlayerId();
  const sessionId = await getSessionId();
  if (!sessionId) return NextResponse.json({ error: "no session" }, { status: 400 });
  try {
    const session = await buyHint(sessionId, playerId);
    return NextResponse.json({ session });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
