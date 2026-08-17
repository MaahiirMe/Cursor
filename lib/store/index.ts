import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { unlockAchievements } from "@/lib/game/achievements";
import { rankForXp } from "@/lib/game/ranks";
import { favouriteMode, nextStreak } from "@/lib/game/streaks";
import type {
  GameMode,
  GameResult,
  LeaderboardRow,
  PlayerProfile,
  SceneTag,
} from "@/types";
import { TRACKS } from "@/data/tracks";

export interface PlayerRecord {
  userId: string;
  username: string;
  avatarSeed: string;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastDailyDate: string | null;
  results: GameResult[];
  guesses: number;
  achievements: string[];
  claimed: boolean;
}

interface StoreShape {
  players: Record<string, PlayerRecord>;
  dailyStats: Record<
    string,
    { plays: number; solves: number; revealSum: number; fastest: number }
  >;
}

const FILE = path.join(process.cwd(), ".data", "store.json");

const empty = (): StoreShape => ({ players: {}, dailyStats: {} });

let memory: StoreShape | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function load(): Promise<StoreShape> {
  if (memory) return memory;
  try {
    const raw = await readFile(FILE, "utf8");
    memory = JSON.parse(raw) as StoreShape;
  } catch {
    memory = empty();
  }
  return memory;
}

function persist(next: StoreShape) {
  memory = next;
  writeQueue = writeQueue.then(async () => {
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(next), "utf8");
  });
  return writeQueue;
}

export function newGuestId(): string {
  return `guest:${crypto.randomUUID()}`;
}

export async function getPlayer(userId: string): Promise<PlayerRecord> {
  const db = await load();
  if (!db.players[userId]) {
    db.players[userId] = {
      userId,
      username: fallbackName(userId),
      avatarSeed: userId,
      xp: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastDailyDate: null,
      results: [],
      guesses: 0,
      achievements: [],
      claimed: false,
    };
    await persist(db);
  }
  return db.players[userId];
}

export async function claimName(userId: string, username: string): Promise<PlayerRecord> {
  const clean = username.trim().slice(0, 18);
  if (clean.length < 3) throw new Error("Naam chhota hai. 3+ letters.");
  const db = await load();
  const taken = Object.values(db.players).some(
    (p) => p.username.toLowerCase() === clean.toLowerCase() && p.userId !== userId,
  );
  if (taken) throw new Error("Ye naam already scene mein hai.");
  const player = await getPlayer(userId);
  player.username = clean;
  player.claimed = true;
  db.players[userId] = player;
  await persist(db);
  return player;
}

export async function mergeGuestIntoUser(guestId: string, userId: string) {
  const db = await load();
  const guest = db.players[guestId];
  if (!guest) return getPlayer(userId);
  const user = await getPlayer(userId);
  user.results = [...guest.results, ...user.results];
  user.xp += guest.xp;
  user.longestStreak = Math.max(user.longestStreak, guest.longestStreak);
  user.currentStreak = Math.max(user.currentStreak, guest.currentStreak);
  user.achievements = [...new Set([...user.achievements, ...guest.achievements])];
  if (!user.claimed && guest.claimed) {
    user.username = guest.username;
    user.claimed = true;
  }
  delete db.players[guestId];
  db.players[userId] = user;
  await persist(db);
  return user;
}

export function officialDaily(player: PlayerRecord, challengeId: string) {
  return player.results.find(
    (r) => r.mode === "daily" && r.challengeId === challengeId && !r.practice,
  );
}

export async function recordGuess(userId: string) {
  const db = await load();
  const player = await getPlayer(userId);
  player.guesses += 1;
  db.players[userId] = player;
  await persist(db);
}

export async function recordResult(params: {
  userId: string;
  result: GameResult;
  today: string;
}): Promise<{ player: PlayerRecord; result: GameResult; newAchievements: string[] }> {
  const db = await load();
  const player = await getPlayer(params.userId);
  const result = { ...params.result };

  if (result.mode === "daily" && !result.practice) {
    const existing = officialDaily(player, result.challengeId ?? "");
    if (existing) {
      return { player, result: existing, newAchievements: [] };
    }
    const streak = nextStreak({
      current: player.currentStreak,
      lastDailyDate: player.lastDailyDate,
      today: params.today,
      wonDaily: result.correct,
    });
    player.currentStreak = streak.current;
    if (result.correct) {
      player.lastDailyDate = params.today;
      player.longestStreak = Math.max(player.longestStreak, player.currentStreak);
    } else {
      player.longestStreak = Math.max(player.longestStreak, player.currentStreak);
    }
    const stats = db.dailyStats[params.today] ?? {
      plays: 0,
      solves: 0,
      revealSum: 0,
      fastest: 99,
    };
    stats.plays += 1;
    if (result.correct) {
      stats.solves += 1;
      stats.revealSum += result.revealDuration;
      stats.fastest = Math.min(stats.fastest, result.revealDuration);
    }
    db.dailyStats[params.today] = stats;
  }

  player.results.push(result);
  player.xp += result.xp;
  const before = new Set(player.achievements);
  player.achievements = unlockAchievements({
    results: player.results,
    currentStreak: player.currentStreak,
    already: player.achievements,
  });
  const newAchievements = player.achievements.filter((id) => !before.has(id));
  db.players[params.userId] = player;
  await persist(db);
  return { player, result, newAchievements };
}

export async function dailyStats(date: string) {
  const db = await load();
  const s = db.dailyStats[date];
  const base = seededBase(date);
  const plays = (s?.plays ?? 0) + base.plays;
  const solves = (s?.solves ?? 0) + base.solves;
  const revealSum = (s?.revealSum ?? 0) + base.revealSum;
  const fastest = Math.min(s?.fastest ?? 99, 2);
  return {
    playerCount: plays,
    successRate: plays ? solves / plays : 0,
    averageGuessDuration: solves ? Math.round((revealSum / (solves || 1)) * 10) / 10 : 7.2,
    fastestVerified: fastest === 99 ? 2 : fastest,
  };
}

function seededBase(date: string) {
  const n = parseInt(createHash("sha256").update(date).digest("hex").slice(0, 8), 16);
  const plays = 12000 + (n % 9000);
  const solves = Math.floor(plays * (0.34 + (n % 17) / 100));
  return { plays, solves, revealSum: solves * 7.2 };
}

export function toProfile(player: PlayerRecord): PlayerProfile {
  const official = player.results.filter((r) => !r.practice);
  const guessed = official.filter((r) => r.correct);
  const rank = rankForXp(player.xp);
  const dnaReady = official.length >= 8;
  return {
    userId: player.userId,
    username: player.username,
    avatarSeed: player.avatarSeed,
    xp: player.xp,
    rankId: rank.id,
    currentStreak: player.currentStreak,
    longestStreak: player.longestStreak,
    songsAttempted: new Set(official.map((r) => r.trackId)).size,
    songsGuessed: new Set(guessed.map((r) => r.trackId)).size,
    accuracy: official.length ? guessed.length / official.length : 0,
    averageRevealDuration: guessed.length
      ? guessed.reduce((a, r) => a + r.revealDuration, 0) / guessed.length
      : 0,
    averageAttempts: official.length
      ? official.reduce((a, r) => a + r.attempts, 0) / official.length
      : 0,
    perfectTwoSecondGuesses: guessed.filter((r) => r.revealDuration <= 2).length,
    favouriteMode: favouriteMode(official),
    bestScene: dnaReady ? bestScene(official) : null,
    dna: dnaReady ? dnaFrom(official) : null,
    achievements: player.achievements,
  };
}

function bestScene(results: GameResult[]): SceneTag | null {
  const dna = dnaFrom(results);
  return dna[0]?.tag ?? null;
}

function dnaFrom(results: GameResult[]): { tag: SceneTag; value: number }[] {
  const tags: SceneTag[] = [
    "Delhi",
    "Mumbai",
    "Pakistan",
    "Underground",
    "Mainstream",
    "Old School",
    "New Wave",
  ];
  const counts = new Map<SceneTag, { tried: number; hit: number }>();
  for (const tag of tags) counts.set(tag, { tried: 0, hit: 0 });
  for (const r of results) {
    const track = TRACKS.find((t) => t.id === r.trackId);
    if (!track) continue;
    for (const tag of track.sceneTags) {
      const c = counts.get(tag);
      if (!c) continue;
      c.tried += 1;
      if (r.correct) c.hit += 1;
    }
  }
  return tags
    .map((tag) => {
      const c = counts.get(tag)!;
      if (c.tried < 3) return null;
      return { tag, value: Math.round((c.hit / c.tried) * 100) };
    })
    .filter(Boolean) as { tag: SceneTag; value: number }[];
}

export async function leaderboard(period: "daily" | "weekly" | "all"): Promise<LeaderboardRow[]> {
  const db = await load();
  const now = Date.now();
  const cutoff =
    period === "daily" ? now - 86400000 : period === "weekly" ? now - 7 * 86400000 : 0;

  const rows = Object.values(db.players).map((p) => {
    const set = p.results.filter((r) => !r.practice && Date.parse(r.completedAt) >= cutoff);
    const guessed = set.filter((r) => r.correct);
    const accuracy = set.length ? guessed.length / set.length : 0;
    const avgReveal = guessed.length
      ? guessed.reduce((a, r) => a + r.revealDuration, 0) / guessed.length
      : 16;
    const perf = guessed.reduce((a, r) => a + r.score, 0);
    const speed = Math.max(0.4, 1.3 - avgReveal / 20);
    const consistency = 1 + Math.min(0.35, p.currentStreak * 0.04);
    const score = Math.round(perf * (0.55 + accuracy * 0.45) * speed * consistency);
    return {
      userId: p.userId,
      username: p.username,
      score,
      averageRevealTime: Math.round(avgReveal * 10) / 10,
      accuracy,
      streak: p.currentStreak,
    };
  });

  const seeded = seedBoard(period);
  const merged = [...rows.filter((r) => r.score > 0), ...seeded]
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return merged;
}

function seedBoard(period: string): Omit<LeaderboardRow, "rank">[] {
  const names = [
    "aux_thief",
    "ncr_kid",
    "boothwala",
    "gullyclock",
    "khi_loop",
    "sector6",
    "no_lyrics",
    "yazzy",
    "tapehead",
    "oldmic",
  ];
  const mul = period === "daily" ? 1 : period === "weekly" ? 4.2 : 18;
  return names.map((username, i) => ({
    userId: `seed:${username}`,
    username,
    score: Math.round((9800 - i * 430) * mul * 0.08),
    averageRevealTime: 2 + (i % 5) * 1.2,
    accuracy: 0.92 - i * 0.03,
    streak: Math.max(0, 12 - i),
  }));
}

function fallbackName(userId: string): string {
  const n = userId.replace(/[^a-z0-9]/gi, "").slice(-4) || "0000";
  return `guest_${n}`;
}

export function unlimitedStats(player: PlayerRecord, mode: GameMode) {
  const set = player.results.filter((r) => r.mode === mode && !r.practice);
  let run = 0;
  let best = 0;
  for (const r of set) {
    if (r.correct) {
      run += 1;
      best = Math.max(best, run);
    } else run = 0;
  }
  const guessed = set.filter((r) => r.correct);
  return {
    currentRun: run,
    bestRun: best,
    accuracy: set.length ? guessed.length / set.length : 0,
    averageGuessTime: guessed.length
      ? guessed.reduce((a, r) => a + r.revealDuration, 0) / guessed.length
      : 0,
    played: set.length,
  };
}
