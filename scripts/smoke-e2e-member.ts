/**
 * 會員流程 smoke e2e（簡易版）
 *
 * 用法：
 *   1) 另開終端機：npm run dev（勿用裸指令 next dev，除非 PATH 有 next）
 *   2) npx tsx scripts/smoke-e2e-member.ts
 *   或 SMOKE_BASE_URL=http://localhost:3000 npx tsx scripts/smoke-e2e-member.ts
 *
 * 會先等待首頁可連線（約 45 秒）；不要等待可設 SMOKE_SKIP_SERVER_WAIT=1
 *
 * 可選：管理安全概覽 API（須與伺服器 .env.local 的 ADMIN_DASHBOARD_KEY 相同）
 *   SMOKE_ADMIN_KEY=你的密鑰 npx tsx scripts/smoke-e2e-member.ts
 *
 * 含登入失敗鎖定（帳號維度）：需已套用 migration 013／014 與 SERVICE ROLE。
 */
const base = process.env.SMOKE_BASE_URL?.trim() || "http://localhost:3000";
const smokeAdminKey = process.env.SMOKE_ADMIN_KEY?.trim();
const skipServerWait = process.env.SMOKE_SKIP_SERVER_WAIT === "1";

/** 與 lib/memberSecurity.ts 的 LOGIN_MAX_ATTEMPTS 保持一致 */
const LOGIN_MAX_ATTEMPTS = 5;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** 給「先跑 smoke、另一窗才啟動 dev」一點緩衝；完全沒開伺服器則逾時後仍會失敗 */
async function waitForDevServer(origin: string) {
  const root = `${origin.replace(/\/$/, "")}/`;
  const maxAttempts = 45;
  const intervalMs = 1000;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(root, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.status > 0) return;
    } catch {
      /* ECONNREFUSED、逾時等：重試 */
    }
    if (i === 0) {
      console.log(
        `等待可連線至 ${root}（最長約 ${maxAttempts} 秒）。請在「另一個」PowerShell 視窗執行：npm run dev`
      );
    } else if (i % 5 === 0) {
      console.log(`  仍等待… 約 ${i} 秒（確認 3000 port 無被占用、防火牆沒擋本機）`);
    }
    await sleep(intervalMs);
  }
  throw new Error("fetch failed");
}

type HttpRes = { status: number; body: string };

async function run() {
  let cookie = "";
  const rand = Math.floor(100000 + Math.random() * 900000);
  const email = `smoke${rand}@example.com`;
  const memberName = `Smoke${rand}`;

  async function req(path: string, init?: RequestInit): Promise<HttpRes> {
    const headers = new Headers(init?.headers ?? {});
    if (cookie) headers.set("cookie", cookie);
    const res = await fetch(`${base}${path}`, { ...init, headers });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0] ?? "";
    return { status: res.status, body: await res.text() };
  }

  /** 不帶 session cookie，避免干擾登入鎖定計次 */
  async function postLoginOnly(body: object): Promise<HttpRes> {
    const res = await fetch(`${base}/api/member/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.text() };
  }

  function assertOk(label: string, cond: boolean, detail: string) {
    if (!cond) throw new Error(`${label} 失敗: ${detail}`);
    console.log(`✓ ${label}`);
  }

  console.log(`Smoke base: ${base}`);
  if (!skipServerWait) {
    await waitForDevServer(base);
    console.log("✓ 已連上開發伺服器");
  }

  const register = await req("/api/member/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      tel: "+852 9123 4567",
      memberName,
      yearlyTrips: 3,
      yearlyGroupTours: 1,
      password: "abc12345",
      weeklyPromoSubscribed: true,
    }),
  });
  assertOk("註冊", register.status === 200, `${register.status} ${register.body}`);

  const me1 = await req("/api/member/me");
  assertOk("註冊後已登入", me1.status === 200 && me1.body.includes('"authenticated":true'), me1.body);

  const profile = await req("/api/member/profile", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      tel: "+852 9876 5432",
    }),
  });
  assertOk("更新 email/電話", profile.status === 200, `${profile.status} ${profile.body}`);

  const password = await req("/api/member/password", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      currentPassword: "abc12345",
      newPassword: "new12345",
      confirmPassword: "new12345",
    }),
  });
  assertOk("更改密碼", password.status === 200, `${password.status} ${password.body}`);

  const logout = await req("/api/member/logout", { method: "POST" });
  assertOk("登出", logout.status === 200, `${logout.status} ${logout.body}`);

  const me2 = await req("/api/member/me");
  assertOk("登出後未登入", me2.status === 200 && me2.body.includes('"authenticated":false'), me2.body);

  const finalPassword = "new12345";
  const wrongPassword = "definitely-wrong-pass9";
  for (let i = 1; i < LOGIN_MAX_ATTEMPTS; i++) {
    const bad = await postLoginOnly({ email, password: wrongPassword });
    assertOk(
      `錯誤密碼登入第 ${i} 次應 401`,
      bad.status === 401,
      `${bad.status} ${bad.body}`
    );
  }
  const lockNth = await postLoginOnly({ email, password: wrongPassword });
  assertOk(
    `第 ${LOGIN_MAX_ATTEMPTS} 次錯誤密碼應鎖定帳號 (429)`,
    lockNth.status === 429,
    `${lockNth.status} ${lockNth.body}`
  );
  const stillLocked = await postLoginOnly({ email, password: finalPassword });
  assertOk(
    "鎖定期間正確密碼仍應拒絕 (429)",
    stillLocked.status === 429,
    `${stillLocked.status} ${stillLocked.body}`
  );

  const reviewNoAuth = await req("/api/reviews", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      tourId: 1,
      itineraryRating: 5,
      mealRating: 5,
      hotelRating: 5,
      guideRating: 5,
      willRebook: true,
      comment: "smoke",
      extraInfo: "smoke",
      participationProof: "smoke",
      photos: [{ storagePath: "smoke.jpg", publicUrl: "https://example.com/smoke.jpg" }],
    }),
  });
  assertOk("未登入不可提交評分", reviewNoAuth.status === 401, `${reviewNoAuth.status} ${reviewNoAuth.body}`);

  const adminNoKey = await fetch(`${base}/api/admin/security/overview`);
  const adminNoKeyText = await adminNoKey.text();
  const adminRejectedNoKey =
    adminNoKey.status === 401 ||
    (adminNoKey.status === 500 && adminNoKeyText.includes("ADMIN_DASHBOARD_KEY"));
  assertOk(
    "管理 API 無密鑰應拒絕（或伺服器未設定密鑰變數）",
    adminRejectedNoKey,
    `${adminNoKey.status} ${adminNoKeyText}`
  );

  if (smokeAdminKey) {
    const adminOk = await fetch(`${base}/api/admin/security/overview`, {
      headers: { "x-admin-key": smokeAdminKey },
    });
    const adminText = await adminOk.text();
    assertOk(
      "管理 API 正確密鑰可讀取",
      adminOk.status === 200 && adminText.includes('"generatedAt"'),
      `${adminOk.status} ${adminText.slice(0, 400)}`
    );
  } else {
    console.log("○ 略過管理 API 正密鑰測試（未設定 SMOKE_ADMIN_KEY）");
  }

  console.log("✅ Smoke e2e 通過");
}

run().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("❌ Smoke e2e 失敗:", msg);
  const looksLikeNoServer =
    msg.includes("fetch failed") ||
    msg.includes("ECONNREFUSED") ||
    /Failed to fetch/i.test(msg);
  if (looksLikeNoServer) {
    console.error(
      `提示：無法連到 ${base}。請在專案目錄先啟動開發伺服器後再跑 smoke：\n  npm run dev\n（勿直接打 next dev，除非已全域安裝 CLI 或使用 npx next dev）`
    );
  }
  process.exit(1);
});
