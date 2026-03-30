import { MemberAuthPanel } from "@/components/MemberAuthPanel";
import { getCurrentMember } from "@/lib/memberAuth";

export default async function MemberPage() {
  const member = await getCurrentMember();

  return (
    <div className="container max-w-2xl px-4 py-8">
      <MemberAuthPanel initialMember={member} />
    </div>
  );
}
