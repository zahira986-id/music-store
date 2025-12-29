const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database Configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'music'
};

async function runMigration() {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection(dbConfig);

        console.log('Reading SQL file...');
        const sqlFile = fs.readFileSync(path.join(__dirname, 'create_favorites_table.sql'), 'utf8');

        // Split by semicolon and execute each statement
        const statements = sqlFile.split(';').filter(stmt => stmt.trim().length > 0);

        console.log(`Executing ${statements.length} SQL statements...`);
        for (const statement of statements) {
            await connection.query(statement);
            console.log('✓ Statement executed');
        }

        console.log('\n✓ Migration completed successfully!');
        console.log('The "favoris" table has been created.');

        await connection.end();
    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
