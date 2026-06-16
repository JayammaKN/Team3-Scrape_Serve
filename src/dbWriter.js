import Database from 'better-sqlite3';
import tar from 'tar-fs';
import fs from 'fs';
import { createWriteStream } from 'fs';

const databaseFile = 'recipes.db';
const tarFile = 'Team3_Scrape&Serve.tar';

let db;

//created a object for all tables to avoid hardcode table names throughout code   
const TABLES = {
  LFV_ELIMINATION: 'LFV_Elimination',
  LFV_ADD: 'LFV_Add',
  LCHF_ELIMINATION: 'LCHF_Elimination',
  LCHF_ADD: 'LCHF_Add',
  ALLERGIES_LFV_MILK: 'LFV_Allergy_Milk',
  ALLERGIES_LFV_NUT: 'LFV_Allergy_Nut',
  ALLERGIES_LFV_OTHER: 'LFV_Allergy_Other'
};

//this block initializes database if alreday exist deletes, used synchronous so it waits until deleted else creates new tables  
function initDb(fresh = true) {
  if (fresh && fs.existsSync(databaseFile)) {
    fs.unlinkSync(databaseFile);
  }

  db = new Database(databaseFile);
   createTables(); 
}

//all table structure is same so using common structure to create table 
function createTables() {
  const tableStructure = `
    (
      Recipe_ID TEXT PRIMARY KEY,
      Recipe_Name TEXT,
      Recipe_Category TEXT,
      Food_Category TEXT,
      Ingredients TEXT,
      Preparation_Time TEXT,
      Cooking_Time TEXT,
      Tag TEXT,
      No_of_servings TEXT,
      Cuisine_category TEXT,
      Recipe_Description TEXT,
      Preparation_method TEXT,
      Nutrient_values TEXT,
      Recipe_URL TEXT
    )
  `;

  db.exec(`CREATE TABLE IF NOT EXISTS ${TABLES.LFV_ELIMINATION} ${tableStructure}`);
  db.exec(`CREATE TABLE IF NOT EXISTS ${TABLES.LFV_ADD} ${tableStructure}`);
  db.exec(`CREATE TABLE IF NOT EXISTS ${TABLES.LCHF_ELIMINATION} ${tableStructure}`);
  db.exec(`CREATE TABLE IF NOT EXISTS ${TABLES.LCHF_ADD} ${tableStructure}`);
  db.exec(`CREATE TABLE IF NOT EXISTS ${TABLES.ALLERGIES_LFV_MILK} ${tableStructure}`);
  db.exec(`CREATE TABLE IF NOT EXISTS ${TABLES.ALLERGIES_LFV_NUT} ${tableStructure}`);
  db.exec(`CREATE TABLE IF NOT EXISTS ${TABLES.ALLERGIES_LFV_OTHER} ${tableStructure}`);

  console.log('Tables created successfully.');
}

// As SQLite not support array joining all array values for ingredients and method into string for inserting into database   
function joinList(value) {
  if (Array.isArray(value)) {
    return value.join(' | ');
  }
  return value || '';
}

// Inserting final recipe into the table. Filter module will call this function based on the logic and table name.    
function insertRecipe(tableName, recipe) {
  const sql = `
    INSERT OR REPLACE INTO ${tableName}
      (
        Recipe_ID,
        Recipe_Name,
        Recipe_Category,
        Food_Category,
        Ingredients,
        Preparation_Time,
        Cooking_Time,
        Tag,
        No_of_servings,
        Cuisine_category,
        Recipe_Description,
        Preparation_method,
        Nutrient_values,
        Recipe_URL
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const insertStatement = db.prepare(sql);

  insertStatement.run(
    recipe.Recipe_ID || '',
    recipe.Recipe_Name || '',
    recipe.Recipe_Category || '',
    recipe.Food_Category || '',
    joinList(recipe.Ingredients),
    recipe.Preparation_Time || '',
    recipe.Cooking_Time || '',
    recipe.Tag || '',
    recipe.No_of_servings || '',
    recipe.Cuisine_category || '',
    recipe.Recipe_Description || '',
    joinList(recipe.Preparation_method),
    recipe.Nutrient_values || '',
    recipe.Recipe_URL || ''
  );
  console.log(`Inserted recipe ${recipe.Recipe_ID} into ${tableName}`);

}

// Convert into submission.tar from recipes.db
function submitTar() {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(tarFile);

    tar.pack('.', { entries: [databaseFile] }).pipe(output);

    output.on('finish', () => {
      console.log('Tar file created successfully');
      resolve(tarFile);
    });

    output.on('error', reject);
  });
}

function closeDB() {
  if (db && db.open) {
    db.close();
  }
}

export {
  initDb,
  insertRecipe,
  submitTar,
  TABLES,
  closeDB
};
