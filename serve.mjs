import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 1112;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.webp': 'image/webp',
};

// Clean-URL rewrite for service pages. Mirrors the production
// Vercel rewrite rule (`/servicios/:slug` → `/servicios/index.html`)
// so local dev resolves URLs like `/servicios/encintado-de-lineas`.
function rewriteCleanUrls(urlPath) {
  const m = urlPath.match(/^\/servicios\/([^/]+?)(?:\.html)?\/?$/);
  if (m && m[1] !== 'index') {
    return '/servicios/index.html';
  }
  return null;
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' || urlPath.endsWith('/')) urlPath = urlPath + 'index.html';

  const rewritten = rewriteCleanUrls(urlPath);
  if (rewritten) {
    serveFile(res, path.join(__dirname, rewritten));
    return;
  }

  if (!path.extname(urlPath)) urlPath = urlPath + '/index.html';
  serveFile(res, path.join(__dirname, urlPath));
});

server.listen(PORT, () => {
  console.log(`MTEC dev server running → http://localhost:${PORT}`);
});
