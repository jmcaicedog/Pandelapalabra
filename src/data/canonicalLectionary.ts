import type { LiturgicalDay } from './liturgy.js';
import { pendingSaint } from './colombianSaints.js';
import { buildSeasonalTitle, getColorName, getLiturgicalCalendarInfo, parseDateStr } from './liturgicalCalendar.js';

/** Calendar-only fallback: no handcrafted readings or date-specific saint guesses. */
export function buildCanonicalDay(dateStr: string): LiturgicalDay {
  const date = parseDateStr(dateStr);
  const info = getLiturgicalCalendarInfo(dateStr);
  const notice = 'No se han podido cargar las lecturas completas de este día. Comprueba tu conexión y vuelve a consultar. Para fechas futuras, las lecturas suelen publicarse con unos tres meses de anticipación.';
  return {
    date: dateStr,
    formattedDate: date.toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    title: buildSeasonalTitle(dateStr, info),
    season: info.season,
    color: info.color,
    colorName: getColorName(info.color, info.season),
    saint: pendingSaint(),
    firstReading: { citation: 'Primera lectura no disponible', text: notice },
    psalm: { citation: 'Salmo responsorial no disponible', response: 'Lecturas aún no disponibles', verses: [notice] },
    gospel: { citation: 'Evangelio no disponible', acclamation: '', text: notice },
    source: 'local',
    readingsPending: true,
  };
}
