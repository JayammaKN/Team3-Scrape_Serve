import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
//const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database("../scrape_data.db");

export function initDB() {
  db.exec("CREATE TABLE IF NOT EXISTS urls (url TEXT)");
}
export function clearUrls() {
  db.exec("DELETE FROM urls");
}

export function getUrls() {
  return db
    .prepare("SELECT url FROM urls")
    .all()
    .map((r) => r.url);
}

export function closeUrlDB() {
  db.close();
}

export function saveAndGetUrls(urls) {
  clearUrls();
  const insert = db.prepare("INSERT OR IGNORE INTO urls (url) VALUES (?)");
  const tx = db.transaction((items) => {
    for (const url of items) {
      insert.run(url);
    }
  });
  tx(urls);
  return getUrls();
}
