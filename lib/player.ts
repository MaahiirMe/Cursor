import { cookies } from "next/headers";
import crypto from "crypto";
import { getProfile } from "./db/store";

const PLAYER = "dhhuh_player";
const SESSION = "dhhuh_session";

export async function getPlayerId(): Promise<string> {
  const jar = await cookies();
  let id = jar.get(PLAYER)?.value;
  if (!id) {
    id = crypto.randomUUID();
    jar.set(PLAYER, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  await getProfile(id);
  return id;
}

export async function setSessionCookie(id: string) {
  const jar = await cookies();
  jar.set(SESSION, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
}

export async function getSessionId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION)?.value;
}
