
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Use Render's persistent disk when DATABASE_PATH is configured.
// Otherwise, use the local students.db file.
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, "students.db");

// Ensure the database directory exists.
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Connect to SQLite.
const db = new Database(dbPath);

// Database settings.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create students table.
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    contact_number TEXT,
    course TEXT NOT NULL,
    year_level TEXT NOT NULL,
    gender TEXT NOT NULL
      CHECK (gender IN ('Male', 'Female', 'Prefer not to say')),
    status TEXT NOT NULL DEFAULT 'Active'
      CHECK (status IN ('Active', 'Inactive')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("SQLite database connected:", dbPath);

module.exports = db;
