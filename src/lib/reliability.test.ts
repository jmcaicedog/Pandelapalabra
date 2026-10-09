import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ExpiringCache } from './cache.ts';
import { isValidDateStr, shiftDate, formatDateStr, getTodayDateStr } from './dateUtils.ts';
import { readStoredJson, writeStorage } from './storage.ts';
import { withTimeout, withAbortTimeout } from './asyncUtils.ts';
import { getEasterDate, getEpiphany, getBaptismOfTheLord, getLiturgicalCalendarInfo, matchesColombianTransfers } from '../data/liturgicalCalendar.ts';

test('fechas reales, años bisiestos y límites del calendario', () => {
  for (const date of ['2026-02-29', '2100-02-29', '2026-04-31', '2026-13-01', '2026-1-01', '1582-12-31', '10000-01-01']) {
    assert.equal(isValidDateStr(date), false, date);
  }
  assert.ok(isValidDateStr('2000-02-29'));
  assert.equal(shiftDate('2028-02-28', 1), '2028-02-29');
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  assert.throws(() => shiftDate('9999-12-31', 1));
  assert.throws(() => shiftDate('1583-01-01', -1));
  assert.throws(() => shiftDate('2026-01-01', NaN));
  assert.ok(isValidDateStr(getTodayDateStr()));
});

test('computus y Epifanía colombiana, incluido Bautismo el lunes', () => {
  assert.equal(formatDateStr(getEasterDate(2026)), '2026-04-05');
  assert.equal(formatDateStr(getEasterDate(2038)), '2038-04-25');
  assert.equal(formatDateStr(getEpiphany(2024)), '2024-01-07');
  assert.equal(formatDateStr(getBaptismOfTheLord(2024)), '2024-01-08');
  assert.equal(getLiturgicalCalendarInfo('2024-01-09').week, 1);
  assert.equal(getLiturgicalCalendarInfo('2024-01-14').week, 2);
  assert.equal(formatDateStr(getBaptismOfTheLord(2026)), '2026-01-11');
});

test('los traslados colombianos rechazan títulos de fiestas en otra fecha', () => {
  assert.equal(matchesColombianTransfers('2026-01-04', 'Epifanía del Señor'), true);
  assert.equal(matchesColombianTransfers('2026-01-06', 'Epifanía del Señor'), false);
  assert.equal(matchesColombianTransfers('2026-05-14', 'Ascensión del Señor'), false);
  assert.equal(matchesColombianTransfers('2026-05-17', 'Ascensión del Señor'), true);
  assert.equal(matchesColombianTransfers('2026-05-17', 'VII Domingo de Pascua'), false);
  assert.equal(matchesColombianTransfers('2026-06-04', 'Corpus Christi'), false);
  assert.equal(matchesColombianTransfers('2026-06-07', 'Solemnidad del Cuerpo y la Sangre de Cristo'), true);
  assert.equal(matchesColombianTransfers('2026-09-14', 'Exaltación de la Santa Cruz'), true);
});

test('cada día de un ciclo gregoriano de 400 años produce semanas válidas', () => {
  for (let year = 2000; year < 2400; year++) {
    for (let month = 0; month < 12; month++) {
      const days = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= days; day++) {
        const date = formatDateStr(new Date(year, month, day, 12));
        const info = getLiturgicalCalendarInfo(date);
        const max = { Adviento: 4, Navidad: 0, Cuaresma: 6, Pascua: 7, 'Tiempo Ordinario': 34 }[info.season];
        assert.ok(info.week >= 0 && info.week <= max, `${date}: ${info.season} ${info.week}`);
        if (info.season === 'Tiempo Ordinario') assert.ok(info.week >= 1, date);
      }
    }
  }
});

test('caché limitada con caducidad y expulsión LRU', t => {
  let now = 0;
  t.mock.method(Date, 'now', () => now);
  const cache = new ExpiringCache<number>(2, 100);
  cache.set('a', 1); cache.set('b', 2);
  assert.equal(cache.get('a'), 1);
  cache.set('c', 3);
  assert.equal(cache.get('b'), undefined);
  now = 100;
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.get('c'), undefined);
});

test('almacenamiento dañado o bloqueado no provoca fallos de renderizado', t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: () => '{json roto', setItem: () => { throw new Error('QuotaExceededError'); },
  } });
  assert.equal(readStoredJson('test', (v): v is string => typeof v === 'string'), null);
  assert.equal(writeStorage('test', 'value'), false);
});

test('los límites de espera y la cancelación producen errores explícitos', async () => {
  assert.equal(await withTimeout(Promise.resolve('ok'), 100), 'ok');
  await assert.rejects(withTimeout(new Promise(() => {}), 5));
  const controller = new AbortController();
  const request = withAbortTimeout(signal => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new Error('Cancelado')), { once: true });
  }), 100, controller.signal);
  controller.abort();
  await assert.rejects(request);
});
