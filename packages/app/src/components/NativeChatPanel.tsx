import { Archive, MessageSquare, Paperclip, Plus, Send, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDocumentContext } from '@/editor/DocumentContext';
import { useSelectionContext } from '@/hooks/use-selection-context';
import { cn } from '@/lib/utils';
import { docNameToRelativePath } from '@/lib/workspace-paths';

type ChatMode = 'ask' | 'plan' | 'agent' | 'custom';
type ChatBackend = 'codex' | 'claude' | 'cursor' | 'opencode' | 'gemini' | 'custom';

type ChatContextItem =
  | { kind: 'file'; path: string }
  | { kind: 'folder'; path: string }
  | { kind: 'selection'; path: string; startLine?: number; endLine?: number; text: string }
  | { kind: 'graph-neighbor'; path: string; sourcePath?: string }
  | { kind: 'search-result'; path: string; query: string; snippet?: string };

type ChatEvent =
  | {
      type: 'chat.session';
      id: string;
      title: string;
      createdAt: string;
      mode: ChatMode;
      backend: ChatBackend;
    }
  | { type: 'chat.context'; items: ChatContextItem[] }
  | { type: 'chat.mode'; from: ChatMode; to: ChatMode; changedAt: string }
  | {
      type: 'chat.backend';
      from: ChatBackend;
      to: ChatBackend;
      changedAt: string;
      reason: 'user_selected' | 'fallback' | 'custom';
    }
  | { type: 'chat.archived'; archivedAt: string }
  | { type: 'message'; role: 'user' | 'assistant' | 'system'; content: string; createdAt: string };

interface ChatSessionSummary {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly mode: ChatMode;
  readonly backend: ChatBackend;
  readonly archived: boolean;
}

const MODES: Array<{ value: ChatMode; label: string }> = [
  { value: 'ask', label: 'Ask' },
  { value: 'plan', label: 'Plan' },
  { value: 'agent', label: 'Agent' },
  { value: 'custom', label: 'Custom' },
];

const BACKENDS: Array<{ value: ChatBackend; label: string }> = [
  { value: 'codex', label: 'Codex' },
  { value: 'claude', label: 'Claude' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'opencode', label: 'OpenCode' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'custom', label: 'Custom' },
];

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return (await response.json()) as T;
}

function latestSession(events: readonly ChatEvent[]): Extract<ChatEvent, { type: 'chat.session' }> {
  const session = events.find(
    (event): event is Extract<ChatEvent, { type: 'chat.session' }> =>
      event.type === 'chat.session',
  );
  if (!session) throw new Error('Chat is missing session header');
  return session;
}

function latestMode(events: readonly ChatEvent[]): ChatMode {
  const session = latestSession(events);
  const changes = events.filter(
    (event): event is Extract<ChatEvent, { type: 'chat.mode' }> => event.type === 'chat.mode',
  );
  return changes.at(-1)?.to ?? session.mode;
}

function latestBackend(events: readonly ChatEvent[]): ChatBackend {
  const session = latestSession(events);
  const changes = events.filter(
    (event): event is Extract<ChatEvent, { type: 'chat.backend' }> =>
      event.type === 'chat.backend',
  );
  return changes.at(-1)?.to ?? session.backend;
}

function contextItems(events: readonly ChatEvent[]): ChatContextItem[] {
  const seen = new Set<string>();
  const items: ChatContextItem[] = [];
  for (const event of events) {
    if (event.type !== 'chat.context') continue;
    for (const item of event.items) {
      const key = `${item.kind}:${'path' in item ? item.path : ''}:${JSON.stringify(item)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  }
  return items;
}

function modeDescription(mode: ChatMode): string {
  switch (mode) {
    case 'ask':
      return 'Read-only conversation.';
    case 'plan':
      return 'Plans and drafts changes without applying them.';
    case 'agent':
      return 'May run tools and edit once CLI execution is wired.';
    case 'custom':
      return 'Uses a saved custom permission profile.';
  }
}

export function NativeChatPanel(): ReactNode {
  const { activeDocName } = useDocumentContext();
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeFileContext = activeDocName ? docNameToRelativePath(activeDocName) : null;
  const liveSelection = useSelectionContext(activeDocName, 'wysiwyg');
  const messages = events.filter(
    (event): event is Extract<ChatEvent, { type: 'message' }> => event.type === 'message',
  );
  const mode = events.length > 0 ? latestMode(events) : 'ask';
  const backend = events.length > 0 ? latestBackend(events) : 'codex';
  const attachedContext = useMemo(() => contextItems(events), [events]);
  const activeFileAttached =
    activeFileContext !== null &&
    attachedContext.some((item) => item.kind === 'file' && item.path === activeFileContext);

  async function refreshSessions(nextActiveId = activeId) {
    const data = await apiJson<{ chats: ChatSessionSummary[] }>('/api/chats');
    setSessions(data.chats);
    if (nextActiveId) {
      setActiveId(nextActiveId);
    } else if (data.chats[0]) {
      setActiveId(data.chats[0].id);
    }
  }

  useEffect(() => {
    if (!open) return;
    void refreshSessions().catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [open]);

  useEffect(() => {
    if (!open || !activeId) {
      setEvents([]);
      return;
    }
    void apiJson<{ events: ChatEvent[] }>(`/api/chats?id=${encodeURIComponent(activeId)}`)
      .then((data) => setEvents(data.events))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [open, activeId]);

  async function createSession() {
    setBusy(true);
    setError(null);
    try {
      const context = activeFileContext ? [{ kind: 'file' as const, path: activeFileContext }] : [];
      const title = activeFileContext?.split('/').pop()?.replace(/\.md$/, '') ?? 'New chat';
      const data = await apiJson<{ session: ChatSessionSummary }>('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, mode: 'ask', backend: 'codex', context }),
      });
      await refreshSessions(data.session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function appendEvent(event: ChatEvent) {
    if (!activeId) return;
    await apiJson('/api/chats/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: activeId, event }),
    });
    setEvents((prev) => [...prev, event]);
  }

  async function changeMode(next: ChatMode) {
    if (next === mode) return;
    await appendEvent({ type: 'chat.mode', from: mode, to: next, changedAt: new Date().toISOString() });
  }

  async function changeBackend(next: ChatBackend) {
    if (next === backend) return;
    await appendEvent({
      type: 'chat.backend',
      from: backend,
      to: next,
      changedAt: new Date().toISOString(),
      reason: 'user_selected',
    });
  }

  async function attachActiveFile() {
    if (!activeFileContext || activeFileAttached) return;
    await appendEvent({ type: 'chat.context', items: [{ kind: 'file', path: activeFileContext }] });
  }

  async function attachSelection() {
    if (!liveSelection) return;
    await appendEvent({
      type: 'chat.context',
      items: [
        {
          kind: 'selection',
          path: docNameToRelativePath(liveSelection.docName),
          startLine: liveSelection.sourceLineStart,
          endLine: liveSelection.sourceLineEnd,
          text: liveSelection.markdown,
        },
      ],
    });
  }

  async function sendMessage() {
    const content = draft.trim();
    if (!content || !activeId) return;
    setBusy(true);
    setError(null);
    setDraft('');
    try {
      const data = await apiJson<{ events: ChatEvent[] }>('/api/chats/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeId, content, mode, backend }),
      });
      setEvents((prev) => [...prev, ...data.events]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDraft(content);
    } finally {
      setBusy(false);
    }
  }

  async function archiveActive() {
    if (!activeId) return;
    setBusy(true);
    try {
      await apiJson('/api/chats/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeId }),
      });
      setActiveId(null);
      setEvents([]);
      await refreshSessions(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 shadow-md"
        aria-label="Open native chat"
      >
        <MessageSquare className="size-4" aria-hidden />
        Chat
      </Button>
      {open ? (
        <aside className="fixed top-3 right-3 bottom-3 z-50 flex w-[420px] max-w-[calc(100vw-1.5rem)] flex-col rounded-lg border bg-background shadow-xl">
          <header className="flex items-center gap-2 border-b px-3 py-2">
            <MessageSquare className="size-4 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-medium text-sm">Native chat</h2>
              <p className="truncate text-muted-foreground text-xs">{modeDescription(mode)}</p>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={createSession} disabled={busy}>
              <Plus className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X className="size-4" aria-hidden />
            </Button>
          </header>
          <div className="grid grid-cols-[9rem_1fr] gap-0 min-h-0 flex-1">
            <nav className="min-h-0 overflow-y-auto border-r p-2">
              {sessions.length === 0 ? (
                <Button type="button" variant="outline" size="sm" onClick={createSession} disabled={busy}>
                  <Plus className="size-3.5" aria-hidden />
                  New chat
                </Button>
              ) : (
                <div className="space-y-1">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setActiveId(session.id)}
                      className={cn(
                        'w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted',
                        activeId === session.id && 'bg-muted text-foreground',
                      )}
                    >
                      <span className="block truncate">{session.title}</span>
                      <span className="block truncate text-muted-foreground">{session.backend}</span>
                    </button>
                  ))}
                </div>
              )}
            </nav>
            <section className="flex min-w-0 flex-col">
              <div className="flex gap-2 border-b p-2">
                <Select value={mode} onValueChange={(value) => void changeMode(value as ChatMode)}>
                  <SelectTrigger size="sm" aria-label="Chat mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES.map((entry) => (
                      <SelectItem key={entry.value} value={entry.value}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={backend}
                  onValueChange={(value) => void changeBackend(value as ChatBackend)}
                >
                  <SelectTrigger size="sm" aria-label="Chat backend">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKENDS.map((entry) => (
                      <SelectItem key={entry.value} value={entry.value}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-1 border-b p-2">
                {attachedContext.map((item, index) => (
                  <span
                    key={`${item.kind}-${index}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted/40 px-1.5 py-0.5 text-muted-foreground text-xs"
                    title={'path' in item ? item.path : item.kind}
                  >
                    <Paperclip className="size-3" aria-hidden />
                    <span className="truncate">{'path' in item ? item.path : item.kind}</span>
                  </span>
                ))}
                {activeFileContext ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={attachActiveFile}
                    disabled={activeFileAttached || !activeId}
                  >
                    <Paperclip className="size-3" aria-hidden />
                    {activeFileAttached ? 'Attached' : 'Attach active file'}
                  </Button>
                ) : null}
                {liveSelection ? (
                  <Button type="button" variant="ghost" size="xs" onClick={attachSelection}>
                    <Paperclip className="size-3" aria-hidden />
                    Attach selection
                  </Button>
                ) : null}
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {activeId === null ? (
                  <div className="flex h-full items-center justify-center">
                    <Button type="button" variant="outline" onClick={createSession} disabled={busy}>
                      <Plus className="size-4" aria-hidden />
                      Start chat
                    </Button>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Ask about the bundle or attach files as context.</p>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={`${message.createdAt}-${index}`}
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm',
                        message.role === 'user'
                          ? 'ml-8 bg-primary text-primary-foreground'
                          : 'mr-8 bg-muted',
                      )}
                    >
                      <div className="mb-1 text-[0.68rem] uppercase opacity-70">{message.role}</div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ))
                )}
              </div>
              {error ? <p className="border-t px-3 py-1 text-destructive text-xs">{error}</p> : null}
              <footer className="border-t p-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Ask the knowledge bundle..."
                  className="min-h-20 w-full resize-none rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <div className="mt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={archiveActive}
                    disabled={busy || !activeId}
                  >
                    <Archive className="size-3.5" aria-hidden />
                    Archive
                  </Button>
                  <Button type="button" size="sm" onClick={sendMessage} disabled={busy || !draft.trim() || !activeId}>
                    <Send className="size-3.5" aria-hidden />
                    Send
                  </Button>
                </div>
              </footer>
            </section>
          </div>
        </aside>
      ) : null}
    </>
  );
}
