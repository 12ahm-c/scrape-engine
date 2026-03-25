import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();

app.use(cors());
app.use(express.json());

// ==============================
// 🔥 Facebook Scraper (FULL FIXED)
// ==============================
app.post("/scrape/facebook", async (req, res) => {
  let browser;

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Missing URL" });
    }

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // 🔥 انتظار تحميل الصفحة
    await page.waitForTimeout(5000);

    // 🔥 scroll لجلب التعليقات
    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(1500);
    }

    // 🔥 استخراج التعليقات
    const comments = await page.evaluate(() => {
      const nodes = document.querySelectorAll("div[dir='auto']");

      return Array.from(nodes)
        .map((n) => n.innerText)
        .filter((t) => t && t.length > 1);
    });

    await browser.close();

    return res.json({
      commentCount: comments.length,
      comments,
    });

  } catch (err) {
    console.error("🔥 FACEBOOK SCRAPER ERROR:", err);

    if (browser) {
      await browser.close();
    }

    return res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
});

// ==============================
// 🔥 HEALTH CHECK (مهم لـ Render)
// ==============================
app.get("/", (req, res) => {
  res.send("Scrape Engine is running 🚀");
});

// ==============================
// 🔥 START SERVER
// ==============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Scraper running on port ${PORT}`);
});