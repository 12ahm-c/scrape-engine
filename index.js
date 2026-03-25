import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const app = express();

app.use(cors());
app.use(express.json());

// ==============================
// 🔥 Facebook Scraper (FINAL VERSION)
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
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // 🔥 User-Agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    // ==============================
    // 🔥 ADD COOKIES (IMPORTANT FIX)
    // ==============================
    await page.setCookie(
      {
        name: "c_user",
        value: process.env.FB_C_USER,
        domain: ".facebook.com",
      },
      {
        name: "xs",
        value: process.env.FB_XS,
        domain: ".facebook.com",
      }
    );

    // 🔥 Open page
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 🔥 Wait for content
    try {
      await page.waitForSelector("div[role='article']", {
        timeout: 20000,
      });
    } catch (e) {
      console.log("⚠️ No articles found, continuing...");
    }

    // 🔥 Scroll to load more content
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await new Promise((r) => setTimeout(r, 1200));
    }

    // 🔥 Extract posts/comments
    const comments = await page.evaluate(() => {
      const posts = document.querySelectorAll("div[role='article']");

      return Array.from(posts)
        .map((el) => el.innerText)
        .filter((text) => text && text.length > 10 && text.length < 1500);
    });

    await browser.close();

    return res.json({
      success: true,
      commentCount: comments.length,
      comments,
    });
  } catch (err) {
    console.error("🔥 FACEBOOK SCRAPER ERROR:", err);

    if (browser) await browser.close();

    return res.status(500).json({
      success: false,
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