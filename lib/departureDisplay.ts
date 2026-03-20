/**
 * 出發日期顯示：僅顯示「今天起至當年年底」的具體日子；
 * 官網只給區間（如 2025/08 - 2026/09）時整段保留顯示。
 */

const RANGE_RE = /^\d{4}\/\d{2}\s*-\s*\d{4}\/\d{2}$/;

export function isDepartureRangeNote(date: string): boolean {
  return RANGE_RE.test(String(date ?? "").trim());
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** 解析 DD/MM 或 DD/MM/YYYY；無年份時取「下一個不小於 ref 當日的該月該日」 */
export function parseDepartureDay(dateStr: string, ref: Date = new Date()): Date | null {
  const s = String(dateStr ?? "").trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  let year = m[3] ? parseInt(m[3], 10) : ref.getFullYear();
  if (year < 100) year += 2000;
  let dt = new Date(year, month - 1, day);
  if (!m[3]) {
    const y0 = ref.getFullYear();
    dt = new Date(y0, month - 1, day);
    if (dt < startOfDay(ref)) dt = new Date(y0 + 1, month - 1, day);
  }
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** 詳情頁列表：區間列一律保留；具體日子只留今天～今年 12/31 */
export function filterDeparturesForDisplay<T extends { date: string }>(
  items: T[],
  ref: Date = new Date()
): T[] {
  if (!items?.length) return [];
  const y = ref.getFullYear();
  const start = startOfDay(ref);
  const end = new Date(y, 11, 31, 23, 59, 59, 999);
  return items.filter(({ date }) => {
    const d = String(date ?? "").trim();
    if (isDepartureRangeNote(d)) return true;
    /* 金怡已成團等「27 Mar 26」英文月格式：團內多日出發一律顯示 */
    if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}$/.test(d.replace(/\s+/g, " ")))
      return true;
    const dt = parseDepartureDay(d, ref);
    if (!dt) return false;
    return dt >= start && dt <= end;
  });
}

/** 列表「出發月份」篩選：區間內是否涵蓋該月 */
export function departureRangeContainsMonth(
  rangeStr: string,
  monthNum: number
): boolean {
  const s = String(rangeStr ?? "").trim();
  if (!RANGE_RE.test(s)) return false;
  const [a, b] = s.split(/\s*-\s*/).map((x) => x.trim());
  const [y1, m1] = a.split("/").map(Number);
  const [y2, m2] = b.split("/").map(Number);
  let y = y1;
  let m = m1;
  for (let guard = 0; guard < 48; guard++) {
    if (m === monthNum) return true;
    if (y === y2 && m === m2) break;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return false;
}
