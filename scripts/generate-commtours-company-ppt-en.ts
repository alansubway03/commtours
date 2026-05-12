import fs from "node:fs";
import path from "node:path";
import PptxGenJS from "pptxgenjs";

const outputDir = path.resolve(process.cwd(), "exports");
const outputFile = path.resolve(outputDir, "CommTours_Company_Profile_2026_EN.pptx");

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
      paraSpaceAfterPt: 14,
    },
  );
}

async function generateProfilePptEn() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "CommTours";
  pptx.company = "CommTours";
  pptx.title = "CommTours Company Profile";
  pptx.subject = "Company profile";
  pptx.lang = "en-US";

  // Cover
  const s1 = pptx.addSlide();
  s1.background = { color: colors.bg };
  s1.addShape("roundRect", {
    x: 0.65,
    y: 0.75,
    w: 2.2,
    h: 0.42,
    rectRadius: 0.08,
    fill: { color: "DBEAFE" },
    line: { color: "DBEAFE", pt: 0 },
  });
  s1.addText("Company Profile", {
    x: 0.9,
    y: 0.85,
    w: 1.8,
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
  s1.addText("Smart Travel Content Platform & Conversion Partner", {
    x: 0.65,
    y: 2.32,
    w: 10.0,
    h: 0.38,
    fontFace: "Calibri",
    fontSize: 22,
    color: colors.muted,
  });
  s1.addShape("roundRect", {
    x: 0.65,
    y: 3.0,
    w: 7.2,
    h: 1.4,
    rectRadius: 0.08,
    fill: { color: "EEF2FF" },
    line: { color: "E2E8F0", pt: 1 },
  });
  s1.addText("Helping travelers discover the right tours faster, while helping partners acquire high-intent demand.", {
    x: 0.95,
    y: 3.35,
    w: 6.6,
    h: 0.7,
    fontFace: "Calibri",
    fontSize: 18,
    color: "1E40AF",
    bold: true,
    align: "center",
  });
  s1.addText(`Version: ${new Date().toISOString().slice(0, 10)}`, {
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
  header(s2, "Who We Are", "CommTours positioning");
  bullets(s2, [
    "CommTours is a travel product discovery and recommendation platform connecting demand and supply.",
    "Our core mission is to help users find better-fit travel options quickly and confidently.",
    "Platform strengths: content-led discovery, tour comparison, campaign placements, and measurable tracking.",
    "Business model: performance-oriented partnerships with transparent reconciliation.",
  ]);
  footer(s2);

  // Vision & mission
  const s3 = pptx.addSlide();
  header(s3, "Vision & Mission");
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
  s3.addText("Vision", {
    x: 1.2,
    y: 2.1,
    w: 5.0,
    h: 0.35,
    fontSize: 22,
    bold: true,
    color: "1D4ED8",
  });
  s3.addText("To become a trusted travel content and conversion platform in Greater China and wider Asia.", {
    x: 1.2,
    y: 2.6,
    w: 5.1,
    h: 1.6,
    fontSize: 18,
    color: colors.body,
  });
  s3.addText("Mission", {
    x: 7.25,
    y: 2.1,
    w: 5.0,
    h: 0.35,
    fontSize: 22,
    bold: true,
    color: "15803D",
  });
  s3.addText("Use technology and content to improve travel decision-making and deliver measurable growth for partners.", {
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
  header(s4, "What We Do", "Core capabilities");
  bullets(s4, [
    "Tour aggregation: present products from multiple suppliers in one discoverable experience.",
    "Content-driven conversion: guide users to action through curated pages and campaign topics.",
    "Tracking and analytics: connect click-to-booking reconciliation through ref_id-based workflow.",
    "Partnership optimization: review weekly performance and continuously improve conversion quality.",
  ]);
  footer(s4);

  // Value proposition
  const s5 = pptx.addSlide();
  header(s5, "Value Proposition", "Benefits for users and partners");
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
  s5.addText("For Travelers", {
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
      "Faster comparison across tours and offers",
      "Easier discovery of better-fit itineraries",
      "Lower search friction and clearer decisions",
    ],
    1.15,
    2.55,
    5.25,
    2.3,
  );
  s5.addText("For Partners", {
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
      "Access to high-intent travel demand",
      "Performance-based model with controlled risk",
      "Transparent data for scalable growth planning",
    ],
    7.2,
    2.55,
    5.2,
    2.3,
  );
  footer(s5);

  // Operations & trust
  const s6 = pptx.addSlide();
  header(s6, "Operations & Trust", "Trackable, reconcilable, optimizable");
  bullets(s6, [
    "Operate with a clear reporting rhythm (weekly tracking, monthly settlement).",
    "Use standardized fields and data exchange to reduce reconciliation overhead.",
    "Build long-term partner trust through transparent process governance.",
    "Continuously improve conversion efficiency through data-informed iteration.",
  ]);
  footer(s6);

  // Closing
  const s7 = pptx.addSlide();
  header(s7, "Closing", "Making every referral more valuable");
  s7.addShape("roundRect", {
    x: 0.9,
    y: 1.9,
    w: 11.7,
    h: 2.8,
    rectRadius: 0.08,
    fill: { color: "EEF2FF" },
    line: { color: "C7D2FE", pt: 1.2 },
  });
  s7.addText("CommTours is committed to being your trusted growth and conversion partner in travel.", {
    x: 1.2,
    y: 2.55,
    w: 11.0,
    h: 0.5,
    fontSize: 25,
    bold: true,
    color: "312E81",
    align: "center",
  });
  s7.addText("Open to discuss: brand partnerships / traffic partnerships / performance collaboration", {
    x: 1.2,
    y: 3.35,
    w: 11.0,
    h: 0.35,
    fontSize: 16,
    color: colors.body,
    align: "center",
  });
  s7.addShape("roundRect", {
    x: 3.7,
    y: 5.4,
    w: 5.2,
    h: 1.05,
    rectRadius: 0.08,
    fill: { color: "DBEAFE" },
    line: { color: "BFDBFE", pt: 1 },
  });
  s7.addText("Contact: __________________", {
    x: 4.08,
    y: 5.72,
    w: 4.5,
    h: 0.3,
    fontSize: 15,
    color: "1D4ED8",
  });
  footer(s7);

  fs.mkdirSync(outputDir, { recursive: true });
  await pptx.writeFile({ fileName: outputFile });
  console.log(outputFile);
}

void generateProfilePptEn();
