import React from 'react';

interface PanVivoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const PanVivoEmblem: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Divine Glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600/40 via-yellow-400/30 to-amber-300/40 blur-[2px]" />

      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        className="relative drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hostGold" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="crossGlow" x1="16" y1="12" x2="32" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FFFBEB" />
            <stop offset="100%" stopColor="#FCD34D" />
          </linearGradient>
          <radialGradient id="sacredAura" cx="50%" cy="50%" r="50%">
            <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Halo Glow */}
        <circle cx="24" cy="24" r="23" fill="url(#sacredAura)" />

        {/* Eucharistic Host Outer Ring */}
        <circle
          cx="24"
          cy="24"
          r="19"
          stroke="url(#hostGold)"
          strokeWidth="2.2"
          className="animate-pulse"
        />

        {/* Sacred Host Body */}
        <circle cx="24" cy="24" r="16.5" fill="#1C1917" stroke="#F59E0B" strokeWidth="1.2" />

        {/* Inner concentric ring */}
        <circle cx="24" cy="24" r="14.5" stroke="#78350F" strokeWidth="0.8" strokeDasharray="1.5 2" />

        {/* Latin Cross (Sacred Bread Mark) */}
        {/* Vertical beam */}
        <path
          d="M24 13.5V34.5"
          stroke="url(#crossGlow)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Horizontal beam */}
        <path
          d="M17.5 20.5H30.5"
          stroke="url(#crossGlow)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Alpha & Omega or Bread Grains Accents */}
        <circle cx="24" cy="20.5" r="1.2" fill="#FEF3C7" />
        <circle cx="24" cy="13.5" r="1" fill="#FEF3C7" />
        <circle cx="24" cy="34.5" r="1" fill="#FEF3C7" />
        <circle cx="17.5" cy="20.5" r="1" fill="#FEF3C7" />
        <circle cx="30.5" cy="20.5" r="1" fill="#FEF3C7" />
      </svg>
    </div>
  );
};

export const PanVivoLogo: React.FC<PanVivoLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const emblemSizes = {
    sm: 24,
    md: 32,
    lg: 44,
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base font-bold',
    lg: 'text-xl font-bold',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <PanVivoEmblem size={emblemSizes[size]} />
      <div className="flex flex-col justify-center leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`${titleSizes[size]} font-bold tracking-tight text-white flex items-center`}
          >
            Pan <span className="text-amber-400 ml-1">Vivo</span>
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] tracking-wider uppercase font-medium text-amber-300/80">
            Liturgia & Oración
          </span>
        )}
      </div>
    </div>
  );
};
