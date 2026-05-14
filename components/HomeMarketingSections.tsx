"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AdSlide = {
  id: string;
  title: string;
  /** 橫幅副標，一句話補充主標 */
  subtitle?: string;
  image: string;
  href: string;
};

/** 首頁「旅遊資訊」精選：正方形卡片，左下 headline / tagline */
type InfoCategory = "Blog" | "行程" | "旅行社" | "旅遊景點";

type InfoCard = {
  id: string;
  category: InfoCategory;
  /** 左下角大字（宜短） */
  headline: string;
  /** 左下角細字（宜短） */
  tagline: string;
  image: string;
  href: string;
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

const AD_SLIDES: AdSlide[] = [
  {
    id: "ad-commtours-launch",
    title: "香港團隊主理，貼地為你整理",
    subtitle:
      "午膳想快睇兩眼，定放工後同屋企人夾行程都得。日程、團費同重點集中喺同一畫面，查閱方便，亦唔使再靠一堆截圖同群組轉發慢慢對。",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&auto=format&fit=crop&q=80",
    href: "/about",
  },
  {
    id: "ad-commtours-vision",
    title: "細節並排睇，邊個行程最啱心水",
    subtitle:
      "出發日期、住宿安排、有冇購物環節、團費包邊啲……各項資料左右對齊。邊份行程最配合大家需要，一望就知，唔使估估下。",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&auto=format&fit=crop&q=80",
    href: "/about",
  },
  {
    id: "ad-commtours-compare",
    title: "多間旅行社行程，一個畫面盡覽",
    subtitle:
      "揀好目的地同出發日，各家路線同報價會排開畀你睇。唔使自己開十幾個分頁，亦唔使手抄價錢再慢慢對，慳返時間慢慢揀。",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80",
    href: "/tours",
  },
];

/** 旅遊資訊每頁格數（Klook 式一排 6 張；最後一頁不足則用 col-span 補齊） */
const INFO_PAGE_SIZE = 6;

const INFO_CARDS: InfoCard[] = [
  {
    id: "info-threads-yfl-victor",
    category: "Blog",
    headline: "Threads｜@yfl_victor",
    tagline: "香港玩食靈感（帖文內文為準）",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=80",
    href: "https://www.threads.com/@yfl_victor/post/DWBVWeXFDnd?hl=zh-hk",
  },
  {
    id: "info-threads-lovestoryhk",
    category: "Blog",
    headline: "Threads｜@lovestoryhk",
    tagline: "拍拖打卡・約會路線精選",
    image: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1200&auto=format&fit=crop&q=80",
    href: "https://www.threads.com/@lovestoryhk/post/DPyD9PIEnn2?hl=zh-hk",
  },
  {
    id: "info-lp-pak-sing-hall",
    category: "旅遊景點",
    headline: "百年卜公祠",
    tagline: "上環太平山街｜Lonely Planet",
    image:
      "https://lp-cms-production.imgix.net/2023-03/shutterstockRF_369907814.jpg?auto=format%2Ccompress&q=80&w=1200&h=1800&fit=crop",
    href: "https://www.lonelyplanet.com/points-of-interest/pak-sing-ancestral-hall/1489383",
  },
  {
    id: "info-lp-maritime-museum",
    category: "旅遊景點",
    headline: "香港海事博物館",
    tagline: "中環八號碼頭｜Lonely Planet",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&auto=format&fit=crop&q=80",
    href: "https://www.lonelyplanet.com/points-of-interest/hong-kong-maritime-museum/1489158",
  },
  {
    id: "info-yahoo-korea-tips",
    category: "Blog",
    headline: "韓遊10大須知",
    tagline: "Yahoo旅遊｜入境·禁藥·暖包",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80",
    href: "https://hk.news.yahoo.com/%E9%9F%93%E5%9C%8B%E6%97%85%E9%81%8A-10%E5%80%8B-%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85-144238021.html",
  },
  {
    id: "info-yahoo-seoul-solo",
    category: "Blog",
    headline: "首爾獨遊攻略",
    tagline: "Yahoo旅遊｜景點·燒肉·優惠",
    image: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=1200&auto=format&fit=crop&q=80",
    href: "https://hk.news.yahoo.com/%E9%A6%96%E7%88%BE%E7%8D%A8%E9%81%8A-2026-%E6%94%BB%E7%95%A5-8-%E5%A4%A7%E5%BF%85%E5%8E%BB%E6%99%AF%E9%BB%9E-060100924.html",
  },
  {
    id: "info-commtours-compare-tours",
    category: "行程",
    headline: "旅行團比較",
    tagline: "CommTours｜多社同屏列陣",
    image: "https://www.tichk.org/sites/default/files/2021-06/home_img_HongKong_Harbour.png",
    href: "/tours",
  },
  {
    id: "info-commtours-agency-reviews",
    category: "旅行社",
    headline: "旅行社評分",
    tagline: "CommTours｜用家評論集中睇",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80",
    href: "/reviews/agencies",
  },
];

const ROTATE_MS = 4000;

function InfoCardTile({ card, dense = false }: { card: InfoCard; dense?: boolean }) {
  const external = isExternalHref(card.href);
  const aria = external
    ? `${card.headline}，${card.tagline}（${card.category}，外部網站，於新分頁開啟）`
    : `${card.headline}，${card.tagline}（${card.category}）`;

  const inner = (
    <>
      <Image
        src={card.image}
        alt=""
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes={dense ? "(max-width: 767px) 18vw, 16vw" : "(max-width: 767px) 25vw, 25vw"}
      />
      <div
        className={
          dense
            ? "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
            : "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/78 via-black/20 to-transparent"
        }
      />
      <div
        className={
          dense
            ? "absolute inset-x-0 bottom-0 p-1.5 pt-7 md:p-2 md:pt-9"
            : "absolute inset-x-0 bottom-0 p-2.5 pt-10 md:p-3 md:pt-12"
        }
      >
        <p
          className={
            dense
              ? "line-clamp-2 text-[11px] font-bold leading-tight tracking-tight text-white drop-shadow md:text-[12px]"
              : "text-[15.5px] font-bold leading-tight tracking-tight text-white drop-shadow md:text-[17.5px]"
          }
        >
          {card.headline}
        </p>
        <p
          className={
            dense
              ? "mt-0.5 line-clamp-2 text-[9px] font-normal leading-snug text-white/88 md:text-[10px]"
              : "mt-0.5 text-[11px] font-normal leading-snug text-white/90 md:text-[13px]"
          }
        >
          {card.tagline}
        </p>
      </div>
    </>
  );

  const cardClassName = dense
    ? "group relative mx-auto block aspect-square min-h-0 w-[88%] overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-black/10 transition-[transform,box-shadow] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:ring-white/10"
    : "group relative mx-auto block aspect-square min-h-0 w-[88%] overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-black/10 transition-[transform,box-shadow] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:ring-white/10";

  if (external) {
    return (
      <a
        href={card.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClassName}
        aria-label={aria}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={card.href} prefetch={false} className={cardClassName} aria-label={aria}>
      {inner}
    </Link>
  );
}

export function HomeMarketingSections({
  betweenBannerAndInfo,
}: {
  /** 插入於首頁橫幅與「旅遊資訊」之間（例如熱門行程橫列） */
  betweenBannerAndInfo?: ReactNode;
} = {}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [infoPage, setInfoPage] = useState(0);
  const infoScrollRef = useRef<HTMLDivElement>(null);
  const totalSlides = AD_SLIDES.length;

  const infoTotalPages = Math.ceil(INFO_CARDS.length / INFO_PAGE_SIZE);
  const visibleInfoCards = useMemo(() => {
    const start = infoPage * INFO_PAGE_SIZE;
    return INFO_CARDS.slice(start, start + INFO_PAGE_SIZE);
  }, [infoPage]);

  const goInfoPage = useCallback(
    (next: number) => {
      const p = Math.max(0, Math.min(infoTotalPages - 1, next));
      setInfoPage(p);
      const el = infoScrollRef.current;
      if (el && typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
        el.scrollTo({ left: p * el.clientWidth, behavior: "smooth" });
      }
    },
    [infoTotalPages],
  );

  const onInfoScroll = useCallback(() => {
    const el = infoScrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const p = Math.round(el.scrollLeft / el.clientWidth);
    if (p >= 0 && p < infoTotalPages) {
      setInfoPage((prev) => (prev !== p ? p : prev));
    }
  }, [infoTotalPages]);

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [totalSlides]);

  const translate = useMemo(() => `translateX(-${activeIndex * 100}%)`, [activeIndex]);

  return (
    <section className="container px-4 pt-5 md:pt-7">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: translate }}
          aria-label="首頁廣告輪播"
        >
          {AD_SLIDES.map((slide) => (
            <Link
              key={slide.id}
              href={slide.href}
              className="relative block h-[148px] min-w-full bg-zinc-800 sm:h-[168px] md:h-[200px]"
              prefetch={false}
              aria-label={
                slide.subtitle ? `${slide.title}。${slide.subtitle}` : slide.title
              }
            >
              {/* 背景圖為裝飾；alt 留空避免破圖時重複顯示主標文字 */}
              <Image src={slide.image} alt="" fill className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/48 via-black/18 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex max-w-[min(100%,34rem)] flex-col justify-center gap-2.5 px-6 py-5 text-white sm:max-w-[min(100%,38rem)] md:gap-3 md:px-10 md:py-6">
                <p className="text-[11px] font-medium tracking-wide text-white/55">CommTours</p>
                <p className="text-[1.05rem] font-semibold leading-snug tracking-tight drop-shadow-sm sm:text-lg md:text-2xl md:leading-tight">
                  {slide.title}
                </p>
                {slide.subtitle ? (
                  <p className="line-clamp-3 text-[13px] font-normal leading-[1.55] text-white/78 drop-shadow-sm sm:text-sm md:line-clamp-none md:text-[0.95rem] md:leading-relaxed">
                    {slide.subtitle}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-2 flex justify-center gap-1.5">
        {AD_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 rounded-full transition-all ${activeIndex === index ? "w-6 bg-primary" : "w-2.5 bg-muted-foreground/30"}`}
            aria-label={`切換到廣告 ${index + 1}`}
          />
        ))}
      </div>

      {betweenBannerAndInfo ? <div className="mt-7">{betweenBannerAndInfo}</div> : null}

      <div className="mt-7">
        <h2 className="mb-4 text-xl font-semibold md:text-2xl">旅遊資訊</h2>
        <div className="relative">
          {/* 手機：每頁 6 欄橫滑；最後一頁唔加寬，每張仍占 1 欄（同第 1 頁卡寬） */}
          <div
            ref={infoScrollRef}
            onScroll={onInfoScroll}
            className="flex snap-x snap-mandatory overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:hidden"
          >
            {Array.from({ length: infoTotalPages }, (_, pageIdx) => {
              const pageCards = INFO_CARDS.slice(
                pageIdx * INFO_PAGE_SIZE,
                pageIdx * INFO_PAGE_SIZE + INFO_PAGE_SIZE,
              );
              const n = pageCards.length;
              const spanClass =
                n === 1 ? "col-span-1 justify-self-center [grid-column:3/4]"
                  : n === 3 ? "col-span-2"
                  : "";

              return (
                <div
                  key={`info-page-${pageIdx}`}
                  className="grid w-full min-w-full shrink-0 grid-cols-6 gap-1.5 snap-start snap-always sm:gap-2"
                >
                  {pageCards.map((card) => (
                    <div key={card.id} className={cn("min-w-0", spanClass)}>
                      <InfoCardTile card={card} dense />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="hidden grid-cols-6 gap-2 md:grid md:gap-3">
            {visibleInfoCards.map((card) => (
              <div
                key={card.id}
                className={cn(
                  "min-w-0",
                  visibleInfoCards.length === 1
                    ? "col-span-1 justify-self-center [grid-column:3/4]"
                    : visibleInfoCards.length === 3
                      ? "col-span-2"
                      : "",
                )}
              >
                <InfoCardTile card={card} dense />
              </div>
            ))}
          </div>
          {infoTotalPages > 1 ? (
            <>
              <button
                type="button"
                disabled={infoPage <= 0}
                onClick={() => goInfoPage(infoPage - 1)}
                tabIndex={infoPage <= 0 ? -1 : 0}
                className="absolute left-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-background text-muted-foreground shadow-md transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-0 md:left-0 md:-translate-x-1/2"
                aria-label="旅遊資訊：上一組"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                disabled={infoPage >= infoTotalPages - 1}
                onClick={() => goInfoPage(infoPage + 1)}
                tabIndex={infoPage >= infoTotalPages - 1 ? -1 : 0}
                className="absolute right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-background text-muted-foreground shadow-md transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-0 md:right-0 md:translate-x-1/2"
                aria-label="旅遊資訊：下一組"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
