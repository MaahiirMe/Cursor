import { NextResponse } from "next/server";
import { getSession } from "@/lib/db/store";
import { shareText, loadPublic } from "@/lib/game";
import { getPlayerId, getSessionId } from "@/lib/player";

export async function GET() {
  const playerId = await getPlayerId();
  const id = await getSessionId();
  if (!id) return NextResponse.json({ error: "no session" }, { status: 400 });
  const stored = await getSession(id);
  if (!stored || stored.playerId !== playerId) {
    return NextResponse.json({ error: "no session" }, { status: 400 });
  }
  const session = await loadPublic(id);
  if (!session) return NextResponse.json({ error: "no session" }, { status: 400 });
  return NextResponse.json({ text: shareText(session) });
}
