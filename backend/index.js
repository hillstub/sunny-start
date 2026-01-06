const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;
const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, 'data', 'sunny_start.db');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Debug Middleware: Log Auth Headers
app.use((req, res, next) => {
    const email = req.headers['x-auth-request-email'];
    console.log(`[Request] ${req.method} ${req.url} | Email: ${email || 'MISSING (defaulting to dev@local)'}`);
    next();
});

// SQLite Database Setup
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('Connected to SQLite database.');
});

// Initialize Schema
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS chores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        text TEXT,
        completed BOOLEAN DEFAULT 0
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        date INTEGER,
        time INTEGER
    )`);
});

// Auth Helper: Get user email from OAuth2 Proxy header
const getUserEmail = (req) => req.headers['x-auth-request-email'] || 'dev@local';

// API Endpoints
app.get('/api/chores', (req, res) => {
    const email = getUserEmail(req);
    db.all('SELECT * FROM chores WHERE user_email = ?', [email], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

app.post('/api/chores', (req, res) => {
    const email = getUserEmail(req);
    const { text } = req.body;
    db.run('INSERT INTO chores (user_email, text) VALUES (?, ?)', [email, text], function (err) {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ id: this.lastID, text, completed: false });
    });
});

app.delete('/api/chores/:id', (req, res) => {
    const email = getUserEmail(req);
    db.run('DELETE FROM chores WHERE id = ? AND user_email = ?', [req.params.id, email], function (err) {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ success: true });
    });
});

app.get('/api/history', (req, res) => {
    const email = getUserEmail(req);
    db.all('SELECT * FROM history WHERE user_email = ? ORDER BY date DESC LIMIT 5', [email], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

app.post('/api/history', (req, res) => {
    const email = getUserEmail(req);
    const { date, time } = req.body;
    db.run('INSERT INTO history (user_email, date, time) VALUES (?, ?, ?)', [email, date, time], function (err) {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ success: true });
    });
});

app.get('/api/joke', (req, res) => {
    const jokePath = process.env.JOKES_FILE_PATH || '/app/data/jokes.txt';
    fs.readFile(jokePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading jokes file:', err);
            return res.json({ joke: "Why did the sun go to school? To get brighter! ☀️" });
        }
        const lines = data.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
            return res.json({ joke: "You're doing great! Keep it up! 🚀" });
        }
        const randomJoke = lines[Math.floor(Math.random() * lines.length)];
        res.json({ joke: randomJoke });
    });
});

// Reward GIF endpoint - reads from configurable file
app.get('/api/reward', (req, res) => {
    const rewardPath = process.env.REWARDS_FILE_PATH || '/app/data/rewards.txt';
    fs.readFile(rewardPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading rewards file:', err);
            return res.json({ url: null }); // Frontend will use emoji fallback
        }
        const lines = data.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
            return res.json({ url: null });
        }
        const randomUrl = lines[Math.floor(Math.random() * lines.length)];
        res.json({ url: randomUrl });
    });
});


app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
