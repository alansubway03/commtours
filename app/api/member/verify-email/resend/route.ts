import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { EmailOtpError, issueEmailOtp } from "@/lib/memberEmailOtp";
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
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "email 格式不正確。" }, { status: 400 });
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
    if (member.email_verified_at) {
      return NextResponse.json({ error: "此帳號已完成 Email 驗證。", verified: true }, { status: 409 });
    }

    try {
      const issued = await issueEmailOtp(String(member.id), email);
      if (issued.cooldownSeconds) {
        return NextResponse.json(
          { error: `驗證碼剛發送過，請 ${issued.cooldownSeconds} 秒後再試。`, cooldownSeconds: issued.cooldownSeconds },
          { status: 429 }
        );
      }
      return NextResponse.json({ ok: true, message: "驗證碼已發送，請檢查你的 Email。" });
    } catch (err) {
      if (err instanceof EmailOtpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      return NextResponse.json({ error: "重發失敗，請稍後再試。" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }
}
