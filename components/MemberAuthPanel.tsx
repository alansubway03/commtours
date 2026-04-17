"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { isValidTel } from "@/lib/memberValidation";

type Member = {
  id: string;
  email: string;
  tel: string;
  memberName: string;
  weeklyPromoSubscribed: boolean;
  isAdmin?: boolean;
};

function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
}

function isLikelyValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isLikelyValidTel(value: string) {
  return isValidTel(value);
}

export function MemberAuthPanel({ initialMember = null }: { initialMember?: Member | null }) {
  const [member, setMember] = useState<Member | null>(initialMember);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerTel, setRegisterTel] = useState("");
  const [registerMemberName, setRegisterMemberName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerSubscribe, setRegisterSubscribe] = useState(true);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileTel, setProfileTel] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const registerPasswordChecks = getPasswordChecks(registerPassword);
  const registerPasswordValid =
    registerPasswordChecks.minLength &&
    registerPasswordChecks.hasLetter &&
    registerPasswordChecks.hasNumber;
  const newPasswordChecks = getPasswordChecks(newPassword);
  const newPasswordValid =
    newPasswordChecks.minLength &&
    newPasswordChecks.hasLetter &&
    newPasswordChecks.hasNumber;
  const confirmPasswordMatched = confirmPassword.length > 0 && confirmPassword === newPassword;
  const registerEmailValid = isLikelyValidEmail(registerEmail);
  const registerTelValid = isLikelyValidTel(registerTel);
  const profileEmailValid = isLikelyValidEmail(profileEmail);
  const profileTelValid = isLikelyValidTel(profileTel);

  async function refreshMe() {
    const res = await fetch("/api/member/me");
    const json = await res.json();
    const me = (json.member ?? null) as Member | null;
    setMember(me);
    if (me) {
      setProfileEmail(me.email ?? "");
      setProfileTel(me.tel ?? "");
    }
  }

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setVerifyMessage("");
    const res = await fetch("/api/member/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: registerEmail,
        tel: registerTel,
        memberName: registerMemberName,
        password: registerPassword,
        weeklyPromoSubscribed: registerSubscribe,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(json.error ?? "註冊失敗");
      return;
    }
    if (json.needEmailVerification) {
      setPendingVerifyEmail(String(json.email ?? registerEmail).trim());
      setVerifyCode("");
      setMessage(
        String(json.message ?? (json.codeSent ? "註冊成功，驗證碼已寄出。" : "註冊成功，請重發驗證碼後完成驗證。"))
      );
      return;
    }
    setMessage("註冊成功。");
    await refreshMe();
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setVerifyMessage("");
    const res = await fetch("/api/member/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (json.needEmailVerification) {
        setPendingVerifyEmail(String(json.email ?? loginEmail).trim());
        setVerifyCode("");
      }
      setMessage(json.error ?? "登入失敗");
      return;
    }
    setMessage("登入成功。");
    await refreshMe();
  }

  async function onLogout() {
    setLoading(true);
    setMessage("");
    await fetch("/api/member/logout", { method: "POST" });
    setLoading(false);
    setMember(null);
    setMessage("已登出。");
  }

  async function onVerifyEmail(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setVerifyMessage("");
    const res = await fetch("/api/member/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingVerifyEmail, code: verifyCode }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setVerifyMessage(json.error ?? "驗證失敗");
      return;
    }
    setMessage(json.message ?? "Email 驗證成功。");
    setVerifyMessage("");
    setPendingVerifyEmail("");
    setVerifyCode("");
    await refreshMe();
  }

  async function onResendEmailOtp() {
    setLoading(true);
    setVerifyMessage("");
    const res = await fetch("/api/member/verify-email/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingVerifyEmail }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setVerifyMessage(json.error ?? "重發失敗");
      return;
    }
    setVerifyMessage(json.message ?? "驗證碼已重發。");
  }

  async function toggleSubscribe(next: boolean) {
    setLoading(true);
    const res = await fetch("/api/member/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscribed: next }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(json.error ?? "更新訂閱失敗");
      return;
    }
    setMessage(next ? "已訂閱每週推廣 email。" : "已取消每週推廣 email。");
    await refreshMe();
  }

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/member/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: profileEmail,
        tel: profileTel,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(json.error ?? "更新資料失敗");
      return;
    }
    setMessage("會員資料已更新。");
    await refreshMe();
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/member/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(json.error ?? "更改密碼失敗");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage(json.message ?? "密碼已更新，請重新登入。");
    setMember(null);
    setTab("login");
    setIsEditing(false);
  }

  if (member) {
    return (
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">會員中心</h1>
          <p className="text-sm text-muted-foreground">
            已登入：{member.memberName}（{member.email}）
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 rounded-md border p-3 text-sm">
            <p>會員名稱：{member.memberName}</p>
            <p>Email：{member.email}</p>
            <p>電話：{member.tel}</p>
          </div>
          {!isEditing ? (
            <Button type="button" onClick={() => setIsEditing(true)}>
              更改資料
            </Button>
          ) : (
            <>
              <form className="space-y-3 rounded-md border p-3" onSubmit={onSaveProfile}>
                <p className="text-sm font-medium">更改 Email / 電話</p>
                <div className="space-y-1">
                  <Label htmlFor="profile-name">會員名稱（不可更改）</Label>
                  <Input id="profile-name" value={member.memberName} disabled />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                  />
                  {profileEmail.length > 0 && !profileEmailValid ? (
                    <p className="text-xs text-red-600">email 格式不正確</p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="profile-tel">電話</Label>
                  <Input
                    id="profile-tel"
                    type="tel"
                    value={profileTel}
                    onChange={(e) => setProfileTel(e.target.value)}
                    required
                  />
                  {profileTel.length > 0 && !profileTelValid ? (
                    <p className="text-xs text-red-600">電話格式不正確（6-20 字元，且至少 6 位數字）</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading || !profileEmailValid || !profileTelValid}>
                    儲存資料
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    取消
                  </Button>
                </div>
              </form>
              <form className="space-y-3 rounded-md border p-3" onSubmit={onChangePassword}>
                <p className="text-sm font-medium">更改密碼</p>
                <div className="space-y-1">
                  <Label htmlFor="current-password">舊密碼</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-password">新密碼（需英文字母+數字，最少 8 字）</Label>
                  <Input
                    id="new-password"
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <p className={newPasswordChecks.minLength ? "text-green-600" : ""}>
                      {newPasswordChecks.minLength ? "✓" : "•"} 最少 8 字元
                    </p>
                    <p className={newPasswordChecks.hasLetter ? "text-green-600" : ""}>
                      {newPasswordChecks.hasLetter ? "✓" : "•"} 包含英文字母
                    </p>
                    <p className={newPasswordChecks.hasNumber ? "text-green-600" : ""}>
                      {newPasswordChecks.hasNumber ? "✓" : "•"} 包含數字
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirm-password">確認新密碼</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword.length > 0 ? (
                    <p className={`text-xs ${confirmPasswordMatched ? "text-green-600" : "text-red-600"}`}>
                      {confirmPasswordMatched ? "✓ 密碼一致" : "密碼不一致"}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={loading || !newPasswordValid || !confirmPasswordMatched}
                >
                  更新密碼
                </Button>
              </form>
            </>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="weekly-promo"
              checked={member.weeklyPromoSubscribed}
              onCheckedChange={(v) => {
                void toggleSubscribe(Boolean(v));
              }}
              disabled={loading}
            />
            <Label htmlFor="weekly-promo">接收每星期推廣（Email）</Label>
          </div>
          <Button type="button" variant="outline" onClick={onLogout} disabled={loading}>
            登出
          </Button>
          {member.isAdmin ? (
            <Button type="button" asChild>
              <Link href="/admin/reviews">前往 Admin 審核頁</Link>
            </Button>
          ) : null}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-bold">會員註冊 / 登入</h1>
        <p className="text-sm text-muted-foreground">註冊後可提交旅行團評分</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={tab === "login" ? "default" : "outline"}
            onClick={() => setTab("login")}
          >
            登入
          </Button>
          <Button
            type="button"
            variant={tab === "register" ? "default" : "outline"}
            onClick={() => setTab("register")}
          >
            註冊
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pendingVerifyEmail ? (
          <form className="mb-6 space-y-3 rounded-md border p-3" onSubmit={onVerifyEmail}>
            <p className="text-sm font-medium">請先完成 Email 驗證</p>
            <p className="text-xs text-muted-foreground">
              已向 <span className="font-medium">{pendingVerifyEmail}</span> 發送 6 位數驗證碼。
            </p>
            <div className="space-y-1">
              <Label htmlFor="verify-email">Email</Label>
              <Input
                id="verify-email"
                type="email"
                value={pendingVerifyEmail}
                onChange={(e) => setPendingVerifyEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="verify-code">驗證碼（6 位數）</Label>
              <Input
                id="verify-code"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading || verifyCode.length !== 6}>
                驗證並登入
              </Button>
              <Button type="button" variant="outline" disabled={loading} onClick={onResendEmailOtp}>
                重發驗證碼
              </Button>
            </div>
            {verifyMessage ? <p className="text-sm text-muted-foreground">{verifyMessage}</p> : null}
          </form>
        ) : null}

        {tab === "register" ? (
          <form className="space-y-3" onSubmit={onRegister}>
            <div className="space-y-1">
              <Label htmlFor="register-member-name">會員名稱</Label>
              <Input
                id="register-member-name"
                value={registerMemberName}
                onChange={(e) => setRegisterMemberName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">格式：2-20 字，只限英文字母及數字</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
              {registerEmail.length > 0 && !registerEmailValid ? (
                <p className="text-xs text-red-600">email 格式不正確</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="register-tel">電話</Label>
              <Input
                id="register-tel"
                type="tel"
                value={registerTel}
                onChange={(e) => setRegisterTel(e.target.value)}
                required
              />
              {registerTel.length > 0 && !registerTelValid ? (
                <p className="text-xs text-red-600">電話格式不正確（6-20 字元，且至少 6 位數字）</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="register-password">密碼（最少 8 字）</Label>
              <Input
                id="register-password"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
                minLength={8}
              />
              <div className="space-y-0.5 text-xs text-muted-foreground">
                <p className={registerPasswordChecks.minLength ? "text-green-600" : ""}>
                  {registerPasswordChecks.minLength ? "✓" : "•"} 最少 8 字元
                </p>
                <p className={registerPasswordChecks.hasLetter ? "text-green-600" : ""}>
                  {registerPasswordChecks.hasLetter ? "✓" : "•"} 包含英文字母
                </p>
                <p className={registerPasswordChecks.hasNumber ? "text-green-600" : ""}>
                  {registerPasswordChecks.hasNumber ? "✓" : "•"} 包含數字
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="register-subscribe"
                checked={registerSubscribe}
                onCheckedChange={(v) => setRegisterSubscribe(Boolean(v))}
              />
              <Label htmlFor="register-subscribe">訂閱每星期推廣（Email）</Label>
            </div>
            <Button
              type="submit"
              disabled={loading || !registerPasswordValid || !registerEmailValid || !registerTelValid}
            >
              建立會員
            </Button>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={onLogin}>
            <div className="space-y-1">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="login-password">密碼</Label>
              <Input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              登入
            </Button>
            <p className="text-sm text-muted-foreground">
              <Link href="/member/forgot-password" className="underline">
                忘記密碼？
              </Link>
            </p>
          </form>
        )}
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
