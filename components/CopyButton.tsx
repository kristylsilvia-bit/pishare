'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({
  text,
  className = '',
  label,
}: {
  text: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable (e.g. insecure context) — fail quietly */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Copied!' : 'Copy'}
      className={`copy-btn ${className}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
}
