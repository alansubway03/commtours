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
const outputFile = path.resolve(outputDir, "CommTours_Partner_Proposal_2026_EN.pptx");

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
      fontSize: 20,
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
  pptx.title = "CommTours x Partner Proposal";

  // Slide 1: Cover
  const s1 = pptx.addSlide();
  s1.background = { color: theme.bg };
  s1.addShape("roundRect", {
    x: 0.65,
    y: 0.75,
    w: 1.9,
    h: 0.42,
    rectRadius: 0.08,
    fill: { color: "DBEAFE" },
    line: { color: "DBEAFE", pt: 0 },
  });
  s1.addText("Proposal", {
    x: 0.92,
    y: 0.85,
    w: 1.35,
    h: 0.22,
    fontFace: "Calibri",
    fontSize: 12,
    bold: true,
    color: "1D4ED8",
    align: "center",
  });
  s1.addText("CommTours x Travel Partner", {
    x: 0.65,
    y: 1.4,
    w: 10.0,
    h: 0.7,
    fontFace: "Calibri",
    fontSize: 44,
    bold: true,
    color: theme.title,
  });
  s1.addText("Traffic Partnership and Conversion-based Revenue Share", {
    x: 0.65,
    y: 2.25,
    w: 10.2,
    h: 0.35,
    fontFace: "Calibri",
    fontSize: 20,
    color: theme.muted,
  });
  s1.addShape("roundRect", {
    x: 0.65,
    y: 3.0,
    w: 6.5,
    h: 1.45,
    rectRadius: 0.1,
    fill: { color: "EEF2FF" },
    line: { color: "E2E8F0", pt: 1 },
  });
  s1.addText("Commission on successful bookings: 5% - 10%", {
    x: 0.95,
    y: 3.45,
    w: 5.9,
    h: 0.5,
    fontFace: "Calibri",
    fontSize: 26,
    bold: true,
    color: "1E40AF",
    align: "center",
  });
  s1.addText(`Date: ${new Date().toISOString().slice(0, 10)}`, {
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
  addHeader(s2, "Company Overview", "Who CommTours is and what we deliver");
  addBullets(s2, [
    "CommTours is a travel discovery platform focused on aggregating high-intent traffic for tour partners.",
    "We combine content, recommendation, and product comparison to improve booking decisions.",
    "Target audience: users with clear travel intent and stronger conversion potential.",
    "Our focus is measurable collaboration: trackable performance, transparent reconciliation, and scalable growth.",
  ]);
  addFooter(s2);

  // Slide 3: Cooperation model
  const s3 = pptx.addSlide();
  addHeader(s3, "Partnership Model", "Traffic delivery + booking conversion + settlement");
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
  s3.addText("CommTours Traffic", {
    x: 1.18,
    y: 2.2,
    w: 3.1,
    h: 0.35,
    fontSize: 19,
    bold: true,
    color: "1D4ED8",
    align: "center",
  });
  s3.addText("Partner Conversion", {
    x: 5.43,
    y: 2.2,
    w: 3.0,
    h: 0.35,
    fontSize: 19,
    bold: true,
    color: "15803D",
    align: "center",
  });
  s3.addText("Settlement", {
    x: 9.5,
    y: 2.2,
    w: 2.6,
    h: 0.35,
    fontSize: 19,
    bold: true,
    color: "C2410C",
    align: "center",
  });
  s3.addShape("line", {
    x: 4.65,
    y: 2.4,
    w: 0.35,
    h: 0,
    line: { color: "94A3B8", pt: 2, beginArrowType: "none", endArrowType: "triangle" },
  });
  s3.addShape("line", {
    x: 8.8,
    y: 2.4,
    w: 0.35,
    h: 0,
    line: { color: "94A3B8", pt: 2, beginArrowType: "none", endArrowType: "triangle" },
  });
  addBullets(
    s3,
    [
      "Use ref_id as the common key for click-to-booking reconciliation.",
      "Commission is based on successful bookings, not raw traffic volume.",
      "Weekly reconciliation and monthly settlement for better cash-flow visibility.",
    ],
    0.9,
    3.5,
    11.8,
    2.6,
  );
  addFooter(s3);

  // Slide 4: Commission structure
  const s4 = pptx.addSlide();
  addHeader(s4, "Commission Structure", "Suggested range for successful bookings: 5% - 10%");
  s4.addShape("roundRect", {
    x: 0.95,
    y: 1.8,
    w: 5.5,
    h: 2.7,
    rectRadius: 0.08,
    fill: { color: "EEF2FF" },
    line: { color: "C7D2FE", pt: 1.3 },
  });
  s4.addText("Commission Range", {
    x: 1.3,
    y: 2.05,
    w: 2.6,
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
  s4.addText("Calculated on confirmed successful bookings", {
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
      "5%: baseline long-term partnership plan",
      "7%: growth-target plan for quarterly expansion",
      "10%: strategic campaign / peak period plan",
    ],
    7.25,
    2.05,
    4.95,
    2.2,
  );
  addFooter(s4, "* Final rate can be adjusted by product type and campaign scope");

  // Slide 5: Workflow
  const s5 = pptx.addSlide();
  addHeader(s5, "Operational Workflow", "Weekly reporting + monthly settlement");
  addBullets(s5, [
    "Step 1: CommTours provides weekly referral/click records (with ref_id).",
    "Step 2: Partner returns weekly conversion report (ref_id / booking_id / status).",
    "Step 3: Both parties reconcile confirmed successful bookings.",
    "Step 4: Monthly invoicing and payment settlement.",
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
  s5.addText("Critical requirement: partner should preserve ref_id from landing URL for accurate reconciliation.", {
    x: 1.2,
    y: 5.68,
    w: 11.1,
    h: 0.35,
    fontSize: 16,
    bold: true,
    color: "92400E",
  });
  addFooter(s5);

  // Slide 6: Partnership benefits
  const s6 = pptx.addSlide();
  addHeader(s6, "Partnership Benefits", "A model designed for sustainable growth");
  addBullets(s6, [
    "Partner perspective: low upfront risk with outcome-based payment model.",
    "CommTours perspective: measurable conversion quality and optimization loop.",
    "Shared perspective: transparent reporting cadence builds trust and predictability.",
    "End goal: higher effective bookings and long-term revenue growth for both sides.",
  ]);
  addFooter(s6);

  // Slide 7: Next steps
  const s7 = pptx.addSlide();
  addHeader(s7, "Next Steps", "Suggested launch timeline: within 2 weeks");
  addBullets(s7, [
    "Week 1: align tracking fields, report format, and commission band (5% - 10%).",
    "Week 2: run a pilot with limited traffic and validate reconciliation flow.",
    "Week 3 onward: scale traffic and move into regular settlement cycle.",
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
  s7.addText("Business contact: __________________   |   Effective date: __________________", {
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
