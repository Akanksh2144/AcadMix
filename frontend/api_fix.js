const fs = require('fs');

let content = fs.readFileSync('c:/AcadMix/frontend/src/services/api.js', 'utf8');

// Replace standard api getters using /api/ prefix (e.g. api.get('/api/users') -> api.get('/users'))
content = content.replace(/api\.(get|post|put|delete|patch)\((['`"])\/api\/(?!v1\/)/g, 'api.$1($2/');

// Replace insightsAPI which explicitly uses /api/v1/ prefix
content = content.replace(/api\.(post|get|delete)\((['`"])\/api\/v1\//g, 'api.$1($2/');

fs.writeFileSync('c:/AcadMix/frontend/src/services/api.js', content, 'utf8');
console.log('Fixed API paths');
