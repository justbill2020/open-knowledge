---
"@inkeep/open-knowledge": minor
---

Launch Codex and Cursor CLIs from the docked terminal, alongside Claude. The "Open with AI" surfaces (header popover, file and empty-space right-click menus, and the empty-state create composer) now offer a Codex (`codex`) and Cursor (`cursor-agent`) row in the Terminal section, each starting an interactive session with the same scope-specific prompt the Claude CLI launch uses. As with Claude, a CLI that isn't on your PATH suppresses the launch and shows an actionable "not installed" banner instead of a broken command.
