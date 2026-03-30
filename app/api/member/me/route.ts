import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/memberAuth";

export async function GET() {
  const member = await getCurrentMember();
  return NextResponse.json({
    authenticated: !!member,
    member,
  });
}
