# 用 OpenClaw 抓五家旅行社旅行團 → 寫入 Supabase（詳細步驟）

目標：從以下五間旅行社各抓 **10 筆**長線旅行團資料，寫入 Supabase `tour` 表，讓網站顯示最新旅行團。

---

## 旅行社網址（長線行程）

| 旅行社 | URL |
|--------|-----|
| 永安旅遊 | https://www.wingontravel.com/tours/dest/LongHaultravel-5-5 |
| EGL 東瀛遊 | https://www.egltours.com/website/tour-line/長線 |
| 金怡假期 | https://www.goldjoy.com/tour |
| Jetour 捷旅 | https://www.jetour.com.hk/tour |
| 縱橫遊 WWPKG | https://www.wwpkg.com.hk/tour/summary |

長線定義：東南亞、中國以外（澳洲、美洲、歐洲、中東等）。

---

## 第一步：確認 OpenClaw 已安裝並可執行

1. 開啟終端機，確認 Node 版本 ≥ 20：
   ```bash
   node -v
   ```

2. 若尚未安裝 OpenClaw，執行：
   ```bash
   npm install -g openclaw
   ```

3. **首次設定**（OpenClaw 沒有 `init` 指令，請用以下其一）：
   - **引導精靈**（建議）：
     ```bash
     openclaw onboard
     ```
     或只裝設定、不裝 daemon：
     ```bash
     openclaw onboard --flow quickstart
     ```
     會引導你設定：模型/API、Gateway、Workspace、Skills 等。
   - **或只開設定精靈**（改既有設定用）：
     ```bash
     openclaw configure
     ```
     或直接：
     ```bash
     openclaw config
     ```
     依提示選 **Model provider**（OpenAI / Anthropic / Google / Ollama）與 **API key**。
   - 設定檔位置：`~/.openclaw/openclaw.json`（或文件中的 `config.yaml`，依版本而定）。

4. 驗證安裝：
   ```bash
   openclaw config file
   openclaw config validate
   ```
   若出現「unknown command」可先試 `openclaw --help` 看目前版本支援的指令。

---

## 第一步補充：`openclaw onboard` 精靈各題建議答案

可依需求二選一：**只做網頁抓取**（全 Skip 即時通）或 **要透過 WhatsApp 等與 OpenClaw 溝通**（見下表）。

| 精靈問的內容 | 建議選擇 / 答案 |
|-------------|-----------------|
| **已有設定檔**（若問 Keep / Modify / Reset） | **Keep** 或 **Modify**（不要選 Reset，會清空） |
| **Skills 是否安裝** | **是**，安裝建議的 skills（之後才能用 browser 抓網頁） |
| **Node 套件管理** | **npm**（文件建議；pnpm 也可） |
| **Daemon 背景服務** | **要接 WhatsApp 等**：選 **安裝**，runtime 選 **Node**（WhatsApp/Telegram 必須）。**只做抓取**：可 **Skip** |
| **Channels（Telegram / WhatsApp / Discord…）** | **要透過 WhatsApp 與 OpenClaw 溝通**：選 **WhatsApp**，依精靈提示用 QR code 登入或填 bot 資料，之後就可在 WhatsApp 發指令／收結果、方便之後更新。**只做抓取**：可全部 **Skip** |
| **Gateway 埠號** | 預設 **18789** 即可 |
| **Gateway 綁定** | **loopback**（127.0.0.1，只本機用） |
| **Gateway 認證** | **Token**，讓精靈自動產生並儲存（建議保留） |
| **Workspace 路徑** | 預設 **~/.openclaw/workspace** 即可 |
| **Model / 認證方式** | **免付費**：選 **Ollama**（本機跑開源模型，不需 API key、不用月費）。有預算再考慮 Anthropic / OpenAI。 |
| **Ollama 設定** | 選 **Local**；Base URL 用預設 `http://127.0.0.1:11434`。若尚未安裝 Ollama，先到 [ollama.com](https://ollama.com) 下載安裝，再在終端機執行 `ollama pull llama3.2` 或 `ollama pull mistral` 下載模型。 |
| **API key 輸入** | 若選 Ollama 則**不用填**；若選 Anthropic/OpenAI 則貼上 key。 |
| **預設模型** | Ollama：選 **llama3.2**、**mistral** 或 **qwen2.5** 等（精靈會列出已安裝的）；能力足夠做 browser 指令與 JSON 輸出。 |
| **Web search（Brave / Perplexity…）** | **Skip**（抓固定網址不必先搜尋） |
| **Health check** | 讓它跑完，確認 Gateway 正常 |

完成後可執行 `openclaw config validate` 再確認。若要補裝 browser skill，見下一步。

若精靈選項或順序與上表不同，以畫面上最接近的為準（例如「跳過」= Skip、「保留」= Keep）。

**透過 WhatsApp 與 OpenClaw 溝通**：即用 WhatsApp 傳訊息給 OpenClaw（例如「去永安網站抓 10 個旅行團」），Agent 會用 browser 抓資料並在 WhatsApp 回覆你，之後要更新旅行團時不必開電腦跑終端機。若 onboard 時已略過 Channels，之後可執行 `openclaw configure`，在精靈裡選設定 **Channels** 補加 WhatsApp。

---

## 第二步：安裝 browser 相關 skill（用來抓網頁）

要抓「會用 JavaScript 渲染」的旅行社網站，需要 browser 能力。**新版 OpenClaw 用 clawhub 管理 skill**（不是 `openclaw skill install`）：

```bash
npx clawhub
```

在 clawhub 裡搜尋 **browser** 或 **browser-automation**，選安裝。或直接試：

```bash
npx clawhub install browser-automation
```

若沒有 `install` 子指令，就執行 `npx clawhub` 後依畫面選單搜尋、安裝。安裝完成後重啟 OpenClaw 或確認 config 裡已啟用對應 skill。

---

## 第三步：用 OpenClaw 對「單一旅行社」做一次抓取測試（以永安為例）

先對 **永安旅遊** 做一次，確認能拿到約 10 筆資料並能輸出成我們要的格式。

1. 在終端機執行（請把下方的 `<你的 agent 名稱>` 換成你 config 裡實際的 agent id，若只有預設就試 `default` 或直接不帶 `--agent`）：

   ```bash
   openclaw agent --agent default --message "請用 browser 打開這個網頁：https://www.wingontravel.com/tours/dest/LongHaultravel-5-5 ，等待頁面載入完成後，從頁面上找出至少 10 個旅行團。每個旅行團請整理成：標題(title)、目的地或路線(destination)、天數(days)、價格或價格範圍(price_range)、出發日期或相關日期資訊(departure_dates)、行程特色或標籤(features)、詳情連結(link)、圖片網址(image_url)。請把結果輸出成一個 JSON 陣列，每個元素是一個物件，欄位名用英文：title, destination, days, price_range, departure_dates (陣列), features (陣列), link, image_url。不要輸出其他說明，只輸出一個 JSON 陣列。"
   ```

2. 若 OpenClaw 回覆的是純文字混 JSON：
   - 把回覆中「從 `[` 開始到 `]` 結束」的那一段複製出來。
   - 貼到編輯器，存成 `tours-wingon.json`（或 `tours-永安.json`）。
   - 檢查是否為合法 JSON（可用 `JSON.parse` 或線上 validator）。

3. 在每筆物件裡補上我們資料庫需要的欄位（若 AI 沒給）：
   - `agency`: `"永安旅遊"`
   - `type`: `"longhaul"`
   - `region`: 若無則填 `"亞洲"` 或依目的地判斷（如歐洲、中東等）

   範例一筆：
   ```json
   {
     "agency": "永安旅遊",
     "type": "longhaul",
     "title": "歐洲五國十天團",
     "destination": "法國、瑞士、意大利",
     "region": "歐洲",
     "days": 10,
     "price_range": "$28,000 起",
     "departure_dates": ["2025-04-15"],
     "features": ["純玩"],
     "affiliate_links": { "wingon": "https://..." },
     "image_url": "https://..."
   }
   ```

---

## 第四步：其餘四家旅行社重複第三步

對每一家換網址與 `agency` 名稱，其餘指示相同。可依序執行（或一次給多個 URL，視 OpenClaw 是否支援）：

| 旅行社 | 指令中的 URL | 輸出檔建議 | agency 值 |
|--------|----------------|------------|-----------|
| EGL 東瀛遊 | https://www.egltours.com/website/tour-line/長線 | tours-egl.json | EGL 東瀛遊 |
| 金怡假期 | https://www.goldjoy.com/tour | tours-goldjoy.json | 金怡假期 |
| Jetour 捷旅 | https://www.jetour.com.hk/tour | tours-jetour.json | Jetour 捷旅 |
| 縱橫遊 | https://www.wwpkg.com.hk/tour/summary | tours-wwpkg.json | 縱橫遊WWPKG |

每家的 prompt 範本（把 `{URL}` 和 `{AGENCY}` 換掉）：

```text
請用 browser 打開：{URL} ，等待頁面載入後，從頁面找出至少 10 個旅行團。每個旅行團整理成：title, destination, days, price_range, departure_dates (陣列), features (陣列), link, image_url。輸出成一個 JSON 陣列，欄位名用英文。然後在每筆加上 agency: "{AGENCY}", type: "longhaul", region 依目的地填（歐洲/亞洲/中東等）。
```

存好五個 JSON 檔後，可合併或分別匯入 Supabase（見下一步）。

---

## 第五步：把 JSON 寫入 Supabase

專案裡已有腳本 `scripts/push-tours-to-supabase.ts`，會讀取 JSON 並寫入 `public.tour`。

1. 在專案根目錄設定環境變數（若尚未設定）：
   - `NEXT_PUBLIC_SUPABASE_URL`：Supabase 專案 URL
   - `SUPABASE_SERVICE_ROLE_KEY`：Supabase Service Role Key（在 Dashboard → Settings → API）
   - 勿把 Service Role Key 提交到 git

2. 若 JSON 是「每個旅行社一個檔案」，可依序執行：
   ```bash
   cd c:\Users\User\tour-compare
   npx tsx scripts/push-tours-to-supabase.ts tours-wingon.json
   npx tsx scripts/push-tours-to-supabase.ts tours-egl.json
   npx tsx scripts/push-tours-to-supabase.ts tours-goldjoy.json
   npx tsx scripts/push-tours-to-supabase.ts tours-jetour.json
   npx tsx scripts/push-tours-to-supabase.ts tours-wwpkg.json
   ```

3. 若你先把五個檔案合併成一個 `tours-all.json`（一個陣列，內含所有旅行社的筆數）：
   ```bash
   npx tsx scripts/push-tours-to-supabase.ts tours-all.json
   ```

4. 若某個 JSON 裡沒有 `agency`，可先設定預設旅行社再執行：
   ```bash
   set SCRAPER_AGENCY=永安旅遊
   npx tsx scripts/push-tours-to-supabase.ts tours-wingon.json
   ```

寫入成功後，網站只要從 Supabase `tour` 表讀取，就會顯示最新旅行團資料。

---

## 第六步：更新網站上的旅行團資料

- 你的 app 已經從 Supabase `tour` 表讀取（例如 `lib/data/tours.ts` 的 `getTours()`）。
- 完成第五步後，重新整理前台頁面或重新打 API，就會看到剛寫入的旅行團。
- 若要做「只更新、不重複」，需要之後在腳本或 DB 層做 upsert（例如以 `agency + title` 或唯一 key 更新），目前腳本為單純 insert。

---

## 流程總覽

```
1. openclaw init → 設定 model / API key
2. openclaw skill install browser-automation
3. 對 5 個 URL 各跑一次 openclaw agent --message "…" → 得到 5 個 JSON（各約 10 筆）
4. 手動補齊 agency / type / region（若 AI 沒給）
5. npx tsx scripts/push-tours-to-supabase.ts < 各 JSON >
6. 重新整理網站 → 看到新旅行團
```

---

## 若 OpenClaw 無法順利抓取：用本專案附的 Playwright 腳本

若 OpenClaw 的 browser 在某一站失敗或取不到足夠資料，可用專案內的 **Playwright 抓取腳本** 作為替代方案：

```bash
npm install
npx playwright install chromium
npm run scrape-tours
```

輸出會出現在 `scripts/output/tours-<旅行社>.json`，再依第五步用 `push-tours-to-supabase.ts` 寫入 Supabase。

腳本會對上述五個 URL 各嘗試抓取約 10 筆，輸出到 `scripts/output/tours-<旅行社>.json`，你再依第五步用 `push-tours-to-supabase.ts` 寫入 Supabase。詳見 `scripts/README.md`。

---

## 環境變數總整理

| 用途 | 變數名 | 說明 |
|------|--------|------|
| OpenClaw 模型 | 在 `openclaw init` 時設定 | 寫入 `~/.openclaw/config.yaml` |
| Supabase 連線 | `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| Supabase 寫入 | `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Settings → API → service_role（勿提交 git） |
| 預設旅行社名 | `SCRAPER_AGENCY` | 選填，JSON 無 `agency` 時使用 |

---

## 常見問題

- **openclaw 指令找不到**  
  改用 `npx openclaw` 或確認 npm global 路徑在 PATH 裡。

- **RLS 錯誤、無法 insert**  
  使用 `SUPABASE_SERVICE_ROLE_KEY`（會繞過 RLS），或到 Supabase Dashboard 為 `tour` 表新增 INSERT policy。

- **JSON 格式錯誤**  
  確保是單一陣列 `[{...},{...}]`，且每筆都有 `agency, type, title, destination, region, days, price_range`（其餘可空陣列或省略）。

- **想每站只抓 10 筆**  
  在給 OpenClaw 的 prompt 裡明確寫「只取前 10 個旅行團」或「最多 10 筆」。
