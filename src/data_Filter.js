import fs from 'fs';
import { INGREDIENTS_FILE } from './config.js';
import * as excel from '../utils/excelreader.js';
import { insertRecipe, TABLES } from './dbWriter.js';

function checkFileExists(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  if (fs.lstatSync(filePath).isDirectory()) throw new Error(`This is a folder, not a file: ${filePath}`);
}

const CONFIG = {
  ingredientsFile: INGREDIENTS_FILE,
  lchfSheetName: 'TABLE_LCHF ELIMINATION',
  lfvSheetName: 'TABLE_LFV ELMINATION',
  allergiesSheetName: 'ALLERGIES INGREDIANTS',
  lchfColumns: { eliminate: 'Eliminate', add: 'Add' },
  lfvColumns: { eliminate: 'Eliminate', add: 'Add' },
};

function getSheetSafe(workbook, sheetName) {
  let sheet = excel.getSheet(workbook, sheetName);
  if (!sheet) sheet = excel.findSheet(workbook, sheetName.trim());
  if (!sheet) console.warn(`Could not find sheet: "${sheetName}"`);
  return sheet;
}


function ingredientsMatchList(ingredients, wordList) {
  const text = (Array.isArray(ingredients) ? ingredients.join(' ') : (ingredients || '')).toLowerCase();
  return wordList.some((word) => {
    if (!word) return false;
    const w = word.toLowerCase().trim();
    const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    return re.test(text);
  });
}

let lists = null;
let setupPromise = null;

async function setup() {
  checkFileExists(CONFIG.ingredientsFile);
  const wb = await excel.openWorkbook(CONFIG.ingredientsFile);
  const lchfSheet = getSheetSafe(wb, CONFIG.lchfSheetName);
  const lfvSheet  = getSheetSafe(wb, CONFIG.lfvSheetName);
  const allergySheet = getSheetSafe(wb, CONFIG.allergiesSheetName);

  // Flat allergy list: Milk, Soy, Egg, Sesame, Peanuts, walnut, almond, hazelnut, pecan
  const allAllergens = excel.readColumn(allergySheet, 'Allergies (Bonus points)');

  const NUTS = ['walnut', 'almond', 'hazelnut', 'pecan', 'peanut', 'peanuts', 'cashew', 'pistachio'];
  const MILK = ['milk'];
  const norm = (a) => a.toLowerCase().trim();

  const allergyMilk  = allAllergens.filter((a) => MILK.includes(norm(a)));
  const allergyNut   = allAllergens.filter((a) => NUTS.includes(norm(a)));
  const allergyOther = allAllergens.filter((a) => !MILK.includes(norm(a)) && !NUTS.includes(norm(a)));

  lists = {
    lfvEliminate:  excel.readColumn(lfvSheet,  CONFIG.lfvColumns.eliminate),
    lfvAdd:        excel.readColumn(lfvSheet,  CONFIG.lfvColumns.add),
    lchfEliminate: excel.readColumn(lchfSheet, CONFIG.lchfColumns.eliminate),
    lchfAdd:       excel.readColumn(lchfSheet, CONFIG.lchfColumns.add),
    allergyMilk,
    allergyNut,
    allergyOther,
  };
}

function getSetup() {
  if (!setupPromise) setupPromise = setup();
  return setupPromise;
}

export async function filterAndStore(recipe) {
  await getSetup();
  const id = (recipe.Recipe_ID || '').toString().trim();
  if (!id) return;

  const ing = recipe.Ingredients;

  // Allergy checks first   

  // If Milk?
  if (ingredientsMatchList(ing, lists.allergyMilk)) {
    insertRecipe(TABLES.ALLERGIES_LFV_MILK, recipe);
    return;
  }

  // If Nuts?
  if (ingredientsMatchList(ing, lists.allergyNut)) {
    insertRecipe(TABLES.ALLERGIES_LFV_NUT, recipe);
    return;
  }

  // If other (soy, egg, sesame)?
  if (ingredientsMatchList(ing, lists.allergyOther)) {
    insertRecipe(TABLES.ALLERGIES_LFV_OTHER, recipe);
    return;
  }

  //Basic flow   

  // 1. LFV eliminate
  if (ingredientsMatchList(ing, lists.lfvEliminate)) {
    insertRecipe(TABLES.LFV_ELIMINATION, recipe);
    return;
  }

  // 2. LCHF eliminate
  if (ingredientsMatchList(ing, lists.lchfEliminate)) {
    insertRecipe(TABLES.LCHF_ELIMINATION, recipe);
    return;
  }

  // 3. LFV add
  if (ingredientsMatchList(ing, lists.lfvAdd)) {
    insertRecipe(TABLES.LFV_ADD, recipe);
    return;
  }

  // 4. LCHF add
  if (ingredientsMatchList(ing, lists.lchfAdd)) {
    insertRecipe(TABLES.LCHF_ADD, recipe);
    return;
  }

  // 5. No match → reject recipe
  console.log(`${id} rejected — fits no list`);
}

export { CONFIG };