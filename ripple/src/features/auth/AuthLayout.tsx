import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Wordmark } from "../../components/Logo";

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-14">
        <Link to="/" aria-label="Ripple home" className="w-fit rounded-md">
          <Wordmark />
        </Link>

        <div className="flex flex-1 items-center py-12">
          <div className="w-full max-w-sm">
            <p className="font-mono text-[11px] tracking-[0.04em] text-ink-faint">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {subtitle}
            </p>

            <div className="mt-8">{children}</div>
            <div className="mt-6 text-sm text-ink-soft">{footer}</div>
          </div>
        </div>

        <p className="font-mono text-[11px] tracking-[0.04em] text-ink-faint">
          Small signals · visible patterns
        </p>
      </div>

      <RippleArt />
    </div>
  );
}

function RippleArt() {
  const rings = [64, 122, 180, 238, 296, 354, 412];

  return (
    <div className="relative hidden overflow-hidden border-l border-line bg-[#e9f0ed] lg:block">
      <svg
        viewBox="0 0 640 900"
        aria-hidden="true"
        fill="none"
        className="absolute -top-24 -right-40 h-[125%] w-[125%] text-teal"
        preserveAspectRatio="xMinYMin slice"
      >
        <g transform="translate(540 150)">
          {rings.map((radius, index) => (
            <circle
              key={radius}
              r={radius}
              stroke="currentColor"
              strokeOpacity={0.42 - index * 0.045}
              strokeWidth="1"
            />
          ))}
          <circle cx="0" cy="0" r="4" fill="currentColor" />
          <circle
            cx={-rings[3] * 0.72}
            cy={rings[3] * 0.69}
            r="5.5"
            fill="#b4530c"
          />
          <line
            x1={-rings[3] * 0.72}
            y1={rings[3] * 0.69}
            x2={-rings[3] * 0.72 - 34}
            y2={rings[3] * 0.69 + 33}
            stroke="#b4530c"
            strokeOpacity=".45"
          />
        </g>
      </svg>

      <div className="absolute top-10 left-10 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-teal-dark/70">
        <span className="h-px w-8 bg-teal-dark/40" />
        Field notes
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[#e9f0ed] via-[#e9f0ed]/90 to-transparent p-10 pt-24">
        <p className="font-mono text-[11px] tracking-[0.04em] text-teal-dark/70">
          Observation 014 · lab-2
        </p>
        <p className="mt-3 max-w-sm text-xl leading-snug font-medium text-balance text-ink">
          “The Wi-Fi drops every afternoon.”
        </p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          Six people said the same thing. That is no longer a complaint — it is
          a pattern worth fixing.
        </p>
      </div>
    </div>
  );
}
