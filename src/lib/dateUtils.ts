/**
 * Date utility helpers for Pan Vivo Liturgia
 */
export function isValidDateStr(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1583 || year > 9999) return false;
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function parseDateStr(value: string): Date {
  if (!isValidDateStr(value)) throw new RangeError('Fecha inválida: se requiere YYYY-MM-DD (1583–9999).');
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function shiftDate(dateStr: string, days: number): string {
  if (!Number.isSafeInteger(days)) throw new RangeError('Desplazamiento de fecha inválido.');
  const date = parseDateStr(dateStr);
  date.setDate(date.getDate() + days);
  const shifted = formatDateStr(date);
  if (!isValidDateStr(shifted)) throw new RangeError('Fecha fuera del calendario admitido.');
  return shifted;
}

export function getTodayDateStr(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function getTomorrowDateStr(): string {
  return shiftDate(getTodayDateStr(), 1);
}

export function getOffsetDateStr(daysOffset: number): string {
  return shiftDate(getTodayDateStr(), daysOffset);
}
