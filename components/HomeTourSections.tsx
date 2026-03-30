"use client";

import { useState } from "react";
import Link from "next/link";
import { TourCard } from "@/components/TourCard";
import { Button } from "@/components/ui/button";
import type { Tour, TourType } from "@/types/tour";
import { TOUR_TYPE_LABELS } from "@/types/tour";
import { AGENCY_FILTER_OPTIONS } from "@/lib/agencies";
import { CANONICAL_REGIONS, canonicalTourRegion } from "@/lib/canonicalTourRegion";
import {
  departureRangeContainsMonth,
  isDepartureRangeNote,
  parseDepartureDay,
} from "@/lib/departureDisplay";

const TAB_ORDER: { id: "popular" | TourType; label: string }[] = [
  { id: "popular", label: "熱門行程" },
  { id: "longhaul", label: TOUR_TYPE_LABELS.longhaul },
  { id: "cruise", label: TOUR_TYPE_LABELS.cruise },
  { id: "cruise_ticket", label: TOUR_TYPE_LABELS.cruise_ticket },
  { id: "hiking", label: TOUR_TYPE_LABELS.hiking },
  { id: "diving", label: TOUR_TYPE_LABELS.diving },
  { id: "festival", label: TOUR_TYPE_LABELS.festival },
];

const POPULAR_COUNT = 5;
const MONTHS = ["不限", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"] as const;
const DAY_OPTIONS = [7, 8, 9, 10, 12, 14, 16, 18, 20, 25, 30] as const;
const PAGE_SIZE = 12;

interface HomeTourSectionsProps {
  tours: Tour[];
}

function parsePriceRange(range: string): [number, number] {
  const nums = String(range).replace(/[$,]/g, "").match(/\d+/g);
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

function matchesMonth(t: Tour, monthLabel: string): boolean {
  if (monthLabel === "不限") return true;
  const monthNum = monthLabelToNum(monthLabel);
  if (monthNum == null) return true;
  const ref = new Date();
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  start.setHours(0, 0, 0, 0);
  const endY = new Date(ref.getFullYear(), 11, 31, 23, 59, 59, 999);
  return (t.departure_date_statuses ?? []).some(({ date }) => {
    if (isDepartureRangeNote(date)) return departureRangeContainsMonth(date, monthNum);
    const dt = parseDepartureDay(date, ref);
    if (!dt) return false;
    if (dt.getMonth() + 1 !== monthNum) return false;
    return dt >= start && dt <= endY;
  });
}

export function HomeTourSections({ tours }: HomeTourSectionsProps) {
  const [activeTab, setActiveTab] = useState<"popular" | TourType>("popular");
  const [region, setRegion] = useState<string>("不限"); // 原有快捷篩選保留
  const [destination, setDestination] = useState("");
  const [agencies, setAgencies] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [daysMin, setDaysMin] = useState<number>(7);
  const [daysMax, setDaysMax] = useState<number>(30);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(100000);
  const [month, setMonth] = useState<(typeof MONTHS)[number]>("不限");
  const [noShopping, setNoShopping] = useState(false);
  const [page, setPage] = useState(1);

  const popularTours = tours.slice(0, POPULAR_COUNT);
  let filteredTours =
    activeTab === "popular" ? popularTours : tours.filter((t) => t.type === activeTab);

  // 長線旅遊在首頁提供地區篩選（歐洲/非洲/…）
  if (activeTab === "longhaul" && region !== "不限") {
    filteredTours = filteredTours.filter(
      (t) => String(canonicalTourRegion(t)) === region
    );
  }

  if (activeTab === "longhaul") {
    if (destination.trim()) {
      const needle = destination.trim().toLowerCase();
      filteredTours = filteredTours.filter((t) =>
        `${t.title} ${t.destination} ${canonicalTourRegion(t)}`.toLowerCase().includes(needle)
      );
    }
    if (agencies.length > 0) {
      const allowed = new Set<string>(
        AGENCY_FILTER_OPTIONS.filter((x) => agencies.includes(x.slug)).map((x) => String(x.agency))
      );
      filteredTours = filteredTours.filter((t) => allowed.has(String(t.agency)));
    }
    if (regions.length > 0) {
      filteredTours = filteredTours.filter((t) => regions.includes(String(canonicalTourRegion(t))));
    }
    filteredTours = filteredTours.filter((t) => t.days >= daysMin && t.days <= daysMax);
    filteredTours = filteredTours.filter((t) => {
      const [min, max] = parsePriceRange(t.price_range);
      return max >= priceMin && min <= priceMax;
    });
    filteredTours = filteredTours.filter((t) => matchesMonth(t, month));
    if (noShopping) {
      filteredTours = filteredTours.filter((t) =>
        (t.features ?? []).some((f) => f.includes("無購物") || f.includes("純玩") || f.includes("纯玩"))
      );
    }
  }

  const totalCount = filteredTours.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedTours =
    activeTab === "longhaul"
      ? filteredTours.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
      : filteredTours;

  const listLink = (() => {
    if (activeTab === "popular") return "/tours";

    const params = new URLSearchParams();
    params.set("types", activeTab);

    if (activeTab === "longhaul" && region !== "不限") {
      params.set("regions", region);
    }
    if (activeTab === "longhaul") {
      if (destination.trim()) params.set("destination", destination.trim());
      if (agencies.length > 0) params.set("agencies", agencies.join(","));
      if (regions.length > 0) params.set("regions", regions.join(","));
      params.set("daysMin", String(daysMin));
      params.set("daysMax", String(daysMax));
      params.set("priceMin", String(priceMin));
      params.set("priceMax", String(priceMax));
      if (month !== "不限") params.set("month", month);
      if (noShopping) params.set("noShopping", "1");
    }
    return `/tours?${params.toString()}`;
  })();

  return (
    <section className="container px-4 py-6 md:py-8">
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {TAB_ORDER.map(({ id, label }) => (
          <Button
            key={id}
            variant={activeTab === id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab(id);
              setPage(1);
            }}
            className="shrink-0"
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold md:text-xl">
              {activeTab === "popular"
                ? "熱門行程"
                : TOUR_TYPE_LABELS[activeTab]}
            </h2>
            {activeTab !== "popular" ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                首頁為精簡預覽，完整篩選與分頁請進入旅行團列表
              </p>
            ) : null}
          </div>

          {activeTab === "longhaul" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">地區</span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-9 rounded-md border border-border bg-card px-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="篩選地區"
              >
                <option value="不限">不限</option>
                {CANONICAL_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={listLink} prefetch={false}>
            {activeTab === "popular" ? "查看全部" : "前往完整篩選"}
          </Link>
        </Button>
      </div>

      {activeTab === "longhaul" ? (
        <div className="mb-5 space-y-3 rounded-xl border border-border bg-card p-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setPage(1);
              }}
              placeholder="搜尋目的地/關鍵字"
              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            />
            <select
              value={String(daysMin)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDaysMin(v);
                if (v > daysMax) setDaysMax(v);
                setPage(1);
              }}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={`min-${d}`} value={d}>
                  最少 {d} 天
                </option>
              ))}
            </select>
            <select
              value={String(daysMax)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDaysMax(v);
                if (v < daysMin) setDaysMin(v);
                setPage(1);
              }}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={`max-${d}`} value={d}>
                  最多 {d} 天
                </option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => {
                setMonth(e.target.value as (typeof MONTHS)[number]);
                setPage(1);
              }}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  出發月份：{m}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border p-2">
              <p className="mb-2 text-xs text-muted-foreground">旅行社</p>
              <div className="flex flex-wrap gap-2">
                {AGENCY_FILTER_OPTIONS.map((a) => {
                  const on = agencies.includes(a.slug);
                  return (
                    <button
                      key={a.slug}
                      type="button"
                      onClick={() => {
                        setAgencies((prev) =>
                          prev.includes(a.slug) ? prev.filter((x) => x !== a.slug) : [...prev, a.slug]
                        );
                        setPage(1);
                      }}
                      className={`rounded-md border px-2 py-1 text-xs ${on ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-md border border-border p-2">
              <p className="mb-2 text-xs text-muted-foreground">地區</p>
              <div className="flex flex-wrap gap-2">
                {CANONICAL_REGIONS.map((r) => {
                  const on = regions.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRegions((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
                        setPage(1);
                      }}
                      className={`rounded-md border px-2 py-1 text-xs ${on ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">預算下限（HK$）</p>
              <input
                type="number"
                min={0}
                step={1000}
                value={priceMin}
                onChange={(e) => {
                  const v = Number(e.target.value || 0);
                  setPriceMin(v);
                  if (v > priceMax) setPriceMax(v);
                  setPage(1);
                }}
                className="h-9 w-full rounded-md border border-border bg-background px-3"
              />
            </div>
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">預算上限（HK$）</p>
              <input
                type="number"
                min={0}
                step={1000}
                value={priceMax}
                onChange={(e) => {
                  const v = Number(e.target.value || 0);
                  setPriceMax(v);
                  if (v < priceMin) setPriceMin(v);
                  setPage(1);
                }}
                className="h-9 w-full rounded-md border border-border bg-background px-3"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={noShopping}
                onChange={(e) => {
                  setNoShopping(e.target.checked);
                  setPage(1);
                }}
              />
              無購物團
            </label>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pagedTours.length === 0 ? (
          <p className="col-span-full py-8 text-center text-muted-foreground">
            暫無此類型行程
          </p>
        ) : (
          pagedTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} showAffiliate />
          ))
        )}
      </div>
      {activeTab === "longhaul" && totalCount > 0 ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一頁
          </Button>
          <span className="text-sm text-muted-foreground">
            {safePage} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            下一頁
          </Button>
        </div>
      ) : null}
    </section>
  );
}
