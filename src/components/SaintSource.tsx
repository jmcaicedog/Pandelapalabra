import type { SaintVerification } from '../data/colombianSaints.ts';

export function SaintSource({ verification, onRetry }: {
  verification?: SaintVerification;
  onRetry?: () => void;
}) {
  if (verification?.biographyError) {
    return <div className="mt-2 text-[11px] text-amber-300/90" role="status">
      <p>{verification.biographyError}</p>
      {onRetry && <button
        type="button"
        className="mt-1 underline underline-offset-2"
        onClick={event => { event.stopPropagation(); onRetry(); }}
      >Reintentar biografía</button>}
    </div>;
  }
  if (verification?.biographyMethod === 'grounded') {
    return <div className="mt-2 text-[11px] text-amber-300/90">
      <p>Síntesis con búsqueda (IA). Fuentes consultadas:</p>
      {verification.biographySources?.map(source => <a
        key={source.url}
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={event => event.stopPropagation()}
        className="block underline underline-offset-2 mt-1"
      >{source.title}</a>)}
    </div>;
  }
  if (verification?.status === 'editorial' && !verification.biographySourceUrl) return null;
  const label = verification?.status === 'publisher'
    ? 'Pan de la Palabra · Colombia'
    : verification?.status === 'ordo'
    ? 'Ordo Colombiano · selección del misal pendiente'
    : null;

  if (!label && !verification?.biographySourceUrl) return null;

  return (
    <div className="mt-2 text-[11px] text-amber-300/90">
      {label && (verification?.sourceUrl ? (
        <a
          href={verification.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="underline underline-offset-2"
        >
          Fuente: {label}
        </a>
      ) : <span>{label}</span>)}
      {verification?.biographySourceUrl && (
        <div className="mt-1">
          <a
            href={verification.biographySourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="underline underline-offset-2"
          >
            Biografía: {verification.biographySourceName || 'fuente consultada'}
          </a>
        </div>
      )}
      {verification?.status === 'publisher' && (verification.celebration || verification.colors) && (
        <p className="mt-1 text-slate-400">
          Ordo Colombiano: {[verification.celebration, verification.colors].filter(Boolean).join(' · ')}.
        </p>
      )}
      {verification?.status === 'ordo' && (
        <p className="mt-1 text-slate-400">
          {verification.celebration}. {verification.colors}.
          {' '}El Ordo puede incluir varias celebraciones; no confirma cuál destaca Pan de la Palabra.
        </p>
      )}
    </div>
  );
}
