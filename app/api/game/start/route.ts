import { NextResponse } from "next/server";
import { startSession } from "@/lib/game";
import { getPlayerId, setSessionCookie } from "@/lib/player";
import type { GameMode } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { mode?: GameMode };
  const mode: GameMode =
    body.mode === "daily" || body.mode === "hard" ? body.mode : "standard";
  const playerId = await getPlayerId();
  const session = await startSession(playerId, mode);
  await setSessionCookie(session.id);
  return NextResponse.json(session);
}
