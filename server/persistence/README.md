# Persistence boundary

`ProcurementRepository` in `repository.ts` is the replacement boundary for mandate and audit reads, mandate creation/updates, and redacted audit events. Callers should depend on that interface and the shared types in `src/domain/models.ts`, not on a concrete storage engine. The async-shaped methods leave room for a later SQLite or Postgres adapter without changing those callers.

`InMemoryProcurementRepository` is the current deterministic adapter. It clones its seed and returned values, guards status transitions, records redacted audit events, and supports mandate creation and editing with request idempotency. Creation events do not include procurement values; update events list changed field names only. Idempotency records are process-local and exist only to prevent accidental duplicate writes within this running instance.

`getProcurementRepository()` returns one process-local instance initialized from `demo-seed.ts`. Its mandate, fixture, audit, and idempotency state resets when the process restarts and is not shared between workers or serverless instances. It is suitable for local domain work and tests only, not durable production storage. The seeded offer and settlement records are illustrative fixture data, not completed decisions or transfers.

Phase 7's `SimulatedSettlementAdapter` is a separate process-local lifecycle store. It creates short-lived simulated quotes, records explicit human approval, returns simulated status/receipt, and writes redacted lifecycle events through the repository. It never calls an external provider or moves funds. Its quote, approval, receipt, and replay state is volatile and must not be mistaken for durable production settlement records.
