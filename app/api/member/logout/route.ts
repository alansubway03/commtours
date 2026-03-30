import { NextResponse } from "next/server";
import { clearCurrentMemberSession } from "@/lib/memberAuth";

export async function POST() {
  await clearCurrentMemberSession();
  return NextResponse.json({ ok: true });
}
