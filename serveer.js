const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(session({
    secret: 'chapz_hub_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Initialize SQLite Database
const db = new sqlite3.Database('./chapz_hub.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        createTables();
    }
});

// Create DB Tables for Orders and Newsletter Subscribers
function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            items TEXT NOT NULL,
            total_price REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// ------------------------------------
// API Routes
// ------------------------------------

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mywork.html'));
});

// Checkout Route (Save Order to SQLite)
app.post('/api/checkout', (req, res) => {
    const { items, total } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    const itemsJson = JSON.stringify(items);
    const sql = `INSERT INTO orders (items, total_price) VALUES (?, ?)`;

    db.run(sql, [itemsJson, total], function (err) {
        if (err) {
            console.error('Order save error:', err.message);
            return res.status(500).json({ success: false, message: 'Failed to process order.' });
        }
        res.json({
            success: true,
            message: 'Order placed successfully!',
            orderId: this.lastID
        });
    });
});

// Newsletter Subscription Route
app.post('/api/subscribe', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const sql = `INSERT INTO subscribers (email) VALUES (?)`;

    db.run(sql, [email], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ success: false, message: 'This email is already subscribed.' });
            }
            return res.status(500).json({ success: false, message: 'Failed to subscribe.' });
        }
        res.json({ success: true, message: 'Subscribed successfully!' });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Serve Admin Dashboard Page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Fetch All Orders (for admin)
app.get('/api/admin/orders', (req, res) => {
    db.all(`SELECT * FROM orders ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Fetch All Subscribers (for admin)
app.get('/api/admin/subscribers', (req, res) => {
    db.all(`SELECT * FROM subscribers ORDER BY subscribed_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});