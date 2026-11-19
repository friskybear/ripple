import {
  AlertTriangle,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { errorText } from "../lib/errors";

export const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ button */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
};

const buttonVariants = {
  primary:
    "border border-transparent bg-teal text-white hover:bg-teal-dark active:bg-teal-dark",
  secondary:
    "border border-line bg-surface text-ink hover:border-line-strong hover:bg-paper active:bg-line/50",
  ghost:
    "border border-transparent bg-transparent text-ink-soft hover:bg-ink/5 hover:text-ink",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(buttonClass(variant, size), className)}
      {...props}
    >
      {loading && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Same look as Button, for router <Link>s (button inside an anchor is invalid). */
export function buttonClass(
  variant: keyof typeof buttonVariants = "secondary",
  size: "sm" | "md" = "md",
) {
  return cx(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150",
    size === "md" ? "h-10 px-4 text-sm" : "h-8 px-3 text-[13px]",
    buttonVariants[variant],
  );
}

/* ------------------------------------------------------------------ inputs */

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-teal focus:ring-2 focus:ring-teal/15 focus:outline-none disabled:opacity-60";

export const invalidInputClass =
  "border-flare focus:border-flare focus:ring-flare/15";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  aside,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-xs font-medium text-flare"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- badges */

const badgeTones = {
  neutral: "border-line bg-paper text-ink-soft",
  teal: "border-teal/20 bg-teal-wash text-teal-dark",
  flare: "border-flare/20 bg-flare-wash text-flare-dark",
  info: "border-info/20 bg-info-wash text-info",
  done: "border-done/20 bg-done-wash text-done",
};

export function Badge({
  tone = "neutral",
  icon: Icon,
  children,
  className,
}: {
  tone?: keyof typeof badgeTones;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        badgeTones[tone],
        className,
      )}
    >
      {Icon && <Icon aria-hidden className="size-3" />}
      {children}
    </span>
  );
}

const statusMeta = {
  open: { label: "Open", tone: "flare" },
  investigating: { label: "Investigating", tone: "info" },
  resolved: { label: "Resolved", tone: "done" },
} as const;

export function StatusBadge({
  status,
}: {
  status: keyof typeof statusMeta;
}) {
  const meta = statusMeta[status];
  return (
    <Badge tone={meta.tone}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ layout */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div className="min-w-0 space-y-1.5">
        <p className="font-mono text-[11px] tracking-[0.04em] text-ink-faint">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-ink sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="max-w-xl text-sm text-ink-soft">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-panel border border-line bg-surface",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  aside,
}: {
  title: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
      <h2 className="font-mono text-[11px] tracking-[0.04em] text-ink-faint">
        {title}
      </h2>
      {aside}
    </div>
  );
}

/* ----------------------------------------------------------------- feedback */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-panel border border-line bg-surface px-6 py-14 text-center">
      {Icon && (
        <span className="flex size-11 items-center justify-center rounded-xl bg-teal-wash text-teal">
          <Icon aria-hidden className="size-5" />
        </span>
      )}
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description && (
        <p className="max-w-sm text-sm text-ink-soft">{description}</p>
      )}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center gap-3 rounded-panel border border-flare/25 bg-flare-wash/60 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-surface text-flare">
        <AlertTriangle aria-hidden className="size-5" />
      </span>
      <p className="max-w-sm text-sm text-flare-dark">{errorText(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-flare/25 bg-flare-wash px-3 py-2 text-[13px] text-flare-dark"
    >
      <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{errorText(error)}</span>
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      {label}
    </span>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-5">
          <div className="h-6 w-10 animate-pulse rounded bg-line/70" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-line/70" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-line/50" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded-full bg-line/60" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------- modal */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-panel border border-line bg-surface p-0 text-ink backdrop:bg-ink/45"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="space-y-0.5">
          <h2 id="dialog-title" className="text-base font-semibold">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-ink-soft">{description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close dialog"
          className="-mt-1 -mr-2"
        >
          <X aria-hidden className="size-4" />
        </Button>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
          {footer}
        </div>
      )}
    </dialog>
  );
}

/* ------------------------------------------------------------------- extras */

export function ImpactMeter({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Impact ${value} of 5`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          aria-hidden
          className={cx(
            "h-3 w-1 rounded-full",
            index < value ? "bg-teal" : "bg-line",
          )}
        />
      ))}
      <span className="ml-1 font-mono text-[11px] text-ink-soft tabular-nums">
        {value}/5
      </span>
    </span>
  );
}
