// Локальный запуск или деплой на любой Node-хостинг (Render, Railway, Fly)
import { createServer } from 'node:http';
import { GET } from './api/result.js';

const PORT = process.env.PORT ?? 3000;

createServer(async (request, response) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);

  if (pathname !== '/result') {
    response.writeHead(404).end();
    return;
  }

  const result = await GET();
  response.writeHead(result.status, Object.fromEntries(result.headers));
  response.end(await result.text());
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT}/result`);
});
