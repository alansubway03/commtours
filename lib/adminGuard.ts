import { headers } from "next/headers";
import { getCurrentMember } from "@/lib/memberAuth";

export async function requireAdminKey() {
  const expected = process.env.ADMIN_DASHBOARD_KEY?.trim();
  if (!expected) {
    return { ok: false as const, status: 500, error: "伺服器未設定 ADMIN_DASHBOARD_KEY。" };
  }

  const h = await headers();
  const provided = h.get("x-admin-key")?.trim() || "";
  if (!provided || provided !== expected) {
    return { ok: false as const, status: 401, error: "未授權。" };
  }
  return { ok: true as const };
}

/**
 * Admin 授權：
 * - 允許用會員 session 登入（email/密碼登入同 `/api/member/login`，但 member_account.is_admin=true 才行）
 * - 同時保留 `ADMIN_DASHBOARD_KEY` + header 的授權（方便你舊模式除錯）
 */
export async function requireAdmin() {
  const member = await getCurrentMember();
  if (member?.isAdmin) {
    return { ok: true as const };
  }

  // 沒有 session admin 時，才嘗試 admin key
  const expected = process.env.ADMIN_DASHBOARD_KEY?.trim();
  if (!expected) {
    return { ok: false as const, status: 401, error: "未授權。" };
  }

  const h = await headers();
  const provided = h.get("x-admin-key")?.trim() || "";
  if (!provided || provided !== expected) {
    return { ok: false as const, status: 401, error: "未授權。" };
  }
  return { ok: true as const };
}
