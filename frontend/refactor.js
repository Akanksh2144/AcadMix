const fs = require('fs');
const path = require('path');

const dir = 'C:/AcadMix/frontend/src/components/system-design/nodes';
const files = [
  'AppServerNode.tsx', 'CacheNode.tsx', 'CDNNode.tsx', 'ClientNode.tsx', 
  'DNSNode.tsx', 'LoadBalancerNode.tsx', 'MessageQueueNode.tsx', 
  'MetricsDashboardNode.tsx', 'NoSQLDatabaseNode.tsx', 'ObjectStorageNode.tsx', 
  'SQLDatabaseNode.tsx', 'WorkerPoolNode.tsx'
];

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove onChange block
  content = content.replace(/\s*const onChange = \([\s\S]*?\};\n/g, '');

  // Remove the div block with p-3 space-y-2.5 or p-3 space-y-2
  const blockRegex = /\n\s*<div className="p-3 space-y-2(?:\.5)?">[\s\S]*?<\/div>\n(?=\s*(?:\{data\.metrics && \(|<Handle|\{\/\* Target input))/;
  content = content.replace(blockRegex, '\n');
  
  // For MetricsDashboardNode, result is unused
  if (file === 'MetricsDashboardNode.tsx') {
    content = content.replace(/\s*const result = data\.simResult;\n/g, '');
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log("Refactoring complete.");
