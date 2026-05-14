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
const outputFile = path.resolve(outputDir, "CommTours_Partner_Cooperation_Modes_EN.pptx");

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

function addFooter(slide: PptxGenJS.Slide, text = "CommTours | Partner cooperation models") {
  slide.addText(text, {
    x: 0.6,
    y: 7.05,
    w: 9,
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
  fontSize = 19,
) {
  slide.addText(
    bullets.map((item) => ({ text: item, options: { bullet: { indent: 16 } } })),
    {
      x,
      y,
      w,
      h,
      fontFace: "Calibri",
      fontSize,
      color: theme.body,
      breakLine: true,
      paraSpaceAfter: 11,
    },
  );
}

async function generate() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "CommTours";
  pptx.company = "CommTours";
  pptx.subject = "Cooperation models overview";
  pptx.title = "CommTours — Partner cooperation models";

  // Slide 1 — Greeting & title
  const s1 = pptx.addSlide();
  s1.background = { color: theme.bg };
  s1.addShape("roundRect", {
    x: 0.65,
    y: 0.75,
    w: 2.4,
    h: 0.42,
    rectRadius: 0.08,
    fill: { color: "DBEAFE" },
    line: { color: "DBEAFE", pt: 0 },
  });
  s1.addText("To our partners", {
    x: 0.85,
    y: 0.85,
    w: 2,
    h: 0.22,
    fontFace: "Calibri",
    fontSize: 12,
    bold: true,
    color: "1D4ED8",
    align: "center",
  });
  s1.addText("Hello,", {
    x: 0.65,
    y: 1.35,
    w: 11,
    h: 0.4,
    fontFace: "Calibri",
    fontSize: 22,
    color: theme.body,
  });
  s1.addText(
    "Thank you for your interest in CommTours. We are a Hong Kong–focused tour discovery and comparison platform, and we look forward to transparent, sustainable partnerships with the travel trade.",
    {
      x: 0.65,
      y: 1.85,
      w: 11.5,
      h: 0.95,
      fontFace: "Calibri",
      fontSize: 17,
      color: theme.muted,
    },
  );
  s1.addText("Partner cooperation models", {
    x: 0.65,
    y: 3.05,
    w: 11,
    h: 0.65,
    fontFace: "Calibri",
    fontSize: 38,
    bold: true,
    color: theme.title,
  });
  s1.addText(
    "This deck summarises four ways to work with us, how each operates, and our fee principles. We are happy to discuss details.",
    {
      x: 0.65,
      y: 3.85,
      w: 11.2,
      h: 0.5,
      fontFace: "Calibri",
      fontSize: 16,
      color: theme.muted,
    },
  );
  s1.addText(`Date: ${new Date().toISOString().slice(0, 10)}`, {
    x: 0.65,
    y: 6.85,
    w: 4.2,
    h: 0.25,
    fontFace: "Calibri",
    fontSize: 11,
    color: theme.muted,
  });
  addFooter(s1);

  // Slide 2 — Overview table
  const s2 = pptx.addSlide();
  addHeader(s2, "Overview", "Four models — use individually or in combination");
  s2.addTable(
    [
      [
        { text: "Model", options: { bold: true, color: theme.title, fill: { color: "E2E8F0" } } },
        { text: "Summary", options: { bold: true, color: theme.title, fill: { color: "E2E8F0" } } },
        { text: "Fees", options: { bold: true, color: theme.title, fill: { color: "E2E8F0" } } },
      ],
      [
        { text: "1. Listings", options: { color: theme.body } },
        { text: "Tour content displayed on CommTours", options: { color: theme.body } },
        { text: "Free", options: { bold: true, color: "15803D" } },
      ],
      [
        { text: "2. Referral booking", options: { color: theme.body } },
        { text: "Users leave CommTours to book on your site", options: { color: theme.body } },
        { text: "Fee: 10% of tour price", options: { bold: true, color: "1D4ED8" } },
      ],
      [
        { text: "3. Homepage ads", options: { color: theme.body } },
        {
          text: "Banner / placement for brand or tours; click-through to your URL",
          options: { color: theme.body },
        },
        { text: "Placement fees TBC", options: { color: theme.body } },
      ],
      [
        { text: "4. Travel content", options: { color: theme.body } },
        {
          text: "Homepage “Travel info” features + links to your company & tours",
          options: { color: theme.body },
        },
        { text: "Editorial / exposure TBC", options: { color: theme.body } },
      ],
    ],
    {
      x: 0.65,
      y: 1.55,
      w: 12.3,
      h: 3.2,
      fontSize: 11.5,
      border: { type: "solid", color: "CBD5E1", pt: 1 },
      colW: [2.15, 6.55, 3.2],
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
  s2.addText(
    "* Final terms are governed by a signed agreement. Referral and placement rates can be customised.",
    {
      x: 0.95,
      y: 5.42,
      w: 11.7,
      h: 0.65,
      fontFace: "Calibri",
      fontSize: 13,
      color: "92400E",
    },
  );
  addFooter(s2);

  // Slide 3 — Model 1
  const s3 = pptx.addSlide();
  addHeader(s3, "Model 1 | Tour listings on CommTours", "No listing fee");
  addBullets(
    s3,
    [
      "What: Your tour facts (title, duration, price band, destination, highlights, images, official links) shown on CommTours for search and comparison.",
      "How: Agree data source / feed format or API; you set update cadence and a single point of contact.",
      "Fees: No charge for being listed — this enriches the platform and serves travellers.",
      "Note: If you also use Model 2, outbound links should carry tracking for reconciliation (see Model 2).",
    ],
    0.9,
    1.7,
    11.8,
    4.8,
    18,
  );
  addFooter(s3);

  // Slide 4 — Model 2
  const s4 = pptx.addSlide();
  addHeader(s4, "Model 2 | Referral to your website for booking", "Referral fee: 10% of tour price");
  addBullets(
    s4,
    [
      "Flow: User browses on CommTours → taps e.g. “Learn more” → lands on your site or booking page to complete the purchase.",
      "Basis: Fee is 10% of the tour price on mutually confirmed, paid bookings (e.g. HK$10,000 tour → HK$1,000 fee).",
      "How: Align on tracking (e.g. ref_id, UTM), reporting format, and reconciliation rhythm (e.g. weekly check, monthly settlement).",
      "Fees: Charged only on attributable, verifiable conversions — raw clicks alone are not billed. Definitions are set out in contract.",
    ],
    0.9,
    1.7,
    11.8,
    4.5,
    18,
  );
  s4.addShape("roundRect", {
    x: 0.65,
    y: 5.35,
    w: 12.3,
    h: 1.05,
    rectRadius: 0.08,
    fill: { color: "EFF6FF" },
    line: { color: "BFDBFE", pt: 1 },
  });
  s4.addText(
    "* 10% is our reference rate; it may vary by product line, campaign, or annual targets — as agreed in writing.",
    {
      x: 0.95,
      y: 5.58,
      w: 11.7,
      h: 0.55,
      fontFace: "Calibri",
      fontSize: 13,
      color: "1E40AF",
    },
  );
  addFooter(s4);

  // Slide 5 — Model 3
  const s5 = pptx.addSlide();
  addHeader(s5, "Model 3 | Homepage advertising placements", "Quoted by slot / period");
  addBullets(
    s5,
    [
      "What: Carousel or other agreed homepage placements for your brand, hero tours, or campaigns; clicks go to your chosen landing page (site, promo, tour code page, etc.).",
      "Assets: You supply copy, creative, and target URL; CommTours publishes to spec (flight dates and rotation by agreement).",
      "How: Confirm flighting, dimensions, click-tracking needs, and go-live / takedown process.",
      "Fees: Paid visibility / traffic — priced by period or campaign; rate card available on request.",
    ],
    0.9,
    1.7,
    11.8,
    4.8,
    18,
  );
  addFooter(s5);

  // Slide 6 — Model 4
  const s6 = pptx.addSlide();
  addHeader(s6, "Model 4 | “Travel info” features on the homepage", "Content marketing + traffic");
  addBullets(
    s6,
    [
      "What: Editorial-style items in the homepage “Travel info” area (e.g. North Korea specialist tours, cruise guides) with your blurb and links to relevant tours.",
      "Format: Short copy + image + outbound or on-site links; volume and refresh rate by project.",
      "How: Align on angle, compliance, link list, and schedule; sensitive destinations must meet law and platform policy.",
      "Fees: Combines editorial production and exposure — priced by article count / flighting.",
    ],
    0.9,
    1.7,
    11.8,
    4.8,
    18,
  );
  addFooter(s6);

  // Slide 7 — Contact
  const s7 = pptx.addSlide();
  addHeader(s7, "Next steps & contact", "We look forward to discussing the details");
  addBullets(
    s7,
    [
      "If you would like to activate one or more models, reply to this note or email us — we can schedule a short call on technical handoff and agreement structure.",
      "Helpful to have: named contact, product lines to pilot first, and any existing tracking / reporting practice (Model 2).",
    ],
    0.9,
    1.7,
    11.8,
    2.6,
    19,
  );
  s7.addShape("roundRect", {
    x: 0.65,
    y: 4.35,
    w: 6.4,
    h: 1.25,
    rectRadius: 0.1,
    fill: { color: "EEF2FF" },
    line: { color: "C7D2FE", pt: 1 },
  });
  s7.addText("CommTours", {
    x: 0.95,
    y: 4.55,
    w: 5.8,
    h: 0.35,
    fontFace: "Calibri",
    fontSize: 18,
    bold: true,
    color: "3730A3",
  });
  s7.addText("Email: info@commtours.com", {
    x: 0.95,
    y: 5.0,
    w: 5.8,
    h: 0.35,
    fontFace: "Calibri",
    fontSize: 16,
    color: theme.body,
  });
  s7.addText("Web: commtours.com", {
    x: 0.95,
    y: 5.35,
    w: 5.8,
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
