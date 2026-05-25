const http = require('http');
const fs = require('fs');
const path = require('path');
const base = __dirname;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

http.createServer((req, res) => {
  const filePath = path.join(base, req.url === '/' ? '/index.html' : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); }
    else { res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain', 'Access-Control-Allow-Origin': '*' }); res.end(data); }
  });
}).listen(8765, () => console.log('plate2 map server: http://localhost:8765'));
