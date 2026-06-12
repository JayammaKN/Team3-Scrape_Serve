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