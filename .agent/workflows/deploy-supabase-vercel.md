---
description: Deploy MusicStore to Supabase and Vercel
---

# Deploying MusicStore Application to Supabase & Vercel

This workflow guides you through deploying your MusicStore application using Supabase for the PostgreSQL database and Vercel for hosting the Node.js application.

---

## Prerequisites

Before starting, ensure you have:
- A GitHub account (for Vercel deployment)
- Git installed and your project committed
- Node.js and npm installed locally

---

## Part 1: Setting Up Supabase (Database)

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up/log in
3. Click "New Project"
4. Fill in the project details:
   - **Name**: `musicstore` (or your preferred name)
   - **Database Password**: Create a strong password (SAVE THIS - you'll need it later)
   - **Region**: Choose the closest region to your users
5. Click "Create new project" and wait 2-3 minutes for setup

### Step 2: Get Your Database Connection Details

1. In your Supabase project dashboard, click the **Settings** icon (gear) in the sidebar
2. Go to **Database** section
3. Scroll down to **Connection string** section
4. Copy the **Connection pooling** URI (use Transaction mode)
5. Replace `[YOUR-PASSWORD]` in the URI with the database password you created

Your connection string will look like:
```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Step 3: Create Database Tables

1. In Supabase, go to **SQL Editor** (in the sidebar)
2. Click "New Query"
3. Paste the following SQL to create all required tables:

```sql
-- Create utilisateurs table
CREATE TABLE IF NOT EXISTS utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'user',
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create instrument table
CREATE TABLE IF NOT EXISTS instrument (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    marque VARCHAR(100),
    prix DECIMAL(10, 2),
    etat VARCHAR(50),
    caracteristique TEXT,
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'disponible',
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create favoris table
CREATE TABLE IF NOT EXISTS favoris (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL,
    instrument_id INTEGER NOT NULL,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE CASCADE,
    UNIQUE(utilisateur_id, instrument_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_google_id ON utilisateurs(google_id);
CREATE INDEX IF NOT EXISTS idx_favoris_user ON favoris(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_favoris_instrument ON favoris(instrument_id);
```

4. Click "Run" to execute the SQL
5. Verify tables were created by going to **Table Editor** in the sidebar

### Step 4: Update Local .env for Testing

Update your local `.env` file to test Supabase connection:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production

# Supabase Database Configuration
DB_HOST=aws-0-[region].pooler.supabase.com
DB_USER=postgres.[project-ref]
DB_PASSWORD=[YOUR-SUPABASE-PASSWORD]
DB_NAME=postgres
DB_PORT=6543
```

**OR** use a single `DATABASE_URL` (recommended):

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

---

## Part 2: Preparing for Vercel Deployment

### Step 5: Update app.js for Production

Make the following changes to `app.js`:

1. **Update PORT to use environment variable**:
```javascript
const PORT = process.env.PORT || 3000;
```

2. **Update Google OAuth callback URL** to be dynamic:
```javascript
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    // ... existing code
}));
```

3. **Enable secure cookies in production**:
```javascript
// Set token in HTTP-only cookie
res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Secure in production
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
});
```

### Step 6: Create vercel.json Configuration

Create a `vercel.json` file in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/app.js"
    },
    {
      "src": "/auth/(.*)",
      "dest": "/app.js"
    },
    {
      "src": "/(.*)",
      "dest": "/app.js"
    }
  ]
}
```

### Step 7: Update .gitignore

Ensure your `.gitignore` includes:
```
node_modules/
.env
.env.local
.vercel
```

### Step 8: Commit Your Changes

// turbo
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

---

## Part 3: Deploying to Vercel

### Step 9: Create Vercel Account and Import Project

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up" and use your GitHub account
3. Click "Add New..." → "Project"
4. Import your MusicStore repository from GitHub
5. Click "Import" next to your repository

### Step 10: Configure Vercel Project Settings

1. **Framework Preset**: Select "Other" (since it's a custom Express app)
2. **Root Directory**: Leave as `./` (default)
3. **Build Command**: Leave empty or use `npm install`
4. **Output Directory**: Leave empty
5. **Install Command**: `npm install`

### Step 11: Add Environment Variables in Vercel

Click "Environment Variables" and add the following:

| Name | Value |
|------|-------|
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | `https://your-app.vercel.app/auth/google/callback` (update after deployment) |
| `JWT_SECRET` | A strong random secret (e.g., use a password generator) |
| `DB_HOST` | `aws-0-[region].pooler.supabase.com` |
| `DB_USER` | `postgres.[project-ref]` |
| `DB_PASSWORD` | Your Supabase database password |
| `DB_NAME` | `postgres` |
| `DB_PORT` | `6543` |
| `NODE_ENV` | `production` |

**OR** use a single environment variable:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | `https://your-app.vercel.app/auth/google/callback` |
| `JWT_SECRET` | A strong random secret |
| `NODE_ENV` | `production` |

### Step 12: Deploy

1. Click "Deploy"
2. Wait for the deployment to complete (1-3 minutes)
3. You'll get a deployment URL like `https://music-store-xyz.vercel.app`

---

## Part 4: Post-Deployment Configuration

### Step 13: Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   ```
   https://your-app.vercel.app/auth/google/callback
   ```
4. Click "Save"

### Step 14: Update GOOGLE_CALLBACK_URL in Vercel

1. Go back to your Vercel project settings
2. Go to "Settings" → "Environment Variables"
3. Edit `GOOGLE_CALLBACK_URL` and update it with your actual Vercel URL:
   ```
   https://your-actual-app.vercel.app/auth/google/callback
   ```
4. Click "Save"
5. Redeploy by going to "Deployments" → Click the three dots on the latest deployment → "Redeploy"

### Step 15: Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Test the following:
   - Sign up with email/password
   - Login with email/password
   - Login with Google OAuth
   - Add instruments
   - Add to favorites
   - Update and delete instruments

---

## Troubleshooting

### Issue: "Cannot GET /" Error

**Solution**: Ensure your `vercel.json` routes are correctly configured and that `app.js` serves the static files from the `public` folder.

### Issue: Database Connection Timeout

**Solution**: 
- Verify your Supabase connection string is correct
- Ensure you're using the **Transaction Pooler** connection string (port 6543)
- Check that `DB_PASSWORD` doesn't have special characters that need URL encoding
- If your password has special characters, encode them (e.g., `@` → `%40`, `#` → `%23`)

### Issue: Google OAuth Fails in Production

**Solution**:
- Verify the callback URL in Google Cloud Console matches your Vercel domain
- Ensure `GOOGLE_CALLBACK_URL` environment variable is set correctly
- Check that cookies are set with `sameSite: 'none'` and `secure: true` in production

### Issue: SSL Certificate Error with Supabase

**Solution**: Ensure your database connection includes SSL options. Update your database connection code if needed:
```javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 6543,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});
```

---

## Maintenance & Updates

### To Deploy Updates:

1. Make changes locally
2. Test locally with your Supabase database
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
4. Vercel will automatically redeploy (if auto-deploy is enabled)

### To View Logs:

1. Go to your Vercel project dashboard
2. Click on a deployment
3. Go to "Functions" tab to see serverless function logs
4. Check for errors and debug accordingly

---

## Security Best Practices

1. **Never commit `.env` files** - Keep them in `.gitignore`
2. **Use strong JWT secrets** - Generate random strings for production
3. **Enable HTTPS only** - Vercel provides this automatically
4. **Rotate secrets regularly** - Update JWT_SECRET and database passwords periodically
5. **Use environment variables** - Never hardcode sensitive data

---

## Congratulations! 🎉

Your MusicStore application is now live on Vercel with Supabase as the database backend!

**Your Live App**: `https://your-app.vercel.app`
**Supabase Dashboard**: `https://supabase.com/dashboard/project/[your-project-id]`
**Vercel Dashboard**: `https://vercel.com/dashboard`
