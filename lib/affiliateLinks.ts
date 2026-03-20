/** DB affiliate_links 可能含 wingon / tripdotcom / egl / jetour / others[] 等 */

import { getSafeHttpUrl } from "@/lib/safeExternalUrl";

const VENDOR_LABEL: Record<string, string> = {
  wingon: "永安旅遊",
  tripdotcom: "Trip.com",
  egl: "東瀛遊",
  jetour: "捷旅",
  goldjoy: "金怡假期",
  wwpkg: "縱橫遊",
};

function safeUrl(s: unknown): string | null {
  return getSafeHttpUrl(s);
}

/** 列表卡「即時報名」：優先永安 → Trip → 其他已知 key → 任意 http → others[0] */
export function pickPrimaryAffiliate(
  links: Record<string, unknown> | null | undefined
): { url: string; shortLabel: string } | null {
  if (!links || typeof links !== "object") return null;
  const order = ["wingon", "tripdotcom", "egl", "jetour", "goldjoy", "wwpkg"] as const;
  for (const k of order) {
    const v = links[k];
    const href = safeUrl(v);
    if (href) {
      if (k === "wingon") return { url: href, shortLabel: "報名去永安" };
      if (k === "tripdotcom") return { url: href, shortLabel: "報名去 Trip.com" };
      return { url: href, shortLabel: `報名 · ${VENDOR_LABEL[k] ?? k}` };
    }
  }
  for (const [k, v] of Object.entries(links)) {
    if (k === "others") continue;
    const href = safeUrl(v);
    if (href) {
      return { url: href, shortLabel: `報名 · ${VENDOR_LABEL[k] ?? "官網"}` };
    }
  }
  const others = links.others;
  if (Array.isArray(others)) {
    for (const o of others) {
      if (!o || typeof o !== "object") continue;
      const rec = o as { url?: unknown; label?: unknown };
      const href = getSafeHttpUrl(rec.url);
      if (href) {
        return {
          url: href,
          shortLabel: String(rec.label ?? "").trim() || "官網報名",
        };
      }
    }
  }
  return null;
}
