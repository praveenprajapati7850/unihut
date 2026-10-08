import React from 'react';

interface UniHutLogoProps {
  className?: string;
  iconClassName?: string;
  variant?: 'full' | 'mark' | 'horizontal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  dark?: boolean;
  showTagline?: boolean;
}

/**
 * UniHut official vector brand mark and logo:
 * - Graduation cap (academic campus identity)
 * - Orange hut / house with chimney & 4-pane window (campus community & housing)
 * - Two-tone wordmark ("Uni" charcoal/white + "Hut" vibrant orange)
 */
export const UniHutIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-9 h-9',
  size,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={style}
      aria-label="UniHut Logo Mark"
    >
      <defs>
        {/* Warm Orange Gradient for the Hut */}
        <linearGradient id="unihutRoofGrad" x1="12" y1="16" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>

        {/* Soft shadow for depth */}
        <filter id="unihutShadow" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#EA580C" floodOpacity="0.25" />
        </filter>

        {/* Cap Gradient */}
        <linearGradient id="capGrad" x1="14" y1="6" x2="50" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      {/* Chimney on the right slope */}
      <rect x="41" y="20" width="5.5" height="11" rx="1.5" fill="#C2410C" />
      <rect x="40" y="19" width="7.5" height="2.5" rx="1" fill="#9A3412" />

      {/* Main Hut / House Body (U-shaped base + gabled roof) */}
      <path
        d="M32 17.5L50 31.5C51.2 32.4 51.5 34 50.8 35.2C50.5 35.7 50 36 49.5 36H47V48C47 52.4 43.4 56 39 56H25C20.6 56 17 52.4 17 48V36H14.5C13.4 36 12.5 35.1 12.5 34C12.5 33.5 12.7 33 13.1 32.7L32 17.5Z"
        fill="url(#unihutRoofGrad)"
        filter="url(#unihutShadow)"
      />

      {/* Roof Edge highlight for crisp vector definition */}
      <path
        d="M12.5 33.5L32 18L51.5 33.5"
        stroke="#FED7AA"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 4-Pane Window in Center of Hut */}
      <g opacity="0.95">
        {/* Top-Left Pane */}
        <rect x="25" y="36" width="5.5" height="5.5" rx="1.2" fill="#FFFFFF" />
        {/* Top-Right Pane */}
        <rect x="33.5" y="36" width="5.5" height="5.5" rx="1.2" fill="#FFFFFF" />
        {/* Bottom-Left Pane */}
        <rect x="25" y="44.5" width="5.5" height="5.5" rx="1.2" fill="#FFFFFF" />
        {/* Bottom-Right Pane */}
        <rect x="33.5" y="44.5" width="5.5" height="5.5" rx="1.2" fill="#FFFFFF" />
      </g>

      {/* Graduation Cap (Mortarboard) on Roof Peak */}
      <g>
        {/* Cap skull-base curve */}
        <path
          d="M22 13.5C22 13.5 22 18 32 18C42 18 42 13.5 42 13.5"
          fill="#1E293B"
          stroke="#0F172A"
          strokeWidth="1"
        />

        {/* Mortarboard Diamond Top */}
        <path
          d="M32 5L52 12.5L32 20L12 12.5L32 5Z"
          fill="url(#capGrad)"
          stroke="#0F172A"
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Mortarboard Center Button */}
        <circle cx="32" cy="12.5" r="1.8" fill="#F59E0B" />

        {/* Tassel Cord & Fringe */}
        <path
          d="M32 12.5C27 13.2 21 14.5 19 18C18.2 19.5 18 21.5 18 23"
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tassel Ring & Brush */}
        <circle cx="18" cy="23.2" r="1.2" fill="#D97706" />
        <path
          d="M16.5 24.2H19.5L19 28.5H17L16.5 24.2Z"
          fill="#F59E0B"
        />
      </g>
    </svg>
  );
};

export const UniHutLogo: React.FC<UniHutLogoProps> = ({
  className = '',
  iconClassName,
  variant = 'horizontal',
  size = 'md',
  dark = false,
  showTagline = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const iconClass = iconClassName || iconSizes[size];

  if (variant === 'mark') {
    return <UniHutIcon className={iconClass} />;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <UniHutIcon className={iconClass} />
      </div>

      <div className="flex flex-col text-left">
        <div className={`font-black tracking-tight leading-none ${textSizes[size]}`}>
          {dark ? (
            <>
              <span className="text-white">Uni</span>
              <span className="bg-gradient-to-r from-[#FF6B1A] to-[#E45A8D] bg-clip-text text-transparent">Hut</span>
            </>
          ) : (
            <>
              <span className="bg-gradient-to-r from-[#A855F7] to-[#E45A8D] bg-clip-text text-transparent">Uni</span>
              <span className="bg-gradient-to-r from-[#E45A8D] to-[#FF6B1A] bg-clip-text text-transparent">Hut</span>
            </>
          )}
        </div>

        {showTagline && (
          <span
            className={`text-[9px] font-bold tracking-wider uppercase mt-1 ${
              dark ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            Your Campus. Your Marketplace.
          </span>
        )}
      </div>
    </div>
  );
};
