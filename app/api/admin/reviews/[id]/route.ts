import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";

type Action = "approve" | "reject";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "缺少評分 ID。" }, { status: 400 });
  }

  let body: { action?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }

  const action = body.action as Action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action 須為 approve 或 reject。" }, { status: 400 });
  }

  const note = String(body.note ?? "").trim();
  const now = new Date().toISOString();
  const moderation_status = action === "approve" ? "approved" : "rejected";

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agency_review")
    .update({
      moderation_status,
      moderated_at: now,
      moderation_note: note,
    })
    .eq("id", id)
    .select("id, moderation_status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "更新失敗。" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "找不到該評分。" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...data });
}

