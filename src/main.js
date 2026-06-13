import { initDb, submitTar, closeDB } from './dbWriter.js';     // Smita — DB init, tar
import { scrapeAllUrls } from './recipeurl.js';                 // Mayura — scrape URLs
import { saveAndGetUrls } from './database.js';                 // Mayura — save/read URLs
import { scrapeRecipe } from './recipeData_scraper.js';         // Sandhya — scrape recipe details
import { filterAndStore } from './data_Filter.js';             // Jaya — filter & store
import { chromium } from 'playwright';

async function main() {

  // Module 4 (Smita) — Initialize DB and create all tables
  initDb(true);
  console.log('Database initialized.');

  // Module 1 (Mayura) — Scrape all recipe URLs from website and store in DB
  const scrapedUrls = await scrapeAllUrls();
  const urls = saveAndGetUrls(scrapedUrls);
  console.log(`\nTotal URLs to scrape: ${urls.length}`);

  // Launch browser once — shared across all recipe scrapes
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  });

  const page = await context.newPage();

  let processed = 0;
  let skipped = 0;

  // Loop through each URL sequentially
  for (const url of urls) {
    try {
      console.log(`\n[${processed + skipped + 1}/${urls.length}] Scraping: ${url}`);

      // Module 2 (Sandhya) — Scrape 14 fields from recipe page
      const recipe = await scrapeRecipe(page, url);

      // Module 3 (Jaya) — Filter and store recipe into correct table
      filterAndStore(recipe);

      processed++;

      // Small delay between recipes — avoids getting blocked
      await page.waitForTimeout(1000);

    } catch (err) {
      console.log(`Skipped ${url}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\nDone — Processed: ${processed} | Skipped: ${skipped}`);

  // Close browser
  await browser.close();

  // Module 4 (Smita) — Bundle DB into .tar for submission
  await submitTar();
  console.log('Database bundled into submission.tar');

  // Close DB connection
  closeDB();
  console.log('Database connection closed.');
}

main().catch(err => {
  console.error('Error in main:', err);
  process.exit(1);
});