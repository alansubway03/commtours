# 旅行團資料自動抓取：擴充到多家旅行社的作法

網站成熟後若要支援**很多旅行社**，建議用「設定驅動」＋「單一管道寫入 DB」，再依需求選抓取方式（自建 Playwright、雲端 API、或 OpenClaw）。

---

## 一、架構：可擴充到很多家

### 1. 設定檔驅動（一家一筆）

- **旅行社清單**：`scripts/agencies.config.json`  
  - 每加一家就加一筆 `{ "id", "name", "url" }`，必要時可加 `selectors` 覆寫。
- **抓取腳本**：只讀這份設定，迴圈跑每一家，輸出格式統一（例如 `tours-<id>.json`）。
- **寫入**：同一支 `push-tours-to-supabase.ts`（或 `--upsert`），不管幾家都走同一條路。

這樣「新增旅行社」= 改設定檔 ＋ 必要時為該站補選擇器，不用改核心流程。

### 2. 排程與監控

- **排程**：用 Windows 工作排程 / cron / GitHub Actions 每天跑一次「抓取 → upsert」。
- **監控**：可記錄每家最後成功時間、筆數或錯誤 log，方便發現某站改版或掛掉。

### 3. 資料面

- **唯一鍵**：用 `source_key`（例如 agency + title + destination + days）做 upsert，同一團只會有一筆，重跑不會重複堆積。
- **欄位統一**：所有來源都對應到同一張 `tour` 表，前端不用管來自哪一家。

---

## 二、OpenClaw 以外的自動抓取方式

| 方式 | 優點 | 缺點 | 適合情境 |
|------|------|------|----------|
| **Playwright / Puppeteer（自建）** | 完全自控、可針對每站寫選擇器、主圖與欄位可精準對應 | 要維護各站選擇器、需有機器或 CI 跑 | 家數多、要穩定、願花時間對每站調校 |
| **Firecrawl / ScrapingBee / Browserbase 等 API** | 代管 browser、有的提供「給 URL 回結構化 JSON」、少管機器 | 付費、有額度、需對接 API | 不想自管 browser、要快速接很多站 |
| **Apify / 現成 Scraper 平台** | 有現成 actor、可排程、輸出 JSON/CSV | 依方案計費、依賴平台 | 先求有、再慢慢遷回自建 |
| **RSS / 官方 API / 合作** | 穩定、合規 | 旅行社多半沒有 | 若有提供再接 |
| **OpenClaw（AI + browser）** | 用自然語言指定要抓什麼、較彈性 | 受模型/地區/ timeout 限制、不穩 | 輔助或少量站、非主線 |

實務上「要自動、要擴到很多家」時，常見組合是：

- **主線**：**Playwright（或 Puppeteer）＋ 每家一組設定（或選擇器覆寫）**，用 `agencies.config.json` 擴充家數，排程每天跑。
- **備援或快速試新站**：用 **Firecrawl 之類的 API** 丟 URL 拿結構化資料，再對應到同一 `tour` 格式寫入 Supabase。
- **OpenClaw**：當作「偶爾手動抓一兩家」或輔助，不當唯一來源。

---

## 三、建議落地步驟

1. **短期**：把現有 Playwright 腳本修穩，至少五家都能穩定抓 10 筆＋主圖，寫入 Supabase；排程用 `daily-update-tours.ps1`（或等同腳本）每天跑。
2. **擴充**：新旅行社只加進 `agencies.config.json`，並為該站補上選擇器（必要時加在設定或單一 `sites/<id>.selectors.json`）。
3. **選配**：若之後要減輕自建 browser 負擔，再選一家「給 URL 回結構化資料」的 API（如 Firecrawl），對接成同一種 JSON 格式，用同一支 push 腳本寫入。

這樣網站成熟後，要套用到很多旅行社時，主要是**加設定與選擇器**，而不是重寫整套系統。
