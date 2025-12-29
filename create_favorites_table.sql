-- Create favorites table to store user's favorite instruments
-- First, drop if exists to avoid conflicts
DROP TABLE IF EXISTS favoris;

CREATE TABLE favoris (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    instrument_id INT NOT NULL,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_favorite (utilisateur_id, instrument_id)
);

-- Create indexes for better performance
CREATE INDEX idx_utilisateur_favoris ON favoris(utilisateur_id);
CREATE INDEX idx_instrument_favoris ON favoris(instrument_id);
