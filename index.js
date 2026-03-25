import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Facebook scraper
app.post("/scrape/facebook", async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "Missing URL" });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle" });

  // scroll لجلب التعليقات
  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(1500);
  }

  const comments = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("div[dir='auto']"))
      .map(el => el.innerText)
      .filter(Boolean);
  });

  await browser.close();

  res.json({
    count: comments.length,
    comments,
  });
});

// تشغيل السيرفر
app.listen(3000, () => {
  console.log("Scraper running on port 3000");
});