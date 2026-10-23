# PrivateSpend Network — Execution Tasks

## 1. How to use this file

Work from top to bottom. Select one unchecked task or one small group of dependent tasks. Implement it, run the relevant checks, update this file, and record important decisions in `memory.md`. Do not mark a task complete without evidence.

**Phase 1 historical scope:** The repository skeleton, documentation, names-only `.env.example`, package setup and lockfile, minimal placeholder app shell, and clean-install/build verification were approved and completed in Phase 1. The current approved scope is stated below.

**Current scope rule (2026-10-23):** Phases 1–7 are committed and pushed to `Adelekejr/Private-SSD`, branch `phase-1-foundation`, at `6bcb427a9e1a8f69dac7a988944e1b214051f0d7`. Phase 8 frontend/design work is complete locally for owner review. Preserve the 1,000 USDC threshold and 4,920 USDC offer; only a threshold-only `REVIEW REQUIRED` offer may proceed after explicit human approval. Keep Phase 8 uncommitted and unpushed, stop here, and do not begin Phase 9. Do not call or integrate providers, suppliers, wallets, live/testnet routes, use funds, connect or modify Vercel, deploy, publish, or change repository visibility.

Mark tasks complete only when evidence is recorded below. Later phases remain unchecked until separately approved.

## 2. Phase 0 — preparation

- [ ] Re-read the current official `HACKATHON.md` on 1 November 2026.
- [ ] Confirm the final track IDs only after the working prototype demonstrates them.
- [ ] Confirm repository strategy and deployment target.
- [ ] Confirm no secrets, private keys, or mainnet actions are needed for the default demo.

## 3. Phase 1 — foundation

- [x] Create the repository structure from `02-ARCHITECTURE.md`.
- [x] Add a reproducible package manager lockfile (`package-lock.json`, pinned package versions).
- [x] Add `AGENTS.md`, `README.md`, `memory.md`, and all five agent-pack documents.
- [x] Add `.env.example` with names only and no secret values; verified all six entries are blank.
- [x] A separate page route manifest is not required: Next.js App Router routes are file-system based.
- [x] Make a clean install and production build pass.

### Phase 1 evidence (2026-10-23)

- `npm ci --no-audit --no-fund` completed from the project lockfile.
- `npm run lint` passed with ESLint 10.13.0, the official Next.js plugin, and TypeScript ESLint rules.
- `npm run typecheck` passed.
- `npm run build` passed with Next.js 16.4.3; the build reported `/` as static and `/api/health` as on-demand server-rendered.
- A local production-server smoke test confirmed the home page states that the product workflow is not implemented and `GET /api/health` returns `status: ok`, `service: privatespend-network`, `phase: foundation`. The local server was stopped afterward.
- Phase 1 was committed and pushed by the coordinator to `phase-1-foundation` as `d8129aac8e4fe035690346e5d52fc51d748626f2`. Phase 2 was still local at this historical checkpoint; it was subsequently committed, and Phases 1–2 are now included through `4e770d0f3f1b188eaf1dc037201d29588ff990fa`. No deployment, Vercel change, or visibility change occurred.

## 4. Phase 2 — domain and persistence

- [x] Add typed mandate, constraint, offer, settlement, and audit-event models.
- [x] Add deterministic seed data for the three supplier offers.
- [x] Add local persistence or an in-memory adapter with a documented replacement boundary.
- [x] Add status transitions and reject invalid transitions.

### Phase 2 evidence (2026-10-23)

- Added TypeScript models in `src/domain/models.ts`, including a discriminated `Constraint` union, mandate/settlement statuses, offer policy labels, and redacted audit-event shape.
- Added deterministic demo data in `server/persistence/demo-seed.ts`: one cloud-compute mandate, three fixed offer fixtures (two labeled blocked and one pass), a `simulated`/`not_started` settlement record, and a redacted seed event. These policy labels are fixture data, not computed decisions.
- Added the async-shaped `ProcurementRepository` contract and `InMemoryProcurementRepository`; the documented replacement boundary and process-local/volatile limitation are in `server/persistence/README.md`.
- Added mandate and settlement transition graphs. Invalid transitions throw `InvalidStatusTransitionError` without mutating state; valid transitions append redacted audit events.
- `npm test` passed all 6 focused tests. `npm run lint`, `npm run typecheck`, and `npm run build` passed. The tests use Node's built-in runner and the existing TypeScript compiler; no test dependency was added.
- A local production-server smoke test confirmed the landing-page Phase 2/fixture copy and `GET /api/health` returns `status: ok`, `service: privatespend-network`, `phase: domain-persistence`; the server was stopped afterward.
- At the Phase 2 checkpoint, the landing page was still a non-interactive placeholder, and no product API, supplier agent, policy engine, AI/provider, wallet, or settlement execution had been added. The Phase 2 implementation was subsequently committed at `4e770d0f3f1b188eaf1dc037201d29588ff990fa`; no settlement was executed.

## 5. Phase 3 — mandate workflow

- [x] Build mandate creation and editing.
- [x] Support budget, asset, unit price, reliability, allowed chains, recipients, approval threshold, and privacy mode.
- [x] Validate inputs on both browser and server.
- [x] Record mandate creation and changes in the audit trail.

### Phase 3 evidence (2026-10-23)

- Cross-checked the original five source PDFs in `/home/ubuntu/upload/` against the agent-pack Markdown. The Phase 3 scope matches the source task list: mandate creation/editing, required constraint fields, browser/server validation, and audit recording. The architecture and design sources support the repository boundary, explicit privacy labeling, and accessible sparse UI.
- Added `src/components/mandate-workspace.tsx` and responsive styles in `src/app/globals.css`. The page lists the seeded mandate, supports creating and editing, displays all requested terms and the redacted audit timeline, and marks later workflow stages as out of scope.
- Added `src/domain/mandate-validation.ts`, used in both the browser and server. It validates purpose, asset symbol, positive budget and optional unit price, reliability in the 0–1 range, unique allowed chains and recipients, approval threshold not exceeding budget, and the privacy-mode enum. Constraint records are rebuilt from saved terms.
- Added `GET`/`POST /api/mandates` and `GET`/`PUT /api/mandates/:id`. Write routes require idempotency keys and repeat validation server-side. The in-memory repository records human create/update events; update summaries contain changed field names only and omit field values.
- `npm test` passed all 11 tests, including route validation, idempotent replay, mandate edits, constraint updates, and audit redaction. `npm run lint`, `npm run typecheck`, and `npm run build` passed.
- A production-server smoke test confirmed the rendered Phase 3 page, `/api/health` phase `mandate-workflow`, invalid POST rejection, create, same-key replay without duplication, update, and redacted audit entries. The local server was stopped afterward.
- The adapter remains volatile and process-local; mandate data and idempotency state reset on restart. Privacy mode is a stored preference only. No supplier agents, policy evaluation, AI provider, attestation, wallet, settlement, external services, or funds were used. No commit, push, deployment, or Vercel change occurred.

## 6. Phase 4 — agent offer workflow

- [x] Implement buyer-agent parsing into typed constraints.
- [x] Implement three deterministic supplier agents.
- [x] Validate every agent response against a schema.
- [x] Show offer comparison with evidence and risk reasons.
- [x] Add a prompt-injection or malformed-offer fixture and show it being rejected.

### Phase 4 evidence (2026-10-23)

- Added a deterministic buyer-request parser that extracts explicit purpose, budget, asset, unit-price, reliability, destination, recipient, and approval-threshold values into typed constraints. It returns suggestions only; invalid/missing fields fall back to the saved mandate and no mandate is updated.
- Added three local deterministic supplier fixtures and `POST /api/mandates/:id/offers/simulate`. Each response passes a strict runtime schema. The server supplies the final `not_evaluated` status; no policy decision is delegated to a supplier agent.
- Added a malformed prompt-injection fixture with an unexpected instruction field. Strict validation rejects it and the UI shows a generic rejection reason without returning or logging the untrusted instruction. Offer comparison shows evidence and clearly labels supplier risk notes as unverified.
- No external supplier, AI, or NEAR services are called. The request and generated offers are not persisted. Policy enforcement, human approval, private inference, wallets, and settlement remain out of scope for Phase 4.
- `npm test` passed all 17 tests. `npm run lint`, `npm run typecheck`, and `npm run build` passed. A local production-server smoke test confirmed the page, health phase `agent-offer-workflow`, three simulated offers, rejection without echoing the injection text, and unchanged saved mandate state. No public preview or browser automation was run.
- Phase 4 was committed and pushed by the coordinator at `fb37b33fa6564bc7a1994c2628287c33dfad5a4c` on `phase-1-foundation`. No Vercel, deployment, visibility, or external supplier change occurred.

## 7. Phase 5 — policy and security

- [x] Implement deterministic budget and unit-price checks.
- [x] Implement approved-recipient and destination-chain checks.
- [x] Implement reliability and expiry checks.
- [x] Implement approval threshold logic.
- [x] Implement nonce and idempotency checks.
- [x] Add a server-side pre-execution recheck guard/test seam; no execution occurs in this phase.
- [x] Add tests for every blocked rule and one fully valid offer.

### Phase 5 evidence (2026-10-23)

- Cross-checked the original five source PDFs in `/home/ubuntu/upload/` against the Phase 5 checklist. Added `server/policy/policy-engine.ts` as a deterministic policy layer separate from buyer parsing and supplier fixture generation. It evaluates budget, asset, unit price, exact approved-recipient membership, case-insensitive allowed-chain membership, minimum reliability, expiry, and nonce replay context against the saved mandate.
- Hard violations return `blocked`; a missing configured unit price or an amount strictly above the human-approval threshold returns `review`; `pass` requires all configured checks to succeed below the threshold. Computed policy reasons are separate from supplier-reported risk notes. The UI labels threshold cases as `REVIEW REQUIRED` and explicitly says there is no approval action.
- Supplier response schema now requires ISO expiry and nonce metadata. Local fixtures use a 15-minute offer expiry and distinct request-scoped nonces. `POST /api/mandates/:id/offers/simulate` requires an idempotency key, replays identical requests, and returns `409` if a key is reused with a changed request. The short-lived cache is process-local, limited to 500 entries, and stores the request digest rather than buyer text.
- `checkOfferBeforeExecution` is a server-side guard/test seam: it strictly validates the untrusted candidate and re-evaluates current saved terms plus a caller-provided consumed-nonce set. It does not execute, persist, or consume anything; durable atomic nonce protection must be supplied by a future execution adapter.
- `npm test` passed all 32 tests, covering every block rule, a fully valid offer, missing-price review, threshold approval, nonce replay, idempotency replay/conflict, and recheck after mandate changes. `npm run lint`, `npm run typecheck`, and `npm run build` passed.
- A local production-server smoke test confirmed `GET /api/health` reports `policy-security`; the simulated offer results are `blocked`, `blocked`, and `review`; exact retries replay unchanged offers; changed-payload key reuse returns `409`; and the prompt-injection text is not echoed. The local server was stopped afterward.
- At the Phase 5 review checkpoint, the work was local and uncommitted/unpushed; it was subsequently committed and pushed at `c7d0d46c8ce7d810407eb50567fb9e622a86802f`. Offers remain volatile and are not persisted. No supplier service, private AI, wallet, NEAR account, testnet, mainnet, approval action, settlement execution, or funds were involved. No Vercel connection/change, deployment, publication, or visibility change occurred.

## 8. Phase 6 — private or simulated AI

- [x] Add a provider-neutral private inference adapter interface.
- [x] Add deterministic simulated-private fallback.
- [x] Check whether credentials are available; add the NEAR AI Cloud gateway server-side only when a credential is present. (No credential was available; gateway integration is deferred.)
- [x] Display verification/attestation status honestly.
- [x] Ensure raw sensitive input does not enter public logs.

### Phase 6 evidence (2026-10-23)

- Cross-checked the original five source PDFs in `/home/ubuntu/upload/` against the Phase 6 scope and safety boundaries. Added `server/privacy/inference-adapter.ts` as a provider-neutral typed interface and `server/privacy/simulated-private-adapter.ts` as the deterministic local implementation using the existing buyer parser.
- The offer API now uses the adapter and returns explicit provenance: `SIMULATED_PRIVATE_AI`, deterministic local parser, `providerContacted: false`, and verification/attestation `not_performed`. The UI displays these values and explains that the fallback is rules-based, not a model or private-provider call. The health endpoint reports `private-ai-simulation`.
- No NEAR AI credential was available in the supplied saved-secret inventory or environment variables. No provider SDK, gateway integration, provider call, verification, or attestation was added or claimed; the conditional live integration remains deferred.
- The route writes no request text to application logs, returns a generic processing error instead of exception text, and the existing idempotency store retains only a digest of the buyer request. Tests capture console output and verify a unique sensitive marker is absent from both logs and the API response; the local production-server smoke request confirmed the same marker was absent from server output.
- `npm test` passed all 34 tests, including deterministic fallback/provenance and sensitive-text log/response checks. `npm run lint`, `npm run typecheck`, and `npm run build` passed. A local production-server smoke check confirmed health phase `private-ai-simulation`, Phase 6 privacy copy, a successful simulated offer response, no provider contact, and verification/attestation `not_performed`; the server was stopped afterward.
- Phase 6 was committed and pushed by the coordinator to `phase-1-foundation` at `dd44a99274b63ca73a73c302fcaedc402d01120f`. No Vercel connection/change, deployment, publication, repository visibility change, external provider call, wallet, settlement, or funds were used in Phase 6.

## 9. Phase 7 — settlement

- [x] Add a settlement adapter interface.
- [x] Add simulated quote, approval, execution, status, and receipt lifecycle.
- [ ] If a reliable route is available, add a NEAR Intents/1Click quote and status path. (Deferred; no provider calls or integration in this owner-approved slice.)
- [x] Validate quote expiry, destination, amount, asset, and recipient.
- [ ] Add testnet path only after the simulated path is stable. (Not in scope; no live or testnet activity.)
- [x] Never expose settlement keys in browser code. (No settlement key or provider credential was added.)

### Phase 7 evidence (2026-10-23)

- Added a provider-neutral settlement adapter interface and a separate process-local simulator. The API exposes simulated quote creation, explicit human approval, simulated execution, status refresh, and a receipt that is marked `SIMULATED`, `moneyMoved: false`, and not on-chain. All endpoint payloads and UI controls are explicitly simulation-only.
- The server accepts an opaque offer-run ID created with server-computed offers; browser-supplied amounts, recipients, or policy results are not settlement authority. Quote eligibility is limited to current `PASS` outcomes or the single threshold-only `REVIEW REQUIRED` outcome. The seeded threshold remains 1,000 USDC and Ember Compute remains 4,920 USDC. That offer's policy label stays `REVIEW` before and after approval; execution is refused until an explicit human approval is recorded. Blocked offers and other reviews, including a missing configured unit price, are rejected.
- The server revalidates quote and offer expiry, destination chain, amount/budget, asset, recipient allowlist, and unchanged policy immediately before creating a simulated receipt. Quote/status/approval records and nonce/idempotency state are process-local and volatile; audit entries are redacted and omit raw recipient/amount data.
- `npm test` passed all 38 tests, including threshold-review approval, blocked and unrelated-review rejection, explicit API approval, no pre-approval execution, quote expiry, changed mandate amount/asset/destination/recipient, simulated receipt honesty, and audit events. `npm run lint`, `npm run typecheck`, and `npm run build` passed.
- A local production-server smoke test confirmed health phase `settlement-simulation`, 1,000 USDC threshold, outcomes `blocked`/`blocked`/`review`, 4,920 USDC REVIEW offer, blocked quote rejection (`422`), unconfirmed approval rejection (`400`), pre-approval execution rejection (`403`), successful explicit approval and simulated status, and receipt `moneyMoved: false`. The local server was stopped after the smoke check.
- No external provider, supplier, wallet, key, live route, testnet, mainnet, funds, Vercel change, deployment, publication, or repository visibility change was used. No provider/testnet path is implemented. Phase 7 was subsequently committed and pushed by the coordinator at `6bcb427a9e1a8f69dac7a988944e1b214051f0d7`; Phase 8 is complete locally for owner review and remains uncommitted/unpushed.

## 10. Phase 8 — frontend and design

- [x] Implement the route `MANDATE → OFFERS → POLICY → APPROVAL → SETTLEMENT → EVIDENCE`.
- [x] Apply `03-DESIGN.md` without hiding policy and audit information.
- [x] Add empty, loading, blocked, expired, and error states.
- [x] Add responsive mobile layout.
- [x] Add keyboard focus and reduced-motion behavior.
- [x] Confirm every state includes a text label.

### Phase 8 evidence (2026-10-23)

- Refined the existing mandate workspace instead of replacing it. The route `MANDATE → OFFERS → POLICY → APPROVAL → SETTLEMENT → EVIDENCE` reports explicit text state labels; links resolve only while their target panels are mounted, and unavailable future steps remain visibly `WAITING` without dead links.
- Applied the supplied design system with a compact route rail, clear loading/empty/error feedback, retained policy and redacted audit evidence, and explicit labels for blocked, review-required, expired, approved, simulated, and completed outcomes. Added a simple app icon that matches the existing workspace mark.
- Kept the 1,000 USDC approval threshold and 4,920 USDC Ember Compute offer unchanged. The offer remains `REVIEW REQUIRED`; approval is an explicit human checkbox/action and does not rewrite policy. The simulated receipt says no money moved.
- Responsive/accessibility smoke checks passed at 375px and 320px with no horizontal overflow; keyboard focus was visible with a 3px outline; `prefers-reduced-motion` disabled transition and smooth-scroll motion.
- `npm test` passed all 38 tests; `npm run lint`, `npm run typecheck`, and `npm run build` passed. The local production health endpoint returned `settlement-simulation`; the app and generated icon responded successfully.
- Production-browser smoke passed for the empty offers panel, delayed loading state, three local offers (two blocked, one threshold review), policy label, quote expiry, unconfirmed approval gate, explicit approval, simulated receipt, redacted audit evidence, API-error text label, all rendered route targets, mobile widths, keyboard focus, and reduced motion. Expiry and the 503 error were browser-only injected responses; they did not alter the local settlement service. The one observed 503 network/console warning was the intentional error-state test.
- Settlement/offer/audit/idempotency state remains volatile and process-local, not production-durable; Phase 8 did not change persistence or server policy. No provider, supplier, wallet, key, live/testnet route, funds, Vercel connection/change, deployment, publication, or repository visibility change was used. Phase 9 remains unstarted; Phase 8 remains uncommitted/unpushed for owner review.

## 11. Phase 9 — validation

- [ ] Run unit tests for policy, schema validation, and status transitions.
- [ ] Run the end-to-end judge flow from clean state.
- [ ] Verify unsafe offers cannot reach execution.
- [ ] Verify approval is required above the threshold.
- [ ] Verify simulated mode is visible everywhere it matters.
- [ ] Run a clean install and production build.
- [ ] Inspect server logs for secrets or raw sensitive input.

## 12. Phase 10 — submission readiness

- [ ] Write `README.md` as do X → see Y testing instructions.
- [ ] Include threat model, architecture, limitations, and NEAR integration explanation.
- [ ] Record a 90–120 second demo.
- [ ] Ask the human to publish the repository.
- [ ] Ask the human to publish the X demo post.
- [ ] Collect the human’s project name, lead name, email, team size, tracks, mainnet payout address, repository URL, demo URL, and final description.
- [ ] Print the exact submission JSON for human confirmation.
- [ ] Submit exactly once after confirmation.

## 13. Definition of done

The product is done when a new judge can run the clean setup, create a mandate, see supplier agents compete, observe unsafe offers blocked, approve the winning offer, see a simulated or testnet settlement lifecycle, and inspect the evidence trail. The repository is public, the demo is public, and the README explains how to reproduce the result.
