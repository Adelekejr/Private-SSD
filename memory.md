# Project memory

## Current status

- Product: PrivateSpend Network, a constrained procurement workflow for small businesses. Agents may propose; deterministic constraints decide; a human retains authority before any real settlement.
- Repository: private `Adelekejr/Private-SSD`, branch `phase-1-foundation`.
- Phases 1–5 are committed and pushed through `c7d0d46c8ce7d810407eb50567fb9e622a86802f` (`feat: add PrivateSpend policy and security checks`). Phase 4's earlier checkpoint is `fb37b33fa6564bc7a1994c2628287c33dfad5a4c`. Phase 6 is implemented locally and remains uncommitted/unpushed for owner review.
- Phase 3 provides responsive mandate creation/editing, shared browser/server validation, `GET`/`POST /api/mandates` and `GET`/`PUT /api/mandates/:id`, typed constraint construction, process-local idempotency, and redacted create/update audit events.
- Phase 4 adds a deterministic buyer-request parser that proposes typed constraints without changing the saved mandate; three deterministic local supplier fixtures; strict offer-response validation; a rejected prompt-injection fixture; evidence and unverified supplier risk notes; and the simulated offers API.
- Phase 5 adds deterministic server policy evaluation for budget, asset, unit price, approved recipient, allowed destination, reliability, expiry, nonce replay, and approval threshold. It distinguishes `blocked`, `review`, and `pass`, with machine-readable policy reasons kept separate from supplier risk notes. Missing unit price under a configured maximum requires review. Offers over the approval threshold require human approval; this phase does not provide an approval action.
- Phase 6 adds a provider-neutral inference adapter and deterministic local simulated fallback using the existing buyer parser. The API and UI explicitly label it `SIMULATED_PRIVATE_AI`, show that no provider was contacted, and report verification and attestation as `not_performed`. This is not an AI model or real private inference.
- No NEAR AI credential was available in the supplied saved-secret inventory or environment variables. The optional server-side NEAR AI Cloud gateway integration was therefore deferred; no provider SDK, gateway call, verification, or attestation was added or claimed.
- Offer results remain volatile API responses and are not persisted. The buyer prompt is not stored or logged. Offer-simulation idempotency hashes the request, caches a response in process memory for 15 minutes, and is not shared across workers or restarts. The existing mandate repository is likewise process-local and volatile.
- `checkOfferBeforeExecution` is a server-side guard/test seam: it validates an untrusted offer and rechecks the current mandate and nonce context, but does not execute anything or consume a nonce. There is no settlement execution, wallet, NEAR account, testnet, mainnet, funds, supplier service, real LLM/private inference, or attestation.
- Phase 5 verification at its review checkpoint (2026-10-23): all 32 tests passed; lint, typecheck, and build passed; a production-server smoke test confirmed policy outcomes, replay/conflict behavior, and no prompt-injection echo. At that checkpoint Phase 5 was local/uncommitted; it was subsequently committed and pushed at `c7d0d46c8ce7d810407eb50567fb9e622a86802f`.
- Phase 6 verification (2026-10-23): all 34 `npm test` tests passed; `npm run lint`, `npm run typecheck`, and `npm run build` passed. Tests verified deterministic fallback provenance and that a unique sensitive marker was absent from captured application logs and the API response. A local production-server smoke test confirmed health phase `private-ai-simulation`, Phase 6 privacy copy, a simulated offer response, no provider contact, and verification/attestation `not_performed`; server output contained no marker and the server was stopped afterward.
- Phase 6 remains uncommitted and unpushed. No Vercel connection or change, deployment, publication, visibility change, real provider call, external supplier call, wallet, approval action, settlement, or funds were used.

## Important scope and source notes

- The current human instruction authorizes Phase 6 local implementation/review only. Keep Phase 6 uncommitted and unpushed; do not start Phase 7 or later. Do not connect or modify Vercel, deploy, publish, or change repository visibility without separate explicit approval.
- Phase 4 was committed and pushed to `Adelekejr/Private-SSD`, branch `phase-1-foundation`, at `fb37b33fa6564bc7a1994c2628287c33dfad5a4c`; Phase 5 was subsequently committed and pushed at `c7d0d46c8ce7d810407eb50567fb9e622a86802f`.
- The original five source PDFs under `/home/ubuntu/upload/` were cross-checked against the Phase 5 and Phase 6 checklists. Phase 6 follows the privacy boundary while deferring real-provider integration due to the unavailable credential.
- `docs/agent-pack/05-AGENT-MEMORY.md` contains a historical claim about an existing PrivateSpend dashboard that conflicts with the verified repository baseline. Treat it as historical source context, not as current implementation evidence. Do not search InvoiceLens for reusable code or assume an earlier PrivateSpend implementation exists.
- Do not copy or import code from InvoiceLens. This repository is separate.

## Durable decisions and limitations

- The Phase 2 persistence boundary is `server/persistence/repository.ts`. Mandates, audit events, and repository idempotency keys remain process-local and volatile; they reset on restart and are not shared across workers or serverless instances. Offer-simulation idempotency has the same local-only limitation and a 15-minute cache expiry.
- Mandate validation is deterministic and shared between the browser form and server routes. It validates purpose, numeric ranges, asset format, reliability range, unique chains/recipients, approval threshold versus budget, and privacy-mode enum.
- Buyer parsing is deterministic regular-expression extraction, not an LLM. Parsed fields are human-reviewable suggestions only. Missing fields inherit saved mandate terms; invalid extraction falls back to saved constraints. Offers and policy decisions are generated from the saved mandate, never from unapproved parser suggestions.
- Supplier fixtures receive only a minimal structured mandate brief; no raw buyer prompt is forwarded. Every fixture response passes the same strict schema, including expiry and nonce metadata; unknown fields are rejected. Rejected text is not returned or logged.
- Raw request text is processed transiently by the local adapter and is not written to application logs or persisted. The idempotency cache stores only a digest of the request and a short-lived response. A future provider adapter must preserve this boundary and return evidence-backed verification/attestation states.
- Policy reasons are computed deterministically on the server. Recipient matching is exact; destination matching is case-insensitive. A missing configured unit price is review-required rather than eligible. Threshold review applies when amount is strictly greater than the mandate threshold. The policy evaluator accepts an explicit set of already-consumed nonces but does not persist or consume nonce state; a future execution adapter must provide durable atomic replay protection.
- Phase 2 seeded offer labels remain illustrative fixture data, not computed policy decisions. The current offer API returns fresh computed outcomes separately.
- Privacy mode remains a saved preference. The current inference path is deterministic simulation; no real private AI, NEAR AI gateway, verification/attestation, wallet, approval endpoint, or settlement execution was added.
- The health endpoint reports infrastructure readiness and `private-ai-simulation`; it does not authorize or execute procurement.
- The official hackathon rules should be re-read on 1 November 2026 and before submission.

## Next step

Stop for Adeleke's review of Phase 6. Propose Phase 7 only after separate approval. Keep Phase 6 local and uncommitted; do not connect Vercel, deploy, publish, or change repository visibility without separate explicit approval.
