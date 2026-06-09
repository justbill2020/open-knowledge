---
"@inkeep/open-knowledge": patch
---

Fix links to non-markdown files rendering as "non-existent" (red) links even when the file exists.

Links to HTML, GPX, XML, archive (`.7z`/`.tar`/`.rar`/…), legacy Office (`.doc`/`.xls`/`.ppt`), OpenDocument, iWork, and e-book files now resolve and serve like any other asset. The editor treats every non-markdown link target as an asset, but the set that governs indexing, serving, and link resolution previously omitted these types, so their links always showed as broken.

`ASSET_EXTENSIONS` is now a superset of everything you can embed or link, enforced by a runtime guard so the two sets can't drift apart again. Newly admitted types are served as downloads (and open in the OS default app on desktop). HTML files are served inside a sandboxed, opaque origin (`Content-Security-Policy: sandbox allow-scripts; connect-src 'none'`): their scripts run so interactive documents work, but they can't read your knowledge base's cookies or storage, and `connect-src 'none'` blocks them from reaching the local API or exfiltrating over the network. On desktop, clicking an HTML link reveals it in Finder rather than failing silently.
