import { initDb, insertRecipe, submitTar, TABLES } from './dbWriter.js';

const recipeA = {
  Recipe_ID: '3911r',
  Recipe_Name: 'Atte ka Malpua',
  Recipe_Category: 'Dessert',
  Food_Category: 'Vegetarian',
  Ingredients: ['plain flour', 'ghee', 'sugar', 'milk', 'cardamom'],
  Preparation_Time: '10 mins',
  Cooking_Time: '20 mins',
  Tag: 'Festival',
  No_of_servings: '4',
  Cuisine_category: 'Indian',
  Recipe_Description: 'A traditional sweet pancake soaked in sugar syrup.',
  Preparation_method: ['Mix the batter.', 'Fry until golden.', 'Serve warm.'],
  Nutrient_values: '250 kcal',
  Recipe_URL: 'https://m.tarladalal.com/atte-ka-malpua-3911r'
};

const recipeB = {
  Recipe_ID: '1234r',
  Recipe_Name: 'Spinach Salad',
  Recipe_Category: 'Salad',
  Food_Category: 'Vegan',
  Ingredients: ['spinach', 'lemon', 'olive oil', 'salt'],
  Preparation_Time: '5 mins',
  Cooking_Time: '0 mins',
  Tag: 'Healthy',
  No_of_servings: '2',
  Cuisine_category: 'Continental',
  Recipe_Description: 'A light fresh salad.',
  Preparation_method: ['Toss everything together.'],
  Nutrient_values: '90 kcal',
  Recipe_URL: 'https://m.tarladalal.com/spinach-salad-1234r'
};

async function main() {
  initDb(true); // fresh database + all four tables

  insertRecipe(TABLES.LFV_ELIMINATION, recipeA); // pretend A belongs here
  insertRecipe(TABLES.LCHF_ADD, recipeB);        // pretend B belongs here

  console.log('Inserted recipes into tables.');

  await submitTar();
  console.log('Done. Open recipes.db in DB Browser for SQLite to check.');
}

main();