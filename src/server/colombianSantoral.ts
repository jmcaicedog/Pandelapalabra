import { getEditorialSaint, hasSaintBiography, type ColombianSaint } from '../data/colombianSaints.js';
import { getSharedBiography, type ResearchedBiography } from './saintBiographies.js';

export async function fetchColombianSantoral(
  date: string,
  biographyLookup: (name: string) => Promise<ResearchedBiography> = getSharedBiography,
): Promise<ColombianSaint> {
  const selected = getEditorialSaint(date);
  if (hasSaintBiography(selected)) return selected;
  try {
    const biography = await biographyLookup(selected.saint.name);
    return {
      saint: { ...selected.saint, shortBio: biography.fullBio.split('\n\n')[0], fullBio: biography.fullBio },
      saintVerification: {
        ...selected.saintVerification,
        biographyMethod: 'grounded',
        biographyCheckedAt: biography.checkedAt,
        biographySources: biography.sources,
        biographySourceUrl: biography.sources[0].url,
        biographySourceName: biography.sources[0].title,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
    const reason = status === 429 || /quota|RESOURCE_EXHAUSTED/i.test(message) ? 'Cuota de IA agotada'
      : /preparación/.test(message) ? 'Generación o espera en curso'
      : /Intentos biográficos agotados/.test(message) ? 'Revisión requerida'
      : message === 'DATABASE_URL de Neon no configurada.' ? 'Persistencia no configurada'
      : 'Fuente, generación o persistencia no disponible';
    console.warn('No se pudo consultar la biografía del santoral.', { date,
      reason,
    });
    return {
      ...selected,
      saintVerification: {
        ...selected.saintVerification,
        biographyError: reason === 'Cuota de IA agotada'
          ? 'El servicio de biografías está temporalmente limitado por cuota. Reintenta más tarde.'
          : reason === 'Generación o espera en curso'
          ? 'La biografía está en preparación o en espera de reintento. Consulta de nuevo en un minuto.'
          : reason === 'Revisión requerida'
          ? 'No se encontró una biografía con fuentes tras varios intentos. Esta entrada requiere revisión.'
          : 'No se pudo obtener una biografía con fuentes. Puedes reintentar la consulta.',
      },
    };
  }
}
