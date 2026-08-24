import fs from 'fs';
import path from 'path';

const htmlPath = path.join('dist', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const timestamp = Date.now();
const modifiedHtml = html
  .replace(/(src="\/assets\/[^"]+)"/g, `$1?v=${timestamp}"`)
  .replace(/(href="\/assets\/[^"]+)"/g, `$1?v=${timestamp}"`);
fs.writeFileSync(htmlPath, modifiedHtml);
console.log('Added cache-busting to index.html');
