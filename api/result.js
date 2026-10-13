import { buildResult } from '../lib/clients.js';

const ORDERS_URL = process.env.ORDERS_URL ?? 'https://test.ooobs.ru/api/orders';
const SOURCE_TIMEOUT_MS = 10_000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

// Каждый запрос заново забирает заявки и пересчитывает результат,
// поэтому повторная синхронизация не может накопить дубли
export async function GET() {
  try {
    const response = await fetch(ORDERS_URL, { signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) });

    if (!response.ok) {
      throw new Error(`источник ответил ${response.status}`);
    }

    return json(buildResult(await response.json()));
  } catch (error) {
    return json({ error: `Не удалось получить заявки: ${error.message}` }, 502);
  }
}
