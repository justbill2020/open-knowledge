---
"@inkeep/open-knowledge": patch
---

The document Properties panel now reflows to a vertical layout when the editor pane is narrow. Each property's value drops below its name and spans the full width of the pane, instead of being squeezed into a thin column beside a fixed-width label.

Previously the panel always used a two-column layout with a fixed label column, so on a narrow pane (side panels open, split view, or a small window) long values like a title or description wrapped into a tall sliver with most of the row left empty. The panel now switches to the stacked layout based on its own width, so it adapts whether the whole window is small or just the editor column is narrow. Wide panes keep the original side-by-side layout.
