import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const app = express();

app.use(cors());
app.use(express.json());

// ==============================
// 🔥 Facebook Scraper (Puppeteer FIXED)
// ==============================
app.post("/scrape/facebook", async (req, res) => {
  let browser;

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Missing URL" });
    }

    // 🚀 Launch browser (Render compatible)
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 🔥 wait load
    await page.waitForTimeout(5000);

    // 🔥 scroll to load comments
    for (let i = 0; i < 25; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1500);
    }

    // 🔥 extract comments
    const comments = await page.evaluate(() => {
      const nodes = document.querySelectorAll("div[dir='auto']");

      return Array.from(nodes)
        .map((el) => el.innerText)
        .filter((t) => t && t.length > 1);
    });

    await browser.close();

    return res.json({
      commentCount: comments.length,
      comments,
    });

  } catch (err) {
    console.error("🔥 FACEBOOK SCRAPER ERROR:", err);

    if (browser) await browser.close();

    return res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
});

// ==============================
// 🔥 HEALTH CHECK
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