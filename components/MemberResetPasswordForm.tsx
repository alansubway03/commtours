"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
}

export function MemberResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const checks = useMemo(() => getPasswordChecks(newPassword), [newPassword]);
  const valid = checks.minLength && checks.hasLetter && checks.hasNumber;
  const matched = confirmPassword.length > 0 && confirmPassword === newPassword;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setMessage("重設連結無效，請重新申請。");
      return;
    }
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/member/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        newPassword,
        confirmPassword,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(json.error ?? "重設失敗");
      return;
    }
    setDone(true);
    setMessage(json.message ?? "密碼已重設，請重新登入。");
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-bold">重設密碼</h1>
      </CardHeader>
      <CardContent>
        {!token ? (
          <p className="text-sm text-muted-foreground">連結缺少 token，請由 email 內連結重新進入。</p>
        ) : (
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label htmlFor="new-password-reset">新密碼</Label>
              <Input
                id="new-password-reset"
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <div className="space-y-0.5 text-xs text-muted-foreground">
                <p className={checks.minLength ? "text-green-600" : ""}>
                  {checks.minLength ? "✓" : "•"} 最少 8 字元
                </p>
                <p className={checks.hasLetter ? "text-green-600" : ""}>
                  {checks.hasLetter ? "✓" : "•"} 包含英文字母
                </p>
                <p className={checks.hasNumber ? "text-green-600" : ""}>
                  {checks.hasNumber ? "✓" : "•"} 包含數字
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-password-reset">確認新密碼</Label>
              <Input
                id="confirm-password-reset"
                type="password"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword.length > 0 ? (
                <p className={`text-xs ${matched ? "text-green-600" : "text-red-600"}`}>
                  {matched ? "✓ 密碼一致" : "密碼不一致"}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={loading || !valid || !matched || done}>
              送出重設
            </Button>
          </form>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          <Link href="/member" className="underline">
            返回會員登入
          </Link>
        </p>
        {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}

