import { getTours } from "@/lib/data/tours";
import { HomeTourSections } from "@/components/HomeTourSections";

export default async function HomePage() {
  const tours = await getTours();

  return (
    <div>
      {/* Hero */}
      <section
        className="relative flex min-h-[380px] flex-col items-center justify-center gap-5 px-4 py-14 text-center text-white md:min-h-[420px]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1526779259212-939e64788e3c?w=1920)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1 className="max-w-3xl text-3xl font-bold leading-tight drop-shadow-md sm:text-4xl md:text-5xl">
          連結世界，比較精彩
        </h1>
        <p className="max-w-2xl text-base text-white/95 drop-shadow sm:text-lg md:text-xl">
          集中比較各大小旅行社長線及特色團，幫你用最少時間選到最合適
        </p>
      </section>

      {/* 類型分頁：熱門行程 + 各類型旅行團 */}
      <HomeTourSections tours={tours} />
    </div>
  );
}
