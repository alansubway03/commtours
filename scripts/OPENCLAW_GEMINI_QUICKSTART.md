# OpenClaw + Gemini 快速試跑（香港可用）

你已安裝 OpenClaw，且已有 Gemini API key。依下面步驟即可用 Gemini 試抓旅行團。

---

## 1. 設定 Gemini API Key

任選一種方式：

**方式 A：環境變數（建議，不用寫進設定檔）**

PowerShell（本次終端機有效）：
```powershell
$env:GOOGLE_API_KEY = "你的_Gemini_API_Key"
```

或寫進專案 `.env.local`（不要提交 git）：
```
GOOGLE_API_KEY=你的_Gemini_API_Key
```
然後在要跑 OpenClaw 的終端機先執行 `cd c:\Users\User\tour-compare`，再跑下面指令。

**方式 B：寫入 OpenClaw 設定**
```bash
openclaw config set models.providers.gemini.apiKey "你的_Gemini_API_Key"
```
設定檔位置多為 `~/.openclaw/openclaw.json` 或 `~/.config/openclaw/openclaw.json5`。

---

## 2. 指定用 Google / Gemini 當預設模型

若從未設過，執行精靈選 Google：
```bash
openclaw configure
```
依提示選 **Model provider** → **Google**，並選模型（例如 `gemini-2.0-flash` 或 `gemini-2.5-flash`）。

或直接用指令設預設（若你的版本支援）：
```bash
openclaw config set models.defaults.provider google
openclaw config set models.defaults.model gemini-2.0-flash
```

---

## 3. 確認有 browser skill（用來開網頁抓資料）

```bash
npx clawhub
```
在介面裡搜尋 **browser** 或 **browser-automation**，若未安裝請安裝。或試：
```bash
npx clawhub install browser-automation
```

---

## 4. 試跑：抓永安旅遊 10 筆旅行團

在專案目錄執行（`--agent default` 若沒有自訂 agent 可省略）：

```bash
openclaw agent --agent main --message "請用 browser 打開 https://www.wingontravel.com/tours/list/country-78.html ，等頁面載入完成後，從頁面找出至少 10 個旅行團。每個旅行團請整理成：標題(title)、目的地(destination)、天數(days)、價格或價格範圍(price_range)、詳情連結(link)、圖片網址(image_url)。輸出成一個 JSON 陣列，每個元素是物件，欄位名用英文：title, destination, days, price_range, link, image_url。只輸出一個 JSON 陣列，不要其他說明。"
```

若成功，終端機會回傳一段 JSON；把從 `[` 到 `]` 的內容複製，存成 `scripts/output/tours-wingon-openclaw.json`，再依專案 `push-tours-to-supabase.ts` 的格式補上 `agency`、`type`、`region`、`affiliate_links` 後即可寫入 Supabase。

---

## 5. 驗證設定

```bash
openclaw config validate
openclaw config file
```
可確認設定檔路徑與是否有效。

---

## 常見問題

- **找不到 openclaw**：改用 `npx openclaw`，或確認 npm global 路徑在 PATH。
- **Gemini API 錯誤**：檢查 key 是否正確、是否有開 Gemini API、網路是否通（香港一般可用）。
- **browser 沒反應**：確認已安裝 browser-automation skill，且精靈裡有選用可控制瀏覽器的能力。
