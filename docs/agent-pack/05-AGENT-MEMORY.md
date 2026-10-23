# PrivateSpend Network — Agent Memory and Operating Rules

## 1. How every coding agent must begin

Before changing code, read these documents in order:

1. `README.md`.
2. `memory.md`.
3. `docs/agent-pack/01-PRD.md`.
4. `docs/agent-pack/02-ARCHITECTURE.md`.
5. `docs/agent-pack/03-DESIGN.md`.
6. `docs/agent-pack/04-TASKS.md`.
7. This file.

Then report the product purpose, completed work, next unchecked task, assumptions, and any conflict. Do not start by rewriting the project or replacing working code.

## 2. Source-of-truth priority

When documents conflict, use this priority:

1. Explicit current human instruction.
2. `01-PRD.md` for product scope.
3. `02-ARCHITECTURE.md` for technical boundaries.
4. `03-DESIGN.md` for visual and interaction decisions.
5. `04-TASKS.md` for implementation order.
6. `memory.md` for historical context.

If the conflict affects money, privacy, secrets, wallet permissions, or an irreversible action, stop and ask the human.

## 3. Required working loop

1. Select one next task from `04-TASKS.md`.
2. State the intended files and acceptance condition.
3. Implement the smallest coherent change.
4. Run focused checks.
5. Run the production build when the change affects integration.
6. Inspect the result and fix confirmed issues.
7. Update `04-TASKS.md` with evidence.
8. Update `memory.md` with durable decisions or blockers.
9. Commit a checkpoint with a meaningful message only after separate explicit human approval; otherwise keep the change local and report it.
10. Report changed files, checks, result, and next task.

Do not mark a task complete because code was written. Mark it complete only when the stated behavior was validated.

### Current human approval override

Phases 1–8 are committed and pushed to `Adelekejr/Private-SSD`, branch `phase-1-foundation`, through commit `1165ae854b62056cdf45e18d509d98a8c791719c`. Phase 9 validation is complete locally; its documentation changes remain uncommitted/unpushed. Stop before Phase 10 until separately approved. Preserve the 1,000 USDC threshold and 4,920 USDC offer. Only a threshold-only `REVIEW REQUIRED` result can proceed after explicit human approval; blocked and unrelated review results remain ineligible. No provider, supplier, wallet, live/testnet route, funds, Vercel connection/change, deployment, publication, or visibility change is authorized. This live scope supersedes older phase-only approval notes.

## 4. Permanent decisions

- The product is PrivateSpend Network, not a generic chatbot.
- The product demonstrates procurement, agent competition, policy, approval, settlement, and evidence.
- Backend correctness and security are more important than decorative frontend work.
- The AI proposes structured data; deterministic code decides policy.
- The default execution mode is simulated.
- No full-access key belongs to an agent or browser.
- No secrets are committed.
- No mainnet funds are used during development.
- The black-and-white technical UI direction from the reference image is optional, not mandatory. It must never hide the workflow or reduce readability.
- One complete honest integration is better than many shallow integrations.

## 5. Provider and cost policy

Build the default product with free tools, deterministic agents, testnet or simulated settlement, and free-tier hosting when practical. Live NEAR AI, Intents, or worker services are optional. Do not add paid dependencies or usage without the human’s explicit decision.

If a live provider is unavailable, keep the typed adapter and switch to a clearly labeled safe mock. Do not simulate a live result while labeling it live.

## 6. Security memory

Always defend against prompt injection in invoices and supplier offers. Always validate method, contract, amount, recipient, chain, expiry, nonce, and approval before execution. Chain-signature payloads must bind the target chain and use distinct derivation paths per network. Raw sensitive documents must not appear in public logs.

## 7. Progress log

### 7.1 Initial state (historical source note)

The source memory described the initial state as:

- Product concept: confidential multi-agent procurement and settlement.
- Existing foundation: PrivateSpend dashboard and safe simulated server boundary.
- Next major work: refactor from invoice approval to mandate, offer, policy, settlement, and audit workflows.
- Deployment target: request-driven hosting is acceptable for the demo; persistent workers are optional.
- Submission window: 1–14 November 2026 according to the current official rules; verify before build and submission.

### 7.2 Repository-state correction

The “existing PrivateSpend dashboard and safe simulated server boundary” statement above is historical source context and is **contradicted by the verified current repository baseline supplied for this task: a new, empty private repository, separate from InvoiceLens**. Treat the current repository as having no reusable PrivateSpend application implementation unless later verified by the human or by direct inspection.

Do not import, copy, or reuse InvoiceLens. Do not assume old PrivateSpend code exists. Preserve this note so future agents do not mistake the historical claim for current implementation evidence.

### 7.3 Phase 4 checkpoint (2026-10-23)

- Added deterministic buyer-request parsing to typed, non-binding constraint suggestions; missing or invalid values fall back to the saved mandate.
- Added three deterministic local supplier agents, strict response validation, visible evidence and unverified risk notes, and a prompt-injection fixture that is rejected without echoing its instruction.
- Offer results were ephemeral and `NOT EVALUATED` at the Phase 4 checkpoint; policy, approval, private inference, supplier integration, wallet, and settlement were absent at that point.
- `npm test` passed 17 tests; lint, type-check, production build, and local production-server smoke checks passed. The coordinator later committed and pushed Phase 4 as `fb37b33fa6564bc7a1994c2628287c33dfad5a4c`. No Vercel or deployment change occurred.

### 7.4 Phase 5 checkpoint (2026-10-23)

- Added deterministic server-side policy evaluation for budget, asset, unit price, recipient, chain, reliability, expiry, nonce replay, and approval threshold. Results distinguish `blocked`, `review`, and `pass`; policy reasons are separate from unverified supplier notes. Missing unit price under a configured maximum requires review, and amounts strictly above threshold require human approval.
- Added strict offer expiry/nonce schema, short-lived process-local offer-simulation idempotency, and `checkOfferBeforeExecution` as a no-execution server guard/test seam. The guard revalidates current mandate terms and a caller-provided consumed-nonce set; it does not execute or consume a nonce.
- All 32 tests, lint, typecheck, production build, and local production API smoke checks passed. Health reports `policy-security`; results were `blocked`, `blocked`, `review`; idempotent replay and `409` conflict behavior passed; prompt-injection content was not echoed.
- At the Phase 5 review checkpoint, Phase 5 remained local and uncommitted/unpushed; it was subsequently committed and pushed at `c7d0d46c8ce7d810407eb50567fb9e622a86802f`. No Vercel connection, deployment, publication, visibility change, external supplier call, wallet, approval action, settlement, or funds were used. Phase 6 required separate approval at that checkpoint.

### 7.5 Phase 6 checkpoint (2026-10-23)

- Added a provider-neutral typed inference adapter and a deterministic local simulated fallback using the existing buyer parser. The offer API returns explicit provenance: no provider was contacted and verification/attestation were not performed; the workspace displays those states and explains that this is rules-based processing, not a real model call.
- No NEAR AI credential was available in the supplied saved-secret inventory or environment. The optional server-side NEAR AI Cloud gateway was deferred; no provider SDK or external call was added.
- Raw buyer text is not written to application logs or persisted. The idempotency cache stores only the request digest. A test captures application console output and confirms a unique sensitive marker is absent from both logs and the API response; the production-server smoke check confirmed it was absent from server output too.
- All 34 tests passed; lint, typecheck, production build, and local production-server smoke checks passed. Health reports `private-ai-simulation`; the API reports simulated mode, `providerContacted: false`, and verification/attestation `not_performed`.
- Phase 6 remains local and uncommitted/unpushed for owner review. No Vercel connection, deployment, publication, visibility change, real provider call, wallet, settlement, or funds were used. Phase 7 requires separate approval.

### 7.6 Phase 7 checkpoint (2026-10-23)

- Added a provider-neutral settlement adapter interface and local process-memory simulator for quote, explicit human approval, simulated execution, status, and receipt. The UI/API identify the entire flow as `SIMULATED`; the receipt states `moneyMoved: false` and is not on-chain.
- Server-issued offer-run IDs bind quote requests to offers and policy results computed on the server. The existing 1,000 USDC threshold and 4,920 USDC Ember Compute offer are unchanged. Its policy stays `REVIEW REQUIRED`; only a threshold-only review may receive a quote and only after explicit human approval may it advance. Blocked offers and other review outcomes remain ineligible.
- The server rechecks expiry, amount/budget, asset, destination, recipient, and unchanged policy before simulated receipt creation. Audit summaries are redacted. Offer-run, quote, status, receipt, nonce, and idempotency state are process-local and volatile.
- All 38 tests passed; lint, typecheck, and production build passed. The local production-server smoke verified `settlement-simulation`, blocked/review outcomes, explicit approval, no pre-approval execution, final simulated status/receipt, and `moneyMoved: false`; the local server was stopped afterward.
- No provider, supplier, wallet, key, live/testnet route, funds, Vercel, deployment, publication, or visibility change was used. Phase 7 was subsequently committed and pushed by the coordinator at `6bcb427a9e1a8f69dac7a988944e1b214051f0d7`; Phase 8 frontend/design work is complete locally for owner review and remains uncommitted/unpushed; Phase 9 has not started.

### 7.7 Phase 8 checkpoint (2026-10-23)

- Refined the existing UI with the six-step workflow route, text-labeled workflow and request states, explicit loading/empty/error feedback, responsive layout, visible keyboard focus, reduced-motion support, and an app icon. Waiting stages without mounted content are labels, not dead links.
- Verified the unchanged 1,000 USDC threshold and 4,920 USDC review-required offer, explicit human approval, and simulation-only receipt with no money moved. Offer, quote, and audit state remains volatile and process-local; no persistence changes were made.
- All 38 tests, lint, typecheck, production build, and local production-browser smoke passed. Browser smoke covered the responsive widths, route targets, blocked/review policy states, an expiry/error response injected only in the browser, approval gating, receipt, keyboard focus, reduced motion, and redacted audit display.
- No provider, supplier, wallet, key, live/testnet route, funds, Vercel, deployment, publication, or visibility change was used. Phase 8 remains uncommitted/unpushed for owner review; Phase 9 remains unstarted.

### 7.8 Phase 9 checkpoint (2026-10-23)

- Clean install, all 38 tests, lint, typecheck, and the optimized production build passed. Local production API rehearsal confirmed two blocked offers cannot be quoted, only the 4,920 USDC threshold-only review may proceed after explicit approval, the review label remains unchanged, and the final receipt is simulated with `moneyMoved: false` and redacted audit evidence.
- Headless Chromium verified visible `SIMULATED`, `BLOCKED`, and `REVIEW REQUIRED` states at fresh 320px, 375px, and 1280px loads, with no horizontal overflow, runtime errors, or failed network requests. The synthetic sensitive marker did not appear in captured server output or the API response.
- No code fix was needed. No provider, wallet, live/testnet route, funds, Vercel, deployment, publication, commit, or push was used. Offer/settlement/audit/idempotency state remains volatile and process-local; Phase 10 remains unstarted and requires separate approval.

## 8. What not to do

- Do not add features because they sound impressive but are not demonstrable.
- Do not replace the policy engine with an LLM prompt.
- Do not add a token just to appear Web3.
- Do not declare live, private, attested, testnet, or settled states without evidence.
- Do not delete these documents after completion. They are the project’s durable context and handoff system.
- Do not commit, push, deploy, change Vercel, or change repository visibility without separate explicit human approval.
