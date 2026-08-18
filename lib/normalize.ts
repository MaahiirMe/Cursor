export function normalizeText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\$/g, "s")
    .replace(/&/g, "and")
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function compact(input: string): string {
  return normalizeText(input).replace(/\s+/g, "");
}

export function tokens(input: string): string[] {
  return normalizeText(input).split(" ").filter(Boolean);
}
