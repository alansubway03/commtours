import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

function parseStatus(raw: string | null): StatusFilter {
  if (raw === "pending" || raw === "approved" || raw === "rejected" || raw === "all") return raw;
  return "pending";
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const status = parseStatus(searchParams.get("status"));
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  const supabase = createSupabaseAdminClient();
  let q = supabase
    .from("tour_review")
    .select(
      `
      id,
      tour_id,
      member_id,
      moderation_status,
      moderation_note,
      moderated_at,
      reviewer_display_name,
      itinerary_rating,
      meal_rating,
      hotel_rating,
      guide_rating,
      will_rebook,
      comment,
      extra_info,
      participation_proof,
      created_at,
      tour(id, title, agency),
      member_account(email, member_name),
      tour_review_photo(id, public_url, created_at)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") {
    q = q.eq("moderation_status", status);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: "讀取評分列表失敗。" }, { status: 500 });
  }

  return NextResponse.json({ reviews: data ?? [] });
}

