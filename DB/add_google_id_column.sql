-- Add google_id column to users table for Google OAuth
ALTER TABLE utilisateurs ADD COLUMN google_id VARCHAR(255) UNIQUE NULL;

