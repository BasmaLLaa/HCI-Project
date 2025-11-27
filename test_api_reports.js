const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-in-production';
const token = jwt.sign({ id: 1, username: 'Basmala@gmail.com' }, JWT_SECRET);

const startDate = '2024-01-01';
const endDate = '2025-11-27';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/reports?startDate=${startDate}&endDate=${endDate}`,
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

console.log('Requesting:', options.path);

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
