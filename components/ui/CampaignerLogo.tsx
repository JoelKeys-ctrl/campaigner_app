import React from 'react';

interface CampaignerLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  withProBadge?: boolean;
  badge?: boolean;
  className?: string;
  textClassName?: string;
  idPrefix?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 60,
};

/**
 * Pure SVG vector emblem of the styled "C" logo for Campaigner
 */
export const CampaignerLogoIcon: React.FC<{
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  badge?: boolean;
  className?: string;
  idPrefix?: string;
}> = ({ size = 'md', badge = true, className = '', idPrefix = 'c-logo' }) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 40;

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-label="Campaigner Logo"
    >
      <defs>
        {/* Main "C" Body Gradient: Rich Emerald */}
        <linearGradient
          id={`${idPrefix}-c-grad`}
          x1="6"
          y1="8"
          x2="42"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="42%" stopColor="#0b7b50" />
          <stop offset="100%" stopColor="#044e32" />
        </linearGradient>

        {/* Dynamic Launch Flap Gradient */}
        <linearGradient
          id={`${idPrefix}-flap-grad`}
          x1="20"
          y1="16"
          x2="40"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Subtle Inner Highlight */}
        <linearGradient
          id={`${idPrefix}-highlight-grad`}
          x1="12"
          y1="10"
          x2="28"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Squircle Badge Background Gradient */}
        <linearGradient
          id={`${idPrefix}-badge-bg`}
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0f1d17" />
          <stop offset="100%" stopColor="#07120e" />
        </linearGradient>

        {/* Badge Border Gradient */}
        <linearGradient
          id={`${idPrefix}-badge-border`}
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#0b7b50" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#047857" stopOpacity="0.05" />
        </linearGradient>

        {/* Ambient Drop Shadow for dimensional depth */}
        <filter
          id={`${idPrefix}-shadow`}
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2"
            floodColor="#044d31"
            floodOpacity="0.4"
          />
        </filter>
      </defs>

      {/* Optional Sleek Squircle Container */}
      {badge && (
        <>
          <rect
            width="48"
            height="48"
            rx="14"
            fill={`url(#${idPrefix}-badge-bg)`}
            stroke={`url(#${idPrefix}-badge-border)`}
            strokeWidth="1.2"
          />
          {/* Subtle top glare inside badge */}
          <rect
            x="1"
            y="1"
            width="46"
            height="22"
            rx="13"
            fill="url(#highlight-glare)"
            fillOpacity="0.04"
          />
        </>
      )}

      {/* Styled Letter "C" Group */}
      <g filter={badge ? `url(#${idPrefix}-shadow)` : undefined}>
        {/* Main Sweeping "C" Curve - Aerodynamic & Geometric */}
        <path
          d="M 33.5 11.8
             C 29.8 8.8 25 7.2 19.8 7.4
             C 10.8 7.8 4.2 14.8 4 23.8
             C 3.8 33 11 40.5 20.2 40.6
             C 25.4 40.7 30.2 38.6 33.6 35.2
             C 34.6 34.2 34.3 32.6 33 32
             C 31.8 31.4 30.4 31.8 29.4 32.7
             C 26.8 35.1 23.3 36.4 19.6 36.1
             C 13.8 35.6 9.3 30.7 9.4 24.8
             C 9.5 18.8 14.4 13.9 20.4 13.7
             C 23.6 13.6 26.6 14.8 28.8 16.8
             C 29.8 17.7 31.4 17.6 32.3 16.6
             L 33.5 15.2
             C 34.3 14.2 34.3 12.6 33.5 11.8 Z"
          fill={`url(#${idPrefix}-c-grad)`}
        />

        {/* Dynamic Forward Campaign Launch Arrow (integrated within C's aperture) */}
        <path
          d="M 19 23.8
             L 39.2 16.5
             C 40.6 16 41.6 17.4 40.8 18.6
             L 32.8 31.5
             C 32.1 32.6 30.5 32.6 29.8 31.4
             L 26.2 25.2
             L 19 23.8 Z"
          fill={`url(#${idPrefix}-flap-grad)`}
        />

        {/* Wing Fold Line for dimensional realism */}
        <path
          d="M 26.2 25.2
             L 40 17.2
             L 30.8 30
             Z"
          fill="#ffffff"
          fillOpacity="0.22"
        />

        {/* High-speed launch trail point */}
        <circle cx="21" cy="24" r="1.5" fill="#34d399" />
      </g>
    </svg>
  );
};

export const CampaignerLogo: React.FC<CampaignerLogoProps> = ({
  size = 'md',
  showText = true,
  withProBadge = true,
  badge = true,
  className = '',
  textClassName = '',
  idPrefix = 'campaigner-logo',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        <CampaignerLogoIcon size={size} badge={badge} idPrefix={idPrefix} />
      </div>

      {showText && (
        <div className="flex items-center gap-2">
          <span
            className={`text-xl font-bold tracking-tight text-gray-900 dark:text-white ${textClassName}`}
          >
            Campaigner
          </span>
          {withProBadge && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#0b7b50]/15 dark:bg-emerald-500/20 text-[#0b7b50] dark:text-emerald-400 border border-[#0b7b50]/30 dark:border-emerald-500/30">
              PRO
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignerLogo;
