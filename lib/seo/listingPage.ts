import type { Metadata } from "next";

/** 允許索引的列表頁不應帶查詢參數；篩選／分頁僅供使用者瀏覽。 */
export const NOINDEX_FOLLOW: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: true,
};

export function getSearchParam(
  value: string | string[] | undefined
): string | undefined {
  if (value == null) return undefined;
  return typeof value === "string" ? value : value[0];
}

export function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function hasActiveSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  ignoredKeys: string[] = []
): boolean {
  const ignored = new Set(ignoredKeys);
  return Object.entries(searchParams).some(([key, value]) => {
    if (ignored.has(key)) return false;
    if (value == null) return false;
    if (Array.isArray(value)) return value.some((v) => v.trim() !== "");
    return value.trim() !== "";
  });
}
