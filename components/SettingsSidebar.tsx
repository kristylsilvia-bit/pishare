'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X,
  Search,
  ChevronDown,
  Sliders,
  FileCode2,
  Save,
  RefreshCw,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import type { Settings } from '@/lib/types';

type Tab = 'params' | 'config';

export function SettingsSidebar({
  open,
  onClose,
  settings,
  onChange,
  modelFocusSignal = 0,
}: {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  modelFocusSignal?: number;
}) {
  const [tab, setTab] = useState<Tab>('params');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // ── Model search ──────────────────────────────────────────────────────────
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelQuery, setModelQuery] = useState(settings.model);
  const [showDropdown, setShowDropdown] = useState(false);
  const modelInputRef = useRef<HTMLInputElement>(null);

  // ── Config editor ─────────────────────────────────────────────────────────
  const [configText, setConfigText] = useState('');
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState<string | null>(null);
  const [configSaving, setConfigSaving] = useState(false);

  // Keep the search box in sync if the model changes from elsewhere (e.g. /model).
  useEffect(() => {
    setModelQuery(settings.model);
  }, [settings.model]);

  // Lazy-load the model list the first time the sidebar opens.
  useEffect(() => {
    if (!open || modelsLoaded) return;
    (async () => {
      try {
        const res = await fetch('/api/models');
        const data = await res.json();
        const ids: string[] = Array.isArray(data?.data)
          ? data.data.map((m: { id: string }) => m.id).filter(Boolean)
          : [];
        setModels(ids);
      } catch {
        setModels([]);
      } finally {
        setModelsLoaded(true);
      }
    })();
  }, [open, modelsLoaded]);

  // Focus the model search when a /model command asks for it.
  useEffect(() => {
    if (modelFocusSignal > 0 && open) {
      setTab('params');
      setShowDropdown(true);
      modelInputRef.current?.focus();
      modelInputRef.current?.select();
    }
  }, [modelFocusSignal, open]);

  async function loadConfig() {
    setConfigLoading(true);
    setConfigStatus(null);
    try {
      const res = await fetch('/api/config');
      const text = await res.text();
      if (res.ok) {
        setConfigText(text);
        setConfigLoaded(true);
      } else {
        setConfigStatus('Could not load config from the Pi.');
      }
    } catch {
      setConfigStatus('Could not reach the config server.');
    } finally {
      setConfigLoading(false);
    }
  }

  // Load config the first time the Config tab is opened.
  useEffect(() => {
    if (open && tab === 'config' && !configLoaded && !configLoading) {
      loadConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  async function saveConfig() {
    setConfigSaving(true);
    setConfigStatus(null);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: configText,
      });
      setConfigStatus(res.ok ? 'Saved — model config reloading.' : 'Save failed.');
    } catch {
      setConfigStatus('Could not reach the config server.');
    } finally {
      setConfigSaving(false);
    }
  }

  function commitModel(value: string) {
    const v = value.trim();
    if (v) onChange({ model: v });
    setShowDropdown(false);
  }

  const filteredModels = models.filter((m) =>
    m.toLowerCase().includes(modelQuery.toLowerCase()),
  );

  return (
    <>
      {open && <div className="sidebar__backdrop" onClick={onClose} />}

      <aside className={`sidebar glass ${open ? 'sidebar--open' : ''}`} aria-hidden={!open}>
        <div className="sidebar__head">
          <div className="sidebar__tabs">
            <button
              type="button"
              className={`sidebar__tab ${tab === 'params' ? 'sidebar__tab--active' : ''}`}
              onClick={() => setTab('params')}
            >
              <Sliders size={14} /> Params
            </button>
            <button
              type="button"
              className={`sidebar__tab ${tab === 'config' ? 'sidebar__tab--active' : ''}`}
              onClick={() => setTab('config')}
            >
              <FileCode2 size={14} /> Config
            </button>
          </div>
          <button type="button" className="sidebar__close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {tab === 'params' ? (
          <div className="sidebar__body">
            {/* Active model */}
            <div className="active-model">
              <div className="active-model__label">
                <Cpu size={13} /> Active model
              </div>
              <div className="active-model__value" title={settings.model}>
                {settings.model || '—'}
              </div>
            </div>

            {/* Model search */}
            <div className="field">
              <label className="field__label">Model search</label>
              <div className="model-search">
                <Search size={14} className="model-search__icon" />
                <input
                  ref={modelInputRef}
                  value={modelQuery}
                  onChange={(e) => {
                    setModelQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitModel(modelQuery);
                    }
                  }}
                  placeholder="search or type e.g. openrouter:anthropic/claude-opus-4"
                  className="model-search__input"
                  spellCheck={false}
                />
              </div>
              {showDropdown && (
                <div className="model-dropdown">
                  {!modelsLoaded && <div className="model-dropdown__empty">Loading models…</div>}
                  {modelsLoaded && filteredModels.length === 0 && (
                    <div className="model-dropdown__empty">
                      No matches — press Enter to use “{modelQuery}”.
                    </div>
                  )}
                  {filteredModels.slice(0, 50).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="model-dropdown__item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setModelQuery(m);
                        commitModel(m);
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* System prompt */}
            <div className="field">
              <label className="field__label">System prompt</label>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => onChange({ systemPrompt: e.target.value })}
                placeholder="You are Hermes, a helpful agent…"
                className="field__textarea"
                rows={4}
              />
            </div>

            {/* Temperature */}
            <div className="field">
              <label className="field__label">
                Temperature <span className="field__num">{settings.temperature.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={settings.temperature}
                onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
                className="slider"
              />
            </div>

            {/* Max tokens */}
            <div className="field">
              <label className="field__label">Max tokens</label>
              <input
                type="number"
                min={1}
                value={settings.maxTokens}
                onChange={(e) => onChange({ maxTokens: Math.max(1, parseInt(e.target.value || '1', 10)) })}
                className="field__input"
              />
            </div>

            {/* Advanced */}
            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setAdvancedOpen((v) => !v)}
            >
              <ChevronDown
                size={15}
                className={`advanced-toggle__chevron ${advancedOpen ? 'is-open' : ''}`}
              />
              Advanced
            </button>

            {advancedOpen && (
              <div className="advanced">
                <div className="field">
                  <label className="field__label">
                    Top&nbsp;P <span className="field__num">{settings.topP.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={settings.topP}
                    onChange={(e) => onChange({ topP: parseFloat(e.target.value) })}
                    className="slider"
                  />
                </div>
                <div className="field">
                  <label className="field__label">
                    Frequency penalty{' '}
                    <span className="field__num">{settings.frequencyPenalty.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    step={0.01}
                    value={settings.frequencyPenalty}
                    onChange={(e) => onChange({ frequencyPenalty: parseFloat(e.target.value) })}
                    className="slider"
                  />
                </div>
                <div className="field">
                  <label className="field__label">
                    Presence penalty{' '}
                    <span className="field__num">{settings.presencePenalty.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    step={0.01}
                    value={settings.presencePenalty}
                    onChange={(e) => onChange({ presencePenalty: parseFloat(e.target.value) })}
                    className="slider"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="sidebar__body">
            <div className="config-head">
              <span className="field__label">~/.hermes/config.yaml</span>
              <button
                type="button"
                className="config-reload"
                onClick={loadConfig}
                disabled={configLoading}
                title="Reload from Pi"
              >
                <RefreshCw size={13} className={configLoading ? 'spin' : ''} /> Reload
              </button>
            </div>

            <textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              placeholder={configLoading ? 'Loading…' : '# config.yaml'}
              className="config-editor"
              spellCheck={false}
            />

            <div className="config-warn">
              <AlertTriangle size={14} />
              Saving will reload model config.
            </div>

            <button
              type="button"
              className="save-btn"
              onClick={saveConfig}
              disabled={configSaving || configLoading}
            >
              <Save size={15} />
              {configSaving ? 'Saving…' : 'Save config'}
            </button>

            {configStatus && <div className="config-status">{configStatus}</div>}
          </div>
        )}
      </aside>
    </>
  );
}
