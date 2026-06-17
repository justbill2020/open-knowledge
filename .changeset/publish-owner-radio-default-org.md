---
"@inkeep/open-knowledge": patch
---

Publish-to-GitHub: pick the owner with a radio list and default to an org

The "Publish to GitHub" dialog now renders the eligible owners as a radio list (one card per owner) instead of a dropdown, so every choice is visible at a glance. When you belong to one or more organizations the wizard pre-selects the first org rather than your personal account, since a knowledge base is far more likely meant for the team, and accidentally publishing it under a personal login is annoying to undo. With no org available it falls back to your own account as before.
