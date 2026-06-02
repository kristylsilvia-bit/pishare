'use client';

import type { HealthStatus } from '@/lib/types';

const LABEL: Record<HealthStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  checking: 'Checking…',
};

export function ConnectionDot({ status }: { status: HealthStatus }) {
  return (
    <div className="conn" title={`Hermes API: ${LABEL[status]}`}>
      <span className={`conn__dot conn__dot--${status}`} />
      <span className="conn__label">{LABEL[status]}</span>
    </div>
  );
}
