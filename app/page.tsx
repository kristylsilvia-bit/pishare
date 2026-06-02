'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, Sparkles, Terminal, Brain, CalendarClock } from 'lucide-react';
import { Toolbar } from '@/components/Toolbar';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { SettingsSidebar } from '@/components/SettingsSidebar';
import { OfflineBanner } from '@/components/OfflineBanner';
import { DEFAULT_SETTINGS, type Message, type Settings, type HealthStatus } from '@/lib/types';
import { estimateConversationTokens, estimateTokens } from '@/lib/tokens';

const HELP_TEXT = `**Slash commands**

- \`/model\` — open settings and switch the active model
- \`/clear\` — clear the conversation
- \`/memory\` — inspect the agent's memory _(sent to Hermes)_
- \`/skills\` — list the agent's skills _(sent to Hermes)_
- \`/cron\` — show scheduled tasks _(sent to Hermes)_
- \`/help\` — show this help

Type \`/\` in the message box to see them inline.`;

const SUGGESTIONS = [
  { icon: Brain, label: 'What do you remember about me?', text: '/memory' },
  { icon: Terminal, label: 'What skills do you have?', text: '/skills' },
  { icon: CalendarClock, label: 'Show my scheduled tasks', text: '/cron' },
];

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelFocusSignal, setModelFocusSignal] = useState(0);
  const [health, setHealth] = useState<HealthStatus>('checking');
  const [offline, setOffline] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [showJump, setShowJump] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  // ── Health polling ──────────────────────────────────────────────────────
  const checkHealth = useCallback(async (initial = false) => {
    if (initial) setHealth('checking');
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) {
        setHealth('online');
        setOffline(false);
      } else {
        setHealth('offline');
        if (initial) setOffline(true);
      }
    } catch {
      setHealth('offline');
      if (initial) setOffline(true);
    }
  }, []);

  useEffect(() => {
    checkHealth(true);
    const id = setInterval(() => checkHealth(false), 30_000);
    return () => clearInterval(id);
  }, [checkHealth]);

  // ── Auto-scroll (pauses when the user scrolls up) ─────────────────────────
  useEffect(() => {
    if (autoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    autoScroll.current = nearBottom;
    setShowJump(!nearBottom && messages.length > 0);
  }

  function jumpToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    autoScroll.current = true;
    el.scrollTop = el.scrollHeight;
    setShowJump(false);
  }

  // ── Message helpers ───────────────────────────────────────────────────────
  function patchMessage(id: string, content: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)));
  }

  function updateSettings(patch: Partial<Settings>) {
    setSettings((s) => ({ ...s, ...patch }));
  }

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    autoScroll.current = true;
    setShowJump(false);
  }

  function exportMarkdown() {
    if (messages.length === 0) return;
    const head = `# Hermes conversation\n\n- **Model:** ${settings.model}\n- **Exported:** ${new Date().toISOString()}\n\n---\n\n`;
    const body = messages
      .map((m) => {
        const who = m.role === 'user' ? 'You' : m.role === 'assistant' ? 'Hermes' : 'System';
        return `### ${who}\n\n${m.content}\n`;
      })
      .join('\n---\n\n');
    const blob = new Blob([head + body], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hermes-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Streaming send ────────────────────────────────────────────────────────
  async function sendToAgent(text: string) {
    const userMsg: Message = { id: uid(), role: 'user', content: text, createdAt: Date.now() };
    const assistantId = uid();
    const history = [...messages, userMsg];

    setMessages([
      ...history,
      { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() },
    ]);
    setStreaming(true);
    autoScroll.current = true;

    const apiMessages: { role: string; content: string }[] = [];
    if (settings.systemPrompt.trim()) {
      apiMessages.push({ role: 'system', content: settings.systemPrompt });
    }
    for (const m of history) apiMessages.push({ role: m.role, content: m.content });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: settings.model,
          messages: apiMessages,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          top_p: settings.topP,
          frequency_penalty: settings.frequencyPenalty,
          presence_penalty: settings.presencePenalty,
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        let msg = 'Request failed.';
        try {
          const j = await res.json();
          msg = j.error || msg;
        } catch {
          /* non-JSON error body */
        }
        patchMessage(assistantId, `⚠️ ${msg}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const s = line.trim();
          if (!s.startsWith('data:')) continue;
          const payload = s.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta: string = json.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              acc += delta;
              patchMessage(assistantId, acc);
            }
          } catch {
            /* keep-alive or partial chunk — ignore */
          }
        }
      }

      if (!acc) patchMessage(assistantId, '_(no content returned)_');
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId && !m.content ? { ...m, content: '_(stopped)_' } : m,
          ),
        );
      } else {
        patchMessage(assistantId, '⚠️ Could not reach Hermes. Check the connection.');
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  // ── Submit routing (UI commands vs. agent) ────────────────────────────────
  function handleSubmit(text: string) {
    const t = text.trim();

    if (t === '/clear') {
      newChat();
      return;
    }
    if (t === '/model' || t.startsWith('/model ')) {
      setSidebarOpen(true);
      setModelFocusSignal((n) => n + 1);
      return;
    }
    if (t === '/help' || t.startsWith('/help')) {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: HELP_TEXT, createdAt: Date.now() },
      ]);
      autoScroll.current = true;
      return;
    }

    // Everything else (including /memory, /skills, /cron) goes to the agent.
    sendToAgent(t);
  }

  const tokenEstimate =
    estimateConversationTokens(messages) + estimateTokens(settings.systemPrompt);

  return (
    <div className="app">
      {offline && <OfflineBanner onRetry={() => checkHealth(true)} />}

      <Toolbar
        status={health}
        model={settings.model}
        onNewChat={newChat}
        onClear={newChat}
        onExport={exportMarkdown}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <main className="chat" ref={scrollRef} onScroll={onScroll}>
        <div className="chat__inner">
          {messages.length === 0 ? (
            <div className="empty">
              <div className="empty__badge">
                <Sparkles size={26} />
              </div>
              <h1 className="empty__title">Talk to Hermes</h1>
              <p className="empty__sub">
                Your agent, wired up. Stream a chat, tweak params, or edit its config —
                all from here.
              </p>
              <div className="empty__suggestions">
                {SUGGESTIONS.map(({ icon: Icon, label, text }) => (
                  <button
                    key={text}
                    type="button"
                    className="suggestion glass"
                    onClick={() => handleSubmit(text)}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <ChatMessage
                key={m.id}
                message={m}
                streaming={
                  streaming && i === messages.length - 1 && m.role === 'assistant'
                }
              />
            ))
          )}
        </div>
      </main>

      {showJump && (
        <button type="button" className="jump" onClick={jumpToBottom} title="Jump to latest">
          <ArrowDown size={18} />
        </button>
      )}

      <footer className="footer">
        <ChatInput
          onSubmit={handleSubmit}
          streaming={streaming}
          onStop={() => abortRef.current?.abort()}
        />
        <div className="footer__meta">
          <span>
            ~{tokenEstimate.toLocaleString()} tokens · {messages.length} message
            {messages.length === 1 ? '' : 's'}
          </span>
          <span className="footer__hint">Enter to send · Shift+Enter for newline</span>
        </div>
      </footer>

      <SettingsSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        settings={settings}
        onChange={updateSettings}
        modelFocusSignal={modelFocusSignal}
      />
    </div>
  );
}
