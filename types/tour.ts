export const TOUR_TYPES = [
  "longhaul",
  "cruise",
  "cruise_ticket",
  "hiking",
  "diving",
  "festival",
] as const;

export type TourType = (typeof TOUR_TYPES)[number];

export const TOUR_TYPE_LABELS: Record<TourType, string> = {
  longhaul: "長線旅遊",
  cruise: "郵輪旅行團",
  cruise_ticket: "郵輪船票",
  hiking: "行山/攀岩",
  diving: "潛水",
  festival: "節日/季節限定",
};

export interface AffiliateLinks {
  wingon?: string;
  tripdotcom?: string;
  /** 東瀛遊、捷旅等 JSON 推送常用 */
  egl?: string;
  jetour?: string;
  goldjoy?: string;
  wwpkg?: string;
  others?: { label: string; url: string }[];
}

/** 單一出發日期的成團狀態（成團 / 快將成團 / 未成團） */
export type DepartureDateStatusType = "成團" | "快將成團" | "未成團";

export interface DepartureDateStatus {
  date: string;
  status: DepartureDateStatusType;
}

export interface Tour {
  id: string;
  agency: string;
  type: TourType;
  title: string;
  destination: string;
  region: string;
  days: number;
  price_range: string;
  /** 由 departure_date_statuses 衍生，供月份篩選等使用 */
  departure_dates: string[];
  /** 每個出發日期對應的成團狀態（僅詳情頁展示） */
  departure_date_statuses?: DepartureDateStatus[];
  features: string[];
  affiliate_links: AffiliateLinks;
  image_url: string;
  last_updated: string;
}

export type TourFilters = {
  destination?: string;
  region?: string[];
  regions?: string[];
  types?: TourType[];
  daysMin?: number;
  daysMax?: number;
  priceMin?: number;
  priceMax?: number;
  departureMonth?: string;
  month?: string;
  noShopping?: boolean;
  features?: string[];
};
