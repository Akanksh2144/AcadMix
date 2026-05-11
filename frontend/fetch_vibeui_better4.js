const https = require('https');
const fs = require('fs');

function fetchVibeUI(url) {
  const options = new URL(url);
  options.headers = {
    'Authorization': 'Bearer vui_sk_9fa1c33c844fe5e8041259110413fedca000da59',
    'X-Client-App': 'antigravity'
  };

  const req = https.get(options, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      fetchVibeUI(res.headers.location.startsWith('http') ? res.headers.location : `https://vibeui.org${res.headers.location}`);
      return;
    }
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const parsed = JSON.parse(data);
        fs.writeFileSync('vibeui_tabs.json', JSON.stringify(parsed.designs.map(d => ({id: d.id, title: d.title, description: d.description})), null, 2));
        console.log('done');
    });
  });

  req.on('error', console.error);
}

// Query for generic tabs
fetchVibeUI('https://vibeui.org/api/v1/designs/search?q=tabs&category=part&limit=5');
