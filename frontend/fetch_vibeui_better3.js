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
        fs.writeFileSync('vibeui_result_3.json', data);
        console.log('done');
    });
  });

  req.on('error', console.error);
}

// Query for clean pill shaped tab bar
fetchVibeUI('https://vibeui.org/api/v1/designs/search?q=pill+shaped+container+tab+menu+light&category=part&limit=1');
