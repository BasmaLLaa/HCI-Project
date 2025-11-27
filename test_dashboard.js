const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-in-production';
const token = jwt.sign({ id: 1, username: 'Basmala@gmail.com' }, JWT_SECRET);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/dashboard',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
