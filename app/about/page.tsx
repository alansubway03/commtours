import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "關於我們",
  description:
    "CommTours 的誕生，源於 Compare、Tours 與 Communication。100% 香港血統的旅遊資訊比較平台，讓旅行團變得分明。",
  openGraph: {
    title: "關於我們 | CommTours",
    description:
      "100% 香港人創立的旅遊資訊比較平台，從領隊視角出發，打破隔閡，讓旅行團變得分明。",
  },
};

export default function AboutPage() {
  return (
    <div className="container px-4 py-10 md:py-16">
      <header className="mx-auto max-w-3xl text-center">
        <Image
          src="/logo-brand.png"
          alt="CommTours"
          width={1024}
          height={1024}
          className="mx-auto mb-6 h-40 w-40 object-contain drop-shadow-sm md:h-44 md:w-44"
          sizes="(min-width: 768px) 176px, 160px"
          unoptimized
        />
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          關於 CommTours
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          連結世界，比較精彩
        </p>
      </header>

      <article className="mx-auto mt-12 max-w-2xl space-y-10 text-muted-foreground">
        <section>
          <p className="leading-relaxed">
            CommTours 的誕生，源於一個簡單卻深刻的理念：
            <strong className="text-foreground">Compare（比較）</strong>、
            <strong className="text-foreground">Tours（團體旅遊）</strong>
            與
            <strong className="text-foreground">Communication（溝通）</strong>。
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            100% 香港血統，最懂香港人的旅行家
          </h2>
          <p className="leading-relaxed">
            我們是一間 100% 由香港人創立的旅遊資訊比較平台。我們深知香港人生活節奏快，追求效率之餘，更追求高品質的休閒體驗。
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            從領隊視角出發，看見市場的缺口
          </h2>
          <p className="leading-relaxed">
            CommTour 的創辦團隊前身為活躍於各大旅行社的外遊領隊。我們曾帶領無數港人走遍全球，親身經歷過旅客在挑選團體行程時的掙扎——市面上旅行社眾多，行程琳瑯滿目，但要逐一翻閱手冊、對比細節（如住宿等級、膳食次數或隱藏收費），既費時又費神。
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            打破隔閡，讓旅行團變得分明
          </h2>
          <p className="leading-relaxed">
            我們發現，市場上一直缺乏一個中立且透明的平台來集中比較各間旅行社。因此，我們創立了 CommTour。
          </p>
          <ul className="mt-4 space-y-2">
            <li className="flex gap-2">
              <span className="text-primary font-medium">·</span>
              <span>
                <strong className="text-foreground">精準比較：</strong>
                透過直覺的界面，讓你一鍵對比各大旅行社的行程與價格。
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-medium">·</span>
              <span>
                <strong className="text-foreground">專業溝通：</strong>
                利用我們過去的專業領隊經驗，轉化為簡單易懂的標籤與評分，消除旅客與旅行社之間的資訊不對稱。
              </span>
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-muted/30 p-6">
          <p className="leading-relaxed">
            在 CommTour，我們不只是做比較，更是你的數位旅遊顧問。我們希望每一位香港人，都能在這裡輕鬆找到最適合自己的夢想行程，讓出發旅遊變得前所未有的簡單。
          </p>
        </section>
      </article>
    </div>
  );
}
