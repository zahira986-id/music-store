-- MusicStore Database Schema for Supabase
-- Run this in Supabase SQL Editor after creating your project

-- Create utilisateurs (users) table
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

-- Create favoris (favorites) table
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

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
