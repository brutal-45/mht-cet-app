interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Custom logo for MH CAP Cut-off Search.
 * Combines a graduation cap (academic) with a location pin (find your college)
 * inside a rounded emerald gradient tile.
 */
export function Logo({ className, size = 36 }: LogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-label="MH CAP Cut-off Search logo"
      role="img"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="logo-grad-light" x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Rounded tile background */}
        <rect x="0" y="0" width="48" height="48" rx="11" fill="url(#logo-grad)" />
        {/* subtle inner highlight */}
        <rect x="0" y="0" width="48" height="24" rx="11" fill="url(#logo-grad-light)" opacity="0.35" />

        {/* Graduation cap - mortarboard */}
        <g>
          {/* cap top (diamond) */}
          <path
            d="M10 19 L24 13 L38 19 L24 25 Z"
            fill="#ffffff"
          />
          {/* cap base (trapezoid under the board) */}
          <path
            d="M16 21.5 L16 27 C16 28.5 19.6 30 24 30 C28.4 30 32 28.5 32 27 L32 21.5 L24 25 Z"
            fill="#e6fff5"
            opacity="0.95"
          />
          {/* tassel */}
          <path
            d="M38 19 L38 25"
            stroke="#fbbf24"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="38" cy="26.5" r="1.6" fill="#fbbf24" />
        </g>

        {/* Location pin (bottom-right, overlapping cap) */}
        <g>
          <path
            d="M33 28 C29.5 28 27 30.4 27 33.4 C27 37.5 33 43 33 43 C33 43 39 37.5 39 33.4 C39 30.4 36.5 28 33 28 Z"
            fill="#ffffff"
            stroke="#047857"
            strokeWidth="1.2"
          />
          <circle cx="33" cy="33.2" r="2.3" fill="#047857" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Wordmark - text portion of the brand.
 * Stacked two-line layout that fits nicely next to the logo mark.
 */
export function Wordmark({
  className,
  title = "CAP Cut-off Finder",
  subtitle = "Maharashtra Engineering · 2025-26",
}: {
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className={`min-w-0 ${className ?? ""}`}>
      <p className="text-sm sm:text-base font-bold tracking-tight leading-tight truncate">
        {title}
      </p>
      <p className="text-[10px] sm:text-xs text-muted-foreground truncate leading-tight mt-0.5">
        {subtitle}
      </p>
    </div>
  );
}
