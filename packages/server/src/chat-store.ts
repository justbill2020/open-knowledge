import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export type ChatMode = 'ask' | 'plan' | 'agent' | 'custom';
export type ChatBackend = 'codex' | 'claude' | 'cursor' | 'opencode' | 'gemini' | 'custom';

export type ChatContextItem =
  | { kind: 'file'; path: string }
  | { kind: 'folder'; path: string }
  | { kind: 'selection'; path: string; startLine?: number; endLine?: number; text: string }
  | { kind: 'graph-neighbor'; path: string; sourcePath?: string }
  | { kind: 'search-result'; path: string; query: string; snippet?: string };

export type ChatEvent =
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

export interface ChatSessionSummary {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly mode: ChatMode;
  readonly backend: ChatBackend;
  readonly archived: boolean;
  readonly path: string;
}

interface CreateChatSessionInput {
  readonly title: string;
  readonly mode: ChatMode;
  readonly backend: ChatBackend;
  readonly context: readonly ChatContextItem[];
  readonly now?: string;
}

function chatRoot(projectDir: string): string {
  return join(projectDir, '.ok', 'local', 'chats');
}

function activeDir(projectDir: string): string {
  return join(chatRoot(projectDir), 'active');
}

function archiveDir(projectDir: string): string {
  return join(chatRoot(projectDir), 'archive');
}

function ensureChatDirs(projectDir: string): void {
  mkdirSync(activeDir(projectDir), { recursive: true });
  mkdirSync(archiveDir(projectDir), { recursive: true });
}

function slugifyTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'chat';
}

function sessionPath(projectDir: string, id: string, archived = false): string {
  const dir = archived ? archiveDir(projectDir) : activeDir(projectDir);
  const match = existsSync(dir)
    ? readdirSync(dir).find((name) => name.startsWith(`${id}-`) && name.endsWith('.jsonl'))
    : undefined;
  if (match) return join(dir, match);
  throw new Error(`Chat session not found: ${id}`);
}

function findSessionPath(projectDir: string, id: string, archived?: boolean): string {
  if (archived !== undefined) return sessionPath(projectDir, id, archived);
  try {
    return sessionPath(projectDir, id, false);
  } catch {
    return sessionPath(projectDir, id, true);
  }
}

function serializeEvent(event: ChatEvent): string {
  return `${JSON.stringify(event)}\n`;
}

function parseEvents(path: string): ChatEvent[] {
  const text = readFileSync(path, 'utf-8');
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as ChatEvent);
}

function summaryFromFile(path: string, archived: boolean): ChatSessionSummary | null {
  const events = parseEvents(path);
  const session = events.find((event): event is Extract<ChatEvent, { type: 'chat.session' }> => {
    return event.type === 'chat.session';
  });
  if (!session) return null;
  return {
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    mode: session.mode,
    backend: session.backend,
    archived,
    path,
  };
}

export function createChatSession(
  projectDir: string,
  input: CreateChatSessionInput,
): ChatSessionSummary {
  ensureChatDirs(projectDir);
  const id = randomUUID();
  const createdAt = input.now ?? new Date().toISOString();
  const path = join(activeDir(projectDir), `${id}-${slugifyTitle(input.title)}.jsonl`);
  const sessionEvent: ChatEvent = {
    type: 'chat.session',
    id,
    title: input.title,
    createdAt,
    mode: input.mode,
    backend: input.backend,
  };
  const contextEvent: ChatEvent = { type: 'chat.context', items: [...input.context] };
  writeFileSync(path, serializeEvent(sessionEvent) + serializeEvent(contextEvent), 'utf-8');
  return {
    id,
    title: input.title,
    createdAt,
    mode: input.mode,
    backend: input.backend,
    archived: false,
    path,
  };
}

export function appendChatEvent(projectDir: string, id: string, event: ChatEvent): void {
  ensureChatDirs(projectDir);
  appendFileSync(findSessionPath(projectDir, id), serializeEvent(event), 'utf-8');
}

export function readChatEvents(
  projectDir: string,
  id: string,
  options: { archived?: boolean } = {},
): ChatEvent[] {
  ensureChatDirs(projectDir);
  return parseEvents(findSessionPath(projectDir, id, options.archived));
}

export function listChatSessions(
  projectDir: string,
  options: { archived: boolean },
): ChatSessionSummary[] {
  ensureChatDirs(projectDir);
  const dir = options.archived ? archiveDir(projectDir) : activeDir(projectDir);
  return readdirSync(dir)
    .filter((name) => name.endsWith('.jsonl'))
    .map((name) => summaryFromFile(join(dir, name), options.archived))
    .filter((summary): summary is ChatSessionSummary => summary !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function archiveChatSession(projectDir: string, id: string): ChatSessionSummary {
  ensureChatDirs(projectDir);
  const source = findSessionPath(projectDir, id, false);
  appendFileSync(
    source,
    serializeEvent({ type: 'chat.archived', archivedAt: new Date().toISOString() }),
    'utf-8',
  );
  const destination = join(archiveDir(projectDir), basename(source));
  renameSync(source, destination);
  const summary = summaryFromFile(destination, true);
  if (!summary) throw new Error(`Chat session missing header after archive: ${id}`);
  return summary;
}
