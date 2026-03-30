import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const SESSION_COOKIE_NAME = "member_session_token";
const SESSION_DAYS = 30;

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

export function buildPasswordHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const digest = hashPassword(password, salt);
  return `${salt}:${digest}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const calculated = hashPassword(password, salt);
  const digestBuf = Buffer.from(digest, "hex");
  const calculatedBuf = Buffer.from(calculated, "hex");
  if (digestBuf.length !== calculatedBuf.length) return false;
  return timingSafeEqual(digestBuf, calculatedBuf);
}

export async function createMemberSession(memberId: string) {
  const supabase = createSupabaseAdminClient();
  const sessionToken = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("member_session").insert({
    member_id: memberId,
    session_token: sessionToken,
    expires_at: expiresAt,
  });
  if (error) throw error;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getCurrentMember() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("member_session")
    .select(
      "member_id, expires_at, member_account(id, email, tel, member_name, yearly_trips, yearly_group_tours, weekly_promo_subscribed)"
    )
    .eq("session_token", token)
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (error || !data) return null;
  const member = Array.isArray(data.member_account) ? data.member_account[0] : data.member_account;
  if (!member) return null;

  return {
    id: member.id as string,
    email: member.email as string,
    tel: member.tel as string,
    memberName: (member.member_name as string) ?? "",
    yearlyTrips: Number(member.yearly_trips ?? 0),
    yearlyGroupTours: Number(member.yearly_group_tours ?? 0),
    weeklyPromoSubscribed: Boolean(member.weekly_promo_subscribed),
  };
}

export async function clearCurrentMemberSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const supabase = createSupabaseAdminClient();

  if (token) {
    await supabase.from("member_session").delete().eq("session_token", token);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function clearAllMemberSessions(memberId: string) {
  const cookieStore = await cookies();
  const supabase = createSupabaseAdminClient();
  await supabase.from("member_session").delete().eq("member_id", memberId);
  cookieStore.delete(SESSION_COOKIE_NAME);
}
