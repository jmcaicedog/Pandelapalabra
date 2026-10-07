export type LiturgicalSeason = 'Adviento' | 'Navidad' | 'Cuaresma' | 'Pascua' | 'Tiempo Ordinario';
export type LiturgicalColor = 'green' | 'purple' | 'white' | 'red';

export interface LiturgicalCalendarInfo {
  season: LiturgicalSeason;
  /** Week within the season (Ordinary Time: 1-34; Advent 1-4; Lent 1-5, 6 = Holy Week; Easter 1-7). 0 = days before the first Sunday (e.g. after Ash Wednesday). */
  week: number;
  /** Sunday cycle (A, B, C) of the liturgical year. */
  sundayCycle: 'A' | 'B' | 'C';
  /** Weekday cycle (Year I = odd, Year II = even liturgical year). */
  weekdayYear: 'I' | 'II';
  color: LiturgicalColor;
  isSunday: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function noon(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day, 12, 0, 0);
}

function addDays(d: Date, days: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

/** Easter Sunday (Gregorian computus, Meeus/Jones/Butcher). */
export function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return noon(year, month - 1, day);
}

/** First Sunday of Advent: the Sunday falling between Nov 27 and Dec 3. */
export function getFirstSundayOfAdvent(year: number): Date {
  const dec3 = noon(year, 11, 3);
  return addDays(dec3, -dec3.getDay());
}

/** Baptism of the Lord: Sunday after January 6 (closes the Christmas season). */
export function getBaptismOfTheLord(year: number): Date {
  const jan6 = noon(year, 0, 6);
  return addDays(jan6, 7 - jan6.getDay());
}

export function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map((p) => parseInt(p, 10));
  return noon(y, (m || 1) - 1, d || 1);
}

export function getLiturgicalCalendarInfo(dateStr: string): LiturgicalCalendarInfo {
  const date = parseDateStr(dateStr);
  const year = date.getFullYear();
  const isSunday = date.getDay() === 0;

  const advent = getFirstSundayOfAdvent(year);
  const liturgicalYear = date >= advent ? year + 1 : year;
  const cycleIndex = liturgicalYear % 3; // 2026 -> 1 (A), 2027 -> 2 (B), 2028 -> 0 (C)
  const sundayCycle: 'A' | 'B' | 'C' = cycleIndex === 1 ? 'A' : cycleIndex === 2 ? 'B' : 'C';
  const weekdayYear: 'I' | 'II' = liturgicalYear % 2 === 0 ? 'II' : 'I';

  const christmas = noon(year, 11, 25);
  const baptism = getBaptismOfTheLord(year);
  const easter = getEasterDate(year);
  const ashWednesday = addDays(easter, -46);
  const pentecost = addDays(easter, 49);

  let season: LiturgicalSeason;
  let week: number;

  if (date >= advent && date < christmas) {
    season = 'Adviento';
    week = Math.floor(diffDays(date, advent) / 7) + 1;
  } else if (date >= christmas || date <= baptism) {
    season = 'Navidad';
    week = 0;
  } else if (date >= ashWednesday && date < easter) {
    season = 'Cuaresma';
    const firstSundayOfLent = addDays(ashWednesday, 4);
    week = date < firstSundayOfLent ? 0 : Math.floor(diffDays(date, firstSundayOfLent) / 7) + 1;
  } else if (date >= easter && date <= pentecost) {
    season = 'Pascua';
    week = Math.floor(diffDays(date, easter) / 7) + 1;
  } else if (date > baptism && date < ashWednesday) {
    season = 'Tiempo Ordinario';
    week = Math.floor(diffDays(date, baptism) / 7) + 1;
  } else {
    season = 'Tiempo Ordinario';
    const week34Sunday = addDays(advent, -7);
    week = 34 + Math.floor(diffDays(date, week34Sunday) / 7);
  }

  const color: LiturgicalColor =
    season === 'Tiempo Ordinario' ? 'green' : season === 'Adviento' || season === 'Cuaresma' ? 'purple' : 'white';

  return { season, week, sundayCycle, weekdayYear, color, isSunday };
}

const RED_TITLE_PATTERNS = [
  /viernes santo/i,
  /pasi[oó]n del se[nñ]or/i,
  /domingo de ramos/i,
  /pentecost[eé]s/i,
  /m[aá]rtir/i,
  /exaltaci[oó]n de la santa cruz/i,
  /\bap[oó]stol(es)?\b/i,
  /evangelista/i,
  /santos inocentes/i,
  /san esteban/i,
];

const WHITE_TITLE_PATTERNS = [
  /natividad/i,
  /navidad/i,
  /inmaculada/i,
  /asunci[oó]n/i,
  /todos los santos/i,
  /sant[ií]sima trinidad/i,
  /cuerpo y (la )?sangre/i,
  /sagrado coraz[oó]n/i,
  /cristo,? rey|jesucristo,? rey|rey del universo/i,
  /bautismo del se[nñ]or/i,
  /epifan[ií]a/i,
  /presentaci[oó]n del se[nñ]or/i,
  /anunciaci[oó]n/i,
  /transfiguraci[oó]n/i,
  /sagrada familia/i,
  /madre de dios/i,
  /ascensi[oó]n/i,
  /jueves santo|cena del se[nñ]or/i,
  /vigilia pascual|domingo de (la )?resurrecci[oó]n|pascua/i,
  /san jos[eé]/i,
  /virgen mar[ií]a|nuestra se[nñ]ora|santa mar[ií]a/i,
  /dedicaci[oó]n/i,
];

export function getColorName(color: LiturgicalColor, label: string): string {
  const colorLabel = color === 'green' ? 'Verde' : color === 'purple' ? 'Morado' : color === 'red' ? 'Rojo' : 'Blanco';
  return `${label} (${colorLabel})`;
}

/**
 * Determines the liturgical color using the calendar season plus the official title of the day
 * (solemnities, feasts, martyrs, Holy Week, etc.).
 */
export function resolveLiturgicalColor(
  info: LiturgicalCalendarInfo,
  title: string,
  saintColor?: LiturgicalColor
): { color: LiturgicalColor; isFeast: boolean } {
  const t = title || '';
  const isSeasonalDay = /semana|domingo|feria|octava|despu[eé]s de|mi[eé]rcoles de ceniza/i.test(t) && !/solemnidad|fiesta/i.test(t);

  if (/fieles difuntos/i.test(t)) return { color: 'purple', isFeast: true };
  if (RED_TITLE_PATTERNS.some((re) => re.test(t))) {
    const holyWeekOrPentecost = /viernes santo|pasi[oó]n|ramos|pentecost/i.test(t);
    return { color: 'red', isFeast: !holyWeekOrPentecost };
  }
  if (!isSeasonalDay && WHITE_TITLE_PATTERNS.some((re) => re.test(t))) {
    return { color: 'white', isFeast: true };
  }
  if (/solemnidad|fiesta/i.test(t)) {
    return { color: info.season === 'Cuaresma' || info.season === 'Adviento' ? 'white' : info.color === 'green' ? 'white' : info.color, isFeast: true };
  }

  // Ordinary Time weekdays: optional memorials of saints take their own color
  if (info.season === 'Tiempo Ordinario' && !info.isSunday && saintColor && saintColor !== 'green' && saintColor !== 'purple') {
    return { color: saintColor, isFeast: false };
  }

  return { color: info.color, isFeast: false };
}

const ORDINALS: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
  11: 'XI', 12: 'XII', 13: 'XIII', 14: 'XIV', 15: 'XV', 16: 'XVI', 17: 'XVII', 18: 'XVIII', 19: 'XIX', 20: 'XX',
  21: 'XXI', 22: 'XXII', 23: 'XXIII', 24: 'XXIV', 25: 'XXV', 26: 'XXVI', 27: 'XXVII', 28: 'XXVIII', 29: 'XXIX',
  30: 'XXX', 31: 'XXXI', 32: 'XXXII', 33: 'XXXIII', 34: 'XXXIV',
};

/** Generic, calendar-derived title used when the official title isn't available. */
export function buildSeasonalTitle(dateStr: string, info: LiturgicalCalendarInfo): string {
  const date = parseDateStr(dateStr);
  const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const roman = ORDINALS[info.week] || String(info.week);

  switch (info.season) {
    case 'Adviento':
      return info.isSunday ? `${roman} Domingo de Adviento (Ciclo ${info.sundayCycle})` : `${capitalized} de la ${roman} semana de Adviento`;
    case 'Navidad':
      return info.isSunday ? `Domingo del Tiempo de Navidad (Ciclo ${info.sundayCycle})` : `${capitalized} del Tiempo de Navidad`;
    case 'Cuaresma':
      if (info.week === 0) return `${capitalized} después de Ceniza`;
      if (info.week === 6) return info.isSunday ? 'Domingo de Ramos en la Pasión del Señor' : `${capitalized} Santo`;
      return info.isSunday ? `${roman} Domingo de Cuaresma (Ciclo ${info.sundayCycle})` : `${capitalized} de la ${roman} semana de Cuaresma`;
    case 'Pascua':
      return info.isSunday ? `${roman} Domingo de Pascua (Ciclo ${info.sundayCycle})` : `${capitalized} de la ${roman} semana de Pascua`;
    default:
      return info.isSunday
        ? `${roman} Domingo del Tiempo Ordinario (Ciclo ${info.sundayCycle})`
        : `${capitalized} de la ${roman} semana del Tiempo Ordinario`;
  }
}
