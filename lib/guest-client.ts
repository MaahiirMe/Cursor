import { GUEST_STORAGE_KEY } from "@/lib/config";

export function getGuestId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(GUEST_STORAGE_KEY);
  if (!id) {
    id = `guest:${crypto.randomUUID()}`;
    localStorage.setItem(GUEST_STORAGE_KEY, id);
  }
  return id;
}

export function apiHeaders(json = false): HeadersInit {
  const headers: Record<string, string> = {
    "x-guest-id": getGuestId(),
  };
  if (json) headers["content-type"] = "application/json";
  return headers;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...apiHeaders(init?.method === "POST"),
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "NETWORK GAYA. SCORE NAHI.");
  }
  return data as T;
}
