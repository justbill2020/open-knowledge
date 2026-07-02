import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import {
  appendChatEvent,
  archiveChatSession,
  createChatSession,
  listChatSessions,
  readChatEvents,
} from './chat-store.ts';

const tmpProject = () => mkdtempSync(join(tmpdir(), 'ok-chat-store-'));

describe('chat-store', () => {
  test('creates an active JSONL chat with session and context header events', () => {
    const projectDir = tmpProject();
    const session = createChatSession(projectDir, {
      title: 'System88 Assessment',
      mode: 'ask',
      backend: 'codex',
      context: [
        { kind: 'file', path: 'Current/Magic/System88/02_Part1_Assessment_Game.md' },
        {
          kind: 'selection',
          path: 'Current/Magic/System88/02_Part1_Assessment_Game.md',
          startLine: 32,
          endLine: 55,
          text: 'setup text',
        },
      ],
      now: '2026-07-02T10:00:00.000Z',
    });

    expect(session.archived).toBe(false);
    expect(session.path.replaceAll('\\', '/')).toContain('.ok/local/chats/active/');
    const events = readChatEvents(projectDir, session.id);
    expect(events).toEqual([
      {
        type: 'chat.session',
        id: session.id,
        title: 'System88 Assessment',
        createdAt: '2026-07-02T10:00:00.000Z',
        mode: 'ask',
        backend: 'codex',
      },
      {
        type: 'chat.context',
        items: [
          { kind: 'file', path: 'Current/Magic/System88/02_Part1_Assessment_Game.md' },
          {
            kind: 'selection',
            path: 'Current/Magic/System88/02_Part1_Assessment_Game.md',
            startLine: 32,
            endLine: 55,
            text: 'setup text',
          },
        ],
      },
    ]);
  });

  test('appends mode, backend, and message events without rewriting earlier lines', () => {
    const projectDir = tmpProject();
    const session = createChatSession(projectDir, {
      title: 'Planning',
      mode: 'ask',
      backend: 'codex',
      context: [],
      now: '2026-07-02T10:00:00.000Z',
    });
    const before = readFileSync(session.path, 'utf-8');

    appendChatEvent(projectDir, session.id, {
      type: 'chat.mode',
      from: 'ask',
      to: 'plan',
      changedAt: '2026-07-02T10:05:00.000Z',
    });
    appendChatEvent(projectDir, session.id, {
      type: 'chat.backend',
      from: 'codex',
      to: 'claude',
      changedAt: '2026-07-02T10:06:00.000Z',
      reason: 'user_selected',
    });
    appendChatEvent(projectDir, session.id, {
      type: 'message',
      role: 'user',
      content: 'make a plan',
      createdAt: '2026-07-02T10:07:00.000Z',
    });

    const after = readFileSync(session.path, 'utf-8');
    expect(after.startsWith(before)).toBe(true);
    expect(readChatEvents(projectDir, session.id).slice(2)).toEqual([
      {
        type: 'chat.mode',
        from: 'ask',
        to: 'plan',
        changedAt: '2026-07-02T10:05:00.000Z',
      },
      {
        type: 'chat.backend',
        from: 'codex',
        to: 'claude',
        changedAt: '2026-07-02T10:06:00.000Z',
        reason: 'user_selected',
      },
      {
        type: 'message',
        role: 'user',
        content: 'make a plan',
        createdAt: '2026-07-02T10:07:00.000Z',
      },
    ]);
  });

  test('archives sessions into chats/archive and hides them from the active list', () => {
    const projectDir = tmpProject();
    const session = createChatSession(projectDir, {
      title: 'Old chat',
      mode: 'ask',
      backend: 'codex',
      context: [],
      now: '2026-07-02T10:00:00.000Z',
    });

    expect(listChatSessions(projectDir, { archived: false })).toHaveLength(1);
    archiveChatSession(projectDir, session.id);

    expect(listChatSessions(projectDir, { archived: false })).toEqual([]);
    expect(listChatSessions(projectDir, { archived: true })).toMatchObject([
      { id: session.id, title: 'Old chat', archived: true },
    ]);
    expect(readChatEvents(projectDir, session.id, { archived: true }).at(-1)).toEqual({
      type: 'chat.archived',
      archivedAt: expect.any(String),
    });
  });
});
