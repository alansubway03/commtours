import { Suspense } from "react";
import { MemberResetPasswordForm } from "@/components/MemberResetPasswordForm";

export default function MemberResetPasswordPage() {
  return (
    <div className="container max-w-2xl px-4 py-8">
      <Suspense fallback={<p className="text-sm text-muted-foreground">載入中...</p>}>
        <MemberResetPasswordForm />
      </Suspense>
    </div>
  );
}

