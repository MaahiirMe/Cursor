import { NextResponse } from "next/server";
import { displayUsername, setGuestCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = displayUsername(body.name ?? "");
  if (name.length < 2) {
    return NextResponse.json({ error: "Naam chhota hai." }, { status: 400 });
  }
  await setGuestCookie(name);
  return NextResponse.json({ identity: { kind: "guest", displayName: name } });
}
