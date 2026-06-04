---
"@inkeep/open-knowledge-app": patch
---

Sidebar + share-dialog polish:

- Custom Markdown sidebar icon (M↓) for `.md` and `.mdx` files, replacing Pierre's default glyph. Colored via the existing `--trees-file-icon-color-markdown` CSS variable so it tracks light/dark and selected-row treatment.
- ShareBranchSwitchDialog: align Cancel button styling with the other dialog Cancel buttons (outline + font-mono uppercase). Give the secondary "Open in current branch" button the same uppercase font-mono treatment as the primary "Open in <branch>" button.
- ShareBranchSwitchDialog: move the repository/file/branch metadata block from the dialog header into the body so it groups visually with the explanation paragraph.
- ShareBranchSwitchDialog: fix a spurious scrollbar caused by inline `<code>` pills whose `py-0.5` extends past the surrounding line-box (`leading-6` on the variant paragraphs absorbs the inline padding).
- ShareMetadataRows: bump value rows to `text-1sm` and label cells to `text-xs` for tighter hierarchy (affects both share dialogs that use this component).
- ShareReceiveDialog: tighten the inline-`<code>` corner radius to `rounded-sm`.
