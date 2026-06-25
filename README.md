# OpenKnowledge

OpenKnowledge is a beautiful, local-first markdown editor and LLM wiki with integrations for Claude, Codex, and Cursor. 

The editor has full WYSWIG so that editing markdown feels like editing a Google Doc or Notion page. 

Sharing and auto-sync are available for team-based collaboration are powered by git.

## Install

**macOS:** download the desktop app — open the DMG, drag **Open Knowledge** to **Applications**, and launch it. [Latest release](https://github.com/inkeep/open-knowledge/releases/latest).

**Linux or an Intel Mac:** run the same editor as a local web app via the CLI (Windows isn't supported yet) ([Node.js 24+](https://nodejs.org) required):

```bash
npm install -g @inkeep/open-knowledge
cd your-project
ok init          # scaffold the project + wire up Claude Code, Cursor, and Codex
ok start --open  # serve the editor and open it in your browser
```

Docs for general usage: <https://openknowledge.ai/docs>.

## Contributions

Public pull requests are welcome. When a public PR opens here, automation mirrors it into the internal monorepo for review and merge. 

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Prerequisites

- Bun 1.3.13 or newer (pinned in [`.bun-version`](./.bun-version))
- Node.js 24 or newer (pinned in [`.node-version`](./.node-version))
- Git

If you use a Node version manager, pin Node 24 with `fnm install`, `volta install node@24`, or `mise install`. Earlier Node versions fail `engines` checks during `bun install`.

## Quick Start

```bash
bun install
bun run check
```

Run the app locally:

```bash
bun run --filter @inkeep/open-knowledge-app dev
```

Run the docs site locally:

```bash
cd docs
bun run dev
```

## Monorepo Layout

- `packages/app` - web app and editor UI
- `packages/cli` - command-line entrypoint
- `packages/core` - shared domain logic
- `packages/desktop` - Electron desktop app
- `packages/plugin` - agent integration package
- `packages/server` - local server
- `docs` - documentation site

## Development

```bash
bun run format
bun run lint
bun run typecheck
bun run test
bun run build
```

## License

OpenKnowledge is licensed under the [GNU General Public License v3.0 or later](./LICENSE) (`GPL-3.0-or-later`).
