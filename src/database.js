import Database from 'better-sqlite3';

const db = new Database('./scrape_data.db');

export function initDB() {
  db.exec("CREATE TABLE IF NOT EXISTS urls (url TEXT)");
}

export function saveUrls(urls) {
  for (const url of urls) {
    db.prepare("INSERT INTO urls (url) VALUES (?)").run(url);
  }
}

export function closeDB() {
  db.close();
}