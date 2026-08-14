import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = normalize(pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, ''));
    let target = join(root, relative);
    if (!target.startsWith(root)) throw new Error('Invalid path');
    if ((await stat(target)).isDirectory()) target = join(target, 'index.html');
    const body = await readFile(target);
    response.writeHead(200, { 'Content-Type': types[extname(target).toLowerCase()] || 'application/octet-stream' });
    response.end(body);
  } catch {
    try {
      const body = await readFile(join(root, 'index.html'));
      response.writeHead(200, { 'Content-Type': types['.html'] });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  }
}).listen(4173, '127.0.0.1', () => {
  console.log('Production preview: http://127.0.0.1:4173/');
});
