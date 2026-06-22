---
"@inkeep/open-knowledge": patch
---

Desktop: detect and surface a failed auto-update install. When a "Relaunch now" (or quit-to-install) update is committed but the app boots back on the old version — e.g. macOS Squirrel's post-quit install never ran — the next launch now shows a clear "Update to vX didn't install" notice with Retry and Download manually actions, instead of failing silently. Previously this clean-quit failure left no signal: the in-session error and no-quit watchdog only fire while the process is alive, and the pending-install record was cleared before quit. Detection uses a prerelease-aware version compare so same-version beta bumps (e.g. beta.1 → beta.3) are no longer misread as a successful install.
