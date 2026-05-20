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
    title: "前外遊領隊為你整理",
    subtitle:
      "放飯睇兩眼或者放工後同屋企人夾行程都得。行程資料、團費同重點集中喺同一畫面，唔使再靠一堆截圖同群組轉發慢慢對。",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&auto=format&fit=crop&q=80",
    href: "/about",
  },
  {
    id: "ad-commtours-vision",
    title: "細節、行程一次過睇哂",
    subtitle:
      "出發日期、住宿、購物點、團費、服務費……各項資料左右對齊。邊份行程最配合大家需要，一次過比較。",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&auto=format&fit=crop&q=80",
    href: "/about",
  },
  {
    id: "ad-commtours-compare",
    title: "一個畫面盡覽多間旅行社行程",
    subtitle:
      "揀好目的地同出發日，各旅行社旅行團同報價一次過睇哂。唔使自己開十幾個分頁，亦唔使手抄價錢再慢慢對，慳返時間慢慢揀。",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80",
    href: "/tours",
  },
];

/** 旅遊資訊每頁格數（Klook 式一排 6 張；最後一頁不足則用 col-span 補齊） */
const INFO_PAGE_SIZE = 6;

/** 深度／微旅主題外部精選（圖為主題示意，著作權屬攝影師；連結以外站正文為準） */
const INFO_CARDS: InfoCard[] = [
  {
    id: "info-mr-angkor",
    category: "Blog",
    headline: "吳哥窟深度旅遊日記",
    tagline: "Mr.Angkor｜小圈大圈外圈・簽證・暹粒日常",
    image:
      "https://images.unsplash.com/photo-1553603227-2358aabe821e?w=1200&auto=format&fit=crop&q=80",
    href: "https://www.mr-angkor.com/",
  },
  {
    id: "info-matcha-kyoto",
    category: "旅遊景點",
    headline: "嚴選京都景點 22 選",
    tagline: "MATCHA｜初訪・深度・近郊・美食祭典",
    image:
      "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=1200&auto=format&fit=crop&q=80",
    href: "https://matcha-jp.com/tw/3092",
  },
  {
    id: "info-aurora-spain",
    category: "Blog",
    headline: "西班牙深度旅遊規劃",
    tagline: "吉光旅遊｜歷史藝術・慢遊・在地體驗",
    image:
      "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1200&auto=format&fit=crop&q=80",
    href: "https://www.auroratour.com.tw/blog/articles/spain-depth-tours",
  },
  {
    id: "info-wanderlust-tokyo",
    category: "Blog",
    headline: "2026 東京自由行攻略",
    tagline: "Wanderlust Annie｜深度・美學・下町散步",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&auto=format&fit=crop&q=80",
    href: "https://wanderlustannie.com.tw/tokyo/",
  },
  {
    id: "info-letsgo-kyoto-depth",
    category: "旅遊景點",
    headline: "京都深度旅遊攻略",
    tagline: "樂吃購！日本｜私房景點・冷門寺社・建築",
    image:
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&auto=format&fit=crop&q=80",
    href: "https://osaka.letsgojp.com/archives/734038/",
  },
  {
    id: "info-klook-osaka-suburbs",
    category: "旅遊景點",
    headline: "大阪近郊深度景點",
    tagline: "Klook 旅遊部落格｜一日遊與小鎮提案",
    image:
      "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&auto=format&fit=crop&q=80",
    href: "https://www.klook.com/zh-HK/blog/%E5%A4%A7%E9%98%AA%E8%BF%91%E9%83%8A%E6%99%AF%E9%BB%9E-%E6%B7%B1%E5%BA%A6%E6%97%85%E9%81%8A-%E6%8E%A8%E4%BB%8B/",
  },
  {
    id: "info-stevemadden-eu-us",
    category: "Blog",
    headline: "歐美深度景點懶人包",
    tagline: "Steve Madden TW｜紐約・巴黎・東京・峇里",
    image:
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1200&auto=format&fit=crop&q=80",
    href: "https://stevemadden.com.tw/pages/%E6%AD%90%E7%BE%8E%E8%87%AA%E7%94%B1%E8%A1%8C%E6%94%BB%E7%95%A5-2025%E6%B7%B1%E5%BA%A6%E6%97%85%E9%81%8A%E6%99%AF%E9%BB%9E%E6%87%B6%E4%BA%BA%E5%8C%85-%E9%AB%98cp%E5%80%BC%E9%A3%AF%E5%BA%97%E6%8E%A8%E8%96%A6",
  },
  {
    id: "info-jnto-tohoku-micro",
    category: "Blog",
    headline: "東北「深度微旅」",
    tagline: "JNTO｜岩手・宮城・三陸海岸・Mini Tour",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
    href: "https://www.japan.travel/tw/tw/blog/92iwate_miyagi/",
  },
  {
    id: "info-tmtravel-bali",
    category: "旅遊景點",
    headline: "峇里島深度文化之旅",
    tagline: "鈦美旅遊｜信仰・中部北部・藍夢島",
    image:
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&auto=format&fit=crop&q=80",
    href: "https://blog.tmtravel.com.tw/travel-in-bali/",
  },
  {
    id: "info-lillian-france",
    category: "Blog",
    headline: "2026 法國自由行全攻略",
    tagline: "嗯嗯莉莉嗯｜景點・交通・心理準備",
    image:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&auto=format&fit=crop&q=80",
    href: "https://lillian.tw/france/",
  },
];

const ROTATE_MS = 6000;

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
        sizes={dense ? "16vw" : "(max-width: 767px) 46vw, 25vw"}
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
    : "group relative block aspect-square min-h-0 w-full overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-black/10 transition-[transform,box-shadow] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:ring-white/10";

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
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/5" />
              <div className="absolute inset-y-0 left-0 flex max-w-[min(100%,34rem)] flex-col justify-center gap-2 px-6 py-5 text-white sm:max-w-[min(100%,38rem)] md:gap-2.5 md:px-10 md:py-6">
                <p className="text-xs font-normal text-white/70">CommTours</p>
                <p className="text-lg font-bold leading-[1.4] tracking-normal sm:text-xl md:text-[1.65rem] md:leading-[1.35]">
                  {slide.title}
                </p>
                {slide.subtitle ? (
                  <p className="line-clamp-3 text-[13px] font-normal leading-[1.65] text-white/92 sm:text-[14px] md:line-clamp-none md:text-[15px] md:leading-[1.7]">
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
          {/* 手機：2 欄 × 3 列（每頁 6 張），橫向換頁；卡片約半屏寬 */}
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
              const spanClass = n === 1 ? "col-span-2 flex justify-center" : "";

              return (
                <div
                  key={`info-page-${pageIdx}`}
                  className="grid w-full min-w-full shrink-0 grid-cols-2 gap-2.5 snap-start snap-always"
                >
                  {pageCards.map((card) => (
                    <div
                      key={card.id}
                      className={cn(
                        "min-w-0",
                        spanClass,
                        n === 1 ? "[&_a]:max-w-[11.5rem] [&_a]:w-full" : "",
                      )}
                    >
                      <InfoCardTile card={card} />
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
