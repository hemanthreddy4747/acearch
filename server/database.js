const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dataDirectory = path.join(__dirname, "..", "data");

if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}

const dbPath = path.join(dataDirectory, "acearch.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
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
        name TEXT NOT NULL,
        color TEXT,
        schedule TEXT DEFAULT '[]',
        notes TEXT DEFAULT '[]',
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT,
        message TEXT,
        created_at TEXT,
        read INTEGER DEFAULT 0,
        notification_key TEXT
    );

    CREATE TABLE IF NOT EXISTS calendar_items (
        id TEXT PRIMARY KEY,
        title TEXT,
        date TEXT,
        type TEXT,
        task_id TEXT
    );

    CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY,
        minutes INTEGER,
        date TEXT,
        completed_at TEXT
    );
`);

// Add columns to older AceArch databases without destroying existing data.
function addColumnIfMissing(table, column, definition) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns.some(item => item.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
}

addColumnIfMissing("tasks", "priority", "TEXT");
addColumnIfMissing("tasks", "description", "TEXT");
addColumnIfMissing("tasks", "updated_at", "TEXT");
addColumnIfMissing("tasks", "completed_at", "TEXT");

addColumnIfMissing("subjects", "schedule", "TEXT DEFAULT '[]'");
addColumnIfMissing("subjects", "notes", "TEXT DEFAULT '[]'");

addColumnIfMissing("notifications", "read", "INTEGER DEFAULT 0");
addColumnIfMissing("notifications", "notification_key", "TEXT");

console.log(`SQLite database ready: ${dbPath}`);

module.exports = db;
