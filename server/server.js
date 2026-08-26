const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "../public")));

/*
 * Return the complete AceArch app state stored in SQLite.
 */
app.get("/api/data", (req, res) => {
    try {
        const tasks = db.prepare(`
            SELECT
                id,
                title,
                subject,
                deadline,
                priority,
                description,
                completed,
                created_at AS createdAt,
                updated_at AS updatedAt,
                completed_at AS completedAt
            FROM tasks
            ORDER BY created_at ASC
        `).all().map(task => ({
            ...task,
            completed: Boolean(task.completed)
        }));

        const subjects = db.prepare(`
            SELECT
                id,
                name,
                color,
                schedule,
                notes,
                created_at AS createdAt
            FROM subjects
            ORDER BY created_at ASC
        `).all().map(subject => ({
            ...subject,
            schedule: parseJSON(subject.schedule, []),
            notes: parseJSON(subject.notes, [])
        }));

        const settingsRows = db.prepare(`
            SELECT key, value FROM settings
        `).all();

        const settings = {};
        for (const row of settingsRows) {
            settings[row.key] = parseJSON(row.value, row.value);
        }

        const notifications = db.prepare(`
            SELECT
                id,
                notification_key AS key,
                title,
                message,
                created_at AS createdAt,
                read
            FROM notifications
            ORDER BY created_at ASC
        `).all().map(notification => ({
            id: notification.id,
            ...(notification.key ? { key: notification.key } : {}),
            title: notification.title,
            message: notification.message,
            createdAt: notification.createdAt,
            read: Boolean(notification.read)
        }));

        const calendarItems = db.prepare(`
            SELECT
                id,
                title,
                date,
                type,
                task_id AS taskId
            FROM calendar_items
            ORDER BY date ASC
        `).all();

        const focusSessions = db.prepare(`
            SELECT
                id,
                minutes,
                date,
                completed_at AS completedAt
            FROM focus_sessions
            ORDER BY completed_at ASC
        `).all();

        res.json({
            tasks,
            subjects,
            settings,
            notifications,
            calendarItems,
            focusSessions
        });
    } catch (error) {
        console.error("Database read error:", error);
        res.status(500).json({
            error: "Could not load AceArch data."
        });
    }
});

/*
 * Replace the SQLite-backed AceArch state in one transaction.
 * This keeps the database consistent if a save contains several
 * changed parts of the application.
 */
app.post("/api/data", (req, res) => {
    const data = req.body || {};

    const save = db.transaction(() => {
        db.prepare("DELETE FROM tasks").run();
        db.prepare("DELETE FROM subjects").run();
        db.prepare("DELETE FROM settings").run();
        db.prepare("DELETE FROM notifications").run();
        db.prepare("DELETE FROM calendar_items").run();
        db.prepare("DELETE FROM focus_sessions").run();

        const insertTask = db.prepare(`
            INSERT INTO tasks (
                id, title, subject, deadline, priority, description,
                completed, created_at, updated_at, completed_at
            ) VALUES (
                @id, @title, @subject, @deadline, @priority, @description,
                @completed, @createdAt, @updatedAt, @completedAt
            )
        `);

        for (const task of Array.isArray(data.tasks) ? data.tasks : []) {
            if (!task.id || !task.title) continue;

            insertTask.run({
                id: String(task.id),
                title: String(task.title),
                subject: task.subject ?? "",
                deadline: task.deadline ?? "",
                priority: task.priority ?? "",
                description: task.description ?? "",
                completed: task.completed ? 1 : 0,
                createdAt: task.createdAt ?? new Date().toISOString(),
                updatedAt: task.updatedAt ?? null,
                completedAt: task.completedAt ?? null
            });
        }

        const insertSubject = db.prepare(`
            INSERT INTO subjects (
                id, name, color, schedule, notes, created_at
            ) VALUES (
                @id, @name, @color, @schedule, @notes, @createdAt
            )
        `);

        for (const subject of Array.isArray(data.subjects) ? data.subjects : []) {
            if (!subject.id || !subject.name) continue;

            insertSubject.run({
                id: String(subject.id),
                name: String(subject.name),
                color: subject.color ?? "",
                schedule: JSON.stringify(Array.isArray(subject.schedule) ? subject.schedule : []),
                notes: JSON.stringify(Array.isArray(subject.notes) ? subject.notes : []),
                createdAt: subject.createdAt ?? new Date().toISOString()
            });
        }

        const insertSetting = db.prepare(`
            INSERT INTO settings (key, value)
            VALUES (@key, @value)
        `);

        if (data.settings && typeof data.settings === "object") {
            for (const [key, value] of Object.entries(data.settings)) {
                insertSetting.run({
                    key,
                    value: JSON.stringify(value)
                });
            }
        }

        const insertNotification = db.prepare(`
            INSERT INTO notifications (
                id, title, message, created_at, read, notification_key
            ) VALUES (
                @id, @title, @message, @createdAt, @read, @key
            )
        `);

        for (const notification of Array.isArray(data.notifications) ? data.notifications : []) {
            if (!notification.id) continue;

            insertNotification.run({
                id: String(notification.id),
                title: notification.title ?? "",
                message: notification.message ?? "",
                createdAt: notification.createdAt ?? new Date().toISOString(),
                read: notification.read ? 1 : 0,
                key: notification.key ?? null
            });
        }

        const insertCalendarItem = db.prepare(`
            INSERT INTO calendar_items (
                id, title, date, type, task_id
            ) VALUES (
                @id, @title, @date, @type, @taskId
            )
        `);

        for (const item of Array.isArray(data.calendarItems) ? data.calendarItems : []) {
            if (!item.id) continue;

            insertCalendarItem.run({
                id: String(item.id),
                title: item.title ?? "",
                date: item.date ?? "",
                type: item.type ?? "",
                taskId: item.taskId ?? null
            });
        }

        const insertFocusSession = db.prepare(`
            INSERT INTO focus_sessions (
                id, minutes, date, completed_at
            ) VALUES (
                @id, @minutes, @date, @completedAt
            )
        `);

        for (const session of Array.isArray(data.focusSessions) ? data.focusSessions : []) {
            if (!session.id) continue;

            insertFocusSession.run({
                id: String(session.id),
                minutes: Number(session.minutes) || 0,
                date: session.date ?? "",
                completedAt: session.completedAt ?? new Date().toISOString()
            });
        }
    });

    try {
        save();
        res.json({ success: true });
    } catch (error) {
        console.error("Database save error:", error);
        res.status(500).json({
            error: "Could not save AceArch data."
        });
    }
});

app.get("/api/test-database", (req, res) => {
    const result = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .all();

    res.json(result);
});

app.listen(PORT, () => {
    console.log(`AceArch is running at http://localhost:${PORT}`);
});

function parseJSON(value, fallback) {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}
