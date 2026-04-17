import { randomInt, scryptSync, timingSafeEqual } from "crypto";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const OTP_PURPOSE = "email_verify";
const OTP_DIGITS = 6;
const OTP_HASH_SALT = "member-email-otp-v1";

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export const OTP_EXPIRE_MINUTES = envInt("OTP_EXPIRE_MINUTES", 10);
export const OTP_RESEND_COOLDOWN_SECONDS = envInt("OTP_RESEND_COOLDOWN_SECONDS", 60);
export const OTP_MAX_ATTEMPTS = envInt("OTP_MAX_ATTEMPTS", 5);

type OtpRow = {
  id: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
  consumed_at: string | null;
  created_at: string;
};

export class EmailOtpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function buildOtpCode(): string {
  return String(randomInt(0, 10 ** OTP_DIGITS)).padStart(OTP_DIGITS, "0");
}

function hashOtp(raw: string): string {
  return scryptSync(raw, OTP_HASH_SALT, 64).toString("hex");
}

function otpEquals(raw: string, hash: string): boolean {
  const a = Buffer.from(hashOtp(raw), "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function sendOtpEmail(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new EmailOtpError("伺服器未設定 RESEND_API_KEY 或 EMAIL_FROM。", 500);
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "CommTours 會員 Email 驗證碼",
    html: `<p>你的 CommTours 驗證碼是：<strong style="font-size:20px;letter-spacing:2px;">${code}</strong></p><p>此驗證碼 ${OTP_EXPIRE_MINUTES} 分鐘內有效，請勿分享給他人。</p>`,
  });

  if (error) {
    throw new EmailOtpError("寄送驗證碼失敗，請稍後再試。", 500);
  }
}

export async function issueEmailOtp(memberId: string, email: string): Promise<{ cooldownSeconds?: number }> {
  const supabase = createSupabaseAdminClient();
  const { data: latest } = await supabase
    .from("member_email_verification_code")
    .select("id, created_at")
    .eq("member_id", memberId)
    .eq("purpose", OTP_PURPOSE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.created_at) {
    const diffSec = Math.floor((Date.now() - new Date(latest.created_at).getTime()) / 1000);
    if (diffSec < OTP_RESEND_COOLDOWN_SECONDS) {
      return { cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS - diffSec };
    }
  }

  const code = buildOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000).toISOString();
  const { data: row, error } = await supabase
    .from("member_email_verification_code")
    .insert({
      member_id: memberId,
      email,
      purpose: OTP_PURPOSE,
      code_hash: hashOtp(code),
      expires_at: expiresAt,
      attempts: 0,
      max_attempts: OTP_MAX_ATTEMPTS,
    })
    .select("id")
    .single();

  if (error || !row) {
    throw new EmailOtpError("建立驗證碼失敗，請稍後再試。", 500);
  }

  try {
    await sendOtpEmail(email, code);
  } catch (err) {
    await supabase.from("member_email_verification_code").delete().eq("id", row.id);
    if (err instanceof EmailOtpError) throw err;
    throw new EmailOtpError("寄送驗證碼失敗，請稍後再試。", 500);
  }

  return {};
}

export async function verifyEmailOtp(memberId: string, code: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data: row } = await supabase
    .from("member_email_verification_code")
    .select("id, code_hash, expires_at, attempts, max_attempts, consumed_at, created_at")
    .eq("member_id", memberId)
    .eq("purpose", OTP_PURPOSE)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const otp = row as OtpRow | null;
  if (!otp) {
    throw new EmailOtpError("找不到可用驗證碼，請先重發。", 400);
  }

  if (new Date(otp.expires_at).getTime() < Date.now()) {
    throw new EmailOtpError("驗證碼已過期，請重發。", 400);
  }

  if (otp.attempts >= otp.max_attempts) {
    await supabase
      .from("member_email_verification_code")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otp.id);
    throw new EmailOtpError("驗證次數已達上限，請重發驗證碼。", 429);
  }

  if (!otpEquals(code, otp.code_hash)) {
    const nextAttempts = otp.attempts + 1;
    await supabase
      .from("member_email_verification_code")
      .update({
        attempts: nextAttempts,
        ...(nextAttempts >= otp.max_attempts ? { consumed_at: new Date().toISOString() } : {}),
      })
      .eq("id", otp.id);

    throw new EmailOtpError(
      nextAttempts >= otp.max_attempts ? "驗證次數已達上限，請重發驗證碼。" : "驗證碼錯誤。",
      nextAttempts >= otp.max_attempts ? 429 : 400
    );
  }

  const nowIso = new Date().toISOString();
  await supabase.from("member_account").update({ email_verified_at: nowIso }).eq("id", memberId);
  await supabase.from("member_email_verification_code").update({ consumed_at: nowIso }).eq("id", otp.id);
}
