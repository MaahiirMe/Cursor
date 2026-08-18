import { NextResponse } from "next/server";
import { currentIdentity } from "@/lib/auth";

export async function GET() {
  const identity = await currentIdentity();
  return NextResponse.json({ identity });
}
