import { headers } from "next/headers";

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
