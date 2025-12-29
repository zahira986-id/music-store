-- Create favorites table to store user's favorite instruments
CREATE TABLE IF NOT EXISTS favoris (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    instrument_id INT NOT NULL,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (utilisateur_id, instrument_id)
);

-- Create index for better performance
CREATE INDEX idx_utilisateur_favoris ON favoris(utilisateur_id);
CREATE INDEX idx_instrument_favoris ON favoris(instrument_id);
