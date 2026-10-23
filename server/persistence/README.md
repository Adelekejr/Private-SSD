# Persistence boundary

`ProcurementRepository` in `repository.ts` is the replacement boundary for mandate, offer, settlement, and audit reads and status changes. Callers should depend on that interface and the shared types in `src/domain/models.ts`, not on a concrete storage engine. The async-shaped methods leave room for a later SQLite or Postgres adapter without changing those callers.

`InMemoryProcurementRepository` is the current deterministic adapter. It clones its seed and returned values, guards status transitions, and records redacted transition audit events. `getProcurementRepository()` returns one process-local instance initialized from `demo-seed.ts`.

This adapter is deliberately volatile: state resets when the process restarts and is not shared between workers or serverless instances. It is suitable for local domain work and tests only, not durable production storage. The offer policy labels are fixed demonstration fixture data; this phase does not evaluate policy or contact supplier agents. The settlement record is `simulated` mode and no settlement is executed. Nothing in this adapter is currently exposed through an API route or UI.
