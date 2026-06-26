---
"@inkeep/open-knowledge-core": patch
---

Task-list checkboxes now stay clickable when an editor transitions from read-only to editable. The list-item NodeView set the checkbox's `disabled` state once at creation from `editor.isEditable`, but a `setEditable()` flip updates the view's editable flag without a document change, so ProseMirror never re-renders the NodeView and the stale `disabled` was never cleared. A checkbox created while the editor was read-only (for example, content loaded before the editor goes live) stayed permanently uncheckable. The NodeView now keeps `disabled` in sync with editability via the editor's `update` event (which `setEditable()` emits) and on every NodeView update.
