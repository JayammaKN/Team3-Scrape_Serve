import { initDb, submitTar, closeDB } from './dbWriter.js';
import { getUrls } from './database.js';
import { scrapeRecipe } from './recipeData_scraper.js';
import { filterAndStore } from './data_Filter.js';
import { chromium } from 'playwright';

async function main() {

  // Module 4 — Initialize DB and create all tables
  initDb(true);
  console.log('Database initialized.');

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

  // Module 1 — Get all URLs from scrape_data.db
  const urls = getUrls();
  console.log(`\nTotal URLs to scrape: ${urls.length}`);

  let processed = 0;
  let skipped = 0;

  // Loop through each URL sequentially
  for (const url of urls) {
    try {
      console.log(`\n[${processed + skipped + 1}/${urls.length}] Scraping: ${url}`);

      // Module 2 — Scrape 14 fields from recipe page
      const recipe = await scrapeRecipe(page, url);

      // Module 3 — Filter and store recipe into correct table
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

  // Module 4 — Bundle DB into .tar for submission
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