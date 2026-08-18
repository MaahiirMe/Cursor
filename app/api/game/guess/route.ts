import { NextResponse } from "next/server";
import { submitGuess } from "@/lib/game";
import { getPlayerId, getSessionId } from "@/lib/player";

export async function POST(request: Request) {
  const playerId = await getPlayerId();
  const sessionId = await getSessionId();
  if (!sessionId) return NextResponse.json({ error: "no session" }, { status: 400 });
  const body = (await request.json()) as { trackId?: string; artistId?: string };
  if (!body.trackId || !body.artistId) {
    return NextResponse.json({ error: "need track and artist" }, { status: 400 });
  }
  try {
    const result = await submitGuess(sessionId, playerId, body.trackId, body.artistId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
