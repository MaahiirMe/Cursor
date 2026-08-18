import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { StoredSession } from "../types";

const file = path.join(process.cwd(), "data", "sessions.json");
const lockFile = file + ".lock";

export type LeaderboardRow = {
  id: string;
  playerId: string;
  username: string;
  score: number;
  solved: number;
  mode: string;
  dailyKey?: string;
  createdAt: number;
  verified: boolean;
};

export type Profile = {
  id: string;
  username?: string;
  createdAt: number;
};

export type PlayerStats = {
  sessions: number;
  tracksAttempted: number;
  correct: number;
  accuracy: number;
  totalScore: number;
  bestScore: number;
  averageListen: number | null;
  perfectTwoSecond: number;
  streak: number;
  bestStreak: number;
};

export type UserRecord = {
  id: string;
  username: string;
  normalizedUsername: string;
  passwordHash: string;
  createdAt: number;
  stats: PlayerStats;
};

export function emptyStats(): PlayerStats {
  return {
    sessions: 0,
    tracksAttempted: 0,
    correct: 0,
    accuracy: 0,
    totalScore: 0,
    bestScore: 0,
    averageListen: null,
    perfectTwoSecond: 0,
    streak: 0,
    bestStreak: 0,
  };
}

type DB = {
  sessions: Record<string, StoredSession>;
  sequence: number;
  dailyClaims: Record<string, string>;
  leaderboard: LeaderboardRow[];
  profiles: Record<string, Profile>;
  tracksOverride: unknown[];
  users: Record<string, UserRecord>;
  usersByNorm: Record<string, string>;
  serveLog: Record<string, Array<{ trackIds: string[]; artistIds: string[]; at: number }>>;
};

function empty(): DB {
  return {
    sessions: {},
    sequence: 240,
    dailyClaims: {},
    leaderboard: [],
    profiles: {},
    tracksOverride: [],
    users: {},
    usersByNorm: {},
    serveLog: {},
  };
}

async function readDB(): Promise<DB> {
  try {
    const raw = JSON.parse(await fs.readFile(file, "utf8")) as Partial<DB>;
    return {
      ...empty(),
      ...raw,
      users: raw.users ?? {},
      usersByNorm: raw.usersByNorm ?? {},
      serveLog: raw.serveLog ?? {},
    };
  } catch {
    return empty();
  }
}

async function writeDB(db: DB) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db));
  await fs.rename(tmp, file);
}

async function withDB<T>(fn: (db: DB) => Promise<T> | T): Promise<T> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  for (let i = 0; i < 80; i++) {
    try {
      const handle = await fs.open(lockFile, "wx");
      try {
        const db = await readDB();
        const result = await fn(db);
        await writeDB(db);
        return result;
      } finally {
        await handle.close();
        await fs.unlink(lockFile).catch(() => undefined);
      }
    } catch {
      await new Promise((r) => setTimeout(r, 15 + (i % 5) * 10));
    }
  }
  throw new Error("Game store is busy");
}

export async function nextSessionNumber(): Promise<number> {
  return withDB((db) => {
    db.sequence += 1;
    return db.sequence;
  });
}

export async function saveSession(session: StoredSession) {
  await withDB((db) => {
    db.sessions[session.id] = session;
  });
}

export async function getSession(id: string): Promise<StoredSession | undefined> {
  return withDB((db) => db.sessions[id] ? structuredClone(db.sessions[id]) : undefined);
}

export async function mutateSession<T>(
  id: string,
  fn: (session: StoredSession) => T,
): Promise<T> {
  return withDB((db) => {
    const session = db.sessions[id];
    if (!session) throw new Error("Session not found");
    return fn(session);
  });
}

export async function getProfile(id: string): Promise<Profile> {
  return withDB((db) => {
    if (!db.profiles[id]) db.profiles[id] = { id, createdAt: Date.now() };
    return db.profiles[id];
  });
}

export async function setUsername(id: string, username: string) {
  return withDB((db) => {
    db.profiles[id] = {
      ...(db.profiles[id] ?? { id, createdAt: Date.now() }),
      username: username.trim().slice(0, 16).toUpperCase(),
    };
    return db.profiles[id];
  });
}

export async function claimDaily(playerId: string, dailyKey: string, sessionId: string) {
  return withDB((db) => {
    const key = `${playerId}:${dailyKey}`;
    const existing = db.dailyClaims[key];
    if (existing) return { replay: true, originalSessionId: existing };
    db.dailyClaims[key] = sessionId;
    return { replay: false, originalSessionId: sessionId };
  });
}

export async function addLeaderboard(row: LeaderboardRow) {
  await withDB((db) => {
    if (!row.verified) return;
    if (row.dailyKey) {
      const dup = db.leaderboard.find(
        (r) => r.playerId === row.playerId && r.dailyKey === row.dailyKey && r.mode === row.mode,
      );
      if (dup) return;
    }
    db.leaderboard.push(row);
  });
}

export async function listLeaderboard(range: "today" | "week" | "all") {
  return withDB((db) => {
    const now = Date.now();
    const cutoff =
      range === "today"
        ? now - 1000 * 60 * 60 * 24
        : range === "week"
          ? now - 1000 * 60 * 60 * 24 * 7
          : 0;
    return db.leaderboard
      .filter((r) => r.verified && r.createdAt >= cutoff && Boolean(db.users[r.playerId]))
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
  });
}

export async function getUser(id: string): Promise<UserRecord | undefined> {
  return withDB((db) => (db.users[id] ? structuredClone(db.users[id]) : undefined));
}

export async function findUserByUsername(username: string): Promise<UserRecord | undefined> {
  const norm = username.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "");
  return withDB((db) => {
    const id = db.usersByNorm[norm];
    return id && db.users[id] ? structuredClone(db.users[id]) : undefined;
  });
}

export async function createUser(input: {
  username: string;
  normalizedUsername: string;
  passwordHash: string;
}): Promise<UserRecord> {
  return withDB((db) => {
    if (db.usersByNorm[input.normalizedUsername]) {
      throw new Error("YEH NAAM KOI LE GAYA.");
    }
    const user: UserRecord = {
      id: crypto.randomUUID(),
      username: input.username,
      normalizedUsername: input.normalizedUsername,
      passwordHash: input.passwordHash,
      createdAt: Date.now(),
      stats: emptyStats(),
    };
    db.users[user.id] = user;
    db.usersByNorm[input.normalizedUsername] = user.id;
    return structuredClone(user);
  });
}

export async function updateUserStats(id: string, next: PlayerStats) {
  return withDB((db) => {
    const user = db.users[id];
    if (!user) return null;
    user.stats = next;
    return structuredClone(user);
  });
}

export async function recordServe(playerId: string, trackIds: string[], artistIds: string[]) {
  return withDB((db) => {
    const list = db.serveLog[playerId] ?? [];
    list.push({ trackIds, artistIds, at: Date.now() });
    db.serveLog[playerId] = list.slice(-16);
  });
}

export async function recentServe(playerId: string) {
  return withDB((db) => {
    const list = db.serveLog[playerId] ?? [];
    return {
      trackIds: list.flatMap((row) => row.trackIds),
      artistIds: list.flatMap((row) => row.artistIds),
    };
  });
}
