import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable in a locked-down webview; the code stays visible.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? "Copied" : `Copy ${label}`}
      title={copied ? "Copied" : "Copy"}
      className="flex size-6 cursor-pointer items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface hover:text-ink"
    >
      {copied ? (
        <Check aria-hidden className="size-3.5 text-done" />
      ) : (
        <Copy aria-hidden className="size-3.5" />
      )}
    </button>
  );
}
