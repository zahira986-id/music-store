const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;

// JWT Secret - In production, use environment variable
const JWT_SECRET = 'your-secret-key-change-in-production';

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

// IMPORTANT: JSON parser and cookie parser MUST come before routes
app.use(express.json());
app.use(cookieParser());


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

        // Create JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'strict'
        });

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

// PUT Update Instrument
app.put('/api/instruments/:id', async (req, res) => {
    console.log(`>>> PUT /api/instruments/${req.params.id} called <<<`);
    const { id } = req.params;
    const { nom, type, marque, prix, etat, caracteristique, image_url } = req.body;

    if (!nom || !type) {
        return res.status(400).json({ error: 'Name and Type are required' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE instrument SET nom = ?, type = ?, marque = ?, prix = ?, etat = ?, caracteristique = ?, image_url = ? WHERE id = ?',
            [nom, type, marque, prix, etat, caracteristique, image_url, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Instrument not found' });
        }

        res.json({ message: 'Instrument updated successfully' });
    } catch (error) {
        console.error('Error updating instrument:', error);
        res.status(500).json({ error: 'Failed to update instrument' });
    }
});

// DELETE Instrument
app.delete('/api/instruments/:id', async (req, res) => {
    console.log(`>>> DELETE /api/instruments/${req.params.id} called <<<`);
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM instrument WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Instrument not found' });
        }

        res.json({ message: 'Instrument deleted successfully' });
    } catch (error) {
        console.error('Error deleting instrument:', error);
        res.status(500).json({ error: 'Failed to delete instrument' });
    }
});

// GET Unique Brands
app.get('/api/brands', async (req, res) => {
    console.log('>>> Request received for /api/brands <<<');
    try {
        const [rows] = await pool.query('SELECT DISTINCT marque FROM instrument WHERE marque IS NOT NULL AND marque != "" ORDER BY marque');
        const brands = rows.map(row => row.marque);
        console.log(`>>> Found brands: ${brands.join(', ')} <<<`);
        res.json(brands);
    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
});

// Auth middleware - Verify JWT from cookie
function requireAuth(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Please login to continue' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// GET User's Favorites
app.get('/api/favorites', requireAuth, async (req, res) => {
    console.log('>>> GET /api/favorites called <<<');
    try {
        const [rows] = await pool.query(
            'SELECT instrument_id FROM favoris WHERE utilisateur_id = ?',
            [req.userId]
        );
        const favoriteIds = rows.map(row => row.instrument_id);
        console.log(`>>> User ${req.userId} has ${favoriteIds.length} favorites <<<`);
        res.json(favoriteIds);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});

// POST Add Favorite
app.post('/api/favorites', requireAuth, async (req, res) => {
    console.log('>>> POST /api/favorites called <<<');
    const { instrument_id } = req.body;

    if (!instrument_id) {
        return res.status(400).json({ error: 'Instrument ID is required' });
    }

    try {
        await pool.query(
            'INSERT INTO favoris (utilisateur_id, instrument_id) VALUES (?, ?)',
            [req.userId, instrument_id]
        );
        res.status(201).json({ message: 'Added to favorites' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Already in favorites' });
        }
        console.error('Error adding favorite:', error);
        res.status(500).json({ error: 'Failed to add favorite' });
    }
});

// DELETE Remove Favorite
app.delete('/api/favorites/:instrument_id', requireAuth, async (req, res) => {
    console.log(`>>> DELETE /api/favorites/${req.params.instrument_id} called <<<`);
    const { instrument_id } = req.params;

    try {
        const [result] = await pool.query(
            'DELETE FROM favoris WHERE utilisateur_id = ? AND instrument_id = ?',
            [req.userId, instrument_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Favorite not found' });
        }

        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
});

// GET Current User
app.get('/api/user', requireAuth, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, nom, email FROM utilisateurs WHERE id = ?',
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Logout - Clear JWT cookie
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

console.log('All API routes (including auth) registered successfully');

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
