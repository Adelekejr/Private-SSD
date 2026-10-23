# Persistence boundary

`ProcurementRepository` in `repository.ts` is the replacement boundary for mandate, offer, settlement, and audit reads, mandate creation/updates, and status changes. Callers should depend on that interface and the shared types in `src/domain/models.ts`, not on a concrete storage engine. The async-shaped methods leave room for a later SQLite or Postgres adapter without changing those callers.

`InMemoryProcurementRepository` is the current deterministic adapter. It clones its seed and returned values, guards status transitions, records redacted audit events, and supports mandate creation and editing with request idempotency. Creation events do not include procurement values; update events list changed field names only. Idempotency records are process-local and exist only to prevent accidental duplicate writes within this running instance.

`getProcurementRepository()` returns one process-local instance initialized from `demo-seed.ts`. Its state and idempotency records reset when the process restarts and are not shared between workers or serverless instances. This adapter is suitable for local domain work and tests only, not durable production storage. The offer policy labels are fixed demonstration fixture data; this phase does not evaluate policy or contact supplier agents. The settlement record is `simulated` mode and no settlement is executed.
