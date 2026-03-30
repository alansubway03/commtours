import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_LOCK_MINUTES = 15;
export const REVIEW_SUBMIT_COOLDOWN_SECONDS = 60;

export async function getRequestMeta() {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const userAgent = h.get("user-agent");
  return {
    ip,
    userAgent: userAgent && userAgent.length > 500 ? userAgent.slice(0, 500) : userAgent,
  };
}

export async function writeMemberAuditLog(
  memberId: string,
  action: string,
  detail: Record<string, unknown> = {}
) {
  const supabase = createSupabaseAdminClient();
  const meta = await getRequestMeta();
  await supabase.from("member_audit_log").insert({
    member_id: memberId,
    action,
    detail,
    ip: meta.ip,
    user_agent: meta.userAgent,
  });
}
