import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { username?: string; password?: string };
  try {
    const identity = await registerUser(body.username ?? "", body.password ?? "");
    return NextResponse.json({ identity, message: "USERNAME TERA HAI." });
  } catch (err) {
    const e = err as Error & { code?: string; suggestions?: string[] };
    return NextResponse.json(
      { error: e.message, suggestions: e.suggestions },
      { status: e.code === "taken" ? 409 : 400 },
    );
  }
}
