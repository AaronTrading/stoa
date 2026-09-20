const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, 'dist');

http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const candidates = path.extname(requestedPath)
    ? [requestedPath]
    : [`${requestedPath}.html`, requestedPath];

  const sendCandidate = (index) => {
    if (index >= candidates.length) {
      res.writeHead(404);
      res.end('Page introuvable');
      return;
    }

    const file = path.resolve(root, `.${candidates[index]}`);
    if (!file.startsWith(`${root}${path.sep}`)) {
      res.writeHead(403);
      res.end();
      return;
    }

    fs.readFile(file, (error, data) => {
      if (error) {
        sendCandidate(index + 1);
        return;
      }

      res.setHeader('Content-Type', ({
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.svg': 'image/svg+xml',
      })[path.extname(file)] || 'application/octet-stream');
      res.end(data);
    });
  };

  sendCandidate(0);
}).listen(4173, '127.0.0.1', () => console.log('http://127.0.0.1:4173'));
