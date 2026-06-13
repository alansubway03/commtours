import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "關於我們",
  description:
    "CommTours 由具前線經驗的團隊主理，為香港旅客整理多間旅行社的行程與條款，方便並排比較，減少資訊落差。",
  openGraph: {
    title: "關於我們 | CommTours",
    description:
      "中立旅遊比較平台：把住宿、膳食、自費節目與條款等資料整理成同一套檢視方式，方便香港旅客自行判斷。",
  },
};

export default function AboutPage() {
  return (
    <div className="container px-4 py-10 md:py-16">
      <header className="mx-auto max-w-3xl text-center">
        <Image
          src="/logo.png?v=20260613"
          alt="CommTours"
          width={1024}
          height={1024}
          className="mx-auto mb-6 h-40 w-40 object-contain drop-shadow-sm md:h-44 md:w-44"
          sizes="(min-width: 768px) 176px, 160px"
          unoptimized
        />
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">關於我們</h1>
        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          連結世界，比較精彩
        </p>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          CommTours 由具多年外遊領隊經驗的團隊主理，是香港人的中立旅遊比較平台：把各社行程資料集中、用同一個方式呈現，方便大家自行對照各細節，再決定是否向旅行社查詢或報名。
        </p>
      </header>

      <article className="mx-auto mt-12 max-w-2xl space-y-12 text-muted-foreground">
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">創辦初心</h2>
          <h3 className="mb-3 text-lg font-medium text-foreground/95">
            從領隊前線經驗出發，收窄宣傳與實際之間的落差
          </h3>
          <p className="leading-relaxed">
            團隊成員曾長期以領隊身份跟團出發，處理過港人對行程、膳食、交通與自費節目的實際查詢；亦見過旅客在報名前，要花大量時間翻閱不同單張與網頁，仍難以判斷兩個「看似相近」的團在住宿級別、膳食次數、購物或小費等等上，究竟有何分別。
          </p>
          <p className="mt-4 leading-relaxed">
            市場上選擇多，但資訊分散、表述方式不一，比較成本往往落在旅客身上。CommTours 希望把這類功課變得有系統：以同一版面整理重點，讓大家用較短時間掌握差異，再按個人需要向旅行社跟進。
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">核心價值</h2>
          <h3 className="mb-3 text-lg font-medium text-foreground/95">
            比較平台：整理各旅行社的旅行團
          </h3>
          <p className="leading-relaxed">
            CommTours 的定位很單純——並排呈現各旅行社行程頁上已列出的內容，方便大家對照出發日、目的地、日數、價錢等等資料。
          </p>
          <p className="mt-4 leading-relaxed">
            CommTours 獨立於各間旅行社；展示與排序以可核對的行程資料為依歸，方便大家自行判斷合適與否。
          </p>
        </section>

        <section className="rounded-xl border border-border bg-muted/30 p-6 md:p-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">願景</h2>
          <p className="leading-relaxed">
            CommTours 致力增加業界透明度，發掘更多優質旅行團。
          </p>
          <p className="mt-4 leading-relaxed">
            我們希望 CommTours 成為整理旅行團資訊時的好幫手：先在這裏比較各旅行團的差異，搵出心水後，再直接向旅行社深入了解及報名。
          </p>
        </section>
      </article>
    </div>
  );
}
