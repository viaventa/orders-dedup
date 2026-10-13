/**
 * Приводит телефон к виду +7XXXXXXXXXX.
 * Возвращает null, если номер не приводится к 11 цифрам.
 */
export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');

  // 10 цифр — номер без кода страны
  if (digits.length === 10) {
    return `+7${digits}`;
  }

  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    return `+7${digits.slice(1)}`;
  }

  return null;
}

function toTimestamp(value) {
  const time = Date.parse(value);
  return Number.isNaN(time) ? -Infinity : time;
}

// При дубле побеждает больший amount, при равных — более поздний created_at
function isPreferred(candidate, current) {
  const { amount } = candidate.client;

  if (amount !== current.client.amount) {
    return amount > current.client.amount;
  }

  return candidate.time > current.time;
}

export function buildResult(orders) {
  if (!Array.isArray(orders)) {
    throw new TypeError('Источник вернул не массив заявок');
  }

  const byPhone = new Map();
  let invalidDropped = 0;

  for (const order of orders) {
    const phone = normalizePhone(order?.phone);

    if (!phone) {
      invalidDropped += 1;
      continue;
    }

    const candidate = {
      client: {
        name: order.name ?? '',
        phone,
        email: order.email ?? '',
        amount: Number(order.amount) || 0,
      },
      time: toTimestamp(order.created_at),
    };
    const current = byPhone.get(phone);

    if (!current || isPreferred(candidate, current)) {
      byPhone.set(phone, candidate);
    }
  }

  const clients = [...byPhone.values()].map(({ client }) => client);

  return {
    clients,
    stats: {
      received: orders.length,
      unique: clients.length,
      duplicates_merged: orders.length - invalidDropped - clients.length,
      invalid_dropped: invalidDropped,
    },
  };
}
