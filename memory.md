# Project memory

## Current status

- Product: PrivateSpend Network, a constrained procurement workflow for small businesses. Agents may propose; deterministic constraints decide; a human retains authority before any real settlement.
- Repository: private `Adelekejr/Private-SSD`, working tree on branch `phase-1-foundation`.
- Phases 1–3 are committed and pushed through `a98ec9db3e1eebd157af2ebc5303ee87e25e9dbb` (`feat: add PrivateSpend mandate workflow`). Phase 4 is implemented locally and remains uncommitted/unpushed for Adeleke's review.
- Phase 3 provides responsive mandate creation/editing, shared browser/server validation, `GET`/`POST /api/mandates` and `GET`/`PUT /api/mandates/:id`, typed constraint construction, process-local idempotency, and redacted create/update audit events.
- Phase 4 adds a deterministic buyer-request parser that proposes typed constraints without changing the saved mandate; three deterministic local supplier fixtures; strict offer-response validation; an injected malformed response fixture that is rejected; offer evidence and unverified supplier risk notes; and `POST /api/mandates/:id/offers/simulate`.
- Offers are volatile UI proposals, not persisted. The buyer prompt is parsed server-side but is not stored or logged. No supplier endpoint, LLM, provider, wallet, NEAR account, testnet, mainnet, or funds are used. All Phase 4 offers have `policyResult: not_evaluated`; policy, approval, private inference, and settlement remain unimplemented.
- Verification on 2026-10-23: `npm test` passed all 17 tests; `npm run lint`, `npm run typecheck`, and `npm run build` passed. A local production-server smoke test confirmed the rendered offer UI, health phase `agent-offer-workflow`, three validated simulated offers, a prompt-injection fixture rejected without echoing its contents, and no change to the saved mandate. The local server was stopped afterward.
- No Phase 4 commit/push, deployment, Vercel change, repository-visibility change, or external supplier call occurred.

## Important scope and source notes

- The current owner instruction authorizes Phase 4 only, building on committed Phases 1–3. Stop for Adeleke's review at the end of Phase 4. Phase 5 requires separate approval.
- The current instruction does not authorize a Phase 4 commit/push, deployment, Vercel modification, or repository-visibility change. Do not perform any of those actions without separate explicit owner approval.
- The original agent-pack documents contain older phase-scope notes. Their current status has been updated for Phase 4, but explicit current human instructions still take priority.
- `docs/agent-pack/05-AGENT-MEMORY.md` records an existing PrivateSpend dashboard and simulated server boundary that conflict with this repository's original verified baseline. Treat that statement as historical source context, not as code or current implementation evidence. Do not search InvoiceLens for reusable code or assume an earlier PrivateSpend implementation exists.
- Do not copy or import code from InvoiceLens. This repository is separate.

## Durable decisions and limitations

- The Phase 2 persistence boundary is `server/persistence/repository.ts`. The current implementation remains process-local and volatile: mandate records, audit events, and idempotency keys reset on restart and are not shared between workers or serverless instances. It is for local development/tests, not durable production storage.
- Mandate validation is deterministic and shared between the browser form and server routes. It validates purpose, numeric ranges, asset format, reliability range, unique chains/recipients, approval threshold versus budget, and privacy-mode enum.
- Buyer parsing is deterministic regular-expression extraction, not an LLM. Parsed fields are human-reviewable suggestions only. Missing fields inherit saved mandate terms; invalid extraction falls back to saved constraints. Offers are generated from the saved mandate, never from unapproved parser suggestions.
- Supplier fixtures receive only a minimal structured mandate brief; no raw buyer prompt is forwarded. Every fixture response passes the same strict schema, which rejects unknown keys. Rejected text is not returned or logged.
- Supplier notes and evidence are deterministic demo content, not externally verified evidence. New offers display `NOT EVALUATED`; no Phase 5 budget, unit-price, recipient, destination, reliability, expiry, or approval logic has been implemented.
- The Phase 2 seeded offer labels remain illustrative fixture data, not computed policy decisions; the Phase 4 UI uses a separate offer simulation result.
- Privacy mode remains a saved preference only. No private AI, attestation, wallet, NEAR provider, or settlement execution was added.
- The health endpoint reports infrastructure readiness and `agent-offer-workflow`; it does not exercise a procurement or policy decision.
- The official hackathon rules should be re-read on 1 November 2026 and before submission.

## Next step

Stop for Adeleke's review of Phase 4. Wait for separate owner approval before Phase 5 or any Phase 4 commit/push, deployment, Vercel change, or repository-visibility change.
