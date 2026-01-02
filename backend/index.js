const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;
const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, 'data', 'sunny_start.db');

// Middleware
app.use(cors());
app.use(bodyParser.json());

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

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
