const mysql = require('mysql2/promise');

async function testDirectDB() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'music'
    });

    try {
        const [rows] = await connection.query('SELECT * FROM instrument LIMIT 5');
        console.log('Direct DB query successful:');
        console.log(JSON.stringify(rows, null, 2));
        console.log(`Found ${rows.length} instruments`);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

testDirectDB();
