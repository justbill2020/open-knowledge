---
"@inkeep/open-knowledge": patch
---

Pressing an arrow key to move the cursor into a Callout or Accordion body now lands reliably. Previously the descent across the component boundary relied on the browser's native caret motion, which under load could intermittently fail to place the cursor inside the body (leaving the selection stuck outside). A deterministic handler now drives the descent for all four arrow directions (down, up, left, right).
