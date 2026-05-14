import fs from "node:fs";
import path from "node:path";
import PptxGenJS from "pptxgenjs";

type SlideTheme = {
  bg: string;
  title: string;
  body: string;
  accent: string;
  muted: string;
};

const theme: SlideTheme = {
  bg: "F8FAFC",
  title: "0F172A",
  body: "1E293B",
  accent: "2563EB",
  muted: "64748B",
};

const outputDir = path.resolve(process.cwd(), "exports");
const outputFile = path.resolve(outputDir, "CommTours_Partner_Cooperation_Modes.pptx");

function addHeader(slide: PptxGenJS.Slide, title: string, subtitle?: string) {
  slide.background = { color: theme.bg };
  slide.addText(title, {
    x: 0.6,
    y: 0.3,
    w: 12.2,
    h: 0.5,
    fontFace: "Calibri",
    fontSize: 30,
    bold: true,
    color: theme.title,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6,
      y: 0.9,
      w: 12.2,
      h: 0.3,
      fontFace: "Calibri",
      fontSize: 15,
      color: theme.muted,
    });
  }
  slide.addShape("line", {
    x: 0.6,
    y: 1.28,
    w: 12.1,
    h: 0,
    line: { color: "CBD5E1", pt: 1.2 },
  });
}

function addFooter(slide: PptxGenJS.Slide, text = "CommTours｜旅行社合作模式") {
  slide.addText(text, {
    x: 0.6,
    y: 7.05,
    w: 8,
    h: 0.2,
    fontFace: "Calibri",
    fontSize: 10.5,
    color: theme.muted,
  });
}

function addBullets(
  slide: PptxGenJS.Slide,
  bullets: string[],
  x = 0.9,
  y = 1.7,
  w = 11.8,
  h = 4.8,
) {
  slide.addText(
    bullets.map((item) => ({ text: item, options: { bullet: { indent: 16 } } })),
    {
      x,
      y,
      w,
      h,
      fontFace: "Calibri",
      fontSize: 20,
      color: theme.body,
      breakLine: true,
      paraSpaceAfter: 12,
    },
  );
}

async function generate() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "CommTours";
  pptx.company = "CommTours";
  pptx.subject = "合作模式說明";
  pptx.title = "CommTours 旅行社合作模式";

  // Slide 1 — 開場問候 + 主題
  const s1 = pptx.addSlide();
  s1.background = { color: theme.bg };
  s1.addShape("roundRect", {
    x: 0.65,
    y: 0.75,
    w: 2.1,
    h: 0.42,
    rectRadius: 0.08,
    fill: { color: "DBEAFE" },
    line: { color: "DBEAFE", pt: 0 },
  });
  s1.addText("致 合作夥伴", {
    x: 0.95,
    y: 0.85,
    w: 1.5,
    h: 0.22,
    fontFace: "Calibri",
    fontSize: 12,
    bold: true,
    color: "1D4ED8",
    align: "center",
  });
  s1.addText("您好，", {
    x: 0.65,
    y: 1.35,
    w: 11,
    h: 0.4,
    fontFace: "Calibri",
    fontSize: 22,
    color: theme.body,
  });
  s1.addText("感謝貴社關注 CommTours。我們是香港出發旅行團資訊整合與比較平台，希望與業界建立透明、可持續的合作。", {
    x: 0.65,
    y: 1.85,
    w: 11.5,
    h: 0.9,
    fontFace: "Calibri",
    fontSize: 18,
    color: theme.muted,
  });
  s1.addText("CommTours 旅行社合作模式說明", {
    x: 0.65,
    y: 3.05,
    w: 11,
    h: 0.65,
    fontFace: "Calibri",
    fontSize: 38,
    bold: true,
    color: theme.title,
  });
  s1.addText("以下概述四種合作方式、操作要點及收費原則，詳情歡迎進一步洽談。", {
    x: 0.65,
    y: 3.85,
    w: 11.2,
    h: 0.45,
    fontFace: "Calibri",
    fontSize: 17,
    color: theme.muted,
  });
  s1.addText(`日期：${new Date().toISOString().slice(0, 10)}`, {
    x: 0.65,
    y: 6.85,
    w: 4.2,
    h: 0.25,
    fontFace: "Calibri",
    fontSize: 11,
    color: theme.muted,
  });
  addFooter(s1);

  // Slide 2 — 四種模式總覽
  const s2 = pptx.addSlide();
  addHeader(s2, "合作模式總覽", "四種方式可單獨或組合採用");
  s2.addTable(
    [
      [
        { text: "模式", options: { bold: true, color: theme.title, fill: { color: "E2E8F0" } } },
        { text: "內容摘要", options: { bold: true, color: theme.title, fill: { color: "E2E8F0" } } },
        { text: "收費", options: { bold: true, color: theme.title, fill: { color: "E2E8F0" } } },
      ],
      [
        { text: "1. 行程上架", options: { color: theme.body } },
        { text: "旅行團資料展示於 CommTours", options: { color: theme.body } },
        { text: "免費", options: { bold: true, color: "15803D" } },
      ],
      [
        { text: "2. 導流報名", options: { color: theme.body } },
        { text: "用戶經 CommTours 前往貴社網站報名", options: { color: theme.body } },
        { text: "仲介費：團費 × 10%", options: { bold: true, color: "1D4ED8" } },
      ],
      [
        { text: "3. 首頁廣告", options: { color: theme.body } },
        { text: "橫幅／版位宣傳公司或指定行程，點擊至目標網頁", options: { color: theme.body } },
        { text: "版位費另議", options: { color: theme.body } },
      ],
      [
        { text: "4. 旅遊資訊", options: { color: theme.body } },
        { text: "首頁「旅遊資訊」主題稿＋相關社／團連結", options: { color: theme.body } },
        { text: "編輯／曝光費另議", options: { color: theme.body } },
      ],
    ],
    {
      x: 0.65,
      y: 1.55,
      w: 12.3,
      h: 3.2,
      fontSize: 13,
      border: { type: "solid", color: "CBD5E1", pt: 1 },
      colW: [2.2, 6.5, 3.2],
    },
  );
  s2.addShape("roundRect", {
    x: 0.65,
    y: 5.15,
    w: 12.3,
    h: 1.15,
    rectRadius: 0.08,
    fill: { color: "FFFBEB" },
    line: { color: "FDE68A", pt: 1 },
  });
  s2.addText("※ 實際條款以雙方簽署之合作協議為準；分潤比例與版位費可再商議。", {
    x: 0.95,
    y: 5.45,
    w: 11.7,
    h: 0.55,
    fontFace: "Calibri",
    fontSize: 14,
    color: "92400E",
  });
  addFooter(s2);

  // Slide 3 — 模式 1
  const s3 = pptx.addSlide();
  addHeader(s3, "模式 1｜行程資料上架", "免費");
  addBullets(s3, [
    "內容：貴社旅行團基本資料（標題、天數、價格區間、目的地、特色、官方圖片與連結等）於 CommTours 展示，供用戶搜尋與比較。",
    "如何合作：提供資料來源授權或 API／資料交換格式約定；或由貴社指定更新頻率與聯絡窗口。",
    "收費：上架展示不另收費，目的為豐富平台內容並服務旅客。",
    "備註：若同時啟用「導流報名」模式，導流連結須帶追蹤參數以便對帳（詳見模式 2）。",
  ]);
  addFooter(s3);

  // Slide 4 — 模式 2
  const s4 = pptx.addSlide();
  addHeader(s4, "模式 2｜經 CommTours 導流至貴社網站報名", "仲介費：團費 × 10%");
  addBullets(s4, [
    "流程：用戶於 CommTours 瀏覽行程 → 點擊「了解更多」等按鈕 → 前往貴社官網或報名頁完成下單。",
    "計費基礎：以雙方確認之「成功報團／已收款訂單」之團費為準，收取仲介費 10%（例：團費 HK$10,000 → HK$1,000）。",
    "如何合作：約定追蹤方式（例如 ref_id、UTM）、報表格式、對帳週期（建議每週核對、每月結算）。",
    "收費：僅於可驗證之成交產生時計收；未成交之點擊不計費。具體定義於合約中列明。",
  ]);
  s4.addShape("roundRect", {
    x: 0.65,
    y: 5.35,
    w: 12.3,
    h: 1.05,
    rectRadius: 0.08,
    fill: { color: "EFF6FF" },
    line: { color: "BFDBFE", pt: 1 },
  });
  s4.addText("※ 10% 為建議牌價，可依產品線、檔期或年度目標調整，以書面協議為準。", {
    x: 0.95,
    y: 5.62,
    w: 11.7,
    h: 0.5,
    fontFace: "Calibri",
    fontSize: 14,
    color: "1E40AF",
  });
  addFooter(s4);

  // Slide 5 — 模式 3
  const s5 = pptx.addSlide();
  addHeader(s5, "模式 3｜CommTours 首頁廣告版位", "按檔期／版位報價");
  addBullets(s5, [
    "內容：於首頁輪播橫幅或其他約定版位，展示貴社品牌、主推行程或活動；用戶點擊後前往貴社指定著陸頁（官網、活動頁、團號頁等）。",
    "素材：由貴社提供文案、圖像及目標 URL；CommTours 依版位規格協助上線（檔期與排序另議）。",
    "如何合作：確認曝光時段、版位尺寸、點擊追蹤需求及上下線流程。",
    "收費：屬付費曝光／導流服務，費用按週期或檔期報價，歡迎索取刊例表。",
  ]);
  addFooter(s5);

  // Slide 6 — 模式 4
  const s6 = pptx.addSlide();
  addHeader(s6, "模式 4｜首頁「旅遊資訊」主題推廣", "內容營銷 + 導流");
  addBullets(s6, [
    "內容：在首頁「旅遊資訊」區以主題稿形式介紹目的地或產品類型（例如：北韓深度遊、郵輪懶人包），並可嵌入貴社簡介與相關旅行團連結，引導有興趣用戶進一步了解。",
    "形式：短文＋配圖＋外部或站內連結；條目數量與更新頻率可依專案約定。",
    "如何合作：共同確認主題方向、用字合規、連結清單及上下線時間；若涉及敏感目的地，以符合法規與平台政策為前提。",
    "收費：屬編輯製作與版位曝光之組合方案，費用依篇數／檔期另議。",
  ]);
  addFooter(s6);

  // Slide 7 — 聯絡
  const s7 = pptx.addSlide();
  addHeader(s7, "下一步與聯絡", "期待與貴社洽談細節");
  addBullets(s7, [
    "若貴社有意啟動任一模式或組合方案，歡迎回覆此函或來電／電郵，我們將安排簡短會議說明技術對接與合約框架。",
    "建議準備：聯絡人、希望優先試行之產品線、以及是否已有追蹤／報表習慣（模式 2）。",
  ]);
  s7.addShape("roundRect", {
    x: 0.65,
    y: 4.35,
    w: 6.2,
    h: 1.25,
    rectRadius: 0.1,
    fill: { color: "EEF2FF" },
    line: { color: "C7D2FE", pt: 1 },
  });
  s7.addText("CommTours", {
    x: 0.95,
    y: 4.55,
    w: 5.5,
    h: 0.35,
    fontFace: "Calibri",
    fontSize: 18,
    bold: true,
    color: "3730A3",
  });
  s7.addText("電郵：info@commtours.com", {
    x: 0.95,
    y: 5.0,
    w: 5.5,
    h: 0.35,
    fontFace: "Calibri",
    fontSize: 16,
    color: theme.body,
  });
  s7.addText("網站：commtours.com", {
    x: 0.95,
    y: 5.35,
    w: 5.5,
    h: 0.3,
    fontFace: "Calibri",
    fontSize: 14,
    color: theme.muted,
  });
  addFooter(s7);

  fs.mkdirSync(outputDir, { recursive: true });
  await pptx.writeFile({ fileName: outputFile });
  console.log(outputFile);
}

void generate();
