import { createServer } from 'node:http';
import { buildResult } from './lib/clients.js';

const PORT = process.env.PORT ?? 3000;
const ORDERS_URL = process.env.ORDERS_URL ?? 'https://test.ooobs.ru/api/orders';
const SOURCE_TIMEOUT_MS = 10_000;

async function fetchOrders() {
  const response = await fetch(ORDERS_URL, { signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) });

  if (!response.ok) {
    throw new Error(`источник ответил ${response.status}`);
  }

  return response.json();
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body, null, 2));
}

// Каждый запрос заново забирает заявки и пересчитывает результат,
// поэтому повторная синхронизация не может накопить дубли
createServer(async (request, response) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);

  if (pathname !== '/result') {
    sendJson(response, 404, { error: 'Результат доступен по адресу /result' });
    return;
  }

  try {
    sendJson(response, 200, buildResult(await fetchOrders()));
  } catch (error) {
    sendJson(response, 502, { error: `Не удалось получить заявки: ${error.message}` });
  }
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT}/result`);
});
