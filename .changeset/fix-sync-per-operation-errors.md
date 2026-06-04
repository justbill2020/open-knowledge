---
"@inkeep/open-knowledge": patch
"@inkeep/open-knowledge-core": patch
"@inkeep/open-knowledge-server": patch
"@inkeep/open-knowledge-app": patch
"@inkeep/open-knowledge-desktop": patch
---

fix(sync): track push and pull errors separately so a sync error stops flashing in the popover

The sync status popover would show a sync error (e.g. a failed push) for only a split second before it vanished. The engine stored the last failure in a single shared `error` field, so a successful fetch on the pull leg cleared a still-unresolved push error — and `trigger('sync')` runs push then pull, so the push error was wiped by the immediately-following fetch within the same "Sync now". The same alternation happened continuously under auto-sync.

Push and pull errors are now tracked independently (`pushError`/`pushErrorCode` and `pullError`/`pullErrorCode`). A success on one leg only clears that leg's error, so a real push failure stays visible until a push actually succeeds (or sync is toggled).

When both legs fail with the same root cause (e.g. an auth failure that blocks fetch and push alike) the popover collapses them into a single neutral line instead of repeating two near-identical messages. When the two legs fail for different reasons, each line is labeled "Push:" / "Pull:" so it's clear which direction failed. A lone failure renders unlabeled, with pull-specific copy for read-side auth failures.
