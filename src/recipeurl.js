// This function scrapes recipe URLs from tarladalal.com
// It takes a 'page' object (from Playwright browser) and returns an array of recipe URLs

export async function scrapeAllUrls(page) {

  // Open a webpage and wait for it to load
  async function open(url) {
    await page.goto(url, {
      waitUntil: "domcontentloaded",  // wait until page content loads
      timeout: 120000,                 // max wait time: 2 minutes
    });
    await page.waitForTimeout(2000);   // pause 2 seconds for page to settle
    await page.keyboard.press("Escape").catch(() => {});  // close any popups
  }

  // Find all recipe links on the current page
  // Recipe URLs on tarladalal end with pattern like -1234r
  async function getRecipeLinks() {
    const links = await page
      .locator("a")
      .evaluateAll((anchors) =>
        anchors.map((a) => a.href).filter((href) => /-\d+r$/.test(href)),
      );
    return new Set(links);  // return as Set to remove duplicates
  }

  // Get all category links from the page
  async function getCategories() {
    const links = await page
      .locator("a")
      .evaluateAll((anchors) =>
        anchors
          .filter((a) => a.href.includes("/category/"))
          .map((a) => ({ text: a.textContent.trim(), href: a.href })),
      );
    // Remove duplicates (same URL = same category)
    return [...new Map(links.map((item) => [item.href, item])).values()];
  }

  // Find "View All" links inside a category
  async function getSubCategories() {
    return new Set(
      await page
        .locator("a")
        .evaluateAll((anchors) =>
          anchors
            .filter(
              (a) =>
                a.textContent.trim() === "View All" &&
                a.href.includes("/recipes/category/"),
            )
            .map((a) => a.href),
        ),
    );
  }

  // Open the main website
  await open("https://www.tarladalal.com/");

  // Click "Categories" button to open menu
  console.log("Opening Categories...");
  await page.getByRole("button", { name: "Categories" }).click();

  // Get all categories from the menu
  const categories = await getCategories();
  console.log(`Found ${categories.length} categories`);

  // Loop through first 5 categories
  const allRecipes = new Set();         // empty Set to store collected recipe URLs
  const recipesPerCategory = 50;        // how many recipes to collect per category
  for (const category of categories.slice(0, 5)) {
    console.log(`\n--- ${category.text} ---`);
    await open(category.href);          // open that category page

    // Find all "View All" sub-category links on this page
    const subCategories = await getSubCategories();
    let count = 0;                      // track how many recipes collected in this category

    // Visit each sub-category page
    for (const subUrl of subCategories) {
      if (count >= recipesPerCategory) break;  // stop if we have enough
      await open(subUrl);               // open the sub-category page

      // Collect all recipe links from this sub-category page
      for (const recipe of await getRecipeLinks()) {
        if (count >= recipesPerCategory) break;  // stop if we have enough

        // Add to Set (Set auto-removes duplicate URLs)
        if (!allRecipes.has(recipe)) {
          allRecipes.add(recipe);
          count++;
        }
      }
    }

    console.log(`${count} recipes collected`);
  }

  // Return all collected URLs as an array
  return [...allRecipes];  // convert Set to array and return
}
