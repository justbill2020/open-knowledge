---
"@inkeep/open-knowledge": patch
---

The Create-new-project dialog in OK Desktop is now name-first. You type the project name in a focused field at the top, then see a read-only Location with a Browse button to change where it lands and a live "Will be created at: …" caption showing the exact folder before you commit. Naming a project no longer means using the OS folder picker's New Folder button or hitting an "already has files" wall first. A name that collides with an existing non-empty folder, or one that can't be turned into a valid folder name, is flagged inline on the name field. The nested-project and parent-git-repo guards are unchanged.
