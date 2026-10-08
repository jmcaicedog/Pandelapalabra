import type { SaintVerification } from '../data/colombianSaints.ts';

export function SaintSource({ verification }: { verification?: SaintVerification }) {
  const label = verification?.status === 'publisher'
    ? verification.method === 'print'
      ? 'Pan de la Palabra · Colombia (edición impresa confirmada)'
      : 'Pan de la Palabra · Colombia'
    : verification?.status === 'ordo'
    ? 'Ordo Colombiano · selección del misal pendiente'
    : 'Santoral colombiano pendiente de confirmar';

  return (
    <div className="mt-2 text-[11px] text-amber-300/90">
      {verification?.sourceUrl ? (
        <a
          href={verification.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="underline underline-offset-2"
        >
          Fuente: {label}
        </a>
      ) : <span>{label}</span>}
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
