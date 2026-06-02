'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export function OfflineBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="offline-banner" role="alert">
      <AlertTriangle size={16} />
      <span>
        Can&apos;t reach the Hermes Agent. Check that it&apos;s running and that port
        forwarding is set up.
      </span>
      <button type="button" onClick={onRetry} className="offline-banner__retry">
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}
