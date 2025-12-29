const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

// Database Connection Configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'music',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create Pool
const pool = mysql.createPool(dbConfig);

// IMPORTANT: JSON parser MUST come before routes
app.use(express.json());

// Test Database Connection
async function testDbConnection() {
    try {
        const [rows] = await pool.query('SELECT 1');
        console.log('Connected to MySQL database "music" successfully!');
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
    }
}

testDbConnection();

console.log('Registering API routes...');

// ========== API ROUTES (BEFORE STATIC MIDDLEWARE) ==========

// Sign Up
app.post('/signup', async (req, res) => {
    const { nom, email, password } = req.body;
    if (!nom || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const [existingUsers] = await pool.query('SELECT * FROM utilisateurs WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO utilisateurs (nom, email, mot_de_passe, role, date_inscription) VALUES (?, ?, ?, ?, NOW())',
            [nom, email, hashedPassword, 'user']);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const [users] = await pool.query('SELECT * FROM utilisateurs WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = users[0];
        const match = await bcrypt.compare(password, user.mot_de_passe);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ message: 'Login successful', user: { id: user.id, nom: user.nom, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// GET Instruments
app.get('/api/instruments', async (req, res) => {
    console.log('>>> GET /api/instruments called <<<');
    try {
        const [rows] = await pool.query('SELECT * FROM instrument');
        console.log(`>>> Returning ${rows.length} instruments <<<`);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching instruments:', error);
        res.status(500).json({ error: 'Failed to fetch instruments' });
    }
});

// POST Instruments
app.post('/api/instruments', async (req, res) => {
    console.log('>>> POST /api/instruments called <<<');
    const { nom, type, marque, prix, etat, caracteristique, image_url } = req.body;
    if (!nom || !type) {
        return res.status(400).json({ error: 'Name and Type are required' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO instrument (nom, type, marque, prix, etat, caracteristique, image_url, status, date_ajout) VALUES (?, ?, ?, ?, ?, ?, ?, "disponible", NOW())',
            [nom, type, marque, prix, etat, caracteristique, image_url]
        );
        res.status(201).json({ message: 'Instrument added successfully', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add instrument' });
    }
});

console.log('API routes registered successfully');

// ========== STATIC FILES (AFTER API ROUTES, EXCLUDING /api/*) ==========
// Only serve static files if the path doesn't start with /api
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log(`Skipping static for API route: ${req.path}`);
        return next();
    }
    express.static(path.join(__dirname, 'public'))(req, res, next);
});
console.log('Static middleware registered');

// ========== ERROR HANDLERS (LAST) ==========

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// 404 Handler (Must be absolute last)
app.use((req, res) => {
    console.log(`404: ${req.method} ${req.path}`);
    if (req.accepts('json')) {
        res.status(404).json({ error: 'Not found' });
    } else {
        res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Route registration complete!');
});
