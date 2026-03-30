import { NextResponse } from "next/server";
import { buildPasswordHash, createMemberSession } from "@/lib/memberAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  isStrongPassword,
  isValidEmail,
  isValidMemberName,
  isValidTel,
  normalizeEmail,
  normalizeMemberName,
  normalizeTel,
} from "@/lib/memberValidation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const tel = normalizeTel(body.tel);
    const password = String(body.password ?? "");
    const memberName = normalizeMemberName(body.memberName);
    const yearlyTrips = Number(body.yearlyTrips);
    const yearlyGroupTours = Number(body.yearlyGroupTours);
    const weeklyPromoSubscribed = Boolean(body.weeklyPromoSubscribed);
    if (!email || !tel || !memberName || password.length < 8) {
      return NextResponse.json(
        { error: "請填妥會員名稱、email、電話，密碼至少 8 字元。" },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "email 格式不正確。" }, { status: 400 });
    }
    if (!isValidTel(tel)) {
      return NextResponse.json(
        { error: "電話格式不正確（6-20 字元，只限數字及 + - ( ) 空格，且至少 6 位數字）。" },
        { status: 400 }
      );
    }
    if (!isValidMemberName(memberName)) {
      return NextResponse.json(
        { error: "會員名稱需為 2-20 字，只可使用英文字母及數字。" },
        { status: 400 }
      );
    }
    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: "密碼必須至少 8 字元，且同時包含英文字母與數字。" },
        { status: 400 }
      );
    }
    if (
      !Number.isInteger(yearlyTrips) ||
      yearlyTrips < 0 ||
      !Number.isInteger(yearlyGroupTours) ||
      yearlyGroupTours < 0
    ) {
      return NextResponse.json({ error: "問卷次數必須是 0 或以上的整數。" }, { status: 400 });
    }
    if (yearlyGroupTours > yearlyTrips) {
      return NextResponse.json({ error: "跟團次數不可多於總旅遊次數。" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: existing } = await supabase
      .from("member_account")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing?.id) {
      return NextResponse.json({ error: "此 email 已註冊。" }, { status: 409 });
    }
    const { data: existingName } = await supabase
      .from("member_account")
      .select("id")
      .ilike("member_name", memberName)
      .maybeSingle();
    if (existingName?.id) {
      return NextResponse.json({ error: "會員名稱已被使用，請更換。" }, { status: 409 });
    }

    const passwordHash = buildPasswordHash(password);
    const { data, error } = await supabase
      .from("member_account")
      .insert({
        email,
        tel,
        member_name: memberName,
        yearly_trips: yearlyTrips,
        yearly_group_tours: yearlyGroupTours,
        password_hash: passwordHash,
        weekly_promo_subscribed: weeklyPromoSubscribed,
      })
      .select("id, email, member_name, yearly_trips, yearly_group_tours")
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        return NextResponse.json({ error: "email 或會員名稱已被使用。" }, { status: 409 });
      }
      if (error?.code === "23514") {
        return NextResponse.json(
          { error: "會員名稱格式不符，需為 2-20 字英數。" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "註冊失敗，請稍後重試。" }, { status: 500 });
    }

    if (weeklyPromoSubscribed) {
      await supabase.from("member_newsletter_optin").upsert(
        {
          member_id: data.id,
          email,
          subscribed: true,
          subscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "member_id" }
      );
    }

    await createMemberSession(data.id);

    return NextResponse.json({
      ok: true,
      member: {
        id: data.id,
        email: data.email,
        memberName: data.member_name,
        yearlyTrips: data.yearly_trips,
        yearlyGroupTours: data.yearly_group_tours,
        weeklyPromoSubscribed,
      },
    });
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }
}
