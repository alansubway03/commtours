# 用 OpenClaw / Playwright 抓旅行社資料並寫入 Supabase

## 流程概覽

```
各大旅行社網站 → OpenClaw (browser) 或 scrape-tours-playwright.ts → JSON
                                                                          ↓
                                            push-tours-to-supabase.ts → Supabase public.tour
```

**第一次操作建議**：請直接看 **`scripts/OPENCLAW_STEP_BY_STEP.md`**，內有從 OpenClaw 安裝到寫入 Supabase 的逐步說明，以及五家旅行社的 URL 與每站 10 筆的目標。

**之後要擴充到很多旅行社**：看 **`scripts/SCRAPING_STRATEGY.md`**，並用 **`scripts/agencies.config.json`** 管理旅行社清單（新增一家就加一筆）。

## EGL 新版「長線」列表（API，推薦）

列表頁資料來自 `POST https://www.egltours.com/website-api/api/web-routes/search`（長線 `locationUUID`），唔使 Playwright。

```bash
npm run scrape:egl-api
```

輸出：`scripts/output/tours-egl-tour-line.json`（團名、價錢、出發日、成團狀態、圖、itinerary 連結）。  
可選：`EGL_PAGE_SIZE`、`EGL_MAX_PAGES`。再 upsert：`npx tsx scripts/push-tours-to-supabase.ts --upsert scripts/output/tours-egl-tour-line.json`

## 客人用 CSV 填資料 → 上傳 Supabase

1. **範本**：`scripts/templates/旅行團資料範本.csv`（若需重產：`npm run csv:template`）  
2. 客人在 CSV 第 2 列開始填寫；**刪除或覆寫「範例旅行社」那一列**（該列不會匯入）。  
3. **上傳**（需 `.env.local` 有 `NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`）：

   ```bash
   npm run csv:upload -- path/to/客人填的.csv
   ```

4. 先檢查不寫入：`npm run csv:upload -- --dry-run path/to/檔案.csv`  
5. 同一 **旅行社 + 行程名稱 + 目的地 + 天數** 視為同一筆，重複上傳會 **更新（upsert）**。

## 一、OpenClaw 抓取

1. **安裝與設定 OpenClaw**  
   依 [OpenClaw 文件](https://openclawdoc.com/docs/cookbook/web-scraping) 安裝，並設定搜尋/抓取用的 API key（例如 Brave Search）。

2. **工具選擇**
   - **web_fetch**：靜態 HTML、列表頁，用 URL 直接抓內容（不執行 JS）。
   - **browser**：要登入、點選、無限捲動的網站，用 browser 自動化。

3. **每家旅行社一個設定檔**  
   複製 `openclaw-tour-scraper.example.yaml`，把 `url` 改成該旅行社的旅行團列表頁，並依實際 HTML 改 `selectors.container` 和 `selectors.fields`（用開發者工具看 class / 結構）。

4. **對應到我們的欄位**  
   抓出來的欄位要能對應到 Supabase `tour` 表：

   | 我們的欄位 | 說明 |
   |-----------|------|
   | agency | 旅行社名稱（可寫死在設定或依 URL 判斷） |
   | type | 固定為 longhaul / cruise / cruise_ticket / hiking / diving / festival 其一 |
   | title | 行程標題 |
   | destination | 目的地 |
   | region | 地區（如歐洲、亞洲） |
   | days | 天數（數字） |
   | price_range | 價錢字串，如 "$28,000-$35,000" |
   | departure_date_statuses | 見下方三種寫法（寫入 DB 前會正規化成陣列） |
   | departure_dates | （選用）僅日期字串陣列；無 statuses 時會變成逐日「未成團」 |

   **`departure_date_statuses` 可擇一：**

   ```json
   { "22/04": "成團", "23/04": "快將成團", "25/04": "未成團" }
   ```

   ```json
   ["22/04:成團", "23/04:快將成團"]
   ```

   ```json
   [{ "date": "22/04", "status": "成團" }]
   ```

   狀態僅限：`成團`、`快將成團`、`未成團`（打錯會當成未成團）；字串陣列請用 **英文冒號 `:`** 分隔日期與狀態。

   | 我們的欄位 | 說明 |
   |-----------|------|
   | features | 特色陣列，如 ["純玩","無購物"] |
   | affiliate_links | `{ "wingon": "url", "tripdotcom": "url" }` |
   | image_url | 主圖 URL |

5. **匯出 JSON**  
   OpenClaw 跑完後，把結果匯出成 JSON 陣列，每筆物件包含上表欄位（欄位名一致即可，腳本會做基本正規化）。

## 二、寫入 Supabase

1. **環境變數**（專案根目錄 `.env.local` 或執行時 export）  
   - `NEXT_PUBLIC_SUPABASE_URL`  
   - `SUPABASE_SERVICE_ROLE_KEY`（建議用 service role，才能繞過 RLS 寫入；勿提交到 git）  
   若沒有 service role key，就要在 Supabase Dashboard 為 `tour` 表新增 INSERT policy，並用 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。

2. **可選：預設旅行社**  
   `SCRAPER_AGENCY=永安旅遊` 會套用到每筆沒有 `agency` 的記錄。

3. **執行**

   ```bash
   # 從檔案讀取（單純新增）
   npx tsx scripts/push-tours-to-supabase.ts scripts/tours-sample.json

   # 每日更新用：有則更新、無則新增（需先執行 migration 003_tour_source_key.sql）
   npx tsx scripts/push-tours-to-supabase.ts --upsert scripts/output/tours-wingon.json
   ```

   腳本會把 JSON 陣列每筆轉成 `tour` 表格式並 `INSERT`；加 `--upsert` 時會依 `source_key` 做 upsert。

## 三、JSON 格式範例

見 `scripts/tours-sample.json`。每筆至少要有：`agency`、`type`、`title`、`destination`、`region`、`days`、`price_range`，其餘可省略（會用預設或空陣列/空物件）。

## 四、每日更新（留意旅行社更新 → 更新 Supabase）

要讓腳本**每天自動**抓五家旅行社並更新 Supabase（有則更新、無則新增，不重複堆積）：

1. **先跑一次 migration**（Supabase SQL Editor 執行 `supabase/migrations/003_tour_source_key.sql`），為 `tour` 表加上 `source_key` 欄位與 unique index。

2. **手動跑一次「每日流程」**：
   ```powershell
   cd C:\Users\User\tour-compare
   .\scripts\daily-update-tours.ps1
   ```
   或：
   ```powershell
   npm run scrape-tours
   npx tsx scripts/push-tours-to-supabase.ts --upsert scripts/output/tours-wingon.json
   npx tsx scripts/push-tours-to-supabase.ts --upsert scripts/output/tours-egl.json
   # ... 其餘三家同理
   ```

3. **Windows 排程：每天自動跑**  
   - 開啟「工作排程器」→ 建立基本工作 → 名稱例如「每日更新旅行團」、每日、時間自訂。  
   - 動作選「啟動程式」：  
     - 程式：`powershell.exe`  
     - 引數：`-ExecutionPolicy Bypass -NoProfile -File "C:\Users\User\tour-compare\scripts\daily-update-tours.ps1"`  
     - 開始於：`C:\Users\User\tour-compare`  
   - 這樣每天到點就會自動抓五家並 upsert 到 Supabase。

`--upsert` 會依 `source_key`（agency + title + destination + days）辨識同一筆行程，存在則更新價格/日期等，不存在則新增。

## 五、注意

- **RLS**：用 script 寫入請用 `SUPABASE_SERVICE_ROLE_KEY`，或為 `tour` 表加 INSERT/UPDATE policy。
- **去重**：未加 `--upsert` 時為單純 insert，同一批跑兩次會插兩次；每日更新請用 `--upsert` 並先執行 003_tour_source_key.sql。
- **頻率**：排程建議每天一次即可，避免對旅行社網站請求過密。
