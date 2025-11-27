const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-in-production';
const token = jwt.sign({ id: 1, username: 'Basmala@gmail.com' }, JWT_SECRET);

// First, get current goals
const getOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/goals',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const getReq = http.request(getOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Current goals:');
    const goals = JSON.parse(data);
    console.table(goals);
    
    if (goals.length > 0) {
      const goalId = goals[0].id;
      console.log('\nUpdating goal ' + goalId + ' with currentAmount: 500');
      
      // Now update the first goal
      const updateData = JSON.stringify({ currentAmount: 500 });
      const updateOptions = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/goals/${goalId}`,
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(updateData)
        }
      };
      
      const updateReq = http.request(updateOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('\nUpdate response:');
          console.log(data);
          
          // Get goals again to verify
          console.log('\nFetching goals again to verify update...');
          const getReq2 = http.request(getOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              console.log('\nGoals after update:');
              const goals = JSON.parse(data);
              console.table(goals);
            });
          });
          getReq2.on('error', (e) => console.error('Error:', e.message));
          getReq2.end();
        });
      });
      
      updateReq.on('error', (e) => console.error('Error:', e.message));
      updateReq.write(updateData);
      updateReq.end();
    }
  });
});

getReq.on('error', (e) => console.error('Error:', e.message));
getReq.end();
