import { createServerSupabaseClient } from "@/lib/supabase";
import type { Tour, TourType } from "@/types/tour";
import { normalizeDepartureDateStatusesInput } from "@/lib/departureDateStatuses";

type TourRow = {
  id: number;
  agency: string | null;
  title: string | null;
  type: string | null;
  destination: string | null;
  region: string | null;
  days: number | null;
  price_range: string | null;
  departure_date_statuses: unknown;
  features: string[] | null;
  affiliate_links: { wingon?: string; tripdotcom?: string; others?: { label: string; url: string }[] } | null;
  image_url: string | null;
  updated_at: string | null;
  created_at: string | null;
};

const TOUR_TYPES: TourType[] = [
  "longhaul",
  "cruise",
  "cruise_ticket",
  "hiking",
  "diving",
  "festival",
];

function mapRowToTour(row: TourRow): Tour {
  const type = row.type && TOUR_TYPES.includes(row.type as TourType)
    ? (row.type as TourType)
    : "longhaul";
  const departure_date_statuses = normalizeDepartureDateStatusesInput(row.departure_date_statuses);
  return {
    id: String(row.id),
    agency: row.agency ?? "",
    type,
    title: row.title ?? "",
    destination: row.destination ?? "",
    region: row.region ?? "",
    days: Number(row.days) ?? 0,
    price_range: row.price_range ?? "",
    departure_date_statuses,
    departure_dates: departure_date_statuses.map((x) => x.date),
    features: Array.isArray(row.features) ? row.features : [],
    affiliate_links:
      row.affiliate_links && typeof row.affiliate_links === "object"
        ? row.affiliate_links
        : {},
    image_url: row.image_url ?? "",
    last_updated: row.updated_at ?? row.created_at ?? "",
  };
}

export async function getTours(): Promise<Tour[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tour")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => mapRowToTour(row as TourRow));
}

export async function getTourById(id: string): Promise<Tour | null> {
  const numId = Number(id);
  if (Number.isNaN(numId)) return null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tour")
    .select("*")
    .eq("id", numId)
    .single();

  if (error || !data) return null;
  return mapRowToTour(data as TourRow);
}
