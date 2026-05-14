import { getTours } from "@/lib/data/tours";
import { getAgencyScoreMap } from "@/lib/data/reviews";
import { HomeMarketingSections } from "@/components/HomeMarketingSections";
import { HomePopularToursRow } from "@/components/HomePopularToursRow";
import { HomeTourSections } from "@/components/HomeTourSections";

export default async function HomePage() {
  const tours = await getTours();
  const agencyScoreMap = await getAgencyScoreMap(tours.map((tour) => String(tour.agency)));

  return (
    <div>
      <HomeMarketingSections
        betweenBannerAndInfo={
          tours.length > 0 ? (
            <HomePopularToursRow tours={tours} agencyScoreMap={agencyScoreMap} />
          ) : undefined
        }
      />

      {/* 類型分頁：各類型旅行團（熱門行程已置於橫幅下方橫列） */}
      <HomeTourSections tours={tours} agencyScoreMap={agencyScoreMap} />
    </div>
  );
}
