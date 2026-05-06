import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getSafeHttpUrl } from "@/lib/safeExternalUrl";
import { generateRefId, REFERRAL_PARTNER } from "@/lib/referralTracking";

function firstIp(raw: string | null): string {
  if (!raw) return "";
  return raw.split(",")[0]?.trim() ?? "";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = getSafeHttpUrl(searchParams.get("target"));
  const tourId = searchParams.get("tourId")?.trim() ?? "";
  const tourIdNum = Number(tourId);
  const agencyName = searchParams.get("agency")?.trim() ?? "";
  const vendor = searchParams.get("vendor")?.trim() ?? "unknown";

  if (!target || !agencyName || !Number.isInteger(tourIdNum) || tourIdNum <= 0) {
    return NextResponse.json({ error: "無效追蹤參數。" }, { status: 400 });
  }

  const refId = generateRefId(agencyName);
  const now = new Date().toISOString();
  const ip =
    firstIp(req.headers.get("x-forwarded-for")) ||
    req.headers.get("x-real-ip") ||
    "";
  const userAgent = req.headers.get("user-agent") ?? "";

  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("referral_click").insert({
      ref_id: refId,
      partner: REFERRAL_PARTNER,
      tour_id: tourIdNum,
      agency_name: agencyName,
      vendor,
      target_url: target,
      clicked_at: now,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch {
    // Tracking 寫入失敗不應阻擋用戶前往旅行社頁面
  }

  const redirectUrl = new URL(target);
  redirectUrl.searchParams.set("ref_id", refId);
  redirectUrl.searchParams.set("partner", REFERRAL_PARTNER);
  redirectUrl.searchParams.set("clicked_at", now);
  return NextResponse.redirect(redirectUrl, { status: 307 });
}
