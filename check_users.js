const mysql = require('mysql2/promise');

async function checkUsers() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'music'
    });

    try {
        const [rows] = await connection.query('SELECT * FROM utilisateurs');
        console.log('Users in DB:', rows);
    } catch (error) {
        console.error(error);
    } finally {
        await connection.end();
    }
}

checkUsers();
