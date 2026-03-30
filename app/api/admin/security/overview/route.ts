import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdminKey } from "@/lib/adminGuard";

type LockedAccountRow = {
  id: string;
  email: string;
  member_name: string;
  failed_login_count: number;
  login_locked_until: string | null;
};

type LoginAttemptRow = {
  email: string;
  ip: string;
  failed_count: number;
  locked_until: string | null;
  last_failed_at: string | null;
};

type AuditRow = {
  id: string;
  action: string;
  detail: Record<string, unknown> | null;
  created_at: string;
  ip: string | null;
  user_agent: string | null;
  member_account:
    | { email: string | null; member_name: string | null }
    | { email: string | null; member_name: string | null }[]
    | null;
};

export async function GET() {
  const auth = await requireAdminKey();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const since24hIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [lockedAccountsRes, attemptsRes, auditsRes] = await Promise.all([
    supabase
      .from("member_account")
      .select("id, email, member_name, failed_login_count, login_locked_until")
      .gt("login_locked_until", nowIso)
      .order("login_locked_until", { ascending: false }),
    supabase
      .from("member_login_attempt")
      .select("email, ip, failed_count, locked_until, last_failed_at")
      .gte("last_failed_at", since24hIso)
      .order("last_failed_at", { ascending: false })
      .limit(500),
    supabase
      .from("member_audit_log")
      .select("id, action, detail, created_at, ip, user_agent, member_account(email, member_name)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (lockedAccountsRes.error || attemptsRes.error || auditsRes.error) {
    return NextResponse.json(
      {
        error: "讀取安全概覽失敗。",
        detail: {
          lockedAccounts: lockedAccountsRes.error?.message,
          attempts: attemptsRes.error?.message,
          audits: auditsRes.error?.message,
        },
      },
      { status: 500 }
    );
  }

  const lockedAccounts = (lockedAccountsRes.data ?? []) as LockedAccountRow[];
  const attempts = (attemptsRes.data ?? []) as LoginAttemptRow[];
  const audits = (auditsRes.data ?? []) as AuditRow[];

  const byIp = new Map<string, { ip: string; sumFailed: number; maxFailed: number; latestAt: string | null }>();
  for (const row of attempts) {
    const prev = byIp.get(row.ip);
    const latestAt =
      !prev?.latestAt || (row.last_failed_at && row.last_failed_at > prev.latestAt)
        ? row.last_failed_at
        : prev.latestAt;
    if (!prev) {
      byIp.set(row.ip, {
        ip: row.ip,
        sumFailed: Number(row.failed_count ?? 0),
        maxFailed: Number(row.failed_count ?? 0),
        latestAt: row.last_failed_at,
      });
    } else {
      byIp.set(row.ip, {
        ip: row.ip,
        sumFailed: prev.sumFailed + Number(row.failed_count ?? 0),
        maxFailed: Math.max(prev.maxFailed, Number(row.failed_count ?? 0)),
        latestAt,
      });
    }
  }

  const topFailedIps = [...byIp.values()]
    .sort((a, b) => (b.sumFailed - a.sumFailed) || (b.maxFailed - a.maxFailed))
    .slice(0, 20);

  const recentAuditLogs = audits.map((row) => {
    const member = Array.isArray(row.member_account) ? row.member_account[0] : row.member_account;
    return {
      id: row.id,
      action: row.action,
      detail: row.detail ?? {},
      createdAt: row.created_at,
      ip: row.ip,
      userAgent: row.user_agent,
      member: {
        email: member?.email ?? null,
        memberName: member?.member_name ?? null,
      },
    };
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    lockedAccountsCount: lockedAccounts.length,
    lockedAccounts: lockedAccounts.map((x) => ({
      id: x.id,
      email: x.email,
      memberName: x.member_name,
      failedLoginCount: x.failed_login_count,
      loginLockedUntil: x.login_locked_until,
    })),
    topFailedIps,
    recentAuditLogs,
  });
}
