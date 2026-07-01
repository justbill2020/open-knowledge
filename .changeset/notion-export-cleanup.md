---
"@inkeep/open-knowledge": minor
---

Add `ok migrate notion [dir]` to clean up a Notion "Markdown & CSV" export in place. It normalizes internal links so they both render and resolve (decodes `%20`, handles targets with parentheses, and angle-wraps targets containing spaces), converts `<aside>` callouts to `> [!note]`, lifts database row properties into YAML frontmatter, extracts inline base64 images to files, and renders each database CSV as a markdown table (keeping the per-row pages). Dry-run by default; pass `--apply` to write. Every transform is idempotent, and the command refuses non-Notion directories unless `--force`.
