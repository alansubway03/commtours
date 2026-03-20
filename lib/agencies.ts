/** 篩選用：slug 對應 DB tour.agency 字串（須與爬蟲/上傳一致） */
export const AGENCY_FILTER_OPTIONS = [
  { slug: "wingon", label: "永安旅遊", agency: "永安旅遊" },
  { slug: "egl", label: "EGL 東瀛遊", agency: "EGL 東瀛遊" },
  { slug: "jetour", label: "Jetour 捷旅", agency: "Jetour 捷旅" },
  { slug: "goldjoy", label: "金怡假期", agency: "金怡假期" },
  { slug: "wwpkg", label: "縱橫遊 WWPKG", agency: "縱橫遊WWPKG" },
] as const;

export type AgencyFilterSlug = (typeof AGENCY_FILTER_OPTIONS)[number]["slug"];

const SLUG_TO_AGENCY = Object.fromEntries(
  AGENCY_FILTER_OPTIONS.map((o) => [o.slug, o.agency])
) as Record<string, string>;

export function agenciesFromSlugs(slugs: string[]): string[] {
  const out: string[] = [];
  for (const s of slugs) {
    const a = SLUG_TO_AGENCY[s.trim()];
    if (a && !out.includes(a)) out.push(a);
  }
  return out;
}
