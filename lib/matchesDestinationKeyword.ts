import { canonicalTourRegion } from "@/lib/canonicalTourRegion";

const OCEANIA_REGION = "澳洲/紐西蘭";

const AUSTRALIA_TERMS = [
  "澳洲",
  "澳大利亞",
  "澳紐",
  "澳新",
  "悉尼",
  "墨爾本",
  "黃金海岸",
  "大堡礁",
  "布里斯本",
  "珀斯",
  "塔斯曼尼亞",
  "坎培拉",
  "阿德萊德",
];

const NEW_ZEALAND_TERMS = [
  "紐西蘭",
  "新西蘭",
  "皇后鎮",
  "奧克蘭",
  "基督城",
  "威靈頓",
  "羅托魯瓦",
];

function tourText(tour: { title: string; destination?: string | null }): string {
  return `${tour.title} ${tour.destination ?? ""}`;
}

function containsAnyTerm(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

export function matchesDestinationKeyword(
  tour: { title: string; destination?: string | null; region: string },
  query: string
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const blob = tourText(tour).toLowerCase();

  if (blob.includes(needle)) return true;

  if (needle === "澳洲" || needle === "澳大利亞") {
    return containsAnyTerm(blob, AUSTRALIA_TERMS);
  }

  if (needle === "紐西蘭" || needle === "新西蘭") {
    return containsAnyTerm(blob, NEW_ZEALAND_TERMS);
  }

  if (needle === OCEANIA_REGION.toLowerCase() || needle === "大洋洲") {
    return (
      canonicalTourRegion({
        title: tour.title,
        destination: tour.destination ?? "",
        region: tour.region,
      }) === OCEANIA_REGION
    );
  }

  const region = String(
    canonicalTourRegion({
      title: tour.title,
      destination: tour.destination ?? "",
      region: tour.region,
    })
  ).toLowerCase();
  return region.includes(needle);
}
