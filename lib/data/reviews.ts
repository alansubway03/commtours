import { createServerSupabaseClient } from "@/lib/supabase";

export type TourReviewListItem = {
  id: string;
  itineraryRating: number;
  mealRating: number;
  hotelRating: number;
  guideRating: number;
  willRebook: boolean;
  comment: string;
  extraInfo: string;
  participationProof: string;
  createdAt: string;
  photos: { publicUrl: string }[];
};

export type TourReviewSummary = {
  total: number;
  itineraryAvg: number;
  mealAvg: number;
  hotelAvg: number;
  guideAvg: number;
  overallAvg: number;
  willRebookYesRate: number;
};

type ReviewRow = {
  id: string;
  itinerary_rating: number;
  meal_rating: number;
  hotel_rating: number;
  guide_rating: number;
  will_rebook: boolean;
  comment: string | null;
  extra_info: string | null;
  participation_proof: string | null;
  created_at: string;
  tour_review_photo: { public_url: string }[] | null;
};

export async function getTourReviewSummary(tourId: string): Promise<TourReviewSummary> {
  const numTourId = Number(tourId);
  if (!Number.isFinite(numTourId)) {
    return {
      total: 0,
      itineraryAvg: 0,
      mealAvg: 0,
      hotelAvg: 0,
      guideAvg: 0,
      overallAvg: 0,
      willRebookYesRate: 0,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tour_review")
    .select("itinerary_rating, meal_rating, hotel_rating, guide_rating, will_rebook")
    .eq("tour_id", numTourId);

  if (error || !data || data.length === 0) {
    return {
      total: 0,
      itineraryAvg: 0,
      mealAvg: 0,
      hotelAvg: 0,
      guideAvg: 0,
      overallAvg: 0,
      willRebookYesRate: 0,
    };
  }

  const total = data.length;
  const itineraryAvg = data.reduce((s, x) => s + Number(x.itinerary_rating ?? 0), 0) / total;
  const mealAvg = data.reduce((s, x) => s + Number(x.meal_rating ?? 0), 0) / total;
  const hotelAvg = data.reduce((s, x) => s + Number(x.hotel_rating ?? 0), 0) / total;
  const guideAvg = data.reduce((s, x) => s + Number(x.guide_rating ?? 0), 0) / total;
  const overallAvg = (itineraryAvg + mealAvg + hotelAvg + guideAvg) / 4;
  const yesCount = data.filter((x) => Boolean(x.will_rebook)).length;
  const willRebookYesRate = (yesCount / total) * 100;

  return {
    total,
    itineraryAvg,
    mealAvg,
    hotelAvg,
    guideAvg,
    overallAvg,
    willRebookYesRate,
  };
}

export async function getTourReviews(tourId: string, limit = 20): Promise<TourReviewListItem[]> {
  const numTourId = Number(tourId);
  if (!Number.isFinite(numTourId)) return [];

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tour_review")
    .select(
      "id, itinerary_rating, meal_rating, hotel_rating, guide_rating, will_rebook, comment, extra_info, participation_proof, created_at, tour_review_photo(public_url)"
    )
    .eq("tour_id", numTourId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as ReviewRow[]).map((row) => ({
    id: row.id,
    itineraryRating: Number(row.itinerary_rating ?? 0),
    mealRating: Number(row.meal_rating ?? 0),
    hotelRating: Number(row.hotel_rating ?? 0),
    guideRating: Number(row.guide_rating ?? 0),
    willRebook: Boolean(row.will_rebook),
    comment: row.comment ?? "",
    extraInfo: row.extra_info ?? "",
    participationProof: row.participation_proof ?? "",
    createdAt: row.created_at,
    photos: Array.isArray(row.tour_review_photo)
      ? row.tour_review_photo.map((x) => ({ publicUrl: x.public_url }))
      : [],
  }));
}
