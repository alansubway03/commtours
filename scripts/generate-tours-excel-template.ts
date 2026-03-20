/**
 * 產生給客人填寫的 Excel 範本：scripts/templates/旅行團資料範本.xlsx
 * 執行：npx tsx scripts/generate-tours-excel-template.ts
 */
import * as XLSX from "xlsx";
import { mkdirSync, existsSync } from "fs";
import { resolve } from "path";

const OUT_DIR = resolve(process.cwd(), "scripts/templates");
const OUT_FILE = resolve(OUT_DIR, "旅行團資料範本.xlsx");

const HEADERS = [
  "旅行社",
  "團種",
  "行程名稱",
  "目的地",
  "區域",
  "天數",
  "價錢",
  "出發日與成團",
  "特色",
  "連結1名稱",
  "連結1網址",
  "連結2名稱",
  "連結2網址",
  "圖片網址",
] as const;

const EXAMPLE_ROW = [
  "範例旅行社",
  "長線團",
  "義大利深度遊10天",
  "米蘭、威尼斯、佛羅倫斯",
  "歐洲",
  10,
  "HK$18,888起",
  "15/04:成團;22/04:快將成團;29/04:未成團",
  "無購物;直航",
  "官網報名",
  "https://example.com/tour-a",
  "查價頁",
  "https://example.com/price-a",
  "https://example.com/image.jpg",
];

const HELP_ROWS: string[][] = [
  ["旅行團資料 Excel 填寫說明"],
  [""],
  ["1. 請在「旅行團資料」工作表從第 2 列開始填寫（第 1 列為欄位名稱，勿刪改）。可刪除範例列再填。"],
  [
    "2. 上傳：專案根目錄執行 npm run excel:upload -- scripts/templates/你的檔案.xlsx（請先刪除或覆寫「範例旅行社」那一列，否則不會匯入）",
  ],
  [""],
  ["欄位說明"],
  ["旅行社", "顯示名稱"],
  [
    "團種",
    "請填：長線團 | 郵輪團 | 郵輪船票 | 行山 | 潛水 | 節日（或英文 longhaul、cruise 等）",
  ],
  ["行程名稱", "必填"],
  ["目的地", "簡短地名即可"],
  ["區域", "如：歐洲、亞洲、北美"],
  ["天數", "數字"],
  ["價錢", "如 HK$12,000起 或 $28,000-$35,000"],
  [
    "出發日與成團",
    "多個用分號 ; 隔開。每一組：日期:狀態。狀態只能是：成團、快將成團、未成團。例：15/04:成團;22/04:未成團",
  ],
  ["特色", "多個用分號 ; 隔開，例：無購物;直航"],
  ["連結1名稱 / 連結1網址", "例如：官網報名 / https://...（沒有可留空）"],
  ["連結2名稱 / 連結2網址", "例如：查價頁 / https://...（沒有可留空）"],
  ["圖片網址", "主圖 URL，沒有可留空"],
  [""],
  ["同一旅行社、同一行程名稱+目的地+天數 會視為同一筆；重複上傳會更新（upsert）。"],
];

function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const wb = XLSX.utils.book_new();

  const wsHelp = XLSX.utils.aoa_to_sheet(HELP_ROWS);
  wsHelp["!cols"] = [{ wch: 18 }, { wch: 72 }];
  XLSX.utils.book_append_sheet(wb, wsHelp, "填寫說明");

  const wsData = XLSX.utils.aoa_to_sheet([HEADERS as unknown as string[], EXAMPLE_ROW]);
  wsData["!cols"] = HEADERS.map(() => ({ wch: 14 }));
  XLSX.utils.book_append_sheet(wb, wsData, "旅行團資料");

  XLSX.writeFile(wb, OUT_FILE);
  console.log("已產生:", OUT_FILE);
}

main();
