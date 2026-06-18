---
"@inkeep/open-knowledge": patch
---

Fix directory symlinks (aliased folders) silently disappearing from the file tree. When a content directory contained a symlinked directory pointing at an already-indexed subtree, the boot-time index walk dropped it — the folder showed empty (its children were filed under the canonical path) or vanished entirely (a second symlink to the same inode). Symlinked directories now surface their full contents in the sidebar, mirroring the canonical folder. The index stores one lightweight edge per symlinked directory (alias prefix → canonical prefix) instead of materializing every descendant, so a content directory with many cross-linked mirrors (e.g. skill farms) stays memory-bounded; the subtree is projected under each alias prefix at `/api/documents` time. Alias rows carry the canonical document identity, so opening one reads and writes the canonical file rather than a second CRDT document over the same inode.
