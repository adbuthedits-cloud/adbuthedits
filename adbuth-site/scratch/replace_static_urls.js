const fs = require('fs');
const path = require('path');

const DOMAINS_TO_REPLACE = [
  /https:\/\/pub-439d84178c4c4a779aaeb4ebd0df65c8\.r2\.dev/g,
  /https:\/\/cdn\.adbuthverse\.com/g
];
const NEW_DOMAIN = 'https://assets.adbuthverse.com';

const TARGET_DIRS = [
  path.join(__dirname, '..', 'pages'),
  path.join(__dirname, '..', 'components')
];

function compressUrl(url) {
  // Image extensions -> .webp
  if (/\.(png|jpg|jpeg|gif|tiff|bmp)(\?.*)?$/i.test(url)) {
    if (!url.toLowerCase().includes('.webp')) {
      return url.replace(/\.(png|jpg|jpeg|gif|tiff|bmp)(\?.*)?$/i, '.webp$2');
    }
  }
  // Video extensions -> _web.mp4
  if (/\.(mp4|mov|avi|mkv|webm)(\?.*)?$/i.test(url)) {
    if (!url.toLowerCase().includes('_web.mp4') && !url.toLowerCase().includes('web.mp4')) {
      return url.replace(/\.(mp4|mov|avi|mkv|webm)(\?.*)?$/i, '_web.mp4$2');
    }
  }
  return url;
}

function processText(content) {
  let updated = content;
  // 1. Replace domains
  for (const domainRegex of DOMAINS_TO_REPLACE) {
    updated = updated.replace(domainRegex, NEW_DOMAIN);
  }
  
  // 2. Replace extensions for NEW_DOMAIN URLs
  const urlRegex = /https:\/\/assets\.adbuthverse\.com\/[a-zA-Z0-9-._~%!$&'()*+,;=:@/]+/g;
  updated = updated.replace(urlRegex, (url) => {
    return compressUrl(url);
  });
  
  return updated;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const updated = processText(content);
      if (updated !== content) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log(`✅ Updated: ${path.relative(path.join(__dirname, '..'), fullPath)}`);
      }
    }
  }
}

console.log('🚀 Starting replacement of static R2/CDN URLs in frontend components...');
for (const dir of TARGET_DIRS) {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  }
}
console.log('🎉 Static URL replacement complete!');
