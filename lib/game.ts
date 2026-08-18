import crypto from "crypto";
import { resolveAudioProvider } from "./audio/resolver";
import { signPlayback } from "./audio/mock";
import { hintsFor } from "./catalogue/hints";
import { getTrack, playableTracks } from "./catalogue";
import { resolveLocalArtistId, resolveLocalTrackId } from "./metadata/cache";
import { COPY, correctCopy, resultHeadline, wrongCopy } from "./copy";
import {
  addLeaderboard,
  claimDaily,
  getProfile,
  getSession,
  mutateSession,
  nextSessionNumber,
  saveSession,
} from "./db/store";
import {
  HINT_COSTS,
  MAX_ATTEMPTS,
  MAX_HINTS,
  nextSeconds,
  possibleScore,
} from "./scoring";
import type {
  GameMode,
  GuessVerdict,
  PurchasedHint,
  RevealedRound,
  SessionPublic,
  SessionStats,
  StoredRound,
  StoredSession,
  Track,
} from "./types";

function dailyKey(date = new Date()): string {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function dailyNumber(key: string): number {
  const start = Date.UTC(2026, 0, 1);
  const t = Date.parse(`${key}T00:00:00Z`);
  return Math.max(1, Math.floor((t - start) / 86400000) + 1);
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function initialSeconds(mode: GameMode): number {
  return mode === "hard" ? 1 : 2;
}

function pickTracks(mode: GameMode, key?: string, exclude: string[] = []): Track[] {
  const pool = playableTracks().filter((t) => !exclude.includes(t.id));
  const seed =
    mode === "daily" && key
      ? Number.parseInt(key.replaceAll("-", ""), 10)
      : crypto.randomInt(1, 1_000_000_000);
  const rand = mulberry32(seed);
  const shuffled = [...pool].sort(() => rand() - 0.5);
  const chosen: Track[] = [];
  const used = new Set<string>();
  for (const t of shuffled) {
    if (used.has(t.id)) continue;
    chosen.push(t);
    used.add(t.id);
    if (chosen.length === 5) break;
  }
  if (chosen.length < 5) {
    throw new Error("Not enough playable tracks from 00:00");
  }
  return chosen;
}

function hydrate(round: StoredRound, mode: GameMode): StoredRound {
  return {
    ...round,
    initialSeconds: round.initialSeconds ?? initialSeconds(mode),
    hintsPurchased: round.hintsPurchased ?? 0,
    replacements: round.replacements ?? 0,
  };
}

function liveScore(round: StoredRound, mode: GameMode): number {
  const r = hydrate(round, mode);
  return possibleScore({
    initialSeconds: r.initialSeconds,
    revealSeconds: r.revealSeconds,
    wrongGuesses: r.attemptsUsed,
    hintsPurchased: r.hintsPurchased,
  });
}

function purchasedHintViews(track: Track, count: number): PurchasedHint[] {
  const hints = hintsFor(track);
  return hints.slice(0, count).map((text, index) => ({
    index: index + 1,
    text,
    cost: HINT_COSTS[index],
  }));
}

function toPublic(session: StoredSession): SessionPublic {
  const rounds: RevealedRound[] = session.rounds.map((raw, index) => {
    const r = hydrate(raw, session.mode);
    const track = getTrack(r.trackId)!;
    const prepared = resolveAudioProvider(track);
    const token = signPlayback(session.id, index);
    const isCurrent =
      session.status === "playing" && index === session.currentIndex && r.outcome === "pending";
    const playback = isCurrent
      ? {
          providerId: prepared.providerId,
          youtubeVideoId: prepared.youtubeVideoId,
          audioUrl:
            prepared.providerId === "licensed" ? prepared.audioUrl : `/api/audio/${token}`,
          startSeconds: 0 as const,
        }
      : { providerId: prepared.providerId, startSeconds: 0 as const };
    const revealed = r.outcome !== "pending" || session.status === "complete";
    const safe: RevealedRound = {
      index,
      attemptsLeft: MAX_ATTEMPTS - r.attemptsUsed,
      attemptsUsed: r.attemptsUsed,
      maxAttempts: MAX_ATTEMPTS,
      revealSeconds: r.revealSeconds,
      initialSeconds: r.initialSeconds,
      possibleScore: r.outcome === "pending" ? liveScore(r, session.mode) : r.score,
      outcome: r.outcome,
      playback,
      score: r.outcome === "pending" ? undefined : r.score,
      purchasedHints: isCurrent || revealed ? purchasedHintViews(track, r.hintsPurchased) : [],
      nextHintCost:
        isCurrent && r.hintsPurchased < MAX_HINTS ? HINT_COSTS[r.hintsPurchased] : null,
      canAddTime: isCurrent && nextSeconds(r.revealSeconds) != null,
    };
    if (revealed) {
      safe.title = track.title;
      safe.artistNames = track.artists.map((a) => a.name);
      safe.artworkSeed = track.id;
      safe.artworkUrl = track.youtubeVideoId
        ? `https://i.ytimg.com/vi/${track.youtubeVideoId}/hqdefault.jpg`
        : undefined;
    }
    return safe;
  });

  const stats = session.status === "complete" ? computeStats(session) : undefined;

  return {
    id: session.id,
    number: session.number,
    mode: session.mode,
    currentIndex: session.currentIndex,
    rounds,
    totalScore: session.rounds.reduce((s, r) => s + r.score, 0),
    status: session.status,
    dailyKey: session.dailyKey,
    replay: session.replay,
    resultCopy: session.status === "complete" ? resultHeadline(stats?.solved ?? 0) : undefined,
    stats,
  };
}

function computeStats(session: StoredSession): SessionStats {
  const solved = session.rounds.filter((r) => r.outcome === "correct").length;
  const firstTry = session.rounds.filter((r) => r.outcome === "correct" && r.attemptsUsed === 1).length;
  const reveals = session.rounds.filter((r) => r.outcome === "correct").map((r) => r.revealSeconds);
  const averageReveal = reveals.length
    ? Math.round(reveals.reduce((a, b) => a + b, 0) / reveals.length)
    : null;
  let bestTrackIndex: number | null = null;
  let best = -1;
  session.rounds.forEach((r, i) => {
    if (r.score > best) {
      best = r.score;
      bestTrackIndex = i;
    }
  });
  return { solved, firstTry, averageReveal, bestTrackIndex };
}

export async function startSession(playerId: string, mode: GameMode): Promise<SessionPublic> {
  const key = mode === "daily" ? dailyKey() : undefined;
  const tracks = pickTracks(mode, key);
  const number = mode === "daily" && key ? dailyNumber(key) : await nextSessionNumber();
  const id = crypto.randomUUID();
  let replay = false;
  if (mode === "daily" && key) {
    const claim = await claimDaily(playerId, key, id);
    replay = claim.replay;
  }
  const startAt = initialSeconds(mode);
  const rounds: StoredRound[] = tracks.map((t) => ({
    trackId: t.id,
    attemptsUsed: 0,
    revealSeconds: startAt,
    initialSeconds: startAt,
    hintsPurchased: 0,
    replacements: 0,
    outcome: "pending",
    score: 0,
    guesses: [],
  }));
  const session: StoredSession = {
    id,
    number,
    mode,
    playerId,
    createdAt: Date.now(),
    currentIndex: 0,
    rounds,
    status: "playing",
    dailyKey: key,
    replay,
  };
  await saveSession(session);
  return toPublic(session);
}

export async function loadPublic(id: string): Promise<SessionPublic | null> {
  const session = await getSession(id);
  if (!session) return null;
  return toPublic(session);
}

export async function submitGuess(
  sessionId: string,
  playerId: string,
  selectedTrackId: string,
  selectedArtistId: string,
): Promise<{ session: SessionPublic; verdict: GuessVerdict; copy: string }> {
  const trackId = await resolveLocalTrackId(selectedTrackId);
  const artistId = await resolveLocalArtistId(selectedArtistId);
  return mutateSession(sessionId, (session) => {
    if (session.playerId !== playerId) throw new Error("Session not found");
    if (session.status !== "playing") throw new Error("Session complete");
    const round = hydrate(session.rounds[session.currentIndex], session.mode);
    session.rounds[session.currentIndex] = round;
    if (round.outcome !== "pending") throw new Error("Round closed");
    if (round.attemptsUsed >= MAX_ATTEMPTS) throw new Error("No attempts");

    const track = getTrack(round.trackId)!;
    const credited = new Set(track.artists.map((a) => a.id));
    const songOk = trackId === track.id;
    const artistOk = credited.has(artistId);
    let verdict: GuessVerdict = "WRONG";
    if (songOk && artistOk) verdict = "FULL_CORRECT";
    else if (!songOk && artistOk) verdict = "ARTIST_ONLY";

    round.attemptsUsed += 1;
    round.guesses.push({
      trackId,
      artistId,
      verdict,
      at: Date.now(),
    });

    const left = MAX_ATTEMPTS - round.attemptsUsed;
    let copy = wrongCopy(left);
    if (verdict === "FULL_CORRECT") {
      round.outcome = "correct";
      round.score = possibleScore({
        initialSeconds: round.initialSeconds,
        revealSeconds: round.revealSeconds,
        wrongGuesses: round.attemptsUsed - 1,
        hintsPurchased: round.hintsPurchased,
      });
      copy = correctCopy({ attemptsUsed: round.attemptsUsed, revealSeconds: round.revealSeconds });
    } else if (verdict === "ARTIST_ONLY") {
      copy = COPY.artistOnly;
    }

    if (verdict !== "FULL_CORRECT" && round.attemptsUsed >= MAX_ATTEMPTS) {
      round.outcome = "failed";
      round.score = 0;
      verdict = "LAST_HAI";
      copy = COPY.skipped;
    }

    return { session: toPublic(session), verdict, copy };
  });
}

export async function replaceUnplayableRound(sessionId: string, playerId: string) {
  return mutateSession(sessionId, (session) => {
    if (session.playerId !== playerId) throw new Error("Session not found");
    if (session.status !== "playing") throw new Error("Session complete");
    const round = hydrate(session.rounds[session.currentIndex], session.mode);
    if (round.outcome !== "pending") {
      return { session: toPublic(session), replaced: false };
    }
    if (round.replacements >= 3) {
      return { session: toPublic(session), replaced: false };
    }
    const used = new Set(session.rounds.map((r) => r.trackId));
    const next = playableTracks().find((t) => !used.has(t.id));
    if (!next) {
      return { session: toPublic(session), replaced: false };
    }
    session.rounds[session.currentIndex] = {
      trackId: next.id,
      attemptsUsed: 0,
      revealSeconds: round.initialSeconds,
      initialSeconds: round.initialSeconds,
      hintsPurchased: 0,
      replacements: round.replacements + 1,
      outcome: "pending",
      score: 0,
      guesses: [],
    };
    return { session: toPublic(session), replaced: true };
  });
}

export async function skipRound(sessionId: string, playerId: string) {
  return mutateSession(sessionId, (session) => {
    if (session.playerId !== playerId) throw new Error("Session not found");
    const round = session.rounds[session.currentIndex];
    if (round.outcome !== "pending") return { session: toPublic(session), copy: COPY.skipped };
    round.outcome = "skipped";
    round.score = 0;
    return { session: toPublic(session), copy: COPY.skipped };
  });
}

export async function unlockMore(sessionId: string, playerId: string) {
  return mutateSession(sessionId, (session) => {
    if (session.playerId !== playerId) throw new Error("Session not found");
    const round = hydrate(session.rounds[session.currentIndex], session.mode);
    session.rounds[session.currentIndex] = round;
    if (round.outcome !== "pending") return toPublic(session);
    const next = nextSeconds(round.revealSeconds);
    if (next) round.revealSeconds = next;
    return toPublic(session);
  });
}

export async function buyHint(sessionId: string, playerId: string) {
  return mutateSession(sessionId, (session) => {
    if (session.playerId !== playerId) throw new Error("Session not found");
    const round = hydrate(session.rounds[session.currentIndex], session.mode);
    session.rounds[session.currentIndex] = round;
    if (round.outcome !== "pending") return toPublic(session);
    if (round.hintsPurchased >= MAX_HINTS) return toPublic(session);
    round.hintsPurchased += 1;
    return toPublic(session);
  });
}

export async function advanceRound(sessionId: string, playerId: string) {
  const session = await mutateSession(sessionId, (s) => {
    if (s.playerId !== playerId) throw new Error("Session not found");
    advance(s);
    return s;
  });
  if (session.status === "complete" && !session.replay) {
    const profile = await getProfile(playerId);
    const stats = computeStats(session);
    await addLeaderboard({
      id: crypto.randomUUID(),
      playerId,
      username: profile.username ?? "GUEST",
      score: session.rounds.reduce((sum: number, r: StoredRound) => sum + r.score, 0),
      solved: stats.solved,
      mode: session.mode,
      dailyKey: session.dailyKey,
      createdAt: Date.now(),
      verified: true,
    });
  }
  return toPublic(session);
}

function advance(session: StoredSession) {
  const next = session.currentIndex + 1;
  if (next >= 5) {
    session.status = "complete";
    session.currentIndex = 4;
  } else {
    session.currentIndex = next;
  }
}

export function shareText(session: SessionPublic): string {
  const lines = session.rounds.map((r, i) => {
    const n = String(i + 1).padStart(2, "0");
    const mark = r.outcome === "correct" ? "●" : "○";
    return `${n} ${mark}`;
  });
  const solved = session.stats?.solved ?? 0;
  const avg = session.stats?.averageReveal ? `${session.stats.averageReveal} SEC` : "—";
  const label =
    session.mode === "daily"
      ? `DAILY #${String(session.number).padStart(3, "0")}`
      : `#${String(session.number).padStart(4, "0")}`;
  return [
    `DHHUH?  ${label}`,
    "",
    ...lines,
    "",
    `${solved}/5`,
    `${session.totalScore.toLocaleString("en-IN")} PTS`,
    `AVG ${avg}`,
    "",
    "SUNKE BATA.",
  ].join("\n");
}

export { dailyKey };
