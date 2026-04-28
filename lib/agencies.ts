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
const AGENCY_TO_SLUG = Object.fromEntries(
  AGENCY_FILTER_OPTIONS.map((o) => [o.agency, o.slug])
) as Record<string, AgencyFilterSlug>;

export const AGENCY_INTRO_BY_SLUG: Partial<Record<AgencyFilterSlug, string>> = {
  wingon:
    "永安旅遊提供多元長短線團、郵輪與自由行產品，行程範圍廣，適合希望一次比較不同預算與路線的旅客。",
  egl:
    "EGL 東瀛遊以日本及亞洲線見稱，行程編排著重交通與景點平衡，常見季節限定路線與主題團。",
  jetour:
    "Jetour 捷旅提供日本、韓國、歐洲及郵輪等產品，主打多樣化行程選擇與不同節奏的出發方案。",
  goldjoy:
    "金怡假期涵蓋長線與特色深度遊路線，重視景點安排與行程內容的完整度，適合喜歡充實行程的旅客。",
  wwpkg:
    "縱橫遊 WWPKG 聚焦主題路線及特色地區產品，常見包含深度體驗元素，適合偏好主題化旅遊的旅客。",
};

export function agenciesFromSlugs(slugs: string[]): string[] {
  const out: string[] = [];
  for (const s of slugs) {
    const a = SLUG_TO_AGENCY[s.trim()];
    if (a && !out.includes(a)) out.push(a);
  }
  return out;
}

export function agencyFromSlug(slug: string): string | null {
  return SLUG_TO_AGENCY[slug.trim()] ?? null;
}

export function agencyToSlug(agency: string): AgencyFilterSlug | null {
  return AGENCY_TO_SLUG[agency.trim()] ?? null;
}
