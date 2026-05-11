const https = require('https');

const options = {
  hostname: 'vibeui.org',
  path: '/api/v1/designs/search?q=premium+pill+shaped+tab+navigation+menu+glassmorphism+framer+motion&category=part&limit=1',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer vui_sk_9fa1c33c844fe5e8041259110413fedca000da59',
    'X-Client-App': 'antigravity'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
