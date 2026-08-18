import { NextResponse } from "next/server";
import { mockWav, verifyPlayback } from "@/lib/audio/mock";
import { getSession } from "@/lib/db/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const parsed = verifyPlayback(token);
  if (!parsed) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const session = await getSession(parsed.sessionId);
  if (!session) return NextResponse.json({ error: "gone" }, { status: 404 });
  const round = session.rounds[parsed.index];
  if (!round) return NextResponse.json({ error: "gone" }, { status: 404 });
  const wav = mockWav(`${session.id}:${round.trackId}`, 16);
  return new NextResponse(Uint8Array.from(wav), {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "no-store",
    },
  });
}
