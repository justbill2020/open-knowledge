---
"@inkeep/open-knowledge": patch
---

Fix the Ask AI composer covering the last lines of a document. Two fixes: the
bottom scroll inset now reserves room for the composer's gradient-fade band (not
just the card), and in source/markdown mode the inset is no longer zeroed by
CodeMirror's content-padding reset — so the final lines clear the field in both
WYSIWYG and source mode instead of sitting under it.
