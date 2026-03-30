import { NextResponse } from "next/server";
import { buildPasswordHash, clearAllMemberSessions, getCurrentMember, verifyPassword } from "@/lib/memberAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { isStrongPassword } from "@/lib/memberValidation";
import { writeMemberAuditLog } from "@/lib/memberSecurity";

export async function PUT(req: Request) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "請先登入會員。" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "請填妥所有密碼欄位。" }, { status: 400 });
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

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("member_account")
      .select("password_hash")
      .eq("id", member.id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "找不到會員資料。" }, { status: 404 });
    }
    if (!verifyPassword(currentPassword, String(data.password_hash ?? ""))) {
      return NextResponse.json({ error: "舊密碼不正確。" }, { status: 401 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "新密碼不可與舊密碼相同。" }, { status: 400 });
    }

    const newHash = buildPasswordHash(newPassword);
    const { error: updateError } = await supabase
      .from("member_account")
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id);

    if (updateError) {
      return NextResponse.json({ error: "更改密碼失敗。" }, { status: 500 });
    }

    await clearAllMemberSessions(member.id);
    await writeMemberAuditLog(member.id, "change_password", {
      changedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      forcedRelogin: true,
      message: "密碼已更新，已登出所有裝置，請重新登入。",
    });
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }
}
