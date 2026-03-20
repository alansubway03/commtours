/**
 * 永安旅遊（wingontravel）指定郵輪：抓所有「旅行團」並依港口關鍵字分類
 *
 * 規則（對應你例子）：
 * 1) 領航星號：香港、台灣、日本
 * 2) 領航星號：香港、日本（排除台灣）
 * 3) 幸運號：希臘、土耳其
 * 4) 鑽石公主號：日本、韓國
 *
 * 實作方式：
 * 1. 先打開主列表：`/cruises/list?port=all`
 * 2. 從頁面抓 ship filter 連結中的 `cruiseship-XXX` 對應（找出幸運號）
 * 3. 再打開各 ships 的清單頁 `cruises/list/cruiseship-XXX.html`，滾動載入
 * 4. 收集所有 `/cruises/detail-` 並抓 title + link
 * 5. 依關鍵字套規則輸出 JSON
 *
 * 輸出：
 *  scripts/output/wingon-cruises-ship-rules.json
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

const OUTPUT_DIR = resolve(process.cwd(), "scripts", "output");
const OUT_FILE = resolve(OUTPUT_DIR, "wingon-cruises-ship-rules.json");

type ShipRule = {
  ruleId: string;
  shipKeywords: string[];
  mustInclude: string[];
  mustExclude?: string[];
};

const RULES: ShipRule[] = [
  {
    ruleId: "navigator_hk_tw_jp",
    shipKeywords: ["領航星號"],
    mustInclude: ["香港", "台灣", "日本"],
  },
  {
    ruleId: "navigator_hk_jp",
    shipKeywords: ["領航星號"],
    mustInclude: ["香港", "日本"],
    mustExclude: ["台灣", "臺灣"],
  },
  {
    ruleId: "fortune_greece_turkey",
    shipKeywords: ["幸運號"],
    mustInclude: ["希臘", "土耳其"],
  },
  {
    ruleId: "diamond_japan_korea",
    shipKeywords: ["鑽石公主號"],
    mustInclude: ["日本", "韓國"],
  },
];

const MAIN_LIST_URL = "https://www.wingontravel.com/cruises/list?port=all";

// 已知 fallback（用來加速，mapping 若抓不到就用這個）
const KNOWN_CRUISESHIP_LIST_URLS: Record<string, string> = {
  "領航星號": "https://www.wingontravel.com/cruises/list/cruiseship-186.html",
  "幸運號": "https://www.wingontravel.com/cruises/list/cruiseship-41.html",
  "鑽石公主號": "https://www.wingontravel.com/cruises/list/cruiseship-16.html",
};

function normalizeText(s: string) {
  return String(s ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickShipKeyword(title: string, keywords: string[]) {
  for (const k of keywords) {
    if (title.includes(k)) return k;
  }
  return null;
}

function matchesRule(title: string, rule: ShipRule) {
  const shipHit = pickShipKeyword(title, rule.shipKeywords);
  if (!shipHit) return false;
  for (const w of rule.mustInclude) {
    if (!title.includes(w)) return false;
  }
  if (rule.mustExclude) {
    for (const w of rule.mustExclude) {
      if (title.includes(w)) return false;
    }
  }
  return true;
}

const EXTRACT_SHIP_MAPPING_JS = `
(function () {
  function normalizeText(s) {
    return String(s ?? "")
      .replace(/\\u00A0/g, " ")
      .replace(/\\s+/g, " ")
      .trim();
  }

  const anchors = Array.from(document.querySelectorAll("a[href*='/cruises/list/cruiseship-']"));
  const out = {};

  for (const a of anchors) {
    const href = a.getAttribute("href") || a.href || "";
    if (!href || !href.includes("cruiseship-")) continue;

    let full = href;
    try {
      full = new URL(href, location.origin).href;
    } catch (e) {}

    const m = full.match(/cruiseship-(\\d+)/);
    if (!m) continue;
    const id = m[1];

    const container = a.closest("li,article,div,section") || a.parentElement || a;
    const label = normalizeText(container && container.textContent ? container.textContent : "");
    out[id] = { url: full, label };
  }

  return out;
})()
`;

const EXTRACT_DETAIL_CARDS_JS = `
(function () {
  function normalizeText(s) {
    return String(s ?? "")
      .replace(/\\u00A0/g, " ")
      .replace(/\\s+/g, " ")
      .trim();
  }

  const links = Array.from(document.querySelectorAll("a[href*='/cruises/detail-']"));
  const items = [];

  for (const a of links) {
    const href = a.getAttribute("href") || a.href || "";
    if (!href) continue;
    let full = href;
    try {
      full = new URL(href, location.origin).href;
    } catch (e) {}

    const container = a.closest("li,article,div,section") || a.parentElement || a;
    const header = container.querySelector("h1,h2,h3,h4");
    const titleRaw = (header && header.textContent ? header.textContent : (container.textContent || ""));
    const title = normalizeText(String(titleRaw).slice(0, 220));
    if (!title) continue;
    items.push({ title, link: full });
  }

  return items;
})()
`;

const TRY_CLICK_MORE_JS = `
(function () {
  const els = Array.from(document.querySelectorAll("a,button"));
  for (const el of els) {
    const t = (el.textContent || "").trim();
    if (t && t.includes("查看更多")) {
      try { el.scrollIntoView({ block: "center" }); } catch (e) {}
      try { el.click(); } catch (e) {}
      return true;
    }
  }
  return false;
})()
`;

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  await page.goto(MAIN_LIST_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(2000);

  const shipMapping = (await page.evaluate(EXTRACT_SHIP_MAPPING_JS)) as Record<
    string,
    { url: string; label: string }
  >;

  const targetShipListUrls: Record<string, string> = {};
  for (const shipKeyword of ["領航星號", "幸運號", "鑽石公主號"]) {
    if (KNOWN_CRUISESHIP_LIST_URLS[shipKeyword]) {
      targetShipListUrls[shipKeyword] = KNOWN_CRUISESHIP_LIST_URLS[shipKeyword];
    }
  }

  // 若沒有已知的船隻清單頁，用 mapping 的 label 去匹配
  for (const shipKeyword of ["幸運號"]) {
    if (targetShipListUrls[shipKeyword]) continue;
    for (const entry of Object.values(shipMapping)) {
      if (entry.label && entry.label.includes(shipKeyword)) {
        targetShipListUrls[shipKeyword] = entry.url;
        break;
      }
    }
  }

  console.log("debug targetShipListUrls=", targetShipListUrls);

  const allProducts: { title: string; link: string; ship: string }[] = [];

  for (const [shipName, shipListUrl] of Object.entries(targetShipListUrls)) {
    console.log(`抓船：${shipName} -> ${shipListUrl}`);
    await page.goto(shipListUrl, { waitUntil: "domcontentloaded", timeout: 120000 });

    const collected = new Map<string, { title: string; link: string; ship: string }>();
    let prevCount = -1;
    let stable = 0;

    for (let iter = 0; iter < 18; iter++) {
      const clicked = await page.evaluate(TRY_CLICK_MORE_JS);
      if (clicked) {
        await page.waitForTimeout(2500);
      } else {
        // 滾動觸發懶載入
        await page.mouse.wheel(0, 2500);
        await page.waitForTimeout(2000);
      }

      const batch = (await page.evaluate(EXTRACT_DETAIL_CARDS_JS)) as {
        title: string;
        link: string;
      }[];

      for (const it of batch) {
        if (collected.has(it.link)) continue;
        // ship 判斷只用 title 中是否包含 shipName（快速）
        if (!it.title.includes(shipName)) continue;
        collected.set(it.link, { title: it.title, link: it.link, ship: shipName });
      }

      const count = collected.size;
      if (count === prevCount) stable += 1;
      else stable = 0;
      prevCount = count;
      console.log(`  iter=${iter} collected=${count} stable=${stable}`);
      if (stable >= 5) break;
    }

    allProducts.push(...Array.from(collected.values()));
  }

  const byRule: Record<string, { title: string; link: string }[]> = {};
  for (const r of RULES) byRule[r.ruleId] = [];

  for (const p of allProducts) {
    for (const r of RULES) {
      if (matchesRule(p.title, r)) {
        byRule[r.ruleId].push({ title: p.title, link: p.link });
      }
    }
  }

  for (const r of RULES) {
    const seen = new Set<string>();
    byRule[r.ruleId] = (byRule[r.ruleId] || []).filter((x) => {
      if (seen.has(x.link)) return false;
      seen.add(x.link);
      return true;
    });
  }

  writeFileSync(
    OUT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        byRule,
        totalCollected: allProducts.length,
        allProductsByShip: Object.fromEntries(
          Object.entries(
            allProducts.reduce((acc, p) => {
              if (!acc[p.ship]) acc[p.ship] = [];
              acc[p.ship].push({ title: p.title, link: p.link });
              return acc;
            }, {} as Record<string, { title: string; link: string }[]>)
          )
        ),
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`完成：輸出 ${OUT_FILE}`);
  for (const r of RULES) {
    console.log(`  ${r.ruleId}: ${byRule[r.ruleId]?.length ?? 0} 筆`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

