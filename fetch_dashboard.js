const jwt = require('jsonwebtoken');
const fetch = global.fetch || require('node-fetch');

const JWT_SECRET = 'your-secret-key-change-in-production';
const token = jwt.sign({ id: 1, username: 'Basmala@gmail.com' }, JWT_SECRET);

(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/dashboard', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
})();
