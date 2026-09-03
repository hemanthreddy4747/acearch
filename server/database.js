const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Development:
//   project/data/acearch.db
//
// Packaged app:
//   Electron's userData/data/acearch.db
const dataDirectory = process.env.ACEARCH_DATA_DIR
    ? process.env.ACEARCH_DATA_DIR
    : path.join(__dirname, "..", "data");

if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}

const dbPath = path.join(dataDirectory, "acearch.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        deadline TEXT,
        subject TEXT,
        priority TEXT,
        description TEXT,
        created_at TEXT,
        updated_at TEXT,
        completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        color TEXT,
        schedule TEXT DEFAULT '[]',
        notes TEXT DEFAULT '[]',
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        user_id TEXT,
        value TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        message TEXT,
        created_at TEXT,
        read INTEGER DEFAULT 0,
        notification_key TEXT
    );

    CREATE TABLE IF NOT EXISTS calendar_items (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        date TEXT,
        type TEXT,
        task_id TEXT
    );

    CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        minutes INTEGER,
        date TEXT,
        completed_at TEXT
    );
`);

// Add columns to older AceArch databases without destroying existing data.
function addColumnIfMissing(table, column, definition) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();

    if (!columns.some(item => item.name === column)) {
        db.exec(
            `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
        );
    }
}

// Existing AceArch migrations.
addColumnIfMissing("tasks", "priority", "TEXT");
addColumnIfMissing("tasks", "description", "TEXT");
addColumnIfMissing("tasks", "updated_at", "TEXT");
addColumnIfMissing("tasks", "completed_at", "TEXT");

addColumnIfMissing("subjects", "schedule", "TEXT DEFAULT '[]'");
addColumnIfMissing("subjects", "notes", "TEXT DEFAULT '[]'");

addColumnIfMissing("notifications", "read", "INTEGER DEFAULT 0");
addColumnIfMissing("notifications", "notification_key", "TEXT");

// Authentication/data ownership columns.
addColumnIfMissing("tasks", "user_id", "TEXT");
addColumnIfMissing("subjects", "user_id", "TEXT");
addColumnIfMissing("settings", "user_id", "TEXT");
addColumnIfMissing("notifications", "user_id", "TEXT");
addColumnIfMissing("calendar_items", "user_id", "TEXT");
addColumnIfMissing("focus_sessions", "user_id", "TEXT");

console.log(`SQLite database ready: ${dbPath}`);

module.exports = db;