import { errorJson, json, resolveUserId } from "@/lib/api/session";
import { submitGuess } from "@/lib/game/engine";
import type { GameMode } from "@/types";

export async function POST(req: Request) {
  try {
    const userId = await resolveUserId(req);
    const body = await req.json();
    if (!body.songText?.trim() || !body.artistText?.trim()) {
      return errorJson("Song + artist dono chahiye.");
    }
    const out = await submitGuess({
      userId,
      mode: (body.mode ?? "daily") as GameMode,
      playId: body.playId ?? body.trackId,
      challengeId: body.challengeId,
      songText: body.songText,
      artistText: body.artistText,
      songId: body.songId,
      artistId: body.artistId,
      revealDuration: Number(body.revealDuration),
      attempt: Number(body.attempt),
      practice: Boolean(body.practice),
      filterArtistId: body.filterArtistId,
      filterScene: body.filterScene,
    });
    return json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "NETWORK GAYA. SCORE NAHI.";
    return errorJson(msg, 400);
  }
}
