/** 一次性：開 EGL 長線頁，記錄 JSON/API 回應 URL（找 tour 資料來源） */
import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";

const URL =
  "https://www.egltours.com/website/tour-line/%E9%95%B7%E7%B7%9A";
const OUT = resolve(process.cwd(), "scripts/output/egl-network-hints.json");

async function main() {
  const hints: { url: string; status: number; snippet: string }[] = [];
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  page.on("response", async (res) => {
    const u = res.url();
    if (!/egltours|localhost/i.test(u)) return;
    const ct = (res.headers()["content-type"] || "").toLowerCase();
    if (!ct.includes("json") && !/api|graphql|tour|product|line/i.test(u))
      return;
    try {
      const txt = await res.text();
      if (txt.length > 200000) return;
      const low = txt.toLowerCase();
      if (
        !low.includes("tour") &&
        !low.includes("itinerary") &&
        !low.includes("product") &&
        !low.includes("package")
      )
        return;
      hints.push({
        url: u,
        status: res.status(),
        snippet: txt.slice(0, 1200),
      });
    } catch {
      /* ignore */
    }
  });
  await page.goto(URL, { waitUntil: "load", timeout: 90000 });
  await page.waitForTimeout(10000);
  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(3000);
  writeFileSync(OUT, JSON.stringify(hints, null, 2), "utf-8");
  console.log("寫入", hints.length, "條 →", OUT);
  for (const h of hints.slice(0, 15)) console.log(h.url);
  await browser.close();
}

main().catch(console.error);
