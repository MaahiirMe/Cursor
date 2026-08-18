import { NextResponse } from "next/server";
import { listLeaderboard } from "@/lib/db/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range");
  const key = range === "today" || range === "week" ? range : "all";
  const rows = await listLeaderboard(key);
  return NextResponse.json({ rows });
}
