---
"@inkeep/open-knowledge-server": patch
"@inkeep/open-knowledge": patch
---

fix(open-knowledge): MCP writes reflect on-disk truth — reconcile out-of-band edits instead of silently clobbering them (PRD-6832)

An OK MCP read could authoritatively return content older than the bytes on disk, with no warning. The root cause was upstream of the read: a doc loaded in the server holds stale in-memory CRDT state, an out-of-band edit (a script, `git pull`, manual edit) makes disk newer, and the next MCP write serializes the stale CRDT over the newer file — making disk itself stale, so the next read faithfully returns bad bytes. In one incident this gave an agent a stale spec scope and cost a multi-file revert.

This change makes disk authoritative on the write/reconcile path:

- **Reconcile-before-apply (L1).** Before a content write (`write_document` / `edit_document` / `edit_frontmatter`) or a `rename` applies, the server compares the on-disk bytes to the last-synced base and, on divergence, ingests the disk edit first (through the existing sanctioned file-watcher path) so the agent's edit lands on top of current reality. Both edits survive.
- **Store-time backstop (L3).** For the residual few-millisecond window where disk changes between the reconcile check and the store, the store re-checks disk before overwriting. On divergence it aborts the overwrite (disk wins) and the handler returns a hard `urn:ok:error:disk-divergence` (409) — the agent's edit was NOT applied; re-read and retry (a retry re-applies exactly once). This is the only guard for `undo` / `rollback`, which have no L1.
- **Heads-up on reconcile.** When a write reconciles an out-of-band edit, the success response carries a `disk-edit-reconciled` warning (`structuredContent.contentDivergence`) so the agent re-reads to see the combined result. Observational — the write still landed and both edits are on disk.

Human-editor (browser) writes are unaffected: the backstop only fires on agent-triggered stores, so in-progress typing is never reverted.
