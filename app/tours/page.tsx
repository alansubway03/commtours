import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase";
import { normalizeDepartureDateStatusesInput } from "@/lib/departureDateStatuses";
import { pickPrimaryAffiliate } from "@/lib/affiliateLinks";
import { getSafeHttpUrl } from "@/lib/safeExternalUrl";
import { canonicalTourRegion } from "@/lib/canonicalTourRegion";
import {
  departureRangeContainsMonth,
  isDepartureRangeNote,
  parseDepartureDay,
} from "@/lib/departureDisplay";
import { agenciesFromSlugs } from "@/lib/agencies";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterSidebar } from "@/components/FilterSidebar";
import { Suspense } from "react";
import {
  Plane,
  Ship,
  Mountain,
  Waves,
  Calendar,
  MapPin,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

export const metadata = {
  title: "長線特色團比價 - 香港出發歐洲/郵輪/潛水等",
  description:
    "篩選香港出發的長線、郵輪、行山、潛水、節日限定等團體行程，比較價格與特色。",
  openGraph: {
    title: "長線特色團比價 - 香港出發歐洲/郵輪/潛水等 | CommTours",
    description: "篩選香港出發的長線、郵輪、行山、潛水、節日限定等團體行程。",
  },
};

const TYPE_LABELS: Record<string, string> = {
  longhaul: "長線團",
  cruise: "郵輪團",
  cruise_ticket: "郵輪船票",
  hiking: "行山",
  diving: "潛水",
  festival: "節日",
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  longhaul: Plane,
  cruise: Ship,
  cruise_ticket: Ship,
  hiking: Mountain,
  diving: Waves,
  festival: Calendar,
};

const PLACEHOLDER_IMAGE = "https://placehold.co/400x200?text=無圖片";

/** 避免超長逗號清單造成查詢負擔 */
const MAX_QUERY_LIST_LENGTH = 40;

function matchesDestinationKeyword(row: TourRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const region = String(canonicalTourRegion(row));
  const hay = `${row.title} ${row.destination ?? ""} ${region}`.toLowerCase();
  return hay.includes(needle);
}

function parsePriceRange(range: string): [number, number] {
  const nums = range.replace(/[$,]/g, "").match(/\d+/g);
  if (!nums?.length) return [0, 999999];
  const parsed = nums.map(Number);
  return [Math.min(...parsed), Math.max(...parsed)];
}

function monthLabelToNum(label: string): number | null {
  const map: Record<string, number> = {
    "1月": 1, "2月": 2, "3月": 3, "4月": 4, "5月": 5, "6月": 6,
    "7月": 7, "8月": 8, "9月": 9, "10月": 10, "11月": 11, "12月": 12,
  };
  return map[label] ?? null;
}

type TourRow = {
  id: number;
  created_at: string;
  agency: string;
  title: string;
  type: string;
  destination: string;
  region: string;
  days: number;
  price_range: string;
  departure_date_statuses: unknown;
  features: string[] | null;
  affiliate_links: Record<string, unknown> | null;
  image_url: string | null;
  updated_at: string | null;
};

function getParam(
  v: string | string[] | undefined
): string | undefined {
  if (v == null) return undefined;
  return typeof v === "string" ? v : v[0];
}

export default async function ToursPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await searchParamsPromise;
  const typesParam = getParam(searchParams.types) ?? getParam(searchParams.type);
  const regionsParam = getParam(searchParams.regions) ?? getParam(searchParams.region);
  const daysMinRaw = Number(
    getParam(searchParams.daysMin) ?? getParam(searchParams.days_min)
  );
  const daysMaxRaw = Number(
    getParam(searchParams.daysMax) ?? getParam(searchParams.days_max)
  );
  const daysFromHome = Number(getParam(searchParams.days));
  const priceMin = Number(getParam(searchParams.priceMin) ?? getParam(searchParams.price_min));
  const priceMax = Number(getParam(searchParams.priceMax) ?? getParam(searchParams.price_max));
  const monthParam = getParam(searchParams.month);
  const noShopping = getParam(searchParams.noShopping) === "1";
  const agenciesParam =
    getParam(searchParams.agencies) ?? getParam(searchParams.agency);
  const destinationQuery = (getParam(searchParams.destination) ?? "").trim();

  const types = typesParam
    ? typesParam.split(",").filter(Boolean).slice(0, MAX_QUERY_LIST_LENGTH)
    : [];
  const regions = regionsParam
    ? regionsParam.split(",").filter(Boolean).slice(0, MAX_QUERY_LIST_LENGTH)
    : [];
  const agencyNames = agenciesParam
    ? agenciesFromSlugs(
        agenciesParam.split(",").filter(Boolean).slice(0, MAX_QUERY_LIST_LENGTH)
      )
    : [];
  let daysMinNum = Number.isNaN(daysMinRaw) ? undefined : daysMinRaw;
  if (!Number.isNaN(daysFromHome) && daysFromHome > 0) {
    daysMinNum =
      daysMinNum != null ? Math.max(daysMinNum, daysFromHome) : daysFromHome;
  }
  const daysMaxNum = Number.isNaN(daysMaxRaw) ? undefined : daysMaxRaw;
  const priceMinNum = Number.isNaN(priceMin) ? undefined : priceMin;
  const priceMaxNum = Number.isNaN(priceMax) ? undefined : priceMax;

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("tour")
    .select("*")
    .order("created_at", { ascending: false });

  if (types.length > 0) query = query.in("type", types);
  if (agencyNames.length > 0) query = query.in("agency", agencyNames);
  /* 地區改在記憶體依標題／目的地推斷，避免 DB 誤標（歐洲團寫成亞洲） */
  if (daysMinNum != null) query = query.gte("days", daysMinNum);
  if (daysMaxNum != null) query = query.lte("days", daysMaxNum);

  const { data: tours, error } = await query;

  if (error) {
    console.error("[tours] Supabase error:", error.message, error.code);
    return (
      <div className="container px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            香港出發長線及特色團比價
          </h1>
          <p className="mt-1 text-muted-foreground">
            歐洲、郵輪、潛水、節日限定等團體行程
          </p>
        </header>
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-destructive">
          <p className="font-semibold">無法載入團體資料</p>
          <p className="mt-1 text-sm opacity-90">
            系統暫時無法取得資料，請稍後再試。若問題持續，請聯絡管理員。
          </p>
        </div>
      </div>
    );
  }

  let list = (tours ?? []) as TourRow[];

  if (destinationQuery) {
    list = list.filter((row) => matchesDestinationKeyword(row, destinationQuery));
  }

  if (regions.length > 0) {
    list = list.filter((row) =>
      regions.includes(String(canonicalTourRegion(row)))
    );
  }

  if (priceMinNum != null) {
    list = list.filter((row) => {
      const [, max] = parsePriceRange(row.price_range);
      return max >= priceMinNum;
    });
  }
  if (priceMaxNum != null) {
    list = list.filter((row) => {
      const [min] = parsePriceRange(row.price_range);
      return min <= priceMaxNum;
    });
  }
  if (monthParam && monthParam !== "不限") {
    const monthNum = monthLabelToNum(monthParam);
    if (monthNum != null) {
      const ref = new Date();
      const yEnd = ref.getFullYear();
      const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
      start.setHours(0, 0, 0, 0);
      const endY = new Date(yEnd, 11, 31, 23, 59, 59, 999);
      list = list.filter((row) => {
        const dates = normalizeDepartureDateStatusesInput(row.departure_date_statuses);
        return dates.some(({ date: d }) => {
          if (isDepartureRangeNote(d)) return departureRangeContainsMonth(d, monthNum);
          const dt = parseDepartureDay(d, ref);
          if (!dt) return false;
          if (dt.getMonth() + 1 !== monthNum) return false;
          return dt >= start && dt <= endY;
        });
      });
    }
  }
  if (noShopping) {
    list = list.filter((row) =>
      (row.features ?? []).some(
        (f) => f.includes("無購物") || f.includes("純玩") || f.includes("纯玩")
      )
    );
  }

  return (
    <div className="container px-4 py-6 md:py-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          香港出發長線及特色團比價
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          歐洲、郵輪、潛水、節日限定等團體行程
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="w-full shrink-0 lg:w-56 xl:w-64">
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-xl bg-muted" />
            }
          >
            <FilterSidebar />
          </Suspense>
        </aside>

        <div className="min-w-0 flex-1">
          <h2 className="mb-4 text-lg font-semibold text-muted-foreground md:text-xl">
            共 {list.length} 個行程
          </h2>
          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center text-muted-foreground md:py-16">
              <p className="font-medium">暫無符合的行程</p>
              <p className="mt-1 text-sm">試試調整左側篩選條件</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {list.map((row) => {
                const TypeIcon = TYPE_ICONS[row.type] ?? Plane;
                const primary = pickPrimaryAffiliate(row.affiliate_links ?? undefined);
                const affiliateLink = primary?.url;
                const affiliateLabel = primary?.shortLabel ?? "查看詳情";

                return (
                  <Card
                    key={row.id}
                    className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
                  >
                    <Link
                      href={`/tours/${row.id}`}
                      className="group flex min-h-0 flex-1 flex-col text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <CardHeader className="p-0">
                        <div className="relative aspect-[2/1] w-full bg-muted">
                          <Image
                            src={getSafeHttpUrl(row.image_url) ?? PLACEHOLDER_IMAGE}
                            alt={row.title}
                            fill
                            className="object-cover transition-opacity hover:opacity-95"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute left-3 top-3">
                            <Badge
                              variant="secondary"
                              className="pointer-events-none gap-1.5 shadow-sm"
                            >
                              <TypeIcon className="h-3.5 w-3.5" />
                              {TYPE_LABELS[row.type] ?? row.type}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col gap-2.5 p-4">
                        <h2 className="line-clamp-2 text-base font-semibold leading-snug group-hover:underline">
                          {row.title}
                        </h2>
                        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                          <span>{row.agency}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-0.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {row.days != null && row.days > 0 ? `${row.days} 天` : "—"}
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {canonicalTourRegion(row)}
                          </span>
                        </p>
                        <p className="font-bold text-price">
                          {row.price_range}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(row.features ?? []).slice(0, 4).map((f) => (
                            <Badge
                              key={f}
                              variant="outline"
                              className="pointer-events-none text-xs font-normal"
                            >
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Link>
                    <CardFooter className="flex flex-col gap-2 p-4 pt-0 sm:flex-row">
                      <Button asChild variant="outline" className="w-full sm:flex-1">
                        <Link href={`/tours/${row.id}`}>查看詳情</Link>
                      </Button>
                      {affiliateLink ? (
                        <Button asChild className="w-full sm:flex-1">
                          <a
                            href={affiliateLink}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                          >
                            即時報名 · {affiliateLabel}
                          </a>
                        </Button>
                      ) : null}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
