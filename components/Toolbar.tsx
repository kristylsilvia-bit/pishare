'use client';

import { Plus, Trash2, Download, SlidersHorizontal, Hexagon } from 'lucide-react';
import { ConnectionDot } from './ConnectionDot';
import type { HealthStatus } from '@/lib/types';

export function Toolbar({
  status,
  model,
  onNewChat,
  onClear,
  onExport,
  onToggleSidebar,
}: {
  status: HealthStatus;
  model: string;
  onNewChat: () => void;
  onClear: () => void;
  onExport: () => void;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="hud glass">
      <div className="hud__left">
        <div className="hud__brand">
          <Hexagon size={20} className="hud__logo" />
          <span className="hud__title">HERMES</span>
        </div>
        <ConnectionDot status={status} />
      </div>

      <div className="hud__right">
        <span className="hud__model" title={`Active model: ${model}`}>
          {model}
        </span>
        <div className="hud__actions">
          <button type="button" onClick={onNewChat} className="hud__btn" title="New chat">
            <Plus size={17} />
          </button>
          <button type="button" onClick={onClear} className="hud__btn" title="Clear history">
            <Trash2 size={16} />
          </button>
          <button type="button" onClick={onExport} className="hud__btn" title="Export as .md">
            <Download size={16} />
          </button>
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hud__btn hud__btn--accent"
            title="Settings"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
