import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/memberAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { REVIEW_SUBMIT_COOLDOWN_SECONDS } from "@/lib/memberSecurity";

function toRating(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 5) return 0;
  return n;
}

function reviewerDisplayName(memberName: string): string {
  const t = memberName.trim();
  return t.length > 0 ? t : "會員";
}

type ReviewPhotoPayload = {
  storagePath: string;
  publicUrl: string;
};

function toMoney(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function isMissingFeeColumnError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = String((err as { message?: unknown }).message ?? "");
  return (
    message.includes("base_fee_hkd") ||
    message.includes("optional_activity_fee_hkd") ||
    message.includes("staff_service_fee_hkd") ||
    message.includes("value_rating")
  );
}

function parseGroupCode(input: string): string {
  const m = input.trim().match(/團號\s*[:：]?\s*(.+)$/);
  return (m?.[1] ?? input).trim();
}

export async function POST(req: Request) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "請先登入會員。" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const tourId = Number(body.tourId);
    const manualAgency = String(body.agency ?? "").trim();
    const destinationCategory = String(body.destinationCategory ?? "").trim() || "其他";
    const rawGroupCode = String(body.groupCode ?? "").trim();
    const itineraryRating = toRating(body.itineraryRating);
    const mealRating = toRating(body.mealRating);
    const hotelRating = toRating(body.hotelRating);
    const guideRating = toRating(body.guideRating);
    const valueRating = toRating(body.valueRating);
    const willRebook = Boolean(body.willRebook);
    const comment = String(body.comment ?? "").trim();
    const extraInfo = String(body.extraInfo ?? "").trim();
    const participationProof = String(body.participationProof ?? "").trim();
    const baseFeeHkd = toMoney(body.baseFeeHkd);
    const optionalActivityFeeHkd = toMoney(body.optionalActivityFeeHkd);
    const staffServiceFeeHkd = toMoney(body.staffServiceFeeHkd);
    const photos = Array.isArray(body.photos) ? body.photos : [];

    if (!itineraryRating || !mealRating || !hotelRating || !guideRating || !valueRating) {
      return NextResponse.json({ error: "五項評分都必須是 1-5 分。" }, { status: 400 });
    }
    const groupCode = (rawGroupCode || parseGroupCode(participationProof)).trim();
    if (!groupCode) return NextResponse.json({ error: "必須提供團號。" }, { status: 400 });
    if (baseFeeHkd === null || optionalActivityFeeHkd === null || staffServiceFeeHkd === null) {
      return NextResponse.json({ error: "費用必須是 0 或以上的數字。" }, { status: 400 });
    }
    if (photos.length === 0) {
      return NextResponse.json({ error: "必須最少上載 1 張參團照片。" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: latestReview } = await supabase
      .from("agency_review")
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

    const displayName = reviewerDisplayName(member.memberName);
    const { data: sourceTour } = Number.isFinite(tourId)
      ? await supabase.from("tour").select("id,agency").eq("id", tourId).maybeSingle()
      : { data: null };
    const agency = manualAgency || String(sourceTour?.agency ?? "").trim();
    if (!agency) return NextResponse.json({ error: "旅行社資料錯誤。" }, { status: 400 });

    const { data: existingReview } = await supabase
      .from("agency_review")
      .select("id, moderation_status")
      .eq("member_id", member.id)
      .eq("agency", agency)
      .eq("group_code", groupCode)
      .maybeSingle();

    if (existingReview?.id) {
      const st = existingReview.moderation_status;
      if (st === "approved") {
        return NextResponse.json({ error: "你已提交過此團號的評分。" }, { status: 409 });
      }
      if (st === "pending") {
        return NextResponse.json(
          { error: "此團評分尚在審核中，請稍後再查看結果。" },
          { status: 409 }
        );
      }
      if (st !== "rejected") {
        return NextResponse.json({ error: "無法提交評分。" }, { status: 409 });
      }

      const validPhotos = photos.filter(
        (p: unknown): p is ReviewPhotoPayload =>
          !!p &&
          typeof p === "object" &&
          typeof (p as { storagePath?: unknown }).storagePath === "string" &&
          typeof (p as { publicUrl?: unknown }).publicUrl === "string"
      );
      const rows = validPhotos.map((p: ReviewPhotoPayload) => ({
        review_id: existingReview.id,
        storage_path: p.storagePath,
        public_url: p.publicUrl,
      }));

      if (rows.length === 0) {
        return NextResponse.json({ error: "照片資料格式錯誤。" }, { status: 400 });
      }

      await supabase.from("agency_review_photo").delete().eq("review_id", existingReview.id);

      const updatePayload = {
        agency,
        destination_category: destinationCategory,
        group_code: groupCode,
        source_tour_id: Number.isFinite(tourId) ? tourId : null,
        itinerary_rating: itineraryRating,
        meal_rating: mealRating,
        hotel_rating: hotelRating,
        guide_rating: guideRating,
        value_rating: valueRating,
        will_rebook: willRebook,
        comment,
        extra_info: extraInfo,
        participation_proof: participationProof,
        base_fee_hkd: baseFeeHkd,
        optional_activity_fee_hkd: optionalActivityFeeHkd,
        staff_service_fee_hkd: staffServiceFeeHkd,
        reviewer_display_name: displayName,
        moderation_status: "pending",
        moderated_at: null,
        moderation_note: "",
        updated_at: new Date().toISOString(),
      };
      let { error: updErr } = await supabase.from("agency_review").update(updatePayload).eq("id", existingReview.id);
      if (updErr && isMissingFeeColumnError(updErr)) {
        const { base_fee_hkd, optional_activity_fee_hkd, staff_service_fee_hkd, value_rating, ...fallbackPayload } =
          updatePayload;
        const fallback = await supabase.from("agency_review").update(fallbackPayload).eq("id", existingReview.id);
        updErr = fallback.error;
      }

      if (updErr) {
        return NextResponse.json({ error: "更新評分失敗。" }, { status: 500 });
      }

      const { error: photoError } = await supabase.from("agency_review_photo").insert(rows);
      if (photoError) {
        return NextResponse.json({ error: "評分已更新，但照片儲存失敗。" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, reviewId: existingReview.id });
    }

    const insertPayload = {
      agency,
      destination_category: destinationCategory,
      group_code: groupCode,
      source_tour_id: Number.isFinite(tourId) ? tourId : null,
      member_id: member.id,
      itinerary_rating: itineraryRating,
      meal_rating: mealRating,
      hotel_rating: hotelRating,
      guide_rating: guideRating,
      value_rating: valueRating,
      will_rebook: willRebook,
      comment,
      extra_info: extraInfo,
      participation_proof: participationProof,
      base_fee_hkd: baseFeeHkd,
      optional_activity_fee_hkd: optionalActivityFeeHkd,
      staff_service_fee_hkd: staffServiceFeeHkd,
      reviewer_display_name: displayName,
      moderation_status: "pending",
      moderated_at: null,
      moderation_note: "",
    };
    let { data: review, error: reviewError } = await supabase.from("agency_review").insert(insertPayload).select("id").single();
    if (reviewError && isMissingFeeColumnError(reviewError)) {
      const { base_fee_hkd, optional_activity_fee_hkd, staff_service_fee_hkd, value_rating, ...fallbackPayload } =
        insertPayload;
      const fallback = await supabase.from("agency_review").insert(fallbackPayload).select("id").single();
      review = fallback.data;
      reviewError = fallback.error;
    }

    if (reviewError || !review) {
      if (reviewError?.code === "23505") {
        return NextResponse.json({ error: "你已提交過此團號的評分。" }, { status: 409 });
      }
      return NextResponse.json({ error: "提交評分失敗。" }, { status: 500 });
    }

    const validPhotos = photos.filter(
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

    const { error: photoError } = await supabase.from("agency_review_photo").insert(rows);
    if (photoError) {
      return NextResponse.json({ error: "評分已提交，但照片儲存失敗。" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, reviewId: review.id });
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }
}
