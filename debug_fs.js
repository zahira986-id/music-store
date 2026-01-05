const fs = require('fs');
const path = require('path');

const root = path.join(__dirname);
const parent = path.join(__dirname, '..');
const index = path.join(__dirname, '..', 'index.html');

console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Project Root:', parent);
console.log('Index path:', index);
console.log('Index exists:', fs.existsSync(index));
console.log('Directory contents of root:', fs.readdirSync(parent));
