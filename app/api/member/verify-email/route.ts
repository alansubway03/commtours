import { NextResponse } from "next/server";
import { attachMemberSessionCookie, createMemberSessionToken } from "@/lib/memberAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { EmailOtpError, verifyEmailOtp } from "@/lib/memberEmailOtp";
import { isValidEmail, normalizeEmail } from "@/lib/memberValidation";

function isMissingColumnError(x: unknown): boolean {
  if (!x || typeof x !== "object") return false;
  const code = String((x as { code?: unknown }).code ?? "");
  return code === "42703";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const code = String(body.code ?? "").trim();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "email 格式不正確。" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "驗證碼格式不正確（需為 6 位數字）。" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: member, error } = await supabase
      .from("member_account")
      .select("id, email_verified_at")
      .eq("email", email)
      .maybeSingle();
    if (isMissingColumnError(error)) {
      return NextResponse.json(
        { error: "系統未完成 Email OTP 初始化，請先執行 migration 018。", needMigration: true },
        { status: 503 }
      );
    }

    if (error || !member) {
      return NextResponse.json({ error: "找不到此會員帳號。" }, { status: 404 });
    }

    if (!member.email_verified_at) {
      try {
        await verifyEmailOtp(String(member.id), code);
      } catch (err) {
        if (err instanceof EmailOtpError) {
          return NextResponse.json({ error: err.message }, { status: err.status });
        }
        return NextResponse.json({ error: "驗證失敗，請稍後再試。" }, { status: 500 });
      }
    }

    const sessionToken = await createMemberSessionToken(String(member.id));
    if (!sessionToken) {
      return NextResponse.json(
        { error: "無法建立登入工作階段，請稍後再試。" },
        { status: 503 }
      );
    }
    const res = NextResponse.json({ ok: true, message: "Email 驗證成功，已為你登入。" });
    attachMemberSessionCookie(res, sessionToken);
    return res;
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }
}
