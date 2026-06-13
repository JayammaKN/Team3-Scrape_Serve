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

//integration with Jaya's module
export function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL UNIQUE);
  `);
  console.log('Tables created successfully.');
}

  //Debug: show tables
 /* const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all();

  console.log('Existing tables:', tables); 
} */

export function closeDB() {
  db.close();
  
} 

