'use client';

import { useState } from 'react';
import { Copy, Check, Link } from 'lucide-react';

export default function CopyButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      onClick={handleCopy}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        copied
          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
      }`}
    >
      {copied ? (
        <><Check size={14} /> Link copied!</>
      ) : (
        <><Link size={14} /> Copy share link</>
      )}
    </button>
  );
}
