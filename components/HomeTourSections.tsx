"use client";

import { useState } from "react";
import Link from "next/link";
import { TourCard } from "@/components/TourCard";
import { Button } from "@/components/ui/button";
import type { Tour, TourType } from "@/types/tour";
import { TOUR_TYPE_LABELS } from "@/types/tour";
import { CANONICAL_REGIONS, canonicalTourRegion } from "@/lib/canonicalTourRegion";

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

interface HomeTourSectionsProps {
  tours: Tour[];
}

export function HomeTourSections({ tours }: HomeTourSectionsProps) {
  const [activeTab, setActiveTab] = useState<"popular" | TourType>("popular");
  const [region, setRegion] = useState<string>("不限");

  const popularTours = tours.slice(0, POPULAR_COUNT);
  let filteredTours =
    activeTab === "popular" ? popularTours : tours.filter((t) => t.type === activeTab);

  // 長線旅遊在首頁提供地區篩選（歐洲/非洲/…）
  if (activeTab === "longhaul" && region !== "不限") {
    filteredTours = filteredTours.filter(
      (t) => String(canonicalTourRegion(t)) === region
    );
  }

  const listLink = (() => {
    if (activeTab === "popular") return "/tours";

    const params = new URLSearchParams();
    params.set("types", activeTab);

    if (activeTab === "longhaul" && region !== "不限") {
      params.set("regions", region);
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
            onClick={() => setActiveTab(id)}
            className="shrink-0"
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold md:text-xl">
            {activeTab === "popular"
              ? "熱門行程"
              : TOUR_TYPE_LABELS[activeTab]}
          </h2>

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
          <Link href={listLink}>查看全部</Link>
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTours.length === 0 ? (
          <p className="col-span-full py-8 text-center text-muted-foreground">
            暫無此類型行程
          </p>
        ) : (
          filteredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} showAffiliate />
          ))
        )}
      </div>
    </section>
  );
}
