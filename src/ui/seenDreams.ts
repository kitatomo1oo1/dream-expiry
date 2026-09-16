const STORAGE_KEY = "dream-expiry:seen-occupations";

/** プライベートブラウジング等でlocalStorageが使えない環境でも落ちないようにする。 */
function readSeenIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function markDreamSeen(occupationId: string): void {
  try {
    const seen = new Set(readSeenIds());
    seen.add(occupationId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(seen)));
  } catch {
    // 保存できない環境では何もしない(機能を諦めるだけで、体験は壊さない)
  }
}

export function getSeenDreamIds(): Set<string> {
  return new Set(readSeenIds());
}
