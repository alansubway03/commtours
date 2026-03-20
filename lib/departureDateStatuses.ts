/** 寫入 / 讀取時允許的多種 departure_date_statuses 輸入，最終正規化為 { date, status }[] */

const VALID = new Set(["成團", "快將成團", "未成團"]);

export function coerceDepartureStatus(s: unknown): "成團" | "快將成團" | "未成團" {
  const t = String(s ?? "").trim();
  return VALID.has(t) ? (t as "成團" | "快將成團" | "未成團") : "未成團";
}

/**
 * 支援：
 * 1. 物件（最簡手寫）：{ "22/04": "成團", "23/04": "未成團" }
 * 2. 字串陣列：["22/04:成團", "23/04:快將成團"]（日期與狀態用英文冒號 : 分隔）
 * 3. 原格式：[{ "date": "22/04", "status": "成團" }]
 */
export function normalizeDepartureDateStatusesInput(v: unknown): {
  date: string;
  status: "成團" | "快將成團" | "未成團";
}[] {
  if (v == null) return [];

  if (typeof v === "object" && !Array.isArray(v)) {
    const out: { date: string; status: "成團" | "快將成團" | "未成團" }[] = [];
    for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
      const date = String(key).trim();
      if (!date) continue;
      out.push({ date, status: coerceDepartureStatus(val) });
    }
    return out;
  }

  if (!Array.isArray(v)) return [];

  const out: { date: string; status: "成團" | "快將成團" | "未成團" }[] = [];
  for (const item of v) {
    if (typeof item === "string") {
      const s = item.trim();
      if (!s) continue;
      const colon = s.indexOf(":");
      if (colon > 0) {
        out.push({
          date: s.slice(0, colon).trim(),
          status: coerceDepartureStatus(s.slice(colon + 1)),
        });
      } else {
        out.push({ date: s, status: "未成團" });
      }
      continue;
    }
    if (item && typeof item === "object" && "date" in item) {
      const date = String((item as { date: unknown }).date ?? "").trim();
      if (!date) continue;
      out.push({
        date,
        status: coerceDepartureStatus((item as { status: unknown }).status),
      });
    }
  }
  return out;
}
