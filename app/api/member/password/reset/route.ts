import { NextResponse } from "next/server";
import { buildPasswordHash, clearAllMemberSessions, verifyPassword } from "@/lib/memberAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { isStrongPassword } from "@/lib/memberValidation";
import { hashPasswordResetToken } from "@/lib/memberPasswordReset";
import { writeMemberAuditLog } from "@/lib/memberSecurity";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = String(body.token ?? "").trim();
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "請填妥所有欄位。" }, { status: 400 });
    }
    if (!isStrongPassword(newPassword)) {
      return NextResponse.json(
        { error: "新密碼必須至少 8 字元，且同時包含英文字母與數字。" },
        { status: 400 }
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "新密碼與確認密碼不一致。" }, { status: 400 });
    }

    const tokenHash = hashPasswordResetToken(token);
    const supabase = createSupabaseAdminClient();
    const nowIso = new Date().toISOString();
    const { data: tokenRow, error: tokenErr } = await supabase
      .from("member_password_reset_token")
      .select("id, member_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (tokenErr || !tokenRow || tokenRow.used_at || String(tokenRow.expires_at) <= nowIso) {
      return NextResponse.json({ error: "重設連結無效或已過期。" }, { status: 400 });
    }

    const { data: member, error: memberErr } = await supabase
      .from("member_account")
      .select("id, password_hash")
      .eq("id", tokenRow.member_id)
      .maybeSingle();
    if (memberErr || !member) {
      return NextResponse.json({ error: "找不到會員資料。" }, { status: 404 });
    }
    if (verifyPassword(newPassword, String(member.password_hash ?? ""))) {
      return NextResponse.json({ error: "新密碼不可與舊密碼相同。" }, { status: 400 });
    }

    const newHash = buildPasswordHash(newPassword);
    const { error: updateErr } = await supabase
      .from("member_account")
      .update({
        password_hash: newHash,
        failed_login_count: 0,
        login_locked_until: null,
        last_failed_login_at: null,
        updated_at: nowIso,
      })
      .eq("id", member.id);
    if (updateErr) {
      return NextResponse.json({ error: "重設密碼失敗。" }, { status: 500 });
    }

    await supabase
      .from("member_password_reset_token")
      .update({ used_at: nowIso })
      .eq("id", tokenRow.id);
    await clearAllMemberSessions(member.id as string);
    await writeMemberAuditLog(member.id as string, "reset_password_by_token", {
      resetAt: nowIso,
    });

    return NextResponse.json({
      ok: true,
      message: "密碼已重設，請使用新密碼重新登入。",
    });
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }
}

