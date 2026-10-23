# Project memory

## Current status

- Product: PrivateSpend Network, a constrained procurement workflow for small businesses. Agents may propose; deterministic constraints decide; a human retains authority before any real settlement.
- Repository: private `Adelekejr/Private-SSD`, working tree on branch `phase-1-foundation`.
- Phases 1 and 2 are committed through `4e770d0f3f1b188eaf1dc037201d29588ff990fa` (`feat: add PrivateSpend domain and persistence foundation`).
- Adeleke explicitly approved Phase 3 only. Phase 3 mandate creation/editing is implemented locally and remains uncommitted. No commit, push, publish, deployment, repository visibility change, or Vercel change was made.
- Phase 3 adds a responsive mandate workspace, shared browser/server validation, `GET`/`POST /api/mandates` and `GET`/`PUT /api/mandates/:id`, typed constraint construction, process-local idempotency, and redacted human audit events for create/update.
- Creation audit entries do not include mandate values. Update audit entries contain changed field names, not field values. The privacy-mode selector stores a preference only; it does not call a provider or attest execution.
- Verification on 2026-10-23: `npm test` passed all 11 tests; `npm run lint`, `npm run typecheck`, and `npm run build` passed. A production-server smoke test confirmed the Phase 3 page and health phase, server rejection of invalid input, create and same-key replay without duplication, edit persistence during the process, and creation/update audit entries with values redacted. The temporary server was stopped.

## Important scope and source notes

- The original agent-pack documents contain historical Phase 1/Phase 2-only approval language. The current human instruction explicitly authorizes Phase 3 only and supersedes that stale scope restriction; Phase 4 and later are not authorized.
- `docs/agent-pack/05-AGENT-MEMORY.md` records an existing PrivateSpend dashboard and simulated server boundary. That statement conflicts with this repository's original verified state. Treat it as historical source context, not as code or current implementation evidence. Do not search InvoiceLens for reusable code or assume an earlier PrivateSpend implementation exists.
- Do not copy or import code from InvoiceLens. This repository is separate.

## Durable decisions and limitations

- The Phase 2 persistence boundary is `server/persistence/repository.ts`. The current implementation remains process-local and volatile: mandate records, audit events, and idempotency keys reset on restart and are not shared between workers or serverless instances. It is for local development/tests, not durable production storage.
- Mandate validation is deterministic and shared between the browser form and server routes. It validates purpose, numeric ranges, asset format, reliability range, unique chains/recipients, approval threshold versus budget, and privacy-mode enum.
- The supported privacy modes are saved as user-entered mandate preferences only. No private AI, attestation, policy engine, supplier agent, wallet, NEAR provider, or settlement execution was added.
- Offer policy labels in the deterministic seed remain illustrative fixture data, not computed policy decisions. The settlement seed is `simulated` and `not_started`; it is not an executed or real settlement.
- The health endpoint reports infrastructure readiness and `mandate-workflow`; it does not exercise a procurement or policy decision.
- No secret, key, provider, or funds are used. No claim of private inference, attestation, testnet, mainnet, or settlement is made.
- Do not commit or push Phase 3, begin Phase 4, publish, deploy, alter repository visibility, or modify Vercel without separate explicit owner approval.
- The official hackathon rules should be re-read on 1 November 2026 and before submission.

## Next step

Stop for Adele's review of Phase 3. Wait for separate owner approval before Phase 4, any commit/push, or any external release/deployment action.
