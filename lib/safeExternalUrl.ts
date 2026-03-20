/**
 * 只允許 http / https 的絕對 URL，用於 affiliate、OG 圖片等，避免 javascript: / data: 等協議。
 */
export function getSafeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (!u.hostname) return null;
  return u.href;
}

export function isSafeHttpUrl(raw: unknown): raw is string {
  return getSafeHttpUrl(raw) !== null;
}
