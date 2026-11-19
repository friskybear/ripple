export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="16" cy="16" r="2.6" fill="currentColor" />
      <circle
        cx="16"
        cy="16"
        r="7.5"
        stroke="currentColor"
        strokeOpacity=".6"
        strokeWidth="1.5"
      />
      <circle
        cx="16"
        cy="16"
        r="12.5"
        stroke="currentColor"
        strokeOpacity=".28"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function Wordmark({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-ink text-paper">
        <LogoMark className="size-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-semibold tracking-tight text-ink">
          ripple
        </span>
        {subtitle && (
          <span className="mt-1 font-mono text-[11px] tracking-[0.04em] text-ink-faint">
            Signal log
          </span>
        )}
      </span>
    </span>
  );
}
