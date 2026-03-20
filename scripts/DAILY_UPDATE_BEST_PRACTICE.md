# 每日更新旅行團 — 實務建議

## 1. 流程（你已有）

- **抓取**：`scrape-tours-playwright.ts` 依 `SITES` / `SKIP_SITES` 抓各旅行社，產出 `scripts/output/tours-*.json`。
- **寫入**：`push-tours-to-supabase.ts --upsert` 以 `source_key` 做 upsert，重跑不會重複、只會更新。
- **一鍵執行**：`npm run daily-tours`（或直接跑 `.\scripts\daily-update-tours.ps1`）＝ 先抓再 push 有產出的檔案。

這套流程本身就很適合「每日跑一次」。

---

## 2. 在哪裡跑（重要）

| 方式 | 適合嗎 | 說明 |
|------|--------|------|
| **Vercel / 一般 serverless** | ❌ 不適合 | Playwright 要開瀏覽器、跑數分鐘，容易超時、記憶體爆；且 Vercel 不適合裝 Chromium。 |
| **本機 / 自管主機 / VPS** | ✅ 推薦 | 用 **cron**（Linux）或 **Windows 工作排程器** 每天固定時間跑 `npm run daily-tours`。 |
| **GitHub Actions** | ✅ 可行 | 用 `schedule` 每天觸發一次 workflow，在 runner 上 `npm ci`、`npx playwright install chromium`、再跑抓取＋push。注意：免費額度有分鐘數上限，跑太久要省著用。 |

結論：**每日更新建議在「有 Node + Playwright 的環境」排程執行**（本機、VPS、或 GitHub Actions），不要放在 Vercel 上跑抓取。

---

## 3. 排程怎麼設

### Windows（本機 / 伺服器）

1. 開啟「工作排程器」→ 建立基本工作。
2. 觸發程序：**每日**，選一個離峰時間（例如 03:00）。
3. 動作：**啟動程式**  
   - 程式：`powershell.exe`  
   - 引數：`-ExecutionPolicy Bypass -NoProfile -File "C:\path\to\tour-compare\scripts\daily-update-tours.ps1"`  
   - 開始於：`C:\path\to\tour-compare`（專案根目錄）。
4. 若需用到 `.env.local`，可同上；或把 `NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY` 設成**系統環境變數**，腳本會沿用。

### Linux / VPS（cron）

```bash
# 每天 3:00 跑（依實際路徑改）
0 3 * * * cd /home/user/tour-compare && npm run daily-tours >> /var/log/daily-tours.log 2>&1
```

建議：`npm run daily-tours` 用專案裡的 Node（例如 `nvm use` 或絕對路徑的 `npm`），避免 cron 環境沒有正確的 Node 版本。

### GitHub Actions（範例）

在 `.github/workflows/daily-tours.yml` 用 `schedule` 每天觸發，步驟大致：

1. checkout、設定 Node。
2. `npm ci`、`npx playwright install chromium`（必要時加 `dependencies`）。
3. 把 `SUPABASE_SERVICE_ROLE_KEY`、`NEXT_PUBLIC_SUPABASE_URL` 設成 **Repository secrets**，在 workflow 裡用 `env` 帶入。
4. 執行 `npm run daily-tours`（或先 `npm run scrape-tours` 再逐檔 `npx tsx scripts/push-tours-to-supabase.ts --upsert ...`）。

這樣就做到「每日一次」在 GitHub 的機器上跑抓取並寫入 Supabase。

---

## 4. 最佳實踐整理

- **只跑一次、用 upsert**：每天跑一輪即可，用 `source_key` upsert，避免重複與衝突。
- **失敗不拖垮全部**：若未來改成「逐站抓、逐站 push」，某一站失敗時只 log 該站，其餘照常 push（你目前是全部抓完再依檔案 push，已算單一失敗不影響其他檔案）。
- **秘密不放進程式碼**：Supabase 金鑰用 `.env.local` 或系統環境變數或 GitHub Secrets，不要 commit。
- **日誌**：排程執行時把 stdout/stderr 寫到檔案（例如 `>> daily-tours.log 2>&1`），方便日後查錯。
- **禮貌抓取**：一天一次、離峰時段跑即可，不必再特別限速；若某站有明確 rate limit 再考慮加 delay。
- **監控（可選）**：若用 GitHub Actions，可加 step：當 `scrape` 或 `push` 失敗時發 Slack/Discord/Email（例如 `uses: 8398a7/action-slack` 或類似）。

---

## 5. 小結

- **Best practice**：在**有 Playwright 的環境**（本機 / VPS / GitHub Actions）用 **cron 或工作排程器** 每天跑一次 `npm run daily-tours`，用現有 upsert 寫入 Supabase；**不要**在 Vercel 上跑抓取。
- 你現在的 `daily-update-tours.ps1` ＋ `npm run daily-tours` 已符合上述做法，只要把排程設好、秘密管理好、有日誌即可。
