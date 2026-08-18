import { promises as fs } from "fs";
import path from "path";
import type { StoredSession } from "../types";

const file = path.join(process.cwd(), "data", "sessions.json");

type DB = {
  sessions: Record<string, StoredSession>;
  sequence: number;
  dailyClaims: Record<string, string>;
  leaderboard: LeaderboardRow[];
  profiles: Record<string, Profile>;
  tracksOverride: unknown[];
};

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

let memory: DB | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function load(): Promise<DB> {
  if (memory) return memory;
  try {
    const raw = await fs.readFile(file, "utf8");
    memory = JSON.parse(raw) as DB;
  } catch {
    memory = {
      sessions: {},
      sequence: 240,
      dailyClaims: {},
      leaderboard: [],
      profiles: {},
      tracksOverride: [],
    };
  }
  return memory;
}

function persist(db: DB) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(db), "utf8");
  });
  return writeQueue;
}

export async function nextSessionNumber(): Promise<number> {
  const db = await load();
  db.sequence += 1;
  persist(db);
  return db.sequence;
}

export async function saveSession(session: StoredSession) {
  const db = await load();
  db.sessions[session.id] = session;
  persist(db);
}

export async function getSession(id: string): Promise<StoredSession | undefined> {
  const db = await load();
  return db.sessions[id];
}

export async function getProfile(id: string): Promise<Profile> {
  const db = await load();
  if (!db.profiles[id]) {
    db.profiles[id] = { id, createdAt: Date.now() };
    persist(db);
  }
  return db.profiles[id];
}

export async function setUsername(id: string, username: string) {
  const db = await load();
  db.profiles[id] = {
    ...(db.profiles[id] ?? { id, createdAt: Date.now() }),
    username: username.trim().slice(0, 16).toUpperCase(),
  };
  persist(db);
  return db.profiles[id];
}

export async function claimDaily(playerId: string, dailyKey: string, sessionId: string) {
  const db = await load();
  const key = `${playerId}:${dailyKey}`;
  const existing = db.dailyClaims[key];
  if (existing) return { replay: true, originalSessionId: existing };
  db.dailyClaims[key] = sessionId;
  persist(db);
  return { replay: false, originalSessionId: sessionId };
}

export async function addLeaderboard(row: LeaderboardRow) {
  const db = await load();
  if (!row.verified) return;
  if (row.dailyKey) {
    const dup = db.leaderboard.find(
      (r) => r.playerId === row.playerId && r.dailyKey === row.dailyKey && r.mode === row.mode,
    );
    if (dup) return;
  }
  db.leaderboard.push(row);
  persist(db);
}

export async function listLeaderboard(range: "today" | "week" | "all") {
  const db = await load();
  const now = Date.now();
  const cutoff =
    range === "today" ? now - 1000 * 60 * 60 * 24 : range === "week" ? now - 1000 * 60 * 60 * 24 * 7 : 0;
  return db.leaderboard
    .filter((r) => r.verified && r.createdAt >= cutoff)
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);
}
