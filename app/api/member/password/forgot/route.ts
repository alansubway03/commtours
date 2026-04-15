import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { isValidEmail, normalizeEmail } from "@/lib/memberValidation";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  PASSWORD_RESET_EXPIRE_MINUTES,
} from "@/lib/memberPasswordReset";
import { sendPasswordResetEmail } from "@/lib/mail";

function genericOk() {
  return NextResponse.json({
    ok: true,
    message: "如果此 email 已註冊，我們已寄出重設密碼連結。",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    if (!email || !isValidEmail(email)) {
      return genericOk();
    }

    const supabase = createSupabaseAdminClient();
    const { data: member } = await supabase
      .from("member_account")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (!member?.id) {
      return genericOk();
    }

    const rawToken = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_EXPIRE_MINUTES * 60 * 1000
    ).toISOString();

    await supabase
      .from("member_password_reset_token")
      .delete()
      .eq("member_id", member.id)
      .is("used_at", null);

    const { error: tokenErr } = await supabase.from("member_password_reset_token").insert({
      member_id: member.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
    if (tokenErr) {
      return NextResponse.json({ error: "建立重設連結失敗。" }, { status: 500 });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
    const resetUrl = `${siteUrl.replace(/\/$/, "")}/member/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail({
      to: member.email as string,
      resetUrl,
      expireMinutes: PASSWORD_RESET_EXPIRE_MINUTES,
    });

    return genericOk();
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }
}

