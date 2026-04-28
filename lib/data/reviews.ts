import { createServerSupabaseClient } from "@/lib/supabase";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { commentPreview, reviewOverallAverage } from "@/lib/reviewHelpers";
import { toCountryCategory } from "@/lib/reviewTaxonomy";

export type TourReviewListItem = {
  id: string;
  reviewerDisplayName: string;
  itineraryRating: number;
  mealRating: number;
  hotelRating: number;
  guideRating: number;
  valueRating: number;
  willRebook: boolean;
  comment: string;
  extraInfo: string;
  participationProof: string;
  baseFeeHkd: number;
  optionalActivityFeeHkd: number;
  staffServiceFeeHkd: number;
  createdAt: string;
  photos: { publicUrl: string; createdAt: string }[];
};

export type ReviewFeedItem = TourReviewListItem & {
  tourId: number;
  tourTitle: string;
  agency: string;
  destination: string;
  countryCategory: string;
  region: string;
  tourType: string;
};

export type TourReviewSummary = {
  total: number;
  itineraryAvg: number;
  mealAvg: number;
  hotelAvg: number;
  guideAvg: number;
  valueAvg: number;
  overallAvg: number;
  willRebookYesRate: number;
};

export type AgencyReviewSummary = {
  total: number;
  overallAvg: number;
  itineraryAvg: number;
  mealAvg: number;
  hotelAvg: number;
  guideAvg: number;
  valueAvg: number;
};

export type AgencyOverviewItem = AgencyReviewSummary & {
  agency: string;
};

export type MemberReviewItem = TourReviewListItem & {
  agency: string;
  destinationCategory: string;
  groupCode: string;
  moderationStatus: "pending" | "approved" | "rejected";
  moderationNote: string;
};

type AgencyReviewRow = {
  id: string;
  reviewer_display_name: string | null;
  agency: string | null;
  destination_category: string | null;
  source_tour_id: number | null;
  itinerary_rating: number;
  meal_rating: number;
  hotel_rating: number;
  guide_rating: number;
  value_rating: number | null;
  will_rebook: boolean;
  comment: string | null;
  extra_info: string | null;
  participation_proof: string | null;
  base_fee_hkd: number | null;
  optional_activity_fee_hkd: number | null;
  staff_service_fee_hkd: number | null;
  created_at: string;
  agency_review_photo: { public_url: string; created_at: string }[] | null;
  tour?:
    | {
        id: number;
        title: string | null;
        agency: string | null;
        destination: string | null;
        region: string | null;
        type: string | null;
      }
    | {
        id: number;
        title: string | null;
        agency: string | null;
        destination: string | null;
        region: string | null;
        type: string | null;
      }[]
    | null;
};

type RatingRow = {
  itinerary_rating: number;
  meal_rating: number;
  hotel_rating: number;
  guide_rating: number;
  value_rating: number | null;
};

type RatingRowWithoutValue = Omit<RatingRow, "value_rating">;

type AgencyScoreRow = {
  agency: string | null;
} & RatingRow;

type AgencyScoreRowWithoutValue = {
  agency: string | null;
} & RatingRowWithoutValue;

function isAgencyReviewTableMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = String((error as { code?: unknown }).code ?? "");
  const message = String((error as { message?: unknown }).message ?? "");
  return code === "PGRST205" || message.includes("agency_review");
}

function isMissingValueRatingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = String((error as { message?: unknown }).message ?? "");
  return message.includes("value_rating");
}

function withDefaultValueRating<T extends object>(
  rows: T[] | null | undefined
): Array<T & { value_rating: number }> | null {
  if (!rows) return null;
  return rows.map((row) => ({
    ...row,
    value_rating: Number((row as { value_rating?: number | null }).value_rating ?? 3),
  }));
}

function mapAgencyReviewRow(row: AgencyReviewRow): TourReviewListItem {
  const rawPhotos = Array.isArray(row.agency_review_photo) ? row.agency_review_photo : [];
  const photos = [...rawPhotos].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  return {
    id: row.id,
    reviewerDisplayName: row.reviewer_display_name?.trim() || "會員",
    itineraryRating: Number(row.itinerary_rating ?? 0),
    mealRating: Number(row.meal_rating ?? 0),
    hotelRating: Number(row.hotel_rating ?? 0),
    guideRating: Number(row.guide_rating ?? 0),
    valueRating: Number(row.value_rating ?? 3),
    willRebook: Boolean(row.will_rebook),
    comment: row.comment ?? "",
    extraInfo: row.extra_info ?? "",
    participationProof: row.participation_proof ?? "",
    baseFeeHkd: Number(row.base_fee_hkd ?? 0),
    optionalActivityFeeHkd: Number(row.optional_activity_fee_hkd ?? 0),
    staffServiceFeeHkd: Number(row.staff_service_fee_hkd ?? 0),
    createdAt: row.created_at,
    photos: photos.map((x) => ({ publicUrl: x.public_url, createdAt: x.created_at })),
  };
}

export { commentPreview, reviewOverallAverage };

function emptyTourSummary(): TourReviewSummary {
  return {
    total: 0,
    itineraryAvg: 0,
    mealAvg: 0,
    hotelAvg: 0,
    guideAvg: 0,
    valueAvg: 0,
    overallAvg: 0,
    willRebookYesRate: 0,
  };
}

export async function getTourReviewSummary(tourId: string): Promise<TourReviewSummary> {
  const numTourId = Number(tourId);
  if (!Number.isFinite(numTourId)) return emptyTourSummary();
  const supabase = await createServerSupabaseClient();
  const { data: tour, error } = await supabase.from("tour").select("agency").eq("id", numTourId).single();
  if (error || !tour?.agency) return emptyTourSummary();
  const agencySummary = await getAgencyReviewSummary(String(tour.agency));
  if (!agencySummary) return emptyTourSummary();
  return {
    ...agencySummary,
    willRebookYesRate: 0,
  };
}

export async function getTourReviews(tourId: string, limit = 200): Promise<TourReviewListItem[]> {
  const numTourId = Number(tourId);
  if (!Number.isFinite(numTourId)) return [];
  const supabase = await createServerSupabaseClient();
  const { data: tour, error } = await supabase.from("tour").select("agency").eq("id", numTourId).single();
  if (error || !tour?.agency) return [];
  return getAgencyReviews(String(tour.agency), limit);
}

export async function getAgencyReviews(agency: string, limit = 300): Promise<TourReviewListItem[]> {
  const name = agency.trim();
  if (!name) return [];

  const supabase = await createServerSupabaseClient();
  const primaryQuery = await supabase
    .from("agency_review")
    .select(
      "id, reviewer_display_name, agency, destination_category, source_tour_id, itinerary_rating, meal_rating, hotel_rating, guide_rating, value_rating, will_rebook, comment, extra_info, participation_proof, base_fee_hkd, optional_activity_fee_hkd, staff_service_fee_hkd, created_at, agency_review_photo(public_url, created_at)"
    )
    .eq("agency", name)
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  let rows = primaryQuery.data as AgencyReviewRow[] | null;
  let rowsError = primaryQuery.error;
  if (primaryQuery.error && isMissingValueRatingColumnError(primaryQuery.error)) {
    const fallbackQuery = await supabase
      .from("agency_review")
      .select(
        "id, reviewer_display_name, agency, destination_category, source_tour_id, itinerary_rating, meal_rating, hotel_rating, guide_rating, will_rebook, comment, extra_info, participation_proof, base_fee_hkd, optional_activity_fee_hkd, staff_service_fee_hkd, created_at, agency_review_photo(public_url, created_at)"
      )
      .eq("agency", name)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);
    rowsError = fallbackQuery.error;
    rows = withDefaultValueRating<Omit<AgencyReviewRow, "value_rating">>(
      fallbackQuery.data as Array<Omit<AgencyReviewRow, "value_rating">> | null
    );
  }

  if (rowsError || !rows) {
    if (!isAgencyReviewTableMissing(rowsError)) return [];
    const { data: tours, error: tourErr } = await supabase.from("tour").select("id").eq("agency", name);
    if (tourErr || !tours?.length) return [];
    const ids = tours.map((t) => Number(t.id)).filter((n) => Number.isFinite(n));
    if (ids.length === 0) return [];
    const legacy = await supabase
      .from("tour_review")
      .select(
        "id, reviewer_display_name, itinerary_rating, meal_rating, hotel_rating, guide_rating, will_rebook, comment, extra_info, participation_proof, base_fee_hkd, optional_activity_fee_hkd, staff_service_fee_hkd, created_at, tour_review_photo(public_url, created_at)"
      )
      .eq("moderation_status", "approved")
      .in("tour_id", ids)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (legacy.error || !legacy.data) return [];
    const rows = legacy.data as Array<
      AgencyReviewRow & { tour_review_photo: { public_url: string; created_at: string }[] | null }
    >;
    return rows.map((r) =>
      mapAgencyReviewRow({
        ...r,
        agency_review_photo: r.tour_review_photo,
        agency: name,
        destination_category: "其他",
        source_tour_id: null,
        value_rating: 3,
      })
    );
  }
  return rows.map(mapAgencyReviewRow);
}

export async function getAgencyReviewSummary(agency: string): Promise<AgencyReviewSummary | null> {
  const name = agency.trim();
  if (!name) return null;

  const supabase = await createServerSupabaseClient();
  const q = await supabase
    .from("agency_review")
    .select("itinerary_rating, meal_rating, hotel_rating, guide_rating, value_rating")
    .eq("agency", name)
    .eq("moderation_status", "approved")
    ;
  let data = q.data as RatingRow[] | null;
  let error = q.error;
  if (q.error && isMissingValueRatingColumnError(q.error)) {
    const fallback = await supabase
      .from("agency_review")
      .select("itinerary_rating, meal_rating, hotel_rating, guide_rating")
      .eq("agency", name)
      .eq("moderation_status", "approved");
    error = fallback.error;
    data = withDefaultValueRating<RatingRowWithoutValue>(fallback.data as RatingRowWithoutValue[] | null);
  }

  if (error || !data || data.length === 0) {
    if (!isAgencyReviewTableMissing(error)) return null;
    const { data: tours, error: tourErr } = await supabase.from("tour").select("id").eq("agency", name);
    if (tourErr || !tours?.length) return null;
    const ids = tours.map((t) => Number(t.id)).filter((n) => Number.isFinite(n));
    if (ids.length === 0) return null;
    const legacy = await supabase
      .from("tour_review")
      .select("itinerary_rating, meal_rating, hotel_rating, guide_rating")
      .eq("moderation_status", "approved")
      .in("tour_id", ids);
    if (legacy.error || !legacy.data || legacy.data.length === 0) return null;
    const rows = legacy.data;
    const total = rows.length;
    const itineraryAvg = rows.reduce((s, x) => s + Number(x.itinerary_rating ?? 0), 0) / total;
    const mealAvg = rows.reduce((s, x) => s + Number(x.meal_rating ?? 0), 0) / total;
    const hotelAvg = rows.reduce((s, x) => s + Number(x.hotel_rating ?? 0), 0) / total;
    const guideAvg = rows.reduce((s, x) => s + Number(x.guide_rating ?? 0), 0) / total;
    const valueAvg = 3;
    const overallAvg = (itineraryAvg + mealAvg + hotelAvg + guideAvg + valueAvg) / 5;
    return { total, overallAvg, itineraryAvg, mealAvg, hotelAvg, guideAvg, valueAvg };
  }

  const rows = data;
  const total = rows.length;
  const itineraryAvg = rows.reduce((s, x) => s + Number(x.itinerary_rating ?? 0), 0) / total;
  const mealAvg = rows.reduce((s, x) => s + Number(x.meal_rating ?? 0), 0) / total;
  const hotelAvg = rows.reduce((s, x) => s + Number(x.hotel_rating ?? 0), 0) / total;
  const guideAvg = rows.reduce((s, x) => s + Number(x.guide_rating ?? 0), 0) / total;
  const valueAvg = rows.reduce((s, x) => s + Number((x as { value_rating?: number | null }).value_rating ?? 3), 0) / total;
  const overallAvg = (itineraryAvg + mealAvg + hotelAvg + guideAvg + valueAvg) / 5;

  return {
    total,
    overallAvg,
    itineraryAvg,
    mealAvg,
    hotelAvg,
    guideAvg,
    valueAvg,
  };
}

export async function getRecentApprovedReviews(limit = 120): Promise<ReviewFeedItem[]> {
  const supabase = await createServerSupabaseClient();
  const primaryQuery = await supabase
    .from("agency_review")
    .select(
      "id, reviewer_display_name, agency, destination_category, source_tour_id, itinerary_rating, meal_rating, hotel_rating, guide_rating, value_rating, will_rebook, comment, extra_info, participation_proof, base_fee_hkd, optional_activity_fee_hkd, staff_service_fee_hkd, created_at, agency_review_photo(public_url, created_at), tour:source_tour_id(id, title, agency, destination, region, type)"
    )
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  let rows = primaryQuery.data as AgencyReviewRow[] | null;
  let rowsError = primaryQuery.error;
  if (primaryQuery.error && isMissingValueRatingColumnError(primaryQuery.error)) {
    const fallbackQuery = await supabase
      .from("agency_review")
      .select(
        "id, reviewer_display_name, agency, destination_category, source_tour_id, itinerary_rating, meal_rating, hotel_rating, guide_rating, will_rebook, comment, extra_info, participation_proof, base_fee_hkd, optional_activity_fee_hkd, staff_service_fee_hkd, created_at, agency_review_photo(public_url, created_at), tour:source_tour_id(id, title, agency, destination, region, type)"
      )
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);
    rowsError = fallbackQuery.error;
    rows = withDefaultValueRating<Omit<AgencyReviewRow, "value_rating">>(
      fallbackQuery.data as Array<Omit<AgencyReviewRow, "value_rating">> | null
    );
  }

  if (rowsError || !rows) {
    if (!isAgencyReviewTableMissing(rowsError)) return [];
    const legacy = await supabase
      .from("tour_review")
      .select(
        "id, reviewer_display_name, itinerary_rating, meal_rating, hotel_rating, guide_rating, will_rebook, comment, extra_info, participation_proof, base_fee_hkd, optional_activity_fee_hkd, staff_service_fee_hkd, created_at, tour_review_photo(public_url, created_at), tour:tour_id(id, title, agency, destination, region, type)"
      )
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (legacy.error || !legacy.data) return [];
    return (legacy.data as Array<AgencyReviewRow & { tour_review_photo: { public_url: string; created_at: string }[] | null }>)
      .map((row) => {
        const tourRel = Array.isArray(row.tour) ? row.tour[0] : row.tour;
        const sourceTourId = Number(tourRel?.id ?? 0);
        return {
          ...mapAgencyReviewRow({
            ...row,
            agency_review_photo: row.tour_review_photo,
            agency: tourRel?.agency ?? "旅行社",
            destination_category: toCountryCategory(tourRel?.destination?.trim() || ""),
            source_tour_id: sourceTourId,
            value_rating: 3,
          }),
          tourId: Number.isFinite(sourceTourId) && sourceTourId > 0 ? sourceTourId : 0,
          tourTitle: tourRel?.title?.trim() || "未命名旅行團",
          agency: tourRel?.agency?.trim() || "旅行社",
          destination: toCountryCategory(tourRel?.destination?.trim() || ""),
          countryCategory: toCountryCategory(tourRel?.destination?.trim() || ""),
          region: tourRel?.region?.trim() || "",
          tourType: tourRel?.type?.trim() || "longhaul",
        };
      });
  }

  return rows.map((row) => {
    const base = mapAgencyReviewRow(row);
    const tourRel = Array.isArray(row.tour) ? row.tour[0] : row.tour;
    const sourceTourId = Number(row.source_tour_id ?? tourRel?.id ?? 0);
    return {
      ...base,
      tourId: Number.isFinite(sourceTourId) && sourceTourId > 0 ? sourceTourId : 0,
      tourTitle: tourRel?.title?.trim() || "未命名旅行團",
      agency: row.agency?.trim() || tourRel?.agency?.trim() || "旅行社",
      destination: row.destination_category?.trim() || tourRel?.destination?.trim() || "未分類",
      countryCategory:
        row.destination_category?.trim() || toCountryCategory(tourRel?.destination?.trim() || ""),
      region: tourRel?.region?.trim() || "",
      tourType: tourRel?.type?.trim() || "longhaul",
    };
  });
}

export async function getAgencyScoreMap(agencies: string[]): Promise<Record<string, number>> {
  const names = Array.from(new Set(agencies.map((x) => x.trim()).filter(Boolean)));
  if (names.length === 0) return {};

  const supabase = await createServerSupabaseClient();
  const q = await supabase
    .from("agency_review")
    .select("agency, itinerary_rating, meal_rating, hotel_rating, guide_rating, value_rating")
    .in("agency", names)
    .eq("moderation_status", "approved");
  let data = q.data as AgencyScoreRow[] | null;
  let error = q.error;
  if (q.error && isMissingValueRatingColumnError(q.error)) {
    const fallback = await supabase
      .from("agency_review")
      .select("agency, itinerary_rating, meal_rating, hotel_rating, guide_rating")
      .in("agency", names)
      .eq("moderation_status", "approved");
    error = fallback.error;
    data = withDefaultValueRating<AgencyScoreRowWithoutValue>(
      fallback.data as AgencyScoreRowWithoutValue[] | null
    );
  }

  if (!error && data) {
    const acc = new Map<string, { n: number; sum: number }>();
    for (const row of data) {
      const agency = row.agency?.trim() || "";
      if (!agency) continue;
      const avg =
        (Number(row.itinerary_rating ?? 0) +
          Number(row.meal_rating ?? 0) +
          Number(row.hotel_rating ?? 0) +
          Number(row.guide_rating ?? 0) +
          Number(row.value_rating ?? 3)) /
        5;
      const prev = acc.get(agency) ?? { n: 0, sum: 0 };
      prev.n += 1;
      prev.sum += avg;
      acc.set(agency, prev);
    }
    return Object.fromEntries(Array.from(acc.entries()).map(([k, v]) => [k, v.sum / v.n]));
  }

  // Fallback for environments not migrated to agency_review.
  const tours = await supabase.from("tour").select("id, agency").in("agency", names);
  if (tours.error || !tours.data?.length) return {};
  const ids = tours.data.map((t) => Number(t.id)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) return {};
  const legacy = await supabase
    .from("tour_review")
    .select("tour_id, itinerary_rating, meal_rating, hotel_rating, guide_rating")
    .in("tour_id", ids)
    .eq("moderation_status", "approved");
  if (legacy.error || !legacy.data) return {};
  const idToAgency = new Map<number, string>();
  for (const t of tours.data as Array<{ id: number; agency: string | null }>) {
    const a = t.agency?.trim() || "";
    if (a) idToAgency.set(Number(t.id), a);
  }
  const acc = new Map<string, { n: number; sum: number }>();
  for (const row of legacy.data as Array<{ tour_id: number } & RatingRowWithoutValue>) {
    const agency = idToAgency.get(Number(row.tour_id));
    if (!agency) continue;
    const avg =
      (Number(row.itinerary_rating ?? 0) +
        Number(row.meal_rating ?? 0) +
        Number(row.hotel_rating ?? 0) +
        Number(row.guide_rating ?? 0) +
        3) /
      5;
    const prev = acc.get(agency) ?? { n: 0, sum: 0 };
    prev.n += 1;
    prev.sum += avg;
    acc.set(agency, prev);
  }
  return Object.fromEntries(Array.from(acc.entries()).map(([k, v]) => [k, v.sum / v.n]));
}

export async function getAgencyOverviews(limit = 200): Promise<AgencyOverviewItem[]> {
  const supabase = await createServerSupabaseClient();
  const q = await supabase
    .from("agency_review")
    .select("agency, itinerary_rating, meal_rating, hotel_rating, guide_rating, value_rating")
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(5000);
  let data = q.data as AgencyScoreRow[] | null;
  let error = q.error;
  if (q.error && isMissingValueRatingColumnError(q.error)) {
    const fallback = await supabase
      .from("agency_review")
      .select("agency, itinerary_rating, meal_rating, hotel_rating, guide_rating")
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(5000);
    error = fallback.error;
    data = withDefaultValueRating<AgencyScoreRowWithoutValue>(
      fallback.data as AgencyScoreRowWithoutValue[] | null
    );
  }

  if (error || !data) return [];

  const map = new Map<string, { total: number; it: number; meal: number; hotel: number; guide: number; value: number }>();
  for (const row of data) {
    const agency = row.agency?.trim() || "旅行社";
    const prev = map.get(agency) ?? { total: 0, it: 0, meal: 0, hotel: 0, guide: 0, value: 0 };
    prev.total += 1;
    prev.it += Number(row.itinerary_rating ?? 0);
    prev.meal += Number(row.meal_rating ?? 0);
    prev.hotel += Number(row.hotel_rating ?? 0);
    prev.guide += Number(row.guide_rating ?? 0);
    prev.value += Number(row.value_rating ?? 3);
    map.set(agency, prev);
  }

  const out: AgencyOverviewItem[] = Array.from(map.entries()).map(([agency, v]) => {
    const itineraryAvg = v.it / v.total;
    const mealAvg = v.meal / v.total;
    const hotelAvg = v.hotel / v.total;
    const guideAvg = v.guide / v.total;
    const valueAvg = v.value / v.total;
    return {
      agency,
      total: v.total,
      itineraryAvg,
      mealAvg,
      hotelAvg,
      guideAvg,
      valueAvg,
      overallAvg: (itineraryAvg + mealAvg + hotelAvg + guideAvg + valueAvg) / 5,
    };
  });

  return out.sort((a, b) => b.total - a.total || b.overallAvg - a.overallAvg).slice(0, limit);
}

export async function getMemberReviews(memberId: string, limit = 100): Promise<MemberReviewItem[]> {
  const id = memberId.trim();
  if (!id) return [];

  const supabase = createSupabaseAdminClient();
  const q = await supabase
    .from("agency_review")
    .select(
      "id, reviewer_display_name, agency, destination_category, group_code, itinerary_rating, meal_rating, hotel_rating, guide_rating, value_rating, will_rebook, comment, extra_info, participation_proof, base_fee_hkd, optional_activity_fee_hkd, staff_service_fee_hkd, moderation_status, moderation_note, created_at, agency_review_photo(public_url, created_at)"
    )
    .eq("member_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);
  let data = q.data as
    | Array<AgencyReviewRow & { group_code?: string | null; moderation_status?: string | null; moderation_note?: string | null }>
    | null;
  let error = q.error;

  if (q.error && isMissingValueRatingColumnError(q.error)) {
    const fallback = await supabase
      .from("agency_review")
      .select(
        "id, reviewer_display_name, agency, destination_category, group_code, itinerary_rating, meal_rating, hotel_rating, guide_rating, will_rebook, comment, extra_info, participation_proof, base_fee_hkd, optional_activity_fee_hkd, staff_service_fee_hkd, moderation_status, moderation_note, created_at, agency_review_photo(public_url, created_at)"
      )
      .eq("member_id", id)
      .order("created_at", { ascending: false })
      .limit(limit);
    error = fallback.error;
    data = withDefaultValueRating<
      Omit<AgencyReviewRow, "value_rating"> & {
        group_code?: string | null;
        moderation_status?: string | null;
        moderation_note?: string | null;
      }
    >(
      fallback.data as
        | Array<
            Omit<AgencyReviewRow, "value_rating"> & {
              group_code?: string | null;
              moderation_status?: string | null;
              moderation_note?: string | null;
            }
          >
        | null
    );
  }

  if (error || !data) return [];
  const rows = data;
  return rows.map((row) => ({
    ...mapAgencyReviewRow(row),
    agency: row.agency?.trim() || "旅行社",
    destinationCategory: row.destination_category?.trim() || "其他",
    groupCode: String(row.group_code ?? "").trim(),
    moderationStatus:
      row.moderation_status === "approved" || row.moderation_status === "rejected"
        ? row.moderation_status
        : "pending",
    moderationNote: String(row.moderation_note ?? "").trim(),
  }));
}
