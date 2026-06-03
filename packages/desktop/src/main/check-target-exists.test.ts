import { describe, expect, test } from 'bun:test';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { checkTargetExists } from './check-target-exists.ts';

describe('checkTargetExists', () => {
  function makeProject(): string {
    return mkdtempSync(join(tmpdir(), 'ok-check-target-exists-'));
  }

  function cleanup(path: string): void {
    rmSync(path, { recursive: true, force: true });
  }

  describe('doc kind', () => {
    test('returns exists for a regular file at a simple path', () => {
      const project = makeProject();
      try {
        writeFileSync(join(project, 'README.md'), '# hi\n');
        expect(checkTargetExists(project, 'doc', 'README.md')).toEqual('exists');
      } finally {
        cleanup(project);
      }
    });

    test('returns exists for a nested file via slashed path', () => {
      const project = makeProject();
      try {
        mkdirSync(join(project, 'docs', 'guides'), { recursive: true });
        writeFileSync(join(project, 'docs', 'guides', 'intro.md'), 'body\n');
        expect(checkTargetExists(project, 'doc', 'docs/guides/intro.md')).toEqual('exists');
      } finally {
        cleanup(project);
      }
    });

    test('returns missing when the file does not exist (ENOENT)', () => {
      const project = makeProject();
      try {
        expect(checkTargetExists(project, 'doc', 'README.md')).toEqual('missing');
      } finally {
        cleanup(project);
      }
    });

    test('returns missing when a doc path resolves to a directory', () => {
      const project = makeProject();
      try {
        mkdirSync(join(project, 'docs'), { recursive: true });
        expect(checkTargetExists(project, 'doc', 'docs')).toEqual('missing');
      } finally {
        cleanup(project);
      }
    });

    test('follows symlinks to a real file (returns exists)', () => {
      const project = makeProject();
      try {
        writeFileSync(join(project, 'real.md'), '# real\n');
        symlinkSync(join(project, 'real.md'), join(project, 'link.md'));
        expect(checkTargetExists(project, 'doc', 'link.md')).toEqual('exists');
      } finally {
        cleanup(project);
      }
    });
  });

  describe('folder kind', () => {
    test('returns exists for a directory at a simple path', () => {
      const project = makeProject();
      try {
        mkdirSync(join(project, 'docs'), { recursive: true });
        expect(checkTargetExists(project, 'folder', 'docs')).toEqual('exists');
      } finally {
        cleanup(project);
      }
    });

    test('returns exists for a nested directory via slashed path', () => {
      const project = makeProject();
      try {
        mkdirSync(join(project, 'docs', 'guides'), { recursive: true });
        expect(checkTargetExists(project, 'folder', 'docs/guides')).toEqual('exists');
      } finally {
        cleanup(project);
      }
    });

    test('returns missing when the directory does not exist (ENOENT)', () => {
      const project = makeProject();
      try {
        expect(checkTargetExists(project, 'folder', 'docs')).toEqual('missing');
      } finally {
        cleanup(project);
      }
    });

    test('returns missing when a folder path resolves to a regular file', () => {
      const project = makeProject();
      try {
        writeFileSync(join(project, 'README.md'), '# hi\n');
        expect(checkTargetExists(project, 'folder', 'README.md')).toEqual('missing');
      } finally {
        cleanup(project);
      }
    });

    test('follows symlinks to a real directory (returns exists)', () => {
      const project = makeProject();
      try {
        mkdirSync(join(project, 'real-dir'), { recursive: true });
        symlinkSync(join(project, 'real-dir'), join(project, 'link-dir'));
        expect(checkTargetExists(project, 'folder', 'link-dir')).toEqual('exists');
      } finally {
        cleanup(project);
      }
    });
  });

  describe('path-shape gate (kind-agnostic)', () => {
    test('returns unreadable for non-absolute projectPath', () => {
      expect(checkTargetExists('relative/path', 'doc', 'README.md')).toEqual('unreadable');
    });

    test('returns unreadable for empty projectPath', () => {
      expect(checkTargetExists('', 'doc', 'README.md')).toEqual('unreadable');
    });

    test('returns unreadable for projectPath containing a NUL byte', () => {
      expect(checkTargetExists('/tmp/a\0b', 'doc', 'README.md')).toEqual('unreadable');
    });

    test('returns unreadable for projectPath that resolves to a different path (`..` escape)', () => {
      expect(checkTargetExists('/tmp/../etc', 'doc', 'passwd')).toEqual('unreadable');
    });

    test('returns unreadable for empty path (doc kind)', () => {
      const project = makeProject();
      try {
        expect(checkTargetExists(project, 'doc', '')).toEqual('unreadable');
      } finally {
        cleanup(project);
      }
    });

    test('returns unreadable for empty path (folder kind) — content-root is skipped upstream', () => {
      const project = makeProject();
      try {
        expect(checkTargetExists(project, 'folder', '')).toEqual('unreadable');
      } finally {
        cleanup(project);
      }
    });

    test('returns unreadable for absolute path', () => {
      const project = makeProject();
      try {
        writeFileSync(join(project, 'README.md'), '# hi\n');
        expect(checkTargetExists(project, 'doc', join(project, 'README.md'))).toEqual('unreadable');
      } finally {
        cleanup(project);
      }
    });

    test('returns unreadable for path with a NUL byte', () => {
      const project = makeProject();
      try {
        expect(checkTargetExists(project, 'doc', 'a\0b.md')).toEqual('unreadable');
      } finally {
        cleanup(project);
      }
    });

    test('returns unreadable for path containing a `..` segment', () => {
      const project = makeProject();
      try {
        writeFileSync(join(project, 'README.md'), '# hi\n');
        expect(checkTargetExists(project, 'doc', 'docs/../README.md')).toEqual('unreadable');
      } finally {
        cleanup(project);
      }
    });

    test('returns unreadable for path that escapes the project root (`../`)', () => {
      const project = makeProject();
      try {
        expect(checkTargetExists(project, 'doc', '../escape.md')).toEqual('unreadable');
      } finally {
        cleanup(project);
      }
    });

    test('does not confuse sibling-directory prefix matches with containment', () => {
      const parent = mkdtempSync(join(tmpdir(), 'ok-check-target-exists-parent-'));
      try {
        const project = join(parent, 'proj');
        const sibling = join(parent, 'proj-evil');
        mkdirSync(project);
        mkdirSync(sibling);
        writeFileSync(join(sibling, 'file.md'), 'no\n');
        expect(checkTargetExists(project, 'doc', '../proj-evil/file.md')).toEqual('unreadable');
      } finally {
        cleanup(parent);
      }
    });
  });

  describe('graceful-fail (kind-agnostic)', () => {
    test('returns missing when projectPath itself does not exist', () => {
      expect(
        checkTargetExists('/tmp/definitely-does-not-exist-ok-test-12345/proj', 'doc', 'README.md'),
      ).toEqual('missing');
    });

    test('handles unreadable directory (EACCES) as unreadable, not missing', () => {
      if (process.platform === 'win32' || process.getuid?.() === 0) return;
      const project = makeProject();
      try {
        mkdirSync(join(project, 'locked'), { recursive: true });
        writeFileSync(join(project, 'locked', 'file.md'), '# hi\n');
        chmodSync(join(project, 'locked'), 0o000);
        try {
          const result = checkTargetExists(project, 'doc', 'locked/file.md');
          expect(result).not.toEqual('missing');
        } finally {
          chmodSync(join(project, 'locked'), 0o755);
        }
      } finally {
        cleanup(project);
      }
    });
  });
});
