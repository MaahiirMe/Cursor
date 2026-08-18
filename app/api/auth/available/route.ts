import { NextResponse } from "next/server";
import { findUserByUsername, normalizeUsername, usernameSuggestions } from "@/lib/auth";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("username") ?? "";
  const norm = normalizeUsername(q);
  if (norm.length < 2) return NextResponse.json({ available: false, message: "Naam chhota hai." });
  const taken = await findUserByUsername(q);
  if (!taken) return NextResponse.json({ available: true, message: "USERNAME TERA HAI." });
  return NextResponse.json({
    available: false,
    message: "YEH NAAM KOI LE GAYA.",
    suggestions: usernameSuggestions(q),
  });
}
