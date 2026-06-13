// ===== OLD CODE (original) — commented for reference =====
/*
import Database from 'better-sqlite3';

// new database for urls
const db = new Database('./scrape_data.db');

// creating table for urls if it doesn't exist
export function initDB() {
  db.exec("CREATE TABLE IF NOT EXISTS urls (url TEXT)");
}

// function to save urls to the database
export function saveUrls(urls) {
  for (const url of urls) {
    db.prepare("INSERT INTO urls (url) VALUES (?)").run(url);
  }
}

// for integration with Sandhya's module 
export function getUrls() {
  return db.prepare("SELECT url FROM urls").all().map(r => r.url);
}

export function closeDB() {
  db.close();
}
*/

// ===== NEW CODE (uses shared DB, combined save+get function) =====

import Database from 'better-sqlite3';

const db = new Database('./recipes.db');

// creating table for urls if it doesn't exist
export function initDB() {
  db.exec("CREATE TABLE IF NOT EXISTS urls (url TEXT)");
}

// Combined function: save URLs to DB and return them all
export function saveAndGetUrls(urls) {
  const insert = db.prepare("INSERT OR IGNORE INTO urls (url) VALUES (?)");
  const tx = db.transaction((items) => {
    for (const url of items) {
      insert.run(url);
    }
  });
  tx(urls);
  return db.prepare("SELECT url FROM urls").all().map(r => r.url);
}

export function closeDB() {
  db.close();
}
