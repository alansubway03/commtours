import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/memberAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "請先登入會員。" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const subscribed = Boolean(body.subscribed);
    const supabase = createSupabaseAdminClient();

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("member_account")
      .update({ weekly_promo_subscribed: subscribed, updated_at: now })
      .eq("id", member.id);
    if (updateError) {
      return NextResponse.json({ error: "更新失敗，請稍後再試。" }, { status: 500 });
    }

    const { error: optinError } = await supabase.from("member_newsletter_optin").upsert(
      {
        member_id: member.id,
        email: member.email,
        subscribed,
        subscribed_at: subscribed ? now : undefined,
        updated_at: now,
      },
      { onConflict: "member_id" }
    );
    if (optinError) {
      return NextResponse.json({ error: "訂閱狀態更新失敗。" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, subscribed });
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }
}
