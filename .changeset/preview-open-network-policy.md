---
"@inkeep/open-knowledge-core": minor
"@inkeep/open-knowledge-app": minor
"@inkeep/open-knowledge-server": minor
---

Preview embeds can now reach the network. The code-block `html preview` iframe runs with an open network CSP, so embeds that load external stylesheets, `fetch` live data, pull map tiles / remote images, use web fonts, or embed third-party iframes (over `https:`/`wss:`/`data:`/`blob:`) render — Leaflet maps, live-data charts, and the like work out of the box. `'unsafe-eval'` is not granted (the common libraries don't need it), and `*` / plaintext `http:`/`ws:` schemes are excluded.

The iframe stays a sandboxed null-origin frame (`sandbox="allow-scripts"`, no `allow-same-origin`), so an embed can reach the network but can never read the knowledge base, cookies, or auth — it widens network reach, not document access.

Breaking: the `preview.scriptSrc` config field is removed — the preview network policy is no longer configurable. A stale `preview.scriptSrc` key is rejected loudly on config load with a migration message (and handled by `ok config migrate`), not a silent no-op. A future multi-tenant host that needs to lock the preview network down will do so with an operator-level control (an env / build flag the tenant can't edit), not a content-editable config field.
