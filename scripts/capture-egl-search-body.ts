import { chromium } from "playwright";
const URL =
  "https://www.egltours.com/website/tour-line/%E9%95%B7%E7%B7%9A";
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const p = await b.newPage();
  p.on("request", (req) => {
    if (req.url().includes("web-routes/search") && req.method() === "POST") {
      console.log(req.postData());
    }
  });
  await p.goto(URL, { waitUntil: "load", timeout: 90000 });
  await p.waitForTimeout(8000);
  await b.close();
})();
