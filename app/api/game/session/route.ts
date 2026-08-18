import { NextResponse } from "next/server";
import { loadPublic } from "@/lib/game";
import { getPlayerId, getSessionId } from "@/lib/player";

export async function GET() {
  await getPlayerId();
  const id = await getSessionId();
  if (!id) return NextResponse.json({ session: null });
  const session = await loadPublic(id);
  return NextResponse.json({ session });
}
