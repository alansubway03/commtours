import type { Tour, TourFilters } from "@/types/tour";

export function filterTours(tours: Tour[], filters: TourFilters): Tour[] {
  return tours.filter((tour) => {
    if (filters.types?.length && !filters.types.includes(tour.type)) return false;
    const regions = filters.regions ?? filters.region;
    if (regions?.length && !regions.includes(tour.region)) return false;
    if (filters.daysMin != null && tour.days < filters.daysMin) return false;
    if (filters.daysMax != null && tour.days > filters.daysMax) return false;
    if (filters.destination?.trim()) {
      const d = filters.destination.trim().toLowerCase();
      if (
        !tour.destination.toLowerCase().includes(d) &&
        !tour.title.toLowerCase().includes(d)
      )
        return false;
    }
    if (filters.noShopping && !tour.features.some((f) => f.includes("無購物") || f.includes("純玩") || f.includes("纯玩")))
      return false;
    if (filters.month) {
      const monthNum = monthLabelToNum(filters.month);
      if (monthNum != null) {
        const hasMonth = tour.departure_dates.some((dateStr) => {
          const m = new Date(dateStr).getMonth() + 1;
          return m === monthNum;
        });
        if (!hasMonth) return false;
      }
    }
    if (filters.priceMin != null || filters.priceMax != null) {
      const [min, max] = parsePriceRange(tour.price_range);
      if (filters.priceMin != null && max < filters.priceMin) return false;
      if (filters.priceMax != null && min > filters.priceMax) return false;
    }
    return true;
  });
}

function monthLabelToNum(label: string): number | null {
  const map: Record<string, number> = {
    "1月": 1, "2月": 2, "3月": 3, "4月": 4, "5月": 5, "6月": 6,
    "7月": 7, "8月": 8, "9月": 9, "10月": 10, "11月": 11, "12月": 12,
  };
  return map[label] ?? null;
}

function parsePriceRange(range: string): [number, number] {
  const match = range.replace(/\$/g, "").replace(/,/g, "").match(/(\d+)\s*-\s*(\d+)/);
  if (match) return [Number(match[1]), Number(match[2])];
  const single = range.replace(/\$/g, "").replace(/,/g, "").match(/(\d+)/);
  if (single) return [Number(single[1]), Number(single[1])];
  return [0, 999999];
}
