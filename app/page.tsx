import Image from "next/image";
import { getTours } from "@/lib/data/tours";
import { getAgencyScoreMap } from "@/lib/data/reviews";
import { HomeTourSections } from "@/components/HomeTourSections";

export default async function HomePage() {
  const tours = await getTours();
  const agencyScoreMap = await getAgencyScoreMap(tours.map((tour) => String(tour.agency)));

  return (
    <div>
      {/* Hero */}
      <section
        className="relative flex min-h-[380px] flex-col items-center justify-center gap-5 px-4 py-14 text-center text-white md:min-h-[420px]"
      >
        <Image
          src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&auto=format&fit=crop&q=80"
          alt="藍色調旅行地圖與探索主題背景"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-black/60" />
        <h1 className="max-w-3xl text-3xl font-bold leading-tight drop-shadow-md sm:text-4xl md:text-5xl">
          連結世界，比較精彩
        </h1>
        <p className="max-w-2xl text-base text-white/95 drop-shadow sm:text-lg md:text-xl">
          集中比較各大小旅行社長線及特色團，幫你用最少時間選到最合適
        </p>
      </section>

      {/* 類型分頁：熱門行程 + 各類型旅行團 */}
      <HomeTourSections tours={tours} agencyScoreMap={agencyScoreMap} />
    </div>
  );
}
