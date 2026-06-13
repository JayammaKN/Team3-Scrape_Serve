import { SCRAPER } from './config.js';
import { chromium } from 'playwright';
import { getUrls, closeDB } from './database.js';

export async function scrapeRecipe(page, url) {
  let attempts = 0;

  while (attempts < SCRAPER.maxRetries) {
    try {
      // open recipe page
      await page.goto(url);
      await page.waitForSelector('h1.rec-heading', { timeout: SCRAPER.timeout });

      const recipe = {};

      // Getting Recipe ID from URL
      const match = url.match(/-(\d+)r\/?$/);
      recipe.recipe_id = match ? match[1] : url;

      // Recipe Name
      recipe.recipe_name = await getText(page, 'h1.rec-heading');

      // using Breadcrumb to get all categories
      const breadcrumbLinks = await page.$$('p.breadcrumbs a');
      const crumbs = [];
      for (const link of breadcrumbLinks) {
        const text = (await link.innerText()).trim();
        crumbs.push(text);
      }
      recipe.food_category    = crumbs[1] || '';
      recipe.cuisine_category = crumbs[3] || '';
      recipe.recipe_category  = crumbs[crumbs.length - 1] || '';

      // Using Array to get Ingredients
      const ingredientElements = await page.$$('div#ingredients li');
      recipe.ingredients = [];
      for (const li of ingredientElements) {
        const text = (await li.innerText()).trim();
        if (text) recipe.ingredients.push(text);
      }

      // Using time boxes to get the heading of each box to know what it contains
      recipe.preparation_time = '';
      recipe.cooking_time     = '';
      recipe.no_of_servings   = '';

      const allTimeBoxes = await page.$$('div.box-time, div.box-timen');

      for (const box of allTimeBoxes) {
        const heading = await box.$eval('h6', el => el.innerText).catch(() => '');
        const value   = await box.$eval('strong', el => el.innerText).catch(() => '');

        const headingLower = heading.toLowerCase().trim();
        const valueLower   = value.toLowerCase().trim();

        if (headingLower.includes('preparation')) {
          recipe.preparation_time = value.trim();
        }

        if (headingLower.includes('cooking')) {
          recipe.cooking_time = value.trim();
        }

        if (
          headingLower.includes('makes')   ||
          headingLower.includes('serving') ||
          valueLower.includes('serving')   ||
          valueLower.includes('piece')     ||
          valueLower.includes('plate')     ||
          valueLower.includes('portion')   ||
          valueLower.includes('cookie')    ||
          valueLower.includes('cup')       ||
          valueLower.includes('glass')
        ) {
          recipe.no_of_servings = value.trim();
        }
      }

      // Tags
      const tagElements = await page.$$('ul.tags-list li a');
      const tags = [];
      for (const tag of tagElements) {
        const text = (await tag.innerText()).trim();
        if (text) tags.push(text);
      }
      recipe.tag = tags.join(', ');

      // Recipe Description
      recipe.recipe_description = await page
        .$eval('meta[property="og:description"]', el => el.getAttribute('content'))
        .catch(() => '');
      recipe.recipe_description = (recipe.recipe_description || '').replace(/\s+/g, ' ').trim();

      // Preparation Method
      const methodSteps = await page.$$('ol#recipe-method li p');
      const steps = [];
      for (let i = 0; i < methodSteps.length; i++) {
        const text = (await methodSteps[i].innerText()).trim();
        if (text) steps.push(`${i + 1}. ${text}`);
      }
      recipe.preparation_method = steps.join(' | ');

      // Nutrient Values
      const nutrientRows = await page.$$('div.col-md table tr');
      const nutrients = [];
      for (const row of nutrientRows) {
        const cells = await row.$$('td');
        if (cells.length >= 2) {
          const label = (await cells[0].innerText()).trim();
          const value = (await cells[1].innerText()).trim();
          if (label && value) nutrients.push(`${label}: ${value}`);
        }
      }
      recipe.nutrient_values = nutrients.join(' | ');

      // Recipe URL
      recipe.recipe_url = url;

      // Print all fields to console
      printToConsole(recipe);

      return recipe;

    } catch (err) {
      attempts++;
      console.warn(`  Attempt ${attempts}/${SCRAPER.maxRetries} failed for ${url}`);
      console.warn(`  Error: ${err.message}`);

      if (attempts >= SCRAPER.maxRetries) {
        console.error(`  ✗ Giving up on: ${url}`);
        return null;
      }
      await page.waitForTimeout(5000 * attempts);
    }
  }
}

// Reads URLs from DB → scrapes each one → returns all recipes for Module 3
export async function scrapeAllRecipes() {
  const urls = getUrls();
  console.log(`\nModule 2 starting — ${urls.length} URLs to scrape`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
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

  const allRecipes = [];
  let processed = 0;
  let skipped = 0;

  for (const url of urls) {
    console.log(`\n[${processed + skipped + 1}/${urls.length}] Scraping: ${url}`);

    const recipe = await scrapeRecipe(page, url);

    if (recipe) {
      allRecipes.push(recipe);
      processed++;
    } else {
      skipped++;
    }

    await page.waitForTimeout(1000);
  }

  console.log(`\nModule 2 done — Scraped: ${processed} | Skipped: ${skipped}`);
  await browser.close();
  closeDB();

  return allRecipes;
}

// Get text from one element
async function getText(page, selector) {
  const element = await page.$(selector);
  if (!element) return '';
  return (await element.innerText()).trim();
}

// Console Printer
function printToConsole(recipe) {
  console.log('\n' + '─'.repeat(65));
  console.log('RECIPE SCRAPED');
  console.log('─'.repeat(65));

  console.log(`  1.  Recipe ID          : ${recipe.recipe_id}`);
  console.log(`  2.  Recipe Name        : ${recipe.recipe_name}`);
  console.log(`  3.  Recipe Category    : ${recipe.recipe_category}`);
  console.log(`  4.  Food Category      : ${recipe.food_category}`);
  console.log(`  5.  Ingredients        : ${recipe.ingredients.slice(0, 3).join(', ')}...`);
  console.log(`  6.  Preparation Time   : ${recipe.preparation_time}`);
  console.log(`  7.  Cooking Time       : ${recipe.cooking_time}`);
  console.log(`  8.  Tag                : ${recipe.tag}`);
  console.log(`  9.  No of Servings     : ${recipe.no_of_servings}`);
  console.log(`  10. Cuisine Category   : ${recipe.cuisine_category}`);
  console.log(`  11. Description        : ${recipe.recipe_description.substring(0, 60)}...`);
  console.log(`  12. Preparation Method : ${recipe.preparation_method.substring(0, 60)}...`);
  console.log(`  13. Nutrient Values    : ${recipe.nutrient_values.substring(0, 60)}...`);
  console.log(`  14. Recipe URL         : ${recipe.recipe_url}`);
  console.log('─'.repeat(65));
}


// TEMP TEST
//import { chromium } from 'playwright';

// const browser = await chromium.launch({ headless: false, slowMo: 500 });
// const context = await browser.newContext({
//   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//   viewport: { width: 1280, height: 720 },
// });
// const page = await context.newPage();
// await scrapeRecipe(page, 'https://www.tarladalal.com/appam--how-to-make-appam--32844r');
// await browser.close();
// TEMP TEST — scrapeAllRecipes (reads from DB)
// await scrapeAllRecipes();