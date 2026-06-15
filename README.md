# Team3 - Scrape & Serve

This project collects recipe URLs, scrapes data, filters it, and save results to a database.

## Project structure

- `src/` contains the main pipeline modules

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the main script:
   ```bash
   npm start
   ```

---

# Recipe object flow (Team 3)

This is the **shared shape** of a recipe as it travels through the pipeline:

```
recipeurl.js    ->  recipeData_scraper.js      ->  data_Filter.js                              ->  dbWriter.js
                  (produces receipe object)        (reads it and implements filter logic)          (saves it to database)
```


## The 14 fields structure 

| Key                 | Type              | Example                                               |
|-----                |-------------------|-------------------------------------------------------|
| Recipe_ID           | string            | "3911r"                                               |
| Recipe_Name         | string            | "Atte ka Malpua"                                      |
| Recipe_Category     | string            | "Dessert"                                             |
| Food_Category       | string            | "Vegetarian"                                          |
| Ingredients         | array of strings  | ["plain flour", "ghee", "sugar", "milk"]              |
| Preparation_Time    | string            | "10 mins"                                             |
| Cooking_Time        | string            | "20 mins"                                             |
| Tag                 | string            | "Festival"                                            |
| No_of_servings      | string            | "4"                                                   |
| Cuisine_category    | string            | "Indian"                                              |
| Recipe_Description  | string            | "A traditional sweet pancake..."                      |
| Preparation_method  | array of strings  | ["Mix the batter.", "Fry golden.", "Serve warm."]     |
| Nutrient_values     | string            | "250 kcal"                                            |
| Recipe_URL          | string            | "https://m.tarladalal.com/atte-ka-malpua-3911r"       |

---

## Example object (what the scraper produces)

const recipe = {
  Recipe_ID: "3911r",
  Recipe_Name: "Atte ka Malpua",
  Recipe_Category: "Dessert",
  Food_Category: "Vegetarian",
  Ingredients: ["plain flour", "ghee", "sugar", "milk", "cardamom"],
  Preparation_Time: "10 mins",
  Cooking_Time: "20 mins",
  Tag: "Festival",
  No_of_servings: "4",
  Cuisine_category: "Indian",
  Recipe_Description: "A traditional sweet pancake soaked in sugar syrup.",
  Preparation_method: [
    "Mix flour and milk into a batter.",
    "Heat ghee and fry spoonfuls until golden.",
    "Soak in sugar syrup and serve warm."
  ],
  Nutrient_values: "250 kcal",
  Recipe_URL: "https://m.tarladalal.com/atte-ka-malpua-3911r"
};


