const tokens = new Map<string, { trackId: string; expires: number }>();

export function issuePlayToken(trackId: string): string {
  const id = crypto.randomUUID();
  tokens.set(id, { trackId, expires: Date.now() + 1000 * 60 * 90 });
  return id;
}

export function resolvePlayToken(id: string): string | null {
  const hit = tokens.get(id);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    tokens.delete(id);
    return null;
  }
  return hit.trackId;
}
