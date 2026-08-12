import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  base: './',
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
});

await server.listen();
server.printUrls();
