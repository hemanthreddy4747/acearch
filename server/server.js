const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("./database");

const app = express();
const PORT = 3000;

const JWT_SECRET =
    process.env.ACEARCH_JWT_SECRET ||
    "acearch-development-secret-change-this-later";

app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "../public")));

/* =========================================================
   AUTHENTICATION
========================================================= */

function createToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            username: user.username
        },
        JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
}

function authenticateToken(req, res, next) {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Authentication required."
        });
    }

    const token = header.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = db.prepare(`
            SELECT id, username
            FROM users
            WHERE id = ?
        `).get(decoded.userId);

        if (!user) {
            return res.status(401).json({
                error: "Account no longer exists."
            });
        }

        req.user = {
            id: user.id,
            username: user.username
        };

        next();
    } catch (error) {
        return res.status(401).json({
            error: "Invalid or expired authentication token."
        });
    }
}

function deleteUserData(userId) {
    const remove = db.transaction(() => {
        db.prepare("DELETE FROM tasks WHERE user_id = ?").run(userId);
        db.prepare("DELETE FROM subjects WHERE user_id = ?").run(userId);
        db.prepare("DELETE FROM settings WHERE user_id = ?").run(userId);
        db.prepare("DELETE FROM notifications WHERE user_id = ?").run(userId);
        db.prepare("DELETE FROM calendar_items WHERE user_id = ?").run(userId);
        db.prepare("DELETE FROM focus_sessions WHERE user_id = ?").run(userId);
    });
    remove();
}

function deleteUserAccount(userId) {
    const remove = db.transaction(() => {
        db.prepare("DELETE FROM tasks WHERE user_id = ?").run(userId);
        db.prepare("DELETE FROM subjects WHERE user_id = ?").run(userId);
        db.prepare("DELETE FROM settings WHERE user_id = ?").run(userId);
        db.prepare("DELETE FROM notifications WHERE user_id = ?").run(userId);
        db.prepare("DELETE FROM calendar_items WHERE user_id = ?").run(userId);
        db.prepare("DELETE FROM focus_sessions WHERE user_id = ?").run(userId);
        db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    });
    remove();
}

/* =========================================================
   REGISTER
========================================================= */

app.post("/api/auth/register", async (req, res) => {
    try {
        const username = String(req.body?.username || "").trim();
        const password = String(req.body?.password || "");

        if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
            return res.status(400).json({
                error:
                    "Username must be 3–30 characters and use only letters, numbers, or underscores."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters."
            });
        }

        const existingUser = db.prepare(`
            SELECT id
            FROM users
            WHERE username = ?
        `).get(username);

        if (existingUser) {
            return res.status(409).json({
                error: "That username is already in use."
            });
        }

        const userId =
            Date.now().toString() +
            "-" +
            crypto.randomBytes(8).toString("hex");

        const passwordHash = await bcrypt.hash(password, 12);

        db.prepare(`
            INSERT INTO users (
                id,
                username,
                password_hash,
                created_at
            )
            VALUES (
                @id,
                @username,
                @passwordHash,
                @createdAt
            )
        `).run({
            id: userId,
            username,
            passwordHash,
            createdAt: new Date().toISOString()
        });

        const user = {
            id: userId,
            username
        };

        const token = createToken(user);

        res.status(201).json({
            success: true,
            token,
            user
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            error: "Could not create account."
        });
    }
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/auth/login", async (req, res) => {
    try {
        const username = String(req.body?.username || "").trim();
        const password = String(req.body?.password || "");

        const user = db.prepare(`
            SELECT
                id,
                username,
                password_hash AS passwordHash
            FROM users
            WHERE username = ?
        `).get(username);

        if (!user) {
            return res.status(401).json({
                error: "Incorrect username or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                error: "Incorrect username or password."
            });
        }

        const publicUser = {
            id: user.id,
            username: user.username
        };

        const token = createToken(publicUser);

        res.json({
            success: true,
            token,
            user: publicUser
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            error: "Could not log in."
        });
    }
});

/* =========================================================
   CURRENT USER
========================================================= */

app.get("/api/auth/me", authenticateToken, (req, res) => {
    const user = db.prepare(`
        SELECT id, username
        FROM users
        WHERE id = ?
    `).get(req.user.id);

    if (!user) {
        return res.status(401).json({
            authenticated: false
        });
    }

    res.json({
        authenticated: true,
        user
    });
});

/* =========================================================
   DELETE CURRENT USER DATA
========================================================= */

app.delete("/api/account/data", authenticateToken, (req, res) => {
    try {
        const user = db.prepare("SELECT id FROM users WHERE id = ?").get(req.user.id);
        if (!user) {
            return res.status(401).json({ error: "Account no longer exists." });
        }

        deleteUserData(req.user.id);
        res.json({ success: true, message: "Your AceArch data was deleted. Your account is still active." });
    } catch (error) {
        console.error("Delete user data error:", error);
        res.status(500).json({ error: "Could not delete your AceArch data." });
    }
});

/* =========================================================
   DELETE CURRENT USER ACCOUNT
========================================================= */

app.delete("/api/account", authenticateToken, (req, res) => {
    try {
        const user = db.prepare("SELECT id FROM users WHERE id = ?").get(req.user.id);
        if (!user) {
            return res.status(401).json({ error: "Account no longer exists." });
        }

        deleteUserAccount(req.user.id);
        res.json({ success: true, message: "Your AceArch account and its data were deleted." });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ error: "Could not delete your AceArch account." });
    }
});

/* =========================================================
   LOAD USER DATA
========================================================= */

app.get("/api/data", authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;

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
            WHERE user_id = ?
            ORDER BY created_at ASC
        `).all(userId).map(task => ({
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
            WHERE user_id = ?
            ORDER BY created_at ASC
        `).all(userId).map(subject => ({
            ...subject,
            schedule: parseJSON(subject.schedule, []),
            notes: parseJSON(subject.notes, [])
        }));

        const settingsRows = db.prepare(`
            SELECT key, value
            FROM settings
            WHERE user_id = ?
        `).all(userId);

        const settings = {};

        for (const row of settingsRows) {
            const prefix = `${userId}::`;
            const key = row.key.startsWith(prefix)
                ? row.key.substring(prefix.length)
                : row.key;
            settings[key] = parseJSON(row.value, row.value);
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
            WHERE user_id = ?
            ORDER BY created_at ASC
        `).all(userId).map(notification => ({
            id: notification.id,
            ...(notification.key
                ? { key: notification.key }
                : {}),
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
            WHERE user_id = ?
            ORDER BY date ASC
        `).all(userId);

        const focusSessions = db.prepare(`
            SELECT
                id,
                minutes,
                date,
                completed_at AS completedAt
            FROM focus_sessions
            WHERE user_id = ?
            ORDER BY completed_at ASC
        `).all(userId);

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

/* =========================================================
   SAVE USER DATA
========================================================= */

app.post("/api/data", authenticateToken, (req, res) => {
    const data = req.body || {};
    const userId = req.user.id;

    const save = db.transaction(() => {

        /*
         * Delete ONLY this user's data.
         * Other accounts remain untouched.
         */

        db.prepare(`
            DELETE FROM tasks
            WHERE user_id = ?
        `).run(userId);

        db.prepare(`
            DELETE FROM subjects
            WHERE user_id = ?
        `).run(userId);

        db.prepare(`
            DELETE FROM settings
            WHERE user_id = ?
        `).run(userId);

        db.prepare(`
            DELETE FROM notifications
            WHERE user_id = ?
        `).run(userId);

        db.prepare(`
            DELETE FROM calendar_items
            WHERE user_id = ?
        `).run(userId);

        db.prepare(`
            DELETE FROM focus_sessions
            WHERE user_id = ?
        `).run(userId);

        /* -------------------------
           TASKS
        ------------------------- */

        const insertTask = db.prepare(`
            INSERT INTO tasks (
                id,
                user_id,
                title,
                subject,
                deadline,
                priority,
                description,
                completed,
                created_at,
                updated_at,
                completed_at
            )
            VALUES (
                @id,
                @userId,
                @title,
                @subject,
                @deadline,
                @priority,
                @description,
                @completed,
                @createdAt,
                @updatedAt,
                @completedAt
            )
        `);

        for (
            const task of Array.isArray(data.tasks)
                ? data.tasks
                : []
        ) {
            if (!task.id || !task.title) continue;

            insertTask.run({
                id: String(task.id),
                userId,
                title: String(task.title),
                subject: task.subject ?? "",
                deadline: task.deadline ?? "",
                priority: task.priority ?? "",
                description: task.description ?? "",
                completed: task.completed ? 1 : 0,
                createdAt:
                    task.createdAt ??
                    new Date().toISOString(),
                updatedAt: task.updatedAt ?? null,
                completedAt: task.completedAt ?? null
            });
        }

        /* -------------------------
           SUBJECTS
        ------------------------- */

        const insertSubject = db.prepare(`
            INSERT INTO subjects (
                id,
                user_id,
                name,
                color,
                schedule,
                notes,
                created_at
            )
            VALUES (
                @id,
                @userId,
                @name,
                @color,
                @schedule,
                @notes,
                @createdAt
            )
        `);

        for (
            const subject of Array.isArray(data.subjects)
                ? data.subjects
                : []
        ) {
            if (!subject.id || !subject.name) continue;

            insertSubject.run({
                id: String(subject.id),
                userId,
                name: String(subject.name),
                color: subject.color ?? "",
                schedule: JSON.stringify(
                    Array.isArray(subject.schedule)
                        ? subject.schedule
                        : []
                ),
                notes: JSON.stringify(
                    Array.isArray(subject.notes)
                        ? subject.notes
                        : []
                ),
                createdAt:
                    subject.createdAt ??
                    new Date().toISOString()
            });
        }

        /* -------------------------
           SETTINGS
        ------------------------- */

        const insertSetting = db.prepare(`
            INSERT INTO settings (
                key,
                user_id,
                value
            )
            VALUES (
                @key,
                @userId,
                @value
            )
        `);

        if (
            data.settings &&
            typeof data.settings === "object"
        ) {
            for (
                const [key, value]
                of Object.entries(data.settings)
            ) {
                insertSetting.run({
                    key: `${userId}::${key}`,
                    userId,
                    value: JSON.stringify(value)
                });
            }
        }

        /* -------------------------
           NOTIFICATIONS
        ------------------------- */

        const insertNotification = db.prepare(`
            INSERT INTO notifications (
                id,
                user_id,
                title,
                message,
                created_at,
                read,
                notification_key
            )
            VALUES (
                @id,
                @userId,
                @title,
                @message,
                @createdAt,
                @read,
                @key
            )
        `);

        for (
            const notification
            of Array.isArray(data.notifications)
                ? data.notifications
                : []
        ) {
            if (!notification.id) continue;

            insertNotification.run({
                id: String(notification.id),
                userId,
                title: notification.title ?? "",
                message: notification.message ?? "",
                createdAt:
                    notification.createdAt ??
                    new Date().toISOString(),
                read: notification.read ? 1 : 0,
                key: notification.key ?? null
            });
        }

        /* -------------------------
           CALENDAR
        ------------------------- */

        const insertCalendarItem = db.prepare(`
            INSERT INTO calendar_items (
                id,
                user_id,
                title,
                date,
                type,
                task_id
            )
            VALUES (
                @id,
                @userId,
                @title,
                @date,
                @type,
                @taskId
            )
        `);

        for (
            const item
            of Array.isArray(data.calendarItems)
                ? data.calendarItems
                : []
        ) {
            if (!item.id) continue;

            insertCalendarItem.run({
                id: String(item.id),
                userId,
                title: item.title ?? "",
                date: item.date ?? "",
                type: item.type ?? "",
                taskId: item.taskId ?? null
            });
        }

        /* -------------------------
           FOCUS SESSIONS
        ------------------------- */

        const insertFocusSession = db.prepare(`
            INSERT INTO focus_sessions (
                id,
                user_id,
                minutes,
                date,
                completed_at
            )
            VALUES (
                @id,
                @userId,
                @minutes,
                @date,
                @completedAt
            )
        `);

        for (
            const session
            of Array.isArray(data.focusSessions)
                ? data.focusSessions
                : []
        ) {
            if (!session.id) continue;

            insertFocusSession.run({
                id: String(session.id),
                userId,
                minutes:
                    Number(session.minutes) || 0,
                date: session.date ?? "",
                completedAt:
                    session.completedAt ??
                    new Date().toISOString()
            });
        }
    });

    try {
        save();

        res.json({
            success: true
        });

    } catch (error) {
        console.error(
            "Database save error:",
            error
        );

        res.status(500).json({
            error: "Could not save AceArch data."
        });
    }
});

/* =========================================================
   DATABASE TEST
========================================================= */

app.get("/api/test-database", (req, res) => {
    try {
        const result = db
            .prepare(`
                SELECT name
                FROM sqlite_master
                WHERE type = 'table'
                ORDER BY name
            `)
            .all();

        res.json(result);

    } catch (error) {
        console.error(
            "Database test error:",
            error
        );

        res.status(500).json({
            error: "Could not test database."
        });
    }
});

/* =========================================================
   SERVER
========================================================= */

app.listen(PORT, () => {
    console.log(
        `AceArch is running at http://localhost:${PORT}`
    );
});

/* =========================================================
   HELPERS
========================================================= */

function parseJSON(value, fallback) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return fallback;
    }

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}