require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Database Connection Configuration (PostgreSQL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// IMPORTANT: JSON parser and cookie parser MUST come before routes
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists with this Google ID
        let result = await pool.query('SELECT * FROM utilisateurs WHERE google_id = $1', [profile.id]);
        let users = result.rows;

        if (users.length > 0) {
            // User exists, return user
            return done(null, users[0]);
        }

        // Check if user exists with this email
        result = await pool.query('SELECT * FROM utilisateurs WHERE email = $1', [profile.emails[0].value]);
        users = result.rows;

        if (users.length > 0) {
            // Link Google account to existing user
            await pool.query('UPDATE utilisateurs SET google_id = $1 WHERE id = $2', [profile.id, users[0].id]);
            return done(null, users[0]);
        }

        // Create new user
        result = await pool.query(
            'INSERT INTO utilisateurs (nom, email, google_id, role, date_inscription) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
            [profile.displayName, profile.emails[0].value, profile.id, 'user']
        );

        const newUser = result.rows[0];
        return done(null, newUser);
    } catch (error) {
        return done(error, null);
    }
}));


// Test Database Connection
async function testDbConnection() {
    try {
        const result = await pool.query('SELECT 1');
        console.log('Connected to PostgreSQL database (Supabase) successfully!');
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
        const result = await pool.query('SELECT * FROM utilisateurs WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO utilisateurs (nom, email, mot_de_passe, role, date_inscription) VALUES ($1, $2, $3, $4, NOW())',
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
        const result = await pool.query('SELECT * FROM utilisateurs WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
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
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict'
        });

        res.json({ message: 'Login successful', user: { id: user.id, nom: user.nom, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Google OAuth Routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/' }),
    (req, res) => {
        // Create JWT token
        const token = jwt.sign(
            { userId: req.user.id, email: req.user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict'
        });

        // Redirect to home page
        res.redirect('/');
    }
);

// GET Instruments
app.get('/api/instruments', async (req, res) => {
    console.log('>>> GET /api/instruments called <<<');
    try {
        const result = await pool.query('SELECT * FROM instrument');
        console.log(`>>> Returning ${result.rows.length} instruments <<<`);
        res.json(result.rows);
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
        const result = await pool.query(
            'INSERT INTO instrument (nom, type, marque, prix, etat, caracteristique, image_url, status, date_ajout) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id',
            [nom, type, marque, prix, etat, caracteristique, image_url, 'disponible']
        );
        res.status(201).json({ message: 'Instrument added successfully', id: result.rows[0].id });
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
        const result = await pool.query(
            'UPDATE instrument SET nom = $1, type = $2, marque = $3, prix = $4, etat = $5, caracteristique = $6, image_url = $7 WHERE id = $8',
            [nom, type, marque, prix, etat, caracteristique, image_url, id]
        );

        if (result.rowCount === 0) {
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
        const result = await pool.query('DELETE FROM instrument WHERE id = $1', [id]);

        if (result.rowCount === 0) {
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
        const result = await pool.query('SELECT DISTINCT marque FROM instrument WHERE marque IS NOT NULL AND marque != \'\' ORDER BY marque');
        const brands = result.rows.map(row => row.marque);
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
        const result = await pool.query(
            'SELECT instrument_id FROM favoris WHERE utilisateur_id = $1',
            [req.userId]
        );
        const favoriteIds = result.rows.map(row => row.instrument_id);
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
            'INSERT INTO favoris (utilisateur_id, instrument_id) VALUES ($1, $2)',
            [req.userId, instrument_id]
        );
        res.status(201).json({ message: 'Added to favorites' });
    } catch (error) {
        if (error.code === '23505') { // PostgreSQL unique constraint violation
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
        const result = await pool.query(
            'DELETE FROM favoris WHERE utilisateur_id = $1 AND instrument_id = $2',
            [req.userId, instrument_id]
        );

        if (result.rowCount === 0) {
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
        const result = await pool.query(
            'SELECT id, nom, email FROM utilisateurs WHERE id = $1',
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
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

// ========== STATIC FILES (AFTER API ROUTES) ==========
// Serve files from the public folder
app.use(express.static(path.join(process.cwd(), 'public')));
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

    // If it's an API request, return JSON
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }

    // For all other requests, serve the index.html (SPA fallback)
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Route registration complete!');
});
