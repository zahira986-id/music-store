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

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let result = await pool.query('SELECT * FROM utilisateurs WHERE google_id = $1', [profile.id]);
        if (result.rows.length > 0) return done(null, result.rows[0]);

        result = await pool.query('SELECT * FROM utilisateurs WHERE email = $1', [profile.emails[0].value]);
        if (result.rows.length > 0) {
            await pool.query('UPDATE utilisateurs SET google_id = $1 WHERE id = $2', [profile.id, result.rows[0].id]);
            return done(null, result.rows[0]);
        }

        result = await pool.query(
            'INSERT INTO utilisateurs (nom, email, google_id, role, date_inscription) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
            [profile.displayName, profile.emails[0].value, profile.id, 'user']
        );
        return done(null, result.rows[0]);
    } catch (error) {
        return done(error, null);
    }
}));

// API Routes
app.post('/signup', async (req, res) => {
    const { nom, email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM utilisateurs WHERE email = $1', [email]);
        if (result.rows.length > 0) return res.status(400).json({ error: 'User already exists' });
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO utilisateurs (nom, email, mot_de_passe, role, date_inscription) VALUES ($1, $2, $3, $4, NOW())',
            [nom, email, hashedPassword, 'user']);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM utilisateurs WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.mot_de_passe);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax'
        });
        res.json({ message: 'Login successful', user: { id: user.id, nom: user.nom, email: user.email } });
    } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
app.get('/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/' }),
    (req, res) => {
        const token = jwt.sign({ userId: req.user.id, email: req.user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax' });
        res.redirect('/');
    }
);

app.get('/api/instruments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM instrument');
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/instruments', async (req, res) => {
    const { nom, type, marque, prix, etat, caracteristique, image_url } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO instrument (nom, type, marque, prix, etat, caracteristique, image_url, status, date_ajout) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id',
            [nom, type, marque, prix, etat, caracteristique, image_url, 'disponible']
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/instruments/:id', async (req, res) => {
    const { id } = req.params;
    const { nom, type, marque, prix, etat, caracteristique, image_url } = req.body;
    try {
        await pool.query('UPDATE instrument SET nom = $1, type = $2, marque = $3, prix = $4, etat = $5, caracteristique = $6, image_url = $7 WHERE id = $8',
            [nom, type, marque, prix, etat, caracteristique, image_url, id]);
        res.json({ message: 'Updated' });
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/instruments/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM instrument WHERE id = $1', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/brands', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT marque FROM instrument WHERE marque IS NOT NULL AND marque != \'\' ORDER BY marque');
        res.json(result.rows.map(r => r.marque));
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

function requireAuth(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Auth needed' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (e) { res.status(401).json({ error: 'Invalid' }); }
}

app.get('/api/favorites', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT instrument_id FROM favoris WHERE utilisateur_id = $1', [req.userId]);
        res.json(result.rows.map(r => r.instrument_id));
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/favorites', requireAuth, async (req, res) => {
    try {
        await pool.query('INSERT INTO favoris (utilisateur_id, instrument_id) VALUES ($1, $2)', [req.userId, req.body.instrument_id]);
        res.status(201).json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/favorites/:id', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM favoris WHERE utilisateur_id = $1 AND instrument_id = $2', [req.userId, req.params.id]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/user', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nom, email FROM utilisateurs WHERE id = $1', [req.userId]);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ ok: true });
});

// Export for Vercel
module.exports = app;

// Local server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
