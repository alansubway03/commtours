import { NextResponse } from "next/server";
import {
  attachMemberSessionCookie,
  createMemberSessionToken,
  verifyPassword,
} from "@/lib/memberAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { EmailOtpError, issueEmailOtp } from "@/lib/memberEmailOtp";
import { isValidEmail, normalizeEmail } from "@/lib/memberValidation";
import { LOGIN_LOCK_MINUTES, LOGIN_MAX_ATTEMPTS, getRequestMeta } from "@/lib/memberSecurity";

function isMissingColumnError(x: unknown): boolean {
  if (!x || typeof x !== "object") return false;
  const code = String((x as { code?: unknown }).code ?? "");
  return code === "42703";
}

export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }
  try {
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? "");
    if (!email || !password) {
      return NextResponse.json({ error: "請輸入 email 與密碼。" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "email 格式不正確。" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const meta = await getRequestMeta(req);
    const ip = meta.ip || "unknown";

    let ipAttempt: { failed_count?: number | null; locked_until?: string | null } | null = null;
    try {
      const ipRow = await supabase
        .from("member_login_attempt")
        .select("failed_count, locked_until")
        .eq("email", email)
        .eq("ip", ip)
        .maybeSingle();
      if (ipRow.error) console.error("[member_login_attempt] select", ipRow.error);
      ipAttempt = ipRow.data ?? null;
    } catch (e) {
      console.error("[member_login_attempt] select threw", e);
    }

    const ipLockUntil = ipAttempt?.locked_until ? new Date(String(ipAttempt.locked_until)) : null;
    if (ipLockUntil && ipLockUntil.getTime() > Date.now()) {
      return NextResponse.json(
        { error: `此 IP 嘗試過多，請於 ${ipLockUntil.toLocaleString("zh-HK")} 後再試。` },
        { status: 429 }
      );
    }

    let memberQuery: {
      data: Record<string, unknown> | null;
      error: { code?: string; message?: string } | null;
    };
    try {
      let mq = await supabase
        .from("member_account")
        .select(
          "id, email, member_name, password_hash, weekly_promo_subscribed, failed_login_count, login_locked_until"
        )
        .ilike("email", email)
        .maybeSingle();
      if (mq.error && isMissingColumnError(mq.error)) {
        mq = await supabase
          .from("member_account")
          .select("id, email, member_name, password_hash, weekly_promo_subscribed")
          .ilike("email", email)
          .maybeSingle();
      }
      memberQuery = mq as typeof memberQuery;
    } catch (e) {
      console.error("[member_account] login select threw", e);
      return NextResponse.json(
        { error: "無法讀取會員資料，請稍後再試。" },
        { status: 503 }
      );
    }
    const { data, error } = memberQuery;

    if (error || !data) {
      const failedCount = Number(ipAttempt?.failed_count ?? 0) + 1;
      const lockAt = failedCount >= LOGIN_MAX_ATTEMPTS
        ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000).toISOString()
        : null;
      try {
        const ur = await supabase.from("member_login_attempt").upsert(
          {
            email,
            ip,
            failed_count: failedCount,
            locked_until: lockAt,
            last_failed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email,ip" }
        );
        if (ur.error) console.error("[member_login_attempt] upsert", ur.error);
      } catch (e) {
        console.error("[member_login_attempt] upsert threw", e);
      }
      return NextResponse.json({ error: "帳號或密碼錯誤。" }, { status: 401 });
    }

    const lockUntil = data.login_locked_until ? new Date(String(data.login_locked_until)) : null;
    if (lockUntil && lockUntil.getTime() > Date.now()) {
      return NextResponse.json(
        { error: `登入失敗過多，請於 ${lockUntil.toLocaleString("zh-HK")} 後再試。` },
        { status: 429 }
      );
    }

    const passwordOk = verifyPassword(password, String(data.password_hash ?? ""));
    if (!passwordOk) {
      const failedCount = Number(data.failed_login_count ?? 0) + 1;
      const lockAt = failedCount >= LOGIN_MAX_ATTEMPTS
        ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000).toISOString()
        : null;
      try {
        const ur = await supabase
          .from("member_account")
          .update({
            failed_login_count: failedCount,
            last_failed_login_at: new Date().toISOString(),
            login_locked_until: lockAt,
          })
          .eq("id", data.id);
        if (ur.error) console.error("[member_account] update failed_login", ur.error);
      } catch (e) {
        console.error("[member_account] update failed_login threw", e);
      }
      const ipFailed = Number(ipAttempt?.failed_count ?? 0) + 1;
      const ipLockAt = ipFailed >= LOGIN_MAX_ATTEMPTS
        ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000).toISOString()
        : null;
      try {
        const ur = await supabase.from("member_login_attempt").upsert(
          {
            email,
            ip,
            failed_count: ipFailed,
            locked_until: ipLockAt,
            last_failed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email,ip" }
        );
        if (ur.error) console.error("[member_login_attempt] upsert", ur.error);
      } catch (e) {
        console.error("[member_login_attempt] upsert threw", e);
      }
      if (lockAt) {
        return NextResponse.json(
          { error: `登入失敗過多，帳號已鎖定 ${LOGIN_LOCK_MINUTES} 分鐘。` },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "帳號或密碼錯誤。" }, { status: 401 });
    }

    try {
      const ur = await supabase
        .from("member_account")
        .update({
          failed_login_count: 0,
          login_locked_until: null,
          last_failed_login_at: null,
        })
        .eq("id", data.id);
      if (ur.error) console.error("[member_account] reset login counters", ur.error);
    } catch (e) {
      console.error("[member_account] reset login counters threw", e);
    }
    try {
      const ur = await supabase.from("member_login_attempt").upsert(
        {
          email,
          ip,
          failed_count: 0,
          locked_until: null,
          last_failed_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email,ip" }
      );
      if (ur.error) console.error("[member_login_attempt] upsert", ur.error);
    } catch (e) {
      console.error("[member_login_attempt] upsert threw", e);
    }

    let emailVerifiedAt: string | null = null;
    let verifyErr: { code?: string } | null | undefined;
    try {
      const vr = await supabase
        .from("member_account")
        .select("email_verified_at")
        .eq("id", data.id)
        .maybeSingle();
      verifyErr = vr.error;
      if (!vr.error) {
        emailVerifiedAt = String(vr.data?.email_verified_at ?? "") || null;
      }
    } catch (e) {
      console.error("[member_account] email_verified_at select threw", e);
      return NextResponse.json(
        { error: "無法讀取驗證狀態，請稍後再試。" },
        { status: 503 }
      );
    }

    if (!emailVerifiedAt && !isMissingColumnError(verifyErr)) {
      let cooldownSeconds: number | undefined;
      let codeSent = false;
      let extraMessage = "";
      try {
        const issued = await issueEmailOtp(String(data.id), email);
        cooldownSeconds = issued.cooldownSeconds;
        codeSent = !issued.cooldownSeconds;
        if (issued.cooldownSeconds) {
          extraMessage = `驗證碼剛發送過，請 ${issued.cooldownSeconds} 秒後再重發。`;
        } else {
          extraMessage = "已向你的 Email 發送驗證碼。";
        }
      } catch (err) {
        if (err instanceof EmailOtpError) {
          extraMessage = err.message;
        } else {
          extraMessage = "驗證碼發送失敗，請稍後重試。";
        }
      }
      return NextResponse.json(
        {
          error: `此帳號尚未完成 Email 驗證。${extraMessage}`,
          needEmailVerification: true,
          email,
          codeSent,
          cooldownSeconds,
        },
        { status: 403 }
      );
    }

    const sessionToken = await createMemberSessionToken(String(data.id));
    if (!sessionToken) {
      return NextResponse.json(
        { error: "無法建立登入工作階段，請稍後再試。" },
        { status: 503 }
      );
    }
    const res = NextResponse.json({
      ok: true,
      member: {
        id: data.id,
        email: data.email,
        memberName: data.member_name,
        weeklyPromoSubscribed: Boolean(data.weekly_promo_subscribed),
      },
    });
    try {
      attachMemberSessionCookie(res, sessionToken);
    } catch (e) {
      console.error("[member/login] attachMemberSessionCookie", e);
      return NextResponse.json(
        { error: "無法寫入登入狀態（Cookie），請檢查瀏覽器設定後再試。" },
        { status: 503 }
      );
    }
    return res;
  } catch (err) {
    console.error("[member/login]", err);
    return NextResponse.json({ error: "登入暫時失敗，請稍後再試。" }, { status: 500 });
  }
}
