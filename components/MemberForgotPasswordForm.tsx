"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MemberForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/member/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(json.error ?? "提交失敗，請稍後再試。");
      return;
    }
    setMessage(json.message ?? "如果此 email 已註冊，我們已寄出重設密碼連結。");
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-bold">忘記密碼</h1>
        <p className="text-sm text-muted-foreground">輸入註冊 email，我們會寄重設連結給你。</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            寄出重設連結
          </Button>
          <p className="text-sm text-muted-foreground">
            <Link href="/member" className="underline">
              返回會員登入
            </Link>
          </p>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

