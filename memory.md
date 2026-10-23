# Project memory

## Current status

- Product: PrivateSpend Network, a constrained procurement workflow for small businesses. Agents may propose; deterministic constraints decide; a human retains authority before any real settlement.
- Repository: private `Adelekejr/Private-SSD`, branch `phase-1-foundation`.
- Phases 1–4 are committed and pushed through `fb37b33fa6564bc7a1994c2628287c33dfad5a4c` (`feat: add PrivateSpend supplier offer workflow`). Phase 5 is implemented locally and remains uncommitted/unpushed for review.
- Phase 3 provides responsive mandate creation/editing, shared browser/server validation, `GET`/`POST /api/mandates` and `GET`/`PUT /api/mandates/:id`, typed constraint construction, process-local idempotency, and redacted create/update audit events.
- Phase 4 adds a deterministic buyer-request parser that proposes typed constraints without changing the saved mandate; three deterministic local supplier fixtures; strict offer-response validation; a rejected prompt-injection fixture; evidence and unverified supplier risk notes; and the simulated offers API.
- Phase 5 adds deterministic server policy evaluation for budget, asset, unit price, approved recipient, allowed destination, reliability, expiry, nonce replay, and approval threshold. It distinguishes `blocked`, `review`, and `pass`, with machine-readable policy reasons kept separate from supplier risk notes. Missing unit price under a configured maximum requires review. Offers over the approval threshold require human approval; this phase does not provide an approval action.
- Offer results remain volatile API responses and are not persisted. The buyer prompt is parsed server-side but is not stored or logged. Offer-simulation idempotency hashes the request, caches a response in process memory for 15 minutes, and is not shared across workers or restarts. The existing mandate repository is likewise process-local and volatile.
- `checkOfferBeforeExecution` is a server-side guard/test seam: it validates an untrusted offer and rechecks the current mandate and nonce context, but does not execute anything or consume a nonce. There is no settlement execution, wallet, NEAR account, testnet, mainnet, funds, supplier service, LLM, private inference, or attestation.
- Verification on 2026-10-23: all 32 `npm test` tests passed; `npm run lint`, `npm run typecheck`, and `npm run build` passed. A local production-server smoke test confirmed health phase `policy-security`, offer results `blocked`, `blocked`, `review`, threshold-triggered approval-required, exact-key replay, `409` on changed payload reuse, and no prompt-injection echo. The local server was stopped afterward.
- No Phase 5 commit/push, Vercel connection/change, deployment, publication, visibility change, or external service call occurred.

## Important scope and source notes

- The current human instruction authorizes Phase 5 local implementation/review only. Keep Phase 5 uncommitted and unpushed. Do not connect or modify Vercel, deploy, publish, or change repository visibility. Phase 6 and later require separate approval.
- Phase 4 was committed and pushed by the coordinator to `Adelekejr/Private-SSD`, branch `phase-1-foundation`, at `fb37b33fa6564bc7a1994c2628287c33dfad5a4c`.
- The original five source PDFs under `/home/ubuntu/upload/` were cross-checked against the Phase 5 checklist. The implementation follows the security boundaries while deferring all settlement execution.
- `docs/agent-pack/05-AGENT-MEMORY.md` contains a historical claim about an existing PrivateSpend dashboard that conflicts with the verified repository baseline. Treat it as historical source context, not as current implementation evidence. Do not search InvoiceLens for reusable code or assume an earlier PrivateSpend implementation exists.
- Do not copy or import code from InvoiceLens. This repository is separate.

## Durable decisions and limitations

- The Phase 2 persistence boundary is `server/persistence/repository.ts`. Mandates, audit events, and repository idempotency keys remain process-local and volatile; they reset on restart and are not shared across workers or serverless instances. Offer-simulation idempotency has the same local-only limitation and a 15-minute cache expiry.
- Mandate validation is deterministic and shared between the browser form and server routes. It validates purpose, numeric ranges, asset format, reliability range, unique chains/recipients, approval threshold versus budget, and privacy-mode enum.
- Buyer parsing is deterministic regular-expression extraction, not an LLM. Parsed fields are human-reviewable suggestions only. Missing fields inherit saved mandate terms; invalid extraction falls back to saved constraints. Offers and policy decisions are generated from the saved mandate, never from unapproved parser suggestions.
- Supplier fixtures receive only a minimal structured mandate brief; no raw buyer prompt is forwarded. Every fixture response passes the same strict schema, including expiry and nonce metadata; unknown fields are rejected. Rejected text is not returned or logged.
- Policy reasons are computed deterministically on the server. Recipient matching is exact; destination matching is case-insensitive. A missing configured unit price is review-required rather than eligible. Threshold review applies when amount is strictly greater than the mandate threshold. The policy evaluator accepts an explicit set of already-consumed nonces but does not persist or consume nonce state; a future execution adapter must provide durable atomic replay protection.
- Phase 2 seeded offer labels remain illustrative fixture data, not computed policy decisions. The current Phase 5 offer API returns fresh computed outcomes separately.
- Privacy mode remains a saved preference only. No private AI, attestation, wallet, NEAR provider, approval endpoint, or settlement execution was added.
- The health endpoint reports infrastructure readiness and `policy-security`; it does not authorize or execute procurement.
- The official hackathon rules should be re-read on 1 November 2026 and before submission.

## Next step

Stop for Adeleke's review of Phase 5. Propose Phase 6 only after separate approval. Keep Phase 5 local and uncommitted; do not connect Vercel, deploy, publish, or change repository visibility without separate explicit approval.
