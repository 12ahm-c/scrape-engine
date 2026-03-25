import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const app = express();

app.use(cors());
app.use(express.json());

// ==============================
// 🔥 Facebook Scraper (FIXED + STABLE)
// ==============================
app.post("/scrape/facebook", async (req, res) => {
  let browser;

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Missing URL" });
    }

    // 🚀 Launch browser (Render stable config)
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    // 🚨 IMPORTANT: avoid networkidle2
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(5000);

    // scroll safely
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1200);
    }

    const comments = await page.evaluate(() => {
      const nodes = document.querySelectorAll("div[dir='auto']");

      return Array.from(nodes)
        .map(el => el.innerText)
        .filter(Boolean);
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
// 🔥 HEALTH CHECK (IMPORTANT FOR RENDER)
// ==============================
app.get("/", (req, res) => {
  res.status(200).send("Scrape Engine is running 🚀");
});

// ==============================
// 🔥 START SERVER (FIXED FOR RENDER)
// ==============================
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Scraper running on port ${PORT}`);
});