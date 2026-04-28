import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/memberAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { AdminReviewModerationClient, type AdminReviewItem } from "@/components/AdminReviewModerationClient";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const member = await getCurrentMember();
  if (!member?.isAdmin) {
    redirect("/member");
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("agency_review")
    .select(
      `
      id,
      source_tour_id,
      moderation_status,
      reviewer_display_name,
      itinerary_rating,
      meal_rating,
      hotel_rating,
      guide_rating,
      value_rating,
      will_rebook,
      comment,
      extra_info,
      participation_proof,
      created_at,
      tour:source_tour_id(id, title, agency),
      member_account(email, member_name),
      agency_review_photo(id, public_url, created_at)
    `
    )
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="container px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin 評分審核</h1>
        <p className="text-sm text-muted-foreground">只顯示待審核（pending）評分，可直接 approve / reject。</p>
      </div>
      <AdminReviewModerationClient initialReviews={(data ?? []) as AdminReviewItem[]} />
    </div>
  );
}

