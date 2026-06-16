export async function scrapeAllUrls(page) {
  async function open(url) {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(2000);
    await page.keyboard.press("Escape").catch(() => {});
  }

  async function getRecipeLinks() {
    const links = await page
      .locator("a")
      .evaluateAll((anchors) =>
        anchors.map((a) => a.href).filter((href) => /-\d+r$/.test(href)),
      );
    return new Set(links);
  }

  async function getCategories() {
    const links = await page
      .locator("a")
      .evaluateAll((anchors) =>
        anchors
          .filter((a) => a.href.includes("/category/"))
          .map((a) => ({ text: a.textContent.trim(), href: a.href })),
      );
    return [...new Map(links.map((item) => [item.href, item])).values()];
  }

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

  await open("https://www.tarladalal.com/");
  console.log("Opening Categories...");
  await page.getByRole("button", { name: "Categories" }).click();

  const categories = await getCategories();
  console.log(`Found ${categories.length} categories`);

  const allRecipes = new Set();
  const recipesPerCategory = 20;

  for (const category of categories.slice(0, 5)) {
    console.log(`\n--- ${category.text} ---`);
    await open(category.href);

    const subCategories = await getSubCategories();
    let count = 0;

    for (const subUrl of subCategories) {
      if (count >= recipesPerCategory) break;
      await open(subUrl);

      for (const recipe of await getRecipeLinks()) {
        if (count >= recipesPerCategory) break;
        if (!allRecipes.has(recipe)) {
          allRecipes.add(recipe);
          count++;
        }
      }
    }
    console.log(`${count} recipes collected`);
  }

  return [...allRecipes];
}
