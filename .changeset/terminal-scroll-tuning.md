---
"@inkeep/open-knowledge": patch
---

Tune embedded-terminal wheel scrolling to feel closer to a native terminal (e.g. Ghostty). The smooth mouse-tracking scroll added previously was correct but sluggish: macOS bakes velocity acceleration into wheel deltas, and the per-event clamp was clipping the accelerated fast-flick range. The mouse-mode accumulator now uses a modest base sensitivity with a higher per-event cap so OS acceleration carries through — fast flicks travel far while slow drags stay gentle — and normal scrollback gets a faster per-notch travel. Desktop only.
