import crypto from "crypto";
import { cookies } from "next/headers";
import type { Identity } from "./identity";
import {
  createUser,
  findUserByUsername,
  getUser,
  type UserRecord,
  type PlayerStats,
} from "./db/store";

const AUTH = "dhhuh_auth";
const GUEST = "dhhuh_guest";
const SECRET = process.env.SESSION_SECRET ?? "dhhuh-dev-secret-change-me";

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "");
}

export function displayUsername(raw: string) {
  return raw.trim().replace(/\s+/g, "").slice(0, 16);
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, salt, expected.length);
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function sign(userId: string) {
  const sig = crypto.createHmac("sha256", SECRET).update(userId).digest("hex").slice(0, 32);
  return `${userId}.${sig}`;
}

function unsign(token: string) {
  const [userId, sig] = token.split(".");
  if (!userId || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(userId).digest("hex").slice(0, 32);
  if (expected.length !== sig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  return userId;
}

export type { Identity } from "./identity";
export type { PlayerStats } from "./db/store";

export function publicUser(user: UserRecord): Extract<Identity, { kind: "registered" }> {
  return {
    kind: "registered",
    id: user.id,
    username: user.username,
    stats: user.stats,
  };
}

export async function setAuthCookie(userId: string) {
  const jar = await cookies();
  jar.set(AUTH, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  jar.delete(GUEST);
}

export async function setGuestCookie(name: string) {
  const jar = await cookies();
  jar.set(GUEST, name, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearAuth() {
  const jar = await cookies();
  jar.delete(AUTH);
}

export async function getAuthUser(): Promise<UserRecord | null> {
  const jar = await cookies();
  const token = jar.get(AUTH)?.value;
  if (!token) return null;
  const id = unsign(token);
  if (!id) return null;
  return (await getUser(id)) ?? null;
}

export async function getGuestName(): Promise<string | null> {
  const jar = await cookies();
  const name = jar.get(GUEST)?.value?.trim();
  return name || null;
}

export async function currentIdentity(): Promise<Identity | null> {
  const user = await getAuthUser();
  if (user) return publicUser(user);
  const guest = await getGuestName();
  if (guest) return { kind: "guest", displayName: guest };
  return null;
}

export function usernameSuggestions(username: string) {
  const base = displayUsername(username) || "MC";
  const n = normalizeUsername(base) || "mc";
  return [`${base}1`, `${base}_DHH`, `${n}uh`.slice(0, 16)].filter(
    (x, i, arr) => arr.indexOf(x) === i && normalizeUsername(x) !== n,
  );
}

export async function registerUser(username: string, password: string) {
  const display = displayUsername(username);
  const normalized = normalizeUsername(display);
  if (normalized.length < 2) throw new Error("Naam chhota hai.");
  if (password.length < 4) throw new Error("Password chhota hai.");
  const taken = await findUserByUsername(display);
  if (taken) {
    const err = new Error("YEH NAAM KOI LE GAYA.");
    (err as Error & { code: string; suggestions: string[] }).code = "taken";
    (err as Error & { suggestions: string[] }).suggestions = usernameSuggestions(display);
    throw err;
  }
  const user = await createUser({
    username: display,
    normalizedUsername: normalized,
    passwordHash: hashPassword(password),
  });
  await setAuthCookie(user.id);
  return publicUser(user);
}

export async function loginUser(username: string, password: string) {
  const user = await findUserByUsername(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Username ya password galat hai.");
  }
  await setAuthCookie(user.id);
  return publicUser(user);
}

export { findUserByUsername };
