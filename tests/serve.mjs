// A tiny static file server for the browser tests: serves the project folder on http://localhost:8891
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..'), port = +process.env.PORT || 8891;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary', '.fbx': 'application/octet-stream' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory() || /[\\/]\.(env|git)/.test(file)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
