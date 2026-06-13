
import Database from 'better-sqlite3';
import fs from 'fs';
import { INGREDIENTS_FILE, MASTER_FILE } from './config.js';
import * as excel from '../utils/excelreader.js';
import { insertRecipe, TABLES } from './dbWriter.js';
//import { getUrls, closeDB } from './database.js'
import { getUrls,saveUrls} from './database.js';


//Make sure both excel files exist

function checkFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  if (fs.lstatSync(filePath).isDirectory()) {
    throw new Error(`This is a folder, not a file: ${filePath}`);
  }
}

const CONFIG = {
  ingredientsFile: INGREDIENTS_FILE,
  masterFile: MASTER_FILE,

  lchfSheetName: 'TABLE_LCHF ELIMINATION',
  lfvSheetName: 'TABLE_LFV ELMINATION',
  allergiesSheetName: 'ALLERGIES INGREDIANTS',

  lchfColumns: { eliminate: 'Eliminate', add: 'Add' },
  lfvColumns: { eliminate: 'Eliminate', add: 'Add' },
  allergiesColumns: { milk: 'Milk', nut: 'Nuts', other: 'Other' },

  outputSheets: {
    eliminate: 'TABLES.LFV_ELIMINATION',
    add: 'TABLES.LFV_ADD',
    milkAllergy: 'ALLERGIES_LFV-MILK',
    nutAllergy: 'ALLERGIES_LFV-NUT',
    otherAllergy: 'ALLERGIES_LFV-OTHER'
  },

  // columns we write into: A = Recipe_ID, B = Recipe_Name
  outputColumns: { recipeId: 1, recipeName: 2 }
};

function getSheetSafe(workbook, sheetName) {
  let sheet = excel.getSheet(workbook, sheetName);

  if (!sheet) {
    console.warn(`Trying a flexible search for a sheet matching: "${sheetName}"`);
    sheet = excel.findSheet(workbook, sheetName.trim());
  }

  if (!sheet) {
    console.warn(`Still could not find a sheet for: "${sheetName}"`);
  }

  return sheet;
}
function ingredientsMatchList(ingredientsText, wordList) {
  const text = (ingredientsText || '').toLowerCase();
  return wordList.some((word) => word && text.includes(word.toLowerCase()));
}

function classifyRecipe(recipe, lists) {
  const matchedTabs = [];

  if (ingredientsMatchList(recipe.Ingredients, lists.eliminate)) matchedTabs.push('eliminate');
  if (ingredientsMatchList(recipe.Ingredients, lists.add)) matchedTabs.push('add');
  if (ingredientsMatchList(recipe.Ingredients, lists.milkAllergy)) matchedTabs.push('milkAllergy');
  if (ingredientsMatchList(recipe.Ingredients, lists.nutAllergy)) matchedTabs.push('nutAllergy');
  if (ingredientsMatchList(recipe.Ingredients, lists.otherAllergy)) matchedTabs.push('otherAllergy');

  return matchedTabs;
}

const globalCache = new Set();

const sheetCache = {
  eliminate: new Set(),
  add: new Set(),
  milkAllergy: new Set(),
  nutAllergy: new Set(),
  otherAllergy: new Set()
};

// Read every existing Recipe_ID from every output tab, ONE TIME.
function loadExistingRecipeIds(sheets) {
  for (const tabKey in sheets) {
    const sheet = sheets[tabKey];
    if (!sheet) continue;

    for (let row = 1; row <= sheet.rowCount; row++) {
      const cellValue = sheet.getRow(row).getCell(CONFIG.outputColumns.recipeId).value;
      if (!cellValue) continue;

      const id = cellValue.toString().trim();
      globalCache.add(id);
      sheetCache[tabKey].add(id);
    }
  }
}
const DB_TABLE_MAP = {
  eliminate: TABLES.LFV_ELIMINATION,
  add: TABLES.LFV_ADD
};

// write one recipe into one tab (skip if it's a duplicate)
function addRecipeToSheet(sheet, recipe, tabKey) {
  if (!sheet) return;

  const id = recipe.Recipe_ID.toString().trim();

  if (globalCache.has(id)) {
    console.log(`Skipping ${id} - already in master file`);
    return;
  }

  if (sheetCache[tabKey].has(id)) {
    console.log(`Skipping ${id} - already in "${tabKey}"`);
    return;
  }

  // 1. write Recipe_ID + Recipe_Name into the excel master file
  excel.appendRow(sheet, {
    [CONFIG.outputColumns.recipeId]: recipe.Recipe_ID,
    [CONFIG.outputColumns.recipeName]: recipe.Recipe_Name
  });

  //  also save the FULL recipe into recipes.db, if this tab hasa matching table in dbWriter.js
  const tableName = DB_TABLE_MAP[tabKey];
  if (tableName) {
    insertRecipe(tableName, recipe);
  }

  globalCache.add(id);
  sheetCache[tabKey].add(id);

  console.log(`Added ${id} (${recipe.Recipe_Name}) -> "${tabKey}"`);
}
// The first time filterAndStore() is called, this opens both excel files, reads the word-lists, and remembers everything in memory so
// the next calls are fast (no re-opening files for every recipe).

let setupPromise = null;

async function setup() {
  checkFileExists(CONFIG.ingredientsFile);
  checkFileExists(CONFIG.masterFile);

  // 1. read the word-lists (eliminate / add / allergies)
  console.log('Opening ingredients file:', CONFIG.ingredientsFile);
  const ingredientsWorkbook = await excel.openWorkbook(CONFIG.ingredientsFile);

  const lchfSheet = getSheetSafe(ingredientsWorkbook, CONFIG.lchfSheetName);
  const lfvSheet = getSheetSafe(ingredientsWorkbook, CONFIG.lfvSheetName);
  const allergySheet = getSheetSafe(ingredientsWorkbook, CONFIG.allergiesSheetName);

  const lists = {
    eliminate: [
      ...excel.readColumn(lchfSheet, CONFIG.lchfColumns.eliminate),
      ...excel.readColumn(lfvSheet, CONFIG.lfvColumns.eliminate)
    ],
    add: [
      ...excel.readColumn(lchfSheet, CONFIG.lchfColumns.add),
      ...excel.readColumn(lfvSheet, CONFIG.lfvColumns.add)
    ],
    milkAllergy: excel.readColumn(allergySheet, CONFIG.allergiesColumns.milk),
    nutAllergy: excel.readColumn(allergySheet, CONFIG.allergiesColumns.nut),
    otherAllergy: excel.readColumn(allergySheet, CONFIG.allergiesColumns.other)
  };

  console.log('Opening master file:', CONFIG.masterFile);
  const masterWorkbook = await excel.openWorkbook(CONFIG.masterFile);

  const sheets = {
    eliminate: getSheetSafe(masterWorkbook, CONFIG.outputSheets.eliminate),
    add: getSheetSafe(masterWorkbook, CONFIG.outputSheets.add),
    milkAllergy: getSheetSafe(masterWorkbook, CONFIG.outputSheets.milkAllergy),
    nutAllergy: getSheetSafe(masterWorkbook, CONFIG.outputSheets.nutAllergy),
    otherAllergy: getSheetSafe(masterWorkbook, CONFIG.outputSheets.otherAllergy)
  };

  loadExistingRecipeIds(sheets);

  return { lists, masterWorkbook, sheets };
}

function getSetup() {
  if (!setupPromise) {
    setupPromise = setup();
  }
  return setupPromise;
}

export async function filterAndStore(recipe) {
  const { lists, masterWorkbook, sheets } = await getSetup();

  const matchedTabs = classifyRecipe(recipe, lists);

  if (matchedTabs.length === 0) {
    console.log(`${recipe.Recipe_ID} did not match any list`);
    return;
  }

  for (const tabKey of matchedTabs) {
    addRecipeToSheet(sheets[tabKey], recipe, tabKey);
  }

  await excel.saveWorkbook(masterWorkbook, CONFIG.masterFile);
}

export { CONFIG };