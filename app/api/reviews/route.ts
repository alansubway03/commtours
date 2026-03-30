import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/memberAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { REVIEW_SUBMIT_COOLDOWN_SECONDS } from "@/lib/memberSecurity";

function toRating(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 5) return 0;
  return n;
}

type ReviewPhotoPayload = {
  storagePath: string;
  publicUrl: string;
};

export async function POST(req: Request) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "請先登入會員。" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const tourId = Number(body.tourId);
    const itineraryRating = toRating(body.itineraryRating);
    const mealRating = toRating(body.mealRating);
    const hotelRating = toRating(body.hotelRating);
    const guideRating = toRating(body.guideRating);
    const willRebook = Boolean(body.willRebook);
    const comment = String(body.comment ?? "").trim();
    const extraInfo = String(body.extraInfo ?? "").trim();
    const participationProof = String(body.participationProof ?? "").trim();
    const photos = Array.isArray(body.photos) ? body.photos : [];

    if (!Number.isFinite(tourId)) {
      return NextResponse.json({ error: "旅行團資料錯誤。" }, { status: 400 });
    }
    if (!itineraryRating || !mealRating || !hotelRating || !guideRating) {
      return NextResponse.json({ error: "四項評分都必須是 1-5 分。" }, { status: 400 });
    }
    if (!participationProof) {
      return NextResponse.json({ error: "必須提供參團證明描述。" }, { status: 400 });
    }
    if (photos.length === 0) {
      return NextResponse.json({ error: "必須最少上載 1 張參團照片。" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: latestReview } = await supabase
      .from("tour_review")
      .select("created_at")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestReview?.created_at) {
      const lastAt = new Date(String(latestReview.created_at)).getTime();
      const diffSec = Math.floor((Date.now() - lastAt) / 1000);
      if (diffSec < REVIEW_SUBMIT_COOLDOWN_SECONDS) {
        const waitSec = REVIEW_SUBMIT_COOLDOWN_SECONDS - diffSec;
        return NextResponse.json(
          { error: `提交過於頻繁，請 ${waitSec} 秒後再試。` },
          { status: 429 }
        );
      }
    }

    const { data: existingReview } = await supabase
      .from("tour_review")
      .select("id")
      .eq("tour_id", tourId)
      .eq("member_id", member.id)
      .maybeSingle();
    if (existingReview?.id) {
      return NextResponse.json({ error: "你已評分過此旅行團。" }, { status: 409 });
    }

    const { data: review, error: reviewError } = await supabase
      .from("tour_review")
      .insert({
        tour_id: tourId,
        member_id: member.id,
        itinerary_rating: itineraryRating,
        meal_rating: mealRating,
        hotel_rating: hotelRating,
        guide_rating: guideRating,
        will_rebook: willRebook,
        comment,
        extra_info: extraInfo,
        participation_proof: participationProof,
      })
      .select("id")
      .single();

    if (reviewError || !review) {
      if (reviewError?.code === "23505") {
        return NextResponse.json({ error: "你已評分過此旅行團。" }, { status: 409 });
      }
      return NextResponse.json({ error: "提交評分失敗。" }, { status: 500 });
    }

    const validPhotos = photos
      .filter(
        (p: unknown): p is ReviewPhotoPayload =>
          !!p &&
          typeof p === "object" &&
          typeof (p as { storagePath?: unknown }).storagePath === "string" &&
          typeof (p as { publicUrl?: unknown }).publicUrl === "string"
      );
    const rows = validPhotos.map((p: ReviewPhotoPayload) => ({
        review_id: review.id,
        storage_path: p.storagePath,
        public_url: p.publicUrl,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: "照片資料格式錯誤。" }, { status: 400 });
    }

    const { error: photoError } = await supabase.from("tour_review_photo").insert(rows);
    if (photoError) {
      return NextResponse.json({ error: "評分已提交，但照片儲存失敗。" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, reviewId: review.id });
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }
}
