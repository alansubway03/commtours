import fs from "node:fs";
import path from "node:path";
import PptxGenJS from "pptxgenjs";

const outputDir = path.resolve(process.cwd(), "exports");
const outputFile = path.resolve(outputDir, "CommTours_Company_Profile_2026.pptx");

const colors = {
  bg: "F8FAFC",
  title: "0F172A",
  body: "1E293B",
  accent: "2563EB",
  muted: "64748B",
};

function header(slide: PptxGenJS.Slide, title: string, subtitle?: string) {
  slide.background = { color: colors.bg };
  slide.addText(title, {
    x: 0.6,
    y: 0.3,
    w: 12.0,
    h: 0.5,
    fontFace: "Calibri",
    fontSize: 30,
    bold: true,
    color: colors.title,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6,
      y: 0.9,
      w: 12.0,
      h: 0.3,
      fontFace: "Calibri",
      fontSize: 14,
      color: colors.muted,
    });
  }
  slide.addShape("line", {
    x: 0.6,
    y: 1.26,
    w: 12.1,
    h: 0,
    line: { color: "CBD5E1", pt: 1.1 },
  });
}

function footer(slide: PptxGenJS.Slide, text = "CommTours Company Profile") {
  slide.addText(text, {
    x: 0.6,
    y: 7.05,
    w: 8.0,
    h: 0.2,
    fontFace: "Calibri",
    fontSize: 10.5,
    color: colors.muted,
  });
}

function bullets(slide: PptxGenJS.Slide, list: string[], x = 0.9, y = 1.7, w = 11.7, h = 4.9) {
  slide.addText(
    list.map((text) => ({ text, options: { bullet: { indent: 16 } } })),
    {
      x,
      y,
      w,
      h,
      fontFace: "Calibri",
      fontSize: 20,
      color: colors.body,
      breakLine: true,
      paraSpaceAfter: 14,
    },
  );
}

async function generateProfilePpt() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "CommTours";
  pptx.company = "CommTours";
  pptx.title = "CommTours 公司介紹";
  pptx.subject = "Company profile";

  // Cover
  const s1 = pptx.addSlide();
  s1.background = { color: colors.bg };
  s1.addShape("roundRect", {
    x: 0.65,
    y: 0.75,
    w: 2.1,
    h: 0.42,
    rectRadius: 0.08,
    fill: { color: "DBEAFE" },
    line: { color: "DBEAFE", pt: 0 },
  });
  s1.addText("公司簡介", {
    x: 0.88,
    y: 0.85,
    w: 1.65,
    h: 0.22,
    fontFace: "Calibri",
    fontSize: 12,
    bold: true,
    color: "1D4ED8",
    align: "center",
  });
  s1.addText("CommTours", {
    x: 0.65,
    y: 1.4,
    w: 8.5,
    h: 0.75,
    fontFace: "Calibri",
    fontSize: 56,
    bold: true,
    color: colors.title,
  });
  s1.addText("智能旅遊內容平台與成交導流夥伴", {
    x: 0.65,
    y: 2.32,
    w: 9.8,
    h: 0.38,
    fontFace: "Calibri",
    fontSize: 22,
    color: colors.muted,
  });
  s1.addShape("roundRect", {
    x: 0.65,
    y: 3.0,
    w: 6.8,
    h: 1.4,
    rectRadius: 0.08,
    fill: { color: "EEF2FF" },
    line: { color: "E2E8F0", pt: 1 },
  });
  s1.addText("讓用戶更快找到合適行程，讓夥伴更準確獲得高意向客源。", {
    x: 1.0,
    y: 3.48,
    w: 6.1,
    h: 0.5,
    fontFace: "Calibri",
    fontSize: 20,
    color: "1E40AF",
    bold: true,
    align: "center",
  });
  s1.addText(`版本：${new Date().toISOString().slice(0, 10)}`, {
    x: 0.65,
    y: 6.8,
    w: 3.6,
    h: 0.2,
    fontFace: "Calibri",
    fontSize: 11,
    color: colors.muted,
  });

  // Who we are
  const s2 = pptx.addSlide();
  header(s2, "我們是誰", "CommTours 的定位");
  bullets(s2, [
    "CommTours 是旅遊產品資訊整合與推薦平台，連接旅客需求與旅行社供應。",
    "核心任務：幫用戶在大量旅遊產品中，快速找到更匹配的選項。",
    "平台特色：內容導購、行程比較、重點推薦位與追蹤分析。",
    "商業模式：以成果導向（performance-based）合作，強調可對帳與可持續。",
  ]);
  footer(s2);

  // Mission & vision
  const s3 = pptx.addSlide();
  header(s3, "願景與使命");
  s3.addShape("roundRect", {
    x: 0.9,
    y: 1.8,
    w: 5.7,
    h: 3.0,
    rectRadius: 0.08,
    fill: { color: "EFF6FF" },
    line: { color: "BFDBFE", pt: 1 },
  });
  s3.addShape("roundRect", {
    x: 6.95,
    y: 1.8,
    w: 5.7,
    h: 3.0,
    rectRadius: 0.08,
    fill: { color: "F0FDF4" },
    line: { color: "BBF7D0", pt: 1 },
  });
  s3.addText("願景 Vision", {
    x: 1.2,
    y: 2.1,
    w: 5.0,
    h: 0.35,
    fontSize: 22,
    bold: true,
    color: "1D4ED8",
  });
  s3.addText("成為大灣區及亞洲市場值得信賴的旅遊內容與成交導流平台。", {
    x: 1.2,
    y: 2.6,
    w: 5.1,
    h: 1.6,
    fontSize: 18,
    color: colors.body,
  });
  s3.addText("使命 Mission", {
    x: 7.25,
    y: 2.1,
    w: 5.0,
    h: 0.35,
    fontSize: 22,
    bold: true,
    color: "15803D",
  });
  s3.addText("用技術與內容提升旅客決策效率，並為合作夥伴帶來可量化的銷售增長。", {
    x: 7.25,
    y: 2.6,
    w: 5.1,
    h: 1.6,
    fontSize: 18,
    color: colors.body,
  });
  footer(s3);

  // What we do
  const s4 = pptx.addSlide();
  header(s4, "我們做什麼", "核心能力");
  bullets(s4, [
    "旅遊產品整合：集中展示多供應商產品，提升用戶搜尋效率。",
    "內容推動轉換：以重點頁面與主題內容導入高意向流量。",
    "行為追蹤與分析：透過 ref_id 建立導流至成交的對帳鏈路。",
    "合作共營：按週檢視數據，持續優化曝光、點擊與轉換。",
  ]);
  footer(s4);

  // Value for users and partners
  const s5 = pptx.addSlide();
  header(s5, "我們的價值", "對用戶與合作夥伴的價值主張");
  s5.addShape("roundRect", {
    x: 0.9,
    y: 1.8,
    w: 5.7,
    h: 3.4,
    rectRadius: 0.08,
    fill: { color: "F8FAFC" },
    line: { color: "CBD5E1", pt: 1.2 },
  });
  s5.addShape("roundRect", {
    x: 6.95,
    y: 1.8,
    w: 5.7,
    h: 3.4,
    rectRadius: 0.08,
    fill: { color: "F8FAFC" },
    line: { color: "CBD5E1", pt: 1.2 },
  });
  s5.addText("對旅客", {
    x: 1.2,
    y: 2.1,
    w: 5.1,
    h: 0.3,
    fontSize: 20,
    bold: true,
    color: colors.accent,
  });
  bullets(
    s5,
    [
      "更快比較行程與價格",
      "更容易找到合適產品",
      "降低搜尋成本與決策壓力",
    ],
    1.15,
    2.55,
    5.25,
    2.3,
  );
  s5.addText("對合作夥伴", {
    x: 7.25,
    y: 2.1,
    w: 5.1,
    h: 0.3,
    fontSize: 20,
    bold: true,
    color: "16A34A",
  });
  bullets(
    s5,
    [
      "獲得高意向導流與新增客源",
      "按成果合作，降低投放風險",
      "有數據可驗證，便於長期擴大",
    ],
    7.2,
    2.55,
    5.2,
    2.3,
  );
  footer(s5);

  // Operation & credibility
  const s6 = pptx.addSlide();
  header(s6, "營運與可信度", "可追蹤、可對帳、可優化");
  bullets(s6, [
    "以清晰報表節奏管理合作（每週追蹤、每月結算）。",
    "合作資料以標準化欄位交換，減少溝通與核對成本。",
    "聚焦長期合作關係，透過數據持續提升轉換效率。",
    "在流程與數據治理上，確保合作透明與可持續性。",
  ]);
  footer(s6);

  // Closing
  const s7 = pptx.addSlide();
  header(s7, "結語", "讓每次導流更有價值");
  s7.addShape("roundRect", {
    x: 0.9,
    y: 1.9,
    w: 11.7,
    h: 2.8,
    rectRadius: 0.08,
    fill: { color: "EEF2FF" },
    line: { color: "C7D2FE", pt: 1.2 },
  });
  s7.addText("CommTours 致力成為你最可靠的旅遊導流與成長夥伴。", {
    x: 1.2,
    y: 2.6,
    w: 11.0,
    h: 0.5,
    fontSize: 28,
    bold: true,
    color: "312E81",
    align: "center",
  });
  s7.addText("歡迎進一步交流：品牌合作 / 流量合作 / 成交分潤", {
    x: 1.2,
    y: 3.35,
    w: 11.0,
    h: 0.35,
    fontSize: 17,
    color: colors.body,
    align: "center",
  });
  s7.addShape("roundRect", {
    x: 3.75,
    y: 5.4,
    w: 5.0,
    h: 1.05,
    rectRadius: 0.08,
    fill: { color: "DBEAFE" },
    line: { color: "BFDBFE", pt: 1 },
  });
  s7.addText("聯絡人：__________________", {
    x: 4.05,
    y: 5.72,
    w: 4.45,
    h: 0.3,
    fontSize: 15,
    color: "1D4ED8",
  });
  footer(s7);

  fs.mkdirSync(outputDir, { recursive: true });
  await pptx.writeFile({ fileName: outputFile });
  console.log(outputFile);
}

void generateProfilePpt();
