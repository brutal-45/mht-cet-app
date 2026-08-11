import { cn } from "@/lib/utils"; 

interface BrutalToolsBadgeProps {
  className?: string;
  variant?: "footer" | "pill";
}

/**
 * "Developed under Brutal Tools" attribution badge.
 * Brutal Tools is the credited toolset/studio behind this app.
 */
export function BrutalToolsBadge({
  className,
  variant = "pill",
}: BrutalToolsBadgeProps) {
  if (variant === "footer") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
          className
        )}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          {/* Hammer + wrench cross — simple "tools" mark */}
          <path
            d="M5 3 L11 9 L9 11 L3 5 Z"
            fill="currentColor"
            opacity="0.85"
          />
          <path
            d="M14 12 L21 19 L19 21 L12 14 Z"
            fill="currentColor"
            opacity="0.85"
          />
          <circle cx="13" cy="11" r="2.4" fill="currentColor" />
        </svg>
        <span>
          Developed under{" "}
          <span className="font-semibold text-foreground">Brutal Tools</span>
          {" · "}
          <span className="font-semibold text-foreground">Viraj Jadhav</span>
        </span>
      </div>
    );
  }

  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className={cn(
        "inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full border border-emerald-300/60 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors",
        className
      )}
      title="Developed under Brutal Tools by Viraj Jadhav"
    >
      {/* Brutal Tools icon */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path d="M5 3 L11 9 L9 11 L3 5 Z" fill="currentColor" opacity="0.9" />
        <path d="M14 12 L21 19 L19 21 L12 14 Z" fill="currentColor" opacity="0.9" />
        <circle cx="13" cy="11" r="2.4" fill="currentColor" />
      </svg>
      <span>
        Developed under <span className="font-semibold">Brutal Tools</span>
      </span>

      {/* Developer chip — visually distinct sub-section inside the same pill */}
      <span className="inline-flex items-center gap-1 ml-0.5 pl-2 border-l border-emerald-300/60 dark:border-emerald-700/60">
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path
            d="M4 21 C4 16.5 7.5 14 12 14 C16.5 14 20 16.5 20 21 Z"
            fill="currentColor"
          />
        </svg>
        <span className="font-semibold">Viraj Jadhav</span>
      </span>
    </a>
  );
}
