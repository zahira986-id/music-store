const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/instruments',
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('BODY:', body);
        try {
            const data = JSON.parse(body);
            console.log('Parsed JSON:', data);
            console.log('Number of instruments:', data.length);
        } catch (e) {
            console.log('Failed to parse JSON:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
