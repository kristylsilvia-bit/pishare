'use client';

import type { SlashCommand } from '@/lib/slashCommands';

export function SlashCommandBar({
  commands,
  activeIndex,
  onPick,
}: {
  commands: SlashCommand[];
  activeIndex: number;
  onPick: (cmd: SlashCommand) => void;
}) {
  if (commands.length === 0) return null;

  return (
    <div className="slashbar" role="listbox" aria-label="Slash commands">
      <span className="slashbar__hint">Commands</span>
      {commands.map((cmd, i) => (
        <button
          key={cmd.name}
          type="button"
          role="option"
          aria-selected={i === activeIndex}
          // Use onMouseDown so the click registers before the input blurs.
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(cmd);
          }}
          className={`slashbar__item ${i === activeIndex ? 'slashbar__item--active' : ''}`}
        >
          <span className="slashbar__name">{cmd.name}</span>
          <span className="slashbar__desc">{cmd.description}</span>
        </button>
      ))}
    </div>
  );
}
