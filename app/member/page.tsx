import type { Metadata } from "next";
import { MemberAuthPanel } from "@/components/MemberAuthPanel";
import { getCurrentMember } from "@/lib/memberAuth";
import { NOINDEX_FOLLOW } from "@/lib/seo/listingPage";

export const metadata: Metadata = {
  title: "會員登入",
  robots: NOINDEX_FOLLOW,
};

export default async function MemberPage() {
  const member = await getCurrentMember();

  return (
    <div className="container max-w-2xl px-4 py-8">
      <MemberAuthPanel initialMember={member} />
    </div>
  );
}
