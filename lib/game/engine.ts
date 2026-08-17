import { ARTISTS } from "@/data/artists";
import { catalogArtists, catalogSongs, publicBeat, revealTrack } from "@/data/catalog";
import { TRACKS, tracksById } from "@/data/tracks";
import { buildDailyChallenge, calendarDateInZone, msUntilNextReset } from "@/lib/game/daily";
import { evaluateGuess } from "@/lib/game/matching";
import { computeScore, computeXp, modeConfig, WRONG_GUESS_PENALTY } from "@/lib/scoring";
import {
  dailyStats,
  officialDaily,
  recordGuess,
  recordResult,
  getPlayer,
} from "@/lib/store";
import { issuePlayToken, resolvePlayToken } from "@/lib/game/tokens";
import type { GameMode, GameResult } from "@/types";

const artistsById = new Map(ARTISTS.map((a) => [a.id, a]));

export async function getDailyPayload(userId: string) {
  const date = calendarDateInZone();
  const challenge = buildDailyChallenge(TRACKS, date);
  const player = await getPlayer(userId);
  const existing = officialDaily(player, challenge.id);
  const stats = await dailyStats(date);
  const playId = issuePlayToken(challenge.trackId);
  return {
    challenge: {
      id: challenge.id,
      date: challenge.date,
      challengeNumber: challenge.challengeNumber,
      difficulty: challenge.difficulty,
      ...stats,
    },
    track: publicBeat(challenge.trackId, playId),
    resetMs: msUntilNextReset(),
    completed: existing ?? null,
    reveal: existing ? revealTrack(challenge.trackId) : null,
    profileHint: {
      username: player.username,
      claimed: player.claimed,
      streak: player.currentStreak,
      gamesPlayed: player.results.length,
    },
  };
}

export async function submitGuess(params: {
  userId: string;
  mode: GameMode;
  playId: string;
  challengeId?: string;
  songText: string;
  artistText: string;
  songId?: string;
  artistId?: string;
  revealDuration: number;
  attempt: number;
  practice?: boolean;
  filterArtistId?: string;
  filterScene?: string;
}) {
  let trackId = resolvePlayToken(params.playId);
  if (!trackId && params.mode === "daily" && params.challengeId) {
    const daily = buildDailyChallenge(TRACKS, calendarDateInZone());
    if (params.challengeId === daily.id) trackId = daily.trackId;
  }
  const track = trackId ? tracksById.get(trackId) : undefined;
  if (!track || !track.active) {
    throw new Error("ISS TRACK KA PREVIEW ABHI AVAILABLE NAHI HAI.");
  }
  if (params.filterArtistId && !track.artists.includes(params.filterArtistId)) {
    throw new Error("Ye track is run ka nahi hai.");
  }
  if (params.filterScene && !track.sceneTags.includes(params.filterScene as never)) {
    throw new Error("Ye track is scene ka nahi hai.");
  }

  const cfg = modeConfig(params.mode);
  if (params.attempt < 1 || params.attempt > cfg.maxAttempts) {
    throw new Error("Attempts khatam.");
  }
  if (!cfg.reveals.includes(params.revealDuration) && !(params.mode === "one-second" && params.revealDuration === 1)) {
    throw new Error("Reveal duration galat hai.");
  }

  if (params.mode === "daily" && params.challengeId) {
    const player = await getPlayer(params.userId);
    const existing = officialDaily(player, params.challengeId);
    if (existing && !params.practice) {
      throw new Error("Aaj ka official score already lock ho chuka hai. Practice chala.");
    }
  }

  await recordGuess(params.userId);

  const evald = evaluateGuess({
    track,
    artistsById,
    songText: params.songText,
    artistText: params.artistText,
    songId: params.songId,
    artistId: params.artistId,
  });

  const maxAttempts = cfg.maxAttempts;
  const attemptsLeft = maxAttempts - params.attempt;
  const finished = evald.verdict === "full" || attemptsLeft <= 0;
  const correct = evald.verdict === "full";
  const scoreDelta = correct ? 0 : -WRONG_GUESS_PENALTY;

  let result: GameResult | null = null;
  let newAchievements: string[] = [];
  let player = await getPlayer(params.userId);

  if (finished) {
    const wrongGuesses = correct ? params.attempt - 1 : params.attempt;
    const score = computeScore({
      correct,
      revealDuration: params.revealDuration,
      wrongGuesses,
      mode: params.mode,
    });
    const xp = computeXp({
      correct,
      revealDuration: params.revealDuration,
      mode: params.mode,
      streak: player.currentStreak,
      practice: params.practice,
    });
    const recorded = await recordResult({
      userId: params.userId,
      today: calendarDateInZone(),
      result: {
        userId: params.userId,
        mode: params.mode,
        trackId: track.id,
        challengeId: params.challengeId,
        score,
        attempts: params.attempt,
        revealDuration: params.revealDuration,
        correct,
        completedAt: new Date().toISOString(),
        practice: params.practice,
        xp,
      },
    });
    result = recorded.result;
    newAchievements = recorded.newAchievements;
    player = recorded.player;
  }

  return {
    ...evald,
    attemptsLeft,
    scoreDelta,
    finished,
    correct,
    result,
    reveal: finished ? revealTrack(track.id) : null,
    newAchievements,
    streak: player.currentStreak,
    showClaim: finished && !player.claimed && player.results.length === 1,
    fasterThan: finished && result?.correct ? fasterThan(params.revealDuration) : null,
    failStat: finished && !correct ? failStat() : null,
  };
}

function fasterThan(reveal: number) {
  const map: Record<number, number> = { 1: 4, 2: 18, 4: 41, 7: 62, 11: 79, 16: 91 };
  return map[reveal] ?? 50;
}

function failStat() {
  return { pool: 16428, missPct: 38 };
}

export function pickRandomTrack(exclude: string[] = [], artistId?: string, scene?: string) {
  let pool = TRACKS.filter((t) => t.active && !exclude.includes(t.id));
  if (artistId) pool = pool.filter((t) => t.artists.includes(artistId));
  if (scene) pool = pool.filter((t) => t.sceneTags.includes(scene as never));
  if (!pool.length) pool = TRACKS.filter((t) => t.active);
  return pool[Math.floor(Math.random() * pool.length)];
}

export { catalogArtists, catalogSongs };
