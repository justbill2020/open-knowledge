---
"@inkeep/open-knowledge-server": patch
---

Fix telemetry shutdown losing local spans when the OTLP collector is unreachable. `shutdownTelemetry()` now drains the local file-sink exporter on its own awaited promise before the provider-wide teardown, instead of relying on `tracerProvider.shutdown()`. The provider fan-out is `Promise.all(...).then(resolve, reject)`, which short-circuits the moment the OTLP push processor rejects (a fast ECONNREFUSED when no collector is listening) — pre-empting the file pipeline's still-in-flight disk write. That dropped the very spans `ok diagnose bundle` exists to harvest and caused the intermittent `Telemetry > Gate combination 4` failure. Draining the file sink first makes on-disk span capture independent of the push pipeline's fate; the whole sequence still rides the existing shutdown-timeout race, so a pathological filesystem stall cannot deadlock teardown.
