"use client";

import Image from "next/image";
import Link from "next/link";
import { Noto_Serif_TC } from "next/font/google";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** 行程推廣橫幅（旅行社付費廣告版位樣式） */
type TourPromoContent = {
  /** 主題大字，如「雪頓節」 */
  heroTitle: string;
  tagline: string;
  /** 副標高亮字（黃色） */
  taglineAccent: string;
  /** 路線白條文案 */
  route: string;
  tourCode?: string;
  airlines?: string;
  price: string;
  priceSuffix?: string;
  departures?: string;
  /** 右上角小圖（節慶／景點示意） */
  insetImage?: string;
};

/** 主題大字：用繁中完整支援的襯線體，避免書法字體缺字（如「雪」）導致混用字型 */
const tourPromoTitle = Noto_Serif_TC({
  weight: "700",
  display: "swap",
});

type AdSlide = {
  id: string;
  title: string;
  /** 橫幅副標，一句話補充主標 */
  subtitle?: string;
  image: string;
  href: string;
  /** platform = CommTours 自有；partner = 旅行社付費廣告 demo */
  kind?: "platform" | "partner";
  /** 合作方品牌名（partner 付費上線時顯示；demo 可省略） */
  brand?: string;
  /** 行動呼籲按鈕文字（partner 可選） */
  cta?: string;
  /** 旅行社行程推廣版式（參考業界橫幅） */
  tourPromo?: TourPromoContent;
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
  /** 首頁廣告版位 demo：示範旅行社可如何推廣行程路線（不顯示具體公司名） */
  {
    id: "ad-partner-demo",
    kind: "partner",
    title: "雪頓節西藏11天之旅",
    subtitle: "一年一度盛大珍貴藏族節慶",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?w=1600&auto=format&fit=crop&q=80&sat=-20",
    href: "/tours",
    tourPromo: {
      heroTitle: "雪頓節",
      tagline: "一年一度盛大",
      taglineAccent: "珍貴藏族節慶",
      route: "西藏 前藏、林芝、後藏、定日、體驗青藏鐵路11天之旅",
      tourCode: "DEMO11UT",
      price: "28,999",
      priceSuffix: "起",
      departures: "限定出發 8月4, 8, 9日",
    },
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

/** 首頁廣告橫幅高度（約為舊版 2 倍，減少過於修長的比例） */
const BANNER_HEIGHT_CLASS = "h-[296px] sm:h-[336px] md:h-[400px]";
/** 桌面版輪播：中間橫幅闊度比例，左右露出相鄰橫幅（參考 HKTVmall） */
const BANNER_PEEK_BASIS = 0.94;
const BANNER_PEEK_GAP_PX = 16;
const BANNER_MD_MQ = "(min-width: 768px)";

const TOUR_PROMO_BLUE = "#1a3d7c";

function PartnerTourBanner({
  slide,
  promo,
  priority = false,
}: {
  slide: AdSlide;
  promo: TourPromoContent;
  priority?: boolean;
}) {
  return (
    <>
      <Image
        src={slide.image}
        alt=""
        fill
        className="object-cover object-center"
        sizes="100vw"
        {...(priority ? { priority: true } : { loading: "eager" })}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

      <span className="absolute right-4 top-4 z-10 rounded border border-white/40 bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white sm:right-5 sm:top-5 sm:text-xs">
        廣告
      </span>

      <div className="absolute inset-0 flex items-center justify-between gap-4 px-5 py-4 sm:gap-5 sm:px-8 sm:py-5 md:px-10 md:py-6">
        <div className="min-w-0 max-w-[58%] space-y-2 sm:max-w-[52%] sm:space-y-2.5">
          <p className="text-xs font-semibold leading-snug text-white drop-shadow-md sm:text-sm md:text-base">
            {promo.tagline}
            <span className="text-yellow-300">{promo.taglineAccent}</span>
          </p>
          <div className="rounded-sm bg-white px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2">
            <p
              className="line-clamp-2 text-[10px] font-semibold leading-snug sm:text-[11px] md:text-xs"
              style={{ color: TOUR_PROMO_BLUE }}
            >
              {promo.route}
            </p>
          </div>
          {promo.tourCode ? (
            <p className="text-[10px] font-medium tracking-wide text-white/90 sm:text-xs">
              {promo.tourCode}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-2 sm:gap-2.5">
          <div className="rounded border border-white/50 bg-black/25 px-2.5 py-1 backdrop-blur-sm sm:px-3 sm:py-1.5">
            <p
              className={cn(
                tourPromoTitle.className,
                "text-2xl leading-none text-white drop-shadow-md sm:text-3xl md:text-4xl",
              )}
            >
              {promo.heroTitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 rounded-md bg-white/95 px-2.5 py-1.5 shadow-md sm:gap-2.5 sm:px-3 sm:py-2">
            <div className="flex items-baseline gap-px whitespace-nowrap">
              <span className="text-base font-bold sm:text-lg" style={{ color: TOUR_PROMO_BLUE }}>
                $
              </span>
              <span
                className="text-xl font-black leading-none sm:text-2xl md:text-3xl"
                style={{ color: TOUR_PROMO_BLUE }}
              >
                {promo.price}
              </span>
              {promo.priceSuffix ? (
                <span className="text-xs font-bold sm:text-sm" style={{ color: TOUR_PROMO_BLUE }}>
                  {promo.priceSuffix}
                </span>
              ) : null}
            </div>
            {promo.departures ? (
              <div
                className="rounded-full px-2.5 py-0.5 text-[9px] font-semibold leading-tight text-white sm:text-[10px] md:text-xs"
                style={{ backgroundColor: TOUR_PROMO_BLUE }}
              >
                {promo.departures}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

function BannerSlide({ slide, priority = false }: { slide: AdSlide; priority?: boolean }) {
  const isPartner = slide.kind === "partner";
  const isTourPromo = isPartner && slide.tourPromo;
  const external = isExternalHref(slide.href);
  const aria = slide.subtitle ? `${slide.title}。${slide.subtitle}` : slide.title;
  const slideClassName = cn("relative block w-full bg-zinc-800", BANNER_HEIGHT_CLASS);

  const inner = isTourPromo ? (
    <PartnerTourBanner slide={slide} promo={slide.tourPromo!} priority={priority} />
  ) : (
    <>
      <Image
        src={slide.image}
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        {...(priority ? { priority: true } : { loading: "eager" })}
      />
      <div
        className={
          isPartner
            ? "absolute inset-0 bg-gradient-to-r from-[#1a2b50]/85 via-[#1a2b50]/45 to-black/10"
            : "absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/5"
        }
      />
      {isPartner ? (
        <span className="absolute right-4 top-4 rounded-md border border-white/25 bg-black/35 px-2 py-0.5 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-sm sm:right-5 sm:top-5 md:right-8 md:top-6 md:text-xs">
          廣告
        </span>
      ) : null}
      <div className="absolute inset-y-0 left-0 flex max-w-[min(100%,40rem)] flex-col justify-center gap-3 px-6 py-6 text-white sm:max-w-[min(100%,44rem)] md:gap-3.5 md:px-12 md:py-8">
        {!isPartner || slide.brand ? (
          <p className="text-sm font-normal text-white/70">{isPartner ? slide.brand : "CommTours"}</p>
        ) : null}
        <p className="text-xl font-bold leading-[1.35] tracking-normal sm:text-2xl md:text-3xl md:leading-[1.3]">
          {slide.title}
        </p>
        {slide.subtitle ? (
          <p className="line-clamp-4 text-sm font-normal leading-[1.65] text-white/92 sm:text-base md:line-clamp-none md:text-lg md:leading-[1.7]">
            {slide.subtitle}
          </p>
        ) : null}
        {isPartner && slide.cta ? (
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-semibold text-[#1a2b50] shadow-sm sm:text-base md:mt-1.5 md:px-4 md:py-2">
            {slide.cta}
            <span aria-hidden className="ml-1">
              →
            </span>
          </span>
        ) : null}
      </div>
    </>
  );

  if (external) {
    return (
      <a
        href={slide.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={slideClassName}
        aria-label={`${aria}（廣告，外部網站，於新分頁開啟）`}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={slide.href} prefetch={false} className={slideClassName} aria-label={aria}>
      {inner}
    </Link>
  );
}

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
  const bannerViewportRef = useRef<HTMLDivElement>(null);
  const [bannerMetrics, setBannerMetrics] = useState({ offset: 0, step: 0 });
  const totalSlides = AD_SLIDES.length;

  const updateBannerMetrics = useCallback(() => {
    const vp = bannerViewportRef.current;
    if (!vp || vp.clientWidth <= 0) return;
    const w = vp.clientWidth;
    const isMd =
      typeof window !== "undefined" && window.matchMedia(BANNER_MD_MQ).matches;
    if (!isMd) {
      setBannerMetrics({ offset: 0, step: w });
      return;
    }
    const slideW = w * BANNER_PEEK_BASIS;
    setBannerMetrics({
      offset: (w - slideW) / 2,
      step: slideW + BANNER_PEEK_GAP_PX,
    });
  }, []);

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

  useEffect(() => {
    updateBannerMetrics();
    const vp = bannerViewportRef.current;
    if (!vp) return;
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateBannerMetrics) : null;
    ro?.observe(vp);
    window.addEventListener("resize", updateBannerMetrics);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateBannerMetrics);
    };
  }, [updateBannerMetrics]);

  const bannerTransform = useMemo(() => {
    if (bannerMetrics.step <= 0) return "translateX(0)";
    return `translateX(calc(${bannerMetrics.offset}px - ${activeIndex * bannerMetrics.step}px))`;
  }, [activeIndex, bannerMetrics.offset, bannerMetrics.step]);

  return (
    <section className="container px-4 pt-5 md:pt-7">
      <div ref={bannerViewportRef} className="w-full overflow-hidden">
        <div
          className="flex gap-0 transition-transform duration-700 ease-in-out md:gap-4"
          style={{ transform: bannerTransform }}
          aria-label="首頁廣告輪播"
        >
          {AD_SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className="w-full shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:w-[94%]"
            >
              <BannerSlide slide={slide} priority={index === 0} />
            </div>
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
