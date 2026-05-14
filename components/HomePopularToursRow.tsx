"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TourCard } from "@/components/TourCard";
import type { Tour } from "@/types/tour";
import { hasFeaturedTag } from "@/lib/featuredTours";

const ROW_LIMIT = 10;
const SCROLL_FRACTION = 0.85;

interface HomePopularToursRowProps {
  tours: Tour[];
  agencyScoreMap: Record<string, number>;
}

export function HomePopularToursRow({ tours, agencyScoreMap }: HomePopularToursRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const popularTours = useMemo(() => {
    const featured = tours.filter((t) => hasFeaturedTag(t.features));
    const rest = tours.filter((t) => !hasFeaturedTag(t.features));
    return [...featured, ...rest].slice(0, ROW_LIMIT);
  }, [tours]);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanPrev(scrollLeft > 6);
    setCanNext(maxScroll > 6 && scrollLeft < maxScroll - 6);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = scrollerRef.current;
    if (!el) return;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateEdges) : null;
    ro?.observe(el);
    window.addEventListener("resize", updateEdges);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateEdges);
    };
  }, [popularTours, updateEdges]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = Math.max(240, el.clientWidth * SCROLL_FRACTION) * dir;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (popularTours.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">熱門行程</h2>
        <Link
          href="/tours"
          prefetch={false}
          className="shrink-0 text-sm font-medium text-foreground underline decoration-foreground/70 underline-offset-4 hover:decoration-foreground"
        >
          查看更多
        </Link>
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={updateEdges}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:gap-4"
        >
          {popularTours.map((tour) => (
            <div
              key={tour.id}
              className="w-[min(17.5rem,calc(100vw-3.5rem))] shrink-0 snap-start sm:w-[17.5rem]"
            >
              <TourCard
                tour={tour}
                showAffiliate
                agencyScore={agencyScoreMap[String(tour.agency).trim()]}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={!canPrev}
          onClick={() => scrollByDir(-1)}
          tabIndex={!canPrev ? -1 : 0}
          className="absolute left-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-background text-muted-foreground shadow-md transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-0 md:left-0 md:-translate-x-1/2"
          aria-label="熱門行程：向左捲動"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => scrollByDir(1)}
          tabIndex={!canNext ? -1 : 0}
          className="absolute right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-background text-muted-foreground shadow-md transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-0 md:right-0 md:translate-x-1/2"
          aria-label="熱門行程：向右捲動"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
