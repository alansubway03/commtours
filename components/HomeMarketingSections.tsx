"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdSlide = {
  id: string;
  title: string;
  /** 橫幅副標，一句話補充主標 */
  subtitle?: string;
  image: string;
  href: string;
};

/** 首頁「旅遊資訊」精選：編輯可改標題、短介、連結（支援 https 外部網站）與圖片 */
type InfoCategory = "Blog" | "行程" | "旅行社" | "旅遊景點";

type InfoCard = {
  id: string;
  category: InfoCategory;
  title: string;
  description: string;
  image: string;
  href: string;
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

const AD_SLIDES: AdSlide[] = [
  {
    id: "ad-commtours-launch",
    title: "CommTours 成功成立",
    subtitle: "100% 香港創立的旅遊資訊比較平台，與你同行每一步。",
    image:
      "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=1600&auto=format&fit=crop&q=80",
    href: "/about",
  },
  {
    id: "ad-commtours-vision",
    title: "CommTours 理念",
    subtitle: "Compare．Tours．Communication — 連結世界，比較精彩。",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&auto=format&fit=crop&q=80",
    href: "/about",
  },
  {
    id: "ad-commtours-compare",
    title: "整合香港旅行團，單一平台比較",
    subtitle: "雲集各大旅行社行程與價格，一個平台看清細節，慳時間、揀得明。",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&auto=format&fit=crop&q=80",
    href: "/tours",
  },
];

/** 旅遊資訊每頁顯示格數（與 lg:grid-cols-4 一致；多於此數則以箭咀分頁） */
const INFO_PAGE_SIZE = 4;

const INFO_CARDS: InfoCard[] = [
  {
    id: "info-blog-timeout",
    category: "Blog",
    title: "Time Out Hong Kong：本地玩樂與展覽",
    description: "國際生活媒體的香港版，更新餐廳、展覽與週末好去處。",
    image: "https://media.timeout.com/images/105824844/750/562/image.jpg",
    href: "https://www.timeout.com/hong-kong",
  },
  {
    id: "info-blog-lonelyplanet-hk",
    category: "Blog",
    title: "Lonely Planet：香港城市指南",
    description: "著名旅遊指南出版社整理的地道景點、交通與預算建議。",
    image:
      "https://lp-cms-production.imgix.net/2023-03/shutterstockRF_369907814.jpg?auto=format%2Ccompress&q=72&w=900&h=600&fit=crop&crop=faces%2Cedges",
    href: "https://www.lonelyplanet.com/china/hong-kong",
  },
  {
    id: "info-tour-commtours",
    category: "行程",
    title: "CommTours：香港出發旅行團比較",
    description: "在本站一次瀏覽多間旅行社的出發日、價格與行程重點。",
    image: "https://www.tichk.org/sites/default/files/2021-06/home_img_HongKong_Harbour.png",
    href: "/tours",
  },
  {
    id: "info-tour-japan",
    category: "行程",
    title: "日本國家旅遊局：官方行程靈感",
    description: "JNTO 提供地區、季節與主題路線，計劃日本自由行或跟團前必讀。",
    image:
      "https://res-4.cloudinary.com/jnto/image/upload/w_900,h_600,c_fill,f_auto,q_auto/v1/media/filer_public/38/b2/38b2fbbe-ea2c-4745-9367-b9839aa27112/img_sakura_key-image_gyla07.jpg",
    href: "https://www.japan.travel/zh-tw/",
  },
  {
    id: "info-agency-reviews",
    category: "旅行社",
    title: "CommTours：旅行社評分與評論",
    description: "集中查看各旅行社背景、特色與用家真實評價。",
    image: "https://eng.taiwan.net.tw/att/menu/0002019.jpg",
    href: "/reviews/agencies",
  },
  {
    id: "info-agency-tic",
    category: "旅行社",
    title: "旅議會 TIC：外遊與業界資訊",
    description: "香港旅遊業議會網站，提供業界守則、消費者提示與相關公告。",
    image: "https://eng.taiwan.net.tw/att/menu/0002001.jpg",
    href: "https://www.tichk.org/",
  },
  {
    id: "info-dest-australia",
    category: "旅遊景點",
    title: "澳洲旅遊局：目的地與節慶",
    description: "Tourism Australia 官方中文版，涵蓋城市、自然景觀與最新活動。",
    image: "https://www.australia.com/content/dam/digital/australia-com/images/136309-56.jpg",
    href: "https://www.australia.com/zh-hk",
  },
  {
    id: "info-dest-taiwan",
    category: "旅遊景點",
    title: "台灣觀光：交通部觀光署官方網站",
    description: "台灣觀光入口網，主題行程、節慶與各地玩樂懶人包。",
    image: "https://www.taiwan.net.tw/images/ogimg.jpg",
    href: "https://www.taiwan.net.tw/",
  },
];

const ROTATE_MS = 4000;

export function HomeMarketingSections() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [infoPage, setInfoPage] = useState(0);
  const totalSlides = AD_SLIDES.length;

  const infoTotalPages = Math.ceil(INFO_CARDS.length / INFO_PAGE_SIZE);
  const visibleInfoCards = useMemo(() => {
    const start = infoPage * INFO_PAGE_SIZE;
    return INFO_CARDS.slice(start, start + INFO_PAGE_SIZE);
  }, [infoPage]);

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
              className="relative block h-[130px] min-w-full bg-zinc-800 sm:h-[150px] md:h-[180px]"
              prefetch={false}
              aria-label={
                slide.subtitle ? `${slide.title}。${slide.subtitle}` : slide.title
              }
            >
              {/* 背景圖為裝飾；alt 留空避免破圖時重複顯示主標文字 */}
              <Image src={slide.image} alt="" fill className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/40" />
              <div className="absolute inset-y-0 left-0 flex max-w-[min(100%,42rem)] flex-col justify-center gap-1.5 px-5 py-4 text-white md:px-8">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">CommTours</p>
                <p className="text-lg font-semibold leading-snug drop-shadow-md md:text-2xl">{slide.title}</p>
                {slide.subtitle ? (
                  <p className="line-clamp-2 text-sm leading-relaxed text-white/90 drop-shadow-sm md:line-clamp-none md:text-base">
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

      <div className="mt-7">
        <h2 className="mb-4 text-xl font-semibold md:text-2xl">旅遊資訊</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleInfoCards.map((card) => {
            const external = isExternalHref(card.href);
            const cardClassName =
              "group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
            const body = (
              <>
                <div className="relative h-36 w-full">
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
                <div className="space-y-1.5 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{card.category}</p>
                  <h3 className="text-sm font-semibold leading-snug md:text-base">{card.title}</h3>
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground md:text-sm">
                    {card.description}
                  </p>
                  {external ? (
                    <p className="text-[10px] text-muted-foreground">外部連結 · 新分頁開啟</p>
                  ) : null}
                </div>
              </>
            );
            if (external) {
              return (
                <a
                  key={card.id}
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClassName}
                  aria-label={`${card.title}（${card.category}，外部網站，於新分頁開啟）`}
                >
                  {body}
                </a>
              );
            }
            return (
              <Link key={card.id} href={card.href} prefetch={false} className={cardClassName} aria-label={`${card.title}（${card.category}）`}>
                {body}
              </Link>
            );
          })}
        </div>
        {infoTotalPages > 1 ? (
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={infoPage <= 0}
              onClick={() => setInfoPage((p) => Math.max(0, p - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              aria-label="上一頁"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              disabled={infoPage >= infoTotalPages - 1}
              onClick={() => setInfoPage((p) => Math.min(infoTotalPages - 1, p + 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              aria-label="下一頁"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
