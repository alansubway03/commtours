import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/memberAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { isValidEmail, isValidTel, normalizeEmail, normalizeTel } from "@/lib/memberValidation";
import { writeMemberAuditLog } from "@/lib/memberSecurity";

export async function PUT(req: Request) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "請先登入會員。" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const tel = normalizeTel(body.tel);

    if (!email || !tel) {
      return NextResponse.json({ error: "email 及電話不可為空。" }, { status: 400 });
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

    const supabase = createSupabaseAdminClient();
    const prevEmail = member.email;
    const prevTel = member.tel;
    const { error } = await supabase
      .from("member_account")
      .update({
        email,
        tel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "此 email 已被使用，請更換。" }, { status: 409 });
      }
      return NextResponse.json({ error: "更新會員資料失敗。" }, { status: 500 });
    }

    await supabase
      .from("member_newsletter_optin")
      .update({ email, updated_at: new Date().toISOString() })
      .eq("member_id", member.id);

    await writeMemberAuditLog(member.id, "update_profile", {
      prevEmail,
      nextEmail: email,
      prevTel,
      nextTel: tel,
    });

    return NextResponse.json({
      ok: true,
      profile: {
        email,
        tel,
      },
    });
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }
}
