'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';
import { SlashCommandBar } from './SlashCommandBar';
import { matchSlashCommands, type SlashCommand } from '@/lib/slashCommands';

export function ChatInput({
  onSubmit,
  streaming,
  onStop,
  disabled = false,
}: {
  onSubmit: (text: string) => void;
  streaming: boolean;
  onStop: () => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const matches = matchSlashCommands(value);

  // Auto-grow the textarea up to a max height.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [value]);

  // Reset the slash-bar highlight whenever the matches change.
  useEffect(() => {
    setActiveIndex(0);
  }, [value]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || streaming) return;
    onSubmit(t);
    setValue('');
  }

  function pickCommand(cmd: SlashCommand) {
    // UI commands run immediately; agent commands get a trailing space for args.
    if (cmd.kind === 'ui') {
      submit(cmd.name);
    } else {
      setValue(`${cmd.name} `);
      taRef.current?.focus();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (matches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % matches.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        pickCommand(matches[activeIndex]);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        pickCommand(matches[activeIndex]);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(value);
    }
  }

  return (
    <div className="composer">
      <SlashCommandBar commands={matches} activeIndex={activeIndex} onPick={pickCommand} />
      <div className="composer__row glass">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={disabled}
          placeholder="Message Hermes…  (type / for commands)"
          className="composer__input"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="send-btn send-btn--stop"
            title="Stop generating"
          >
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => submit(value)}
            disabled={!value.trim() || disabled}
            className="send-btn"
            title="Send"
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
