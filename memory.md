# Project memory

## Current status

- Product: PrivateSpend Network, a constrained procurement workflow for small businesses. Agents may propose; deterministic constraints decide; a human retains authority before any real settlement.
- Repository: private `Adelekejr/Private-SSD`, branch `phase-1-foundation`.
- Phases 1–6 are committed and pushed through `dd44a99274b63ca73a73c302fcaedc402d01120f`. Phase 7 is implemented locally for owner review and remains uncommitted/unpushed.
- Phase 3 provides responsive mandate creation/editing, shared browser/server validation, `GET`/`POST /api/mandates` and `GET`/`PUT /api/mandates/:id`, typed constraint construction, process-local idempotency, and redacted create/update audit events.
- Phase 4 adds a deterministic buyer-request parser that proposes typed constraints without changing the saved mandate; three deterministic local supplier fixtures; strict offer-response validation; a rejected prompt-injection fixture; evidence and unverified supplier risk notes; and the simulated offers API.
- Phase 5 adds deterministic server policy evaluation for budget, asset, unit price, approved recipient, allowed destination, reliability, expiry, nonce replay, and approval threshold. It distinguishes `blocked`, `review`, and `pass`; missing configured unit price requires review. Policy evidence is kept separate from supplier risk notes.
- Phase 6 adds a provider-neutral inference adapter and deterministic local simulated fallback using the existing buyer parser. The API and UI label it `SIMULATED_PRIVATE_AI`, show that no provider was contacted, and report verification/attestation as `not_performed`. This is not an AI model or real private inference.
- Phase 7 adds a provider-neutral settlement adapter interface and process-local simulated quote, approval, execution, status, and receipt lifecycle. Quotes are created from opaque server-issued offer references; browser data is not policy authority. The server revalidates expiry, destination, amount/budget, asset, recipient, and current policy immediately before generating the simulated receipt. Redacted audit events record the simulated lifecycle.
- Owner decision for the demo: preserve the 1,000 USDC threshold and 4,920 USDC Ember Compute offer. Its deterministic policy result remains `REVIEW REQUIRED` because it exceeds the threshold. Only this threshold-only review may be quoted; explicit human approval must be recorded before simulated execution. The policy label remains `review`. Blocked offers and other review outcomes, including a missing configured unit price, remain ineligible.
- The simulated receipt says `SIMULATED`, `moneyMoved: false`, and that no funds were transferred or signed. No settlement provider, supplier, wallet, key, chain, testnet, mainnet, transfer, real private inference, or attestation is used.
- No NEAR AI credential was available in the supplied saved-secret inventory or environment variables. The optional server-side NEAR AI Cloud gateway integration remains deferred; no provider SDK, gateway call, verification, or attestation was added or claimed.
- Raw buyer request text is not written to application logs or persisted. The inference cache stores only a request digest. Offer-run, quote, approval, receipt, nonce, and idempotency state are process-local and volatile; they reset on restart and are not shared between workers or serverless instances.
- `checkOfferBeforeExecution` remains a no-execution policy guard/test seam. The settlement simulator uses its own server-side current-policy recheck and process-local nonce state; neither is durable production settlement infrastructure.
- Phase 5 review evidence: all 32 tests passed; lint, typecheck, build, and local production-server smoke passed; policy outcomes and replay/conflict behavior were confirmed.
- Phase 6 evidence: all 34 tests passed; lint, typecheck, build, and local production-server smoke passed. A unique sensitive marker was absent from captured application logs and API response; health reported `private-ai-simulation`.
- Phase 7 verification (2026-10-23): `npm test` passed all 38 tests; `npm run lint`, `npm run typecheck`, and `npm run build` passed. A local production-server smoke test confirmed health phase `settlement-simulation`; threshold 1,000 USDC; offer results `blocked`, `blocked`, `review`; 4,920 USDC review offer; blocked quote rejection; explicit approval requirement; refusal to execute before approval; successful simulated status/receipt; and `moneyMoved: false`. The local server was stopped afterward.
- Phase 7 remains uncommitted/unpushed. No Vercel connection/change, deployment, publication, repository visibility change, provider call, supplier call, wallet, live/testnet route, or funds were used.

## Important scope and source notes

- The current owner instruction authorizes the Phase 7 local simulated settlement slice only. Preserve the 1,000 USDC threshold and 4,920 USDC offer. Keep Phase 7 uncommitted/unpushed; stop for owner review and do not start Phase 8. Do not call or integrate external providers, wallets, live/testnet routes, connect or modify Vercel, deploy, publish, or change repository visibility.
- Phase 4 was committed and pushed to `Adelekejr/Private-SSD`, branch `phase-1-foundation`, at `fb37b33fa6564bc7a1994c2628287c33dfad5a4c`; Phase 5 was subsequently committed and pushed at `c7d0d46c8ce7d810407eb50567fb9e622a86802f`; Phase 6 was committed and pushed at `dd44a99274b63ca73a73c302fcaedc402d01120f`.
- The original five source PDFs under `/home/ubuntu/upload/` were cross-checked against the Phase 5, Phase 6, and Phase 7 checklists. Phase 7 follows the simulation-first boundary and keeps external provider and testnet routes out of the current slice.
- `docs/agent-pack/05-AGENT-MEMORY.md` contains a historical claim about an existing PrivateSpend dashboard that conflicts with the verified repository baseline. Treat it as historical source context, not as current implementation evidence. Do not search InvoiceLens for reusable code or assume an earlier PrivateSpend implementation exists.
- Do not copy or import code from InvoiceLens. This repository is separate.

## Durable decisions and limitations

- The Phase 2 `ProcurementRepository` boundary supports local mandate and audit data. Mandates, audits, seeded fixtures, settlement simulation state, and all idempotency/nonces are process-local and volatile; they reset on restart and are not shared across workers or serverless instances. This is not durable production storage.
- Mandate validation is deterministic and shared between the browser form and server routes. It validates purpose, numeric ranges, asset format, reliability range, unique chains/recipients, approval threshold versus budget, and privacy-mode enum.
- Buyer parsing is deterministic regular-expression extraction, not an LLM. Parsed fields are human-reviewable suggestions only. Missing fields inherit saved mandate terms; invalid extraction falls back to saved constraints. Offers and policy decisions use the saved mandate, never unapproved parser suggestions.
- Supplier fixtures receive only a minimal structured mandate brief; no raw buyer prompt is forwarded. Every fixture response passes the same strict schema, including expiry and nonce metadata; unknown fields are rejected. Rejected text is not returned or logged.
- Policy reasons are computed deterministically on the server. Recipient matching is exact; destination matching is case-insensitive. A missing configured unit price is review-required and is not a threshold-only approval case. Threshold review applies when amount is strictly greater than the mandate threshold. A threshold-only review may advance in the simulator only after explicit human approval; it remains `review`. A blocked result or a review with any other reason cannot be quoted or approved.
- Before simulated receipt creation, the server checks quote/offer expiry, destination chain, amount and current budget, asset, approved recipient, and unchanged policy classification against the latest mandate. A receipt is evidence of a local simulation only; it is never on-chain and does not imply funds moved.
- The health endpoint reports infrastructure readiness and `settlement-simulation`; it does not authorize or execute procurement.
- The official hackathon rules should be re-read on 1 November 2026 and before submission.

## Next step

Stop after the Phase 7 local simulation slice for Adeleke's review. Do not commit, push, connect Vercel, deploy, publish, change repository visibility, or begin Phase 8 without separate explicit approval.
