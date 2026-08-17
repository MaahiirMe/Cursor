import { cookies } from "next/headers";
import { GUEST_COOKIE } from "@/lib/config";
import { getPlayer, newGuestId } from "@/lib/store";

export async function resolveUserId(req: Request): Promise<string> {
  const header = req.headers.get("x-guest-id");
  const cookieStore = await cookies();
  const cookie = cookieStore.get(GUEST_COOKIE)?.value;
  const userId = header || cookie || newGuestId();
  cookieStore.set(GUEST_COOKIE, userId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  await getPlayer(userId);
  return userId;
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function errorJson(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
