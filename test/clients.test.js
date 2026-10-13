import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildResult, normalizePhone } from '../lib/clients.js';

const orders = JSON.parse(await readFile(new URL('./fixtures/orders.json', import.meta.url), 'utf8'));

test('приводит разные форматы телефона к +7XXXXXXXXXX', () => {
  const formats = [
    '+7 999 123-45-67',
    '8 (999) 123 45 67',
    '79991234567',
    '+7-999-123-45-67',
    '9991234567',
  ];

  for (const phone of formats) {
    assert.equal(normalizePhone(phone), '+79991234567', phone);
  }
});

test('отбрасывает номера, которые не приводятся к 11 цифрам', () => {
  for (const phone of ['123', '', 'не указан', '+7 999', null, '+1 555 123 45 67']) {
    assert.equal(normalizePhone(phone), null, String(phone));
  }
});

test('при дубле оставляет запись с максимальным amount', () => {
  const { clients } = buildResult([
    { name: 'Первый', phone: '+79990000000', amount: 100, created_at: '2026-10-03T00:00:00Z' },
    { name: 'Второй', phone: '89990000000', amount: 500, created_at: '2026-10-01T00:00:00Z' },
  ]);

  assert.deepEqual(clients, [{ name: 'Второй', phone: '+79990000000', email: '', amount: 500 }]);
});

test('при равных amount оставляет более позднюю по created_at', () => {
  const { clients } = buildResult([
    { name: 'Поздний', phone: '+79990000000', amount: 200, created_at: '2026-10-05T00:00:00Z' },
    { name: 'Ранний', phone: '89990000000', amount: 200, created_at: '2026-10-01T00:00:00Z' },
  ]);

  assert.equal(clients[0].name, 'Поздний');
});

test('считает статистику по заявкам из /api/orders', () => {
  assert.deepEqual(buildResult(orders).stats, {
    received: 17,
    unique: 8,
    duplicates_merged: 5,
    invalid_dropped: 4,
  });
});

test('повторная синхронизация не плодит дубли', () => {
  const once = buildResult(orders);
  const twice = buildResult([...orders, ...orders]);

  assert.deepEqual(twice.clients, once.clients);
});
