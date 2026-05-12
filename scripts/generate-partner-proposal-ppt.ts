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
const outputFile = path.resolve(outputDir, "CommTours_Partner_Proposal_2026.pptx");

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

function addFooter(slide: PptxGenJS.Slide, text = "CommTours Partnership Proposal") {
  slide.addText(text, {
    x: 0.6,
    y: 7.05,
    w: 6.8,
    h: 0.2,
    fontFace: "Calibri",
    fontSize: 10.5,
    color: theme.muted,
  });
}

function addBullets(slide: PptxGenJS.Slide, bullets: string[], x = 0.9, y = 1.7, w = 11.8, h = 4.8) {
  slide.addText(
    bullets.map((item) => ({ text: item, options: { bullet: { indent: 16 } } })),
    {
      x,
      y,
      w,
      h,
      fontFace: "Calibri",
      fontSize: 21,
      color: theme.body,
      breakLine: true,
      paraSpaceAfter: 14,
    },
  );
}

async function generate() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "CommTours";
  pptx.company = "CommTours";
  pptx.subject = "Partnership proposal";
  pptx.title = "CommTours x Partner 合作簡報";

  // Slide 1: Cover
  const s1 = pptx.addSlide();
  s1.background = { color: theme.bg };
  s1.addShape("roundRect", {
    x: 0.65,
    y: 0.75,
    w: 1.7,
    h: 0.42,
    rectRadius: 0.08,
    fill: { color: "DBEAFE" },
    line: { color: "DBEAFE", pt: 0 },
  });
  s1.addText("合作提案", {
    x: 0.84,
    y: 0.85,
    w: 1.3,
    h: 0.22,
    fontFace: "Calibri",
    fontSize: 12,
    bold: true,
    color: "1D4ED8",
    align: "center",
  });
  s1.addText("CommTours x 旅行社夥伴", {
    x: 0.65,
    y: 1.4,
    w: 9.2,
    h: 0.7,
    fontFace: "Calibri",
    fontSize: 44,
    bold: true,
    color: theme.title,
  });
  s1.addText("旅遊產品導流合作與分潤機制說明", {
    x: 0.65,
    y: 2.25,
    w: 9.5,
    h: 0.35,
    fontFace: "Calibri",
    fontSize: 20,
    color: theme.muted,
  });
  s1.addShape("roundRect", {
    x: 0.65,
    y: 3.0,
    w: 6.35,
    h: 1.45,
    rectRadius: 0.1,
    fill: { color: "EEF2FF" },
    line: { color: "E2E8F0", pt: 1 },
  });
  s1.addText("成功報團抽成：5% - 10%", {
    x: 0.95,
    y: 3.45,
    w: 5.7,
    h: 0.5,
    fontFace: "Calibri",
    fontSize: 30,
    bold: true,
    color: "1E40AF",
    align: "center",
  });
  s1.addText(`日期：${new Date().toISOString().slice(0, 10)}`, {
    x: 0.65,
    y: 6.8,
    w: 4.2,
    h: 0.25,
    fontFace: "Calibri",
    fontSize: 11,
    color: theme.muted,
  });

  // Slide 2: Company intro
  const s2 = pptx.addSlide();
  addHeader(s2, "公司介紹", "CommTours 的定位與價值");
  addBullets(s2, [
    "CommTours 專注旅遊產品資訊整合與精準導流，連接消費者與旅行社。",
    "透過內容推薦、行程比較、活動頁面等觸點，提升合作夥伴可見度。",
    "目標客群：有明確出遊意向的用戶（高轉換潛力）。",
    "我們重視可追蹤、可對帳、可持續放大的合作模式。",
  ]);
  addFooter(s2);

  // Slide 3: Cooperation model
  const s3 = pptx.addSlide();
  addHeader(s3, "合作模式", "導流 + 成交分潤");
  s3.addShape("roundRect", {
    x: 0.9,
    y: 1.8,
    w: 3.7,
    h: 1.2,
    rectRadius: 0.08,
    fill: { color: "EFF6FF" },
    line: { color: "BFDBFE", pt: 1 },
  });
  s3.addShape("roundRect", {
    x: 5.05,
    y: 1.8,
    w: 3.7,
    h: 1.2,
    rectRadius: 0.08,
    fill: { color: "F0FDF4" },
    line: { color: "BBF7D0", pt: 1 },
  });
  s3.addShape("roundRect", {
    x: 9.2,
    y: 1.8,
    w: 3.2,
    h: 1.2,
    rectRadius: 0.08,
    fill: { color: "FFF7ED" },
    line: { color: "FED7AA", pt: 1 },
  });
  s3.addText("CommTours 導流", {
    x: 1.35,
    y: 2.2,
    w: 2.8,
    h: 0.35,
    fontSize: 20,
    bold: true,
    color: "1D4ED8",
    align: "center",
  });
  s3.addText("Partner 成交", {
    x: 5.55,
    y: 2.2,
    w: 2.8,
    h: 0.35,
    fontSize: 20,
    bold: true,
    color: "15803D",
    align: "center",
  });
  s3.addText("分潤結算", {
    x: 9.4,
    y: 2.2,
    w: 2.8,
    h: 0.35,
    fontSize: 20,
    bold: true,
    color: "C2410C",
    align: "center",
  });
  s3.addShape("line", { x: 4.65, y: 2.4, w: 0.35, h: 0, line: { color: "94A3B8", pt: 2, beginArrowType: "none", endArrowType: "triangle" } });
  s3.addShape("line", { x: 8.8, y: 2.4, w: 0.35, h: 0, line: { color: "94A3B8", pt: 2, beginArrowType: "none", endArrowType: "triangle" } });
  addBullets(
    s3,
    [
      "以 ref_id 作為追蹤鍵值，對帳流程清晰透明。",
      "按「成功報團」計算佣金，不用為無效流量付款。",
      "每週對帳、每月結算，雙方資金節奏更穩定。",
    ],
    0.9,
    3.5,
    11.8,
    2.6,
  );
  addFooter(s3);

  // Slide 4: Commission
  const s4 = pptx.addSlide();
  addHeader(s4, "分潤機制", "成功報團抽成建議：5% - 10%");
  s4.addShape("roundRect", {
    x: 0.95,
    y: 1.8,
    w: 5.5,
    h: 2.7,
    rectRadius: 0.08,
    fill: { color: "EEF2FF" },
    line: { color: "C7D2FE", pt: 1.3 },
  });
  s4.addText("抽成區間", {
    x: 1.3,
    y: 2.05,
    w: 2.2,
    h: 0.35,
    fontSize: 19,
    color: theme.muted,
  });
  s4.addText("5% - 10%", {
    x: 1.3,
    y: 2.35,
    w: 4.5,
    h: 0.9,
    fontSize: 52,
    bold: true,
    color: "3730A3",
  });
  s4.addText("按已成交及已確認訂單計算", {
    x: 1.3,
    y: 3.5,
    w: 4.7,
    h: 0.35,
    fontSize: 14,
    color: theme.body,
  });
  s4.addShape("roundRect", {
    x: 7.0,
    y: 1.8,
    w: 5.4,
    h: 2.7,
    rectRadius: 0.08,
    fill: { color: "F8FAFC" },
    line: { color: "CBD5E1", pt: 1.2 },
  });
  addBullets(
    s4,
    [
      "5%：標準合作方案（穩定長期合作）",
      "7%：季度目標達成方案（量級成長）",
      "10%：重點活動 / 限時檔期方案（衝刺成交）",
    ],
    7.25,
    2.05,
    4.95,
    2.2,
  );
  addFooter(s4, "※ 抽成比例可按產品類型與合作目標調整");

  // Slide 5: Workflow
  const s5 = pptx.addSlide();
  addHeader(s5, "合作流程", "每週對帳 + 每月結算");
  addBullets(s5, [
    "Step 1：CommTours 每週提供導流清單（含 ref_id）。",
    "Step 2：Partner 回傳成交報表（ref_id / booking_id / status）。",
    "Step 3：雙方按已確認成交訂單核對佣金。",
    "Step 4：按月完成請款與付款結算。",
  ]);
  s5.addShape("roundRect", {
    x: 0.9,
    y: 5.3,
    w: 11.7,
    h: 1.1,
    rectRadius: 0.08,
    fill: { color: "FFFBEB" },
    line: { color: "FDE68A", pt: 1 },
  });
  s5.addText("關鍵要求：Partner 需保存 landing URL 的 ref_id，避免對帳落差。", {
    x: 1.2,
    y: 5.68,
    w: 11.1,
    h: 0.35,
    fontSize: 17,
    bold: true,
    color: "92400E",
  });
  addFooter(s5);

  // Slide 6: Benefits
  const s6 = pptx.addSlide();
  addHeader(s6, "合作優勢", "雙方可持續放大的成長模式");
  addBullets(s6, [
    "Partner 角度：低前置成本、按成果付費，風險可控。",
    "CommTours 角度：可追蹤轉換、可驗證成效，便於優化投放。",
    "雙方角度：透過固定節奏報表，提升合作透明度與信任。",
    "最終目標：提升有效報團量與長期收益。",
  ]);
  addFooter(s6);

  // Slide 7: Next step
  const s7 = pptx.addSlide();
  addHeader(s7, "下一步", "建議 2 週內完成啟動");
  addBullets(s7, [
    "第 1 週：確認追蹤欄位、報表格式、分潤比例（5% - 10%）。",
    "第 2 週：小流量試跑並驗證對帳一致性。",
    "第 3 週起：正式投放與週期結算。",
  ]);
  s7.addShape("roundRect", {
    x: 0.9,
    y: 5.3,
    w: 11.7,
    h: 1.1,
    rectRadius: 0.08,
    fill: { color: "ECFEFF" },
    line: { color: "A5F3FC", pt: 1 },
  });
  s7.addText("聯絡窗口：________________   |   生效日期：________________", {
    x: 1.2,
    y: 5.68,
    w: 11.1,
    h: 0.35,
    fontSize: 15,
    color: "0F766E",
  });
  addFooter(s7);

  fs.mkdirSync(outputDir, { recursive: true });
  await pptx.writeFile({ fileName: outputFile });
  console.log(outputFile);
}

void generate();
