import { NextResponse } from "next/server";
import { getPlayerId } from "@/lib/player";
import { getProfile, setUsername } from "@/lib/db/store";

export async function GET() {
  const id = await getPlayerId();
  const profile = await getProfile(id);
  return NextResponse.json(profile);
}

export async function POST(request: Request) {
  const id = await getPlayerId();
  const body = (await request.json()) as { username?: string };
  if (!body.username) return NextResponse.json({ error: "need name" }, { status: 400 });
  const profile = await setUsername(id, body.username);
  return NextResponse.json(profile);
}
