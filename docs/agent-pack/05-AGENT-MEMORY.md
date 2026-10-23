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

Phase 4 was committed and pushed by the coordinator to `phase-1-foundation` at `fb37b33fa6564bc7a1994c2628287c33dfad5a4c`. The current human instruction authorizes **Phase 5 local implementation/review only**. Keep Phase 5 uncommitted and unpushed; do not connect or modify Vercel, deploy, publish, or change repository visibility. Phase 6 and later require separate approval. This live scope supersedes older phase-only approval notes.

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
- Phase 5 remains local and uncommitted/unpushed. No Vercel connection, deployment, publication, visibility change, external supplier call, wallet, approval action, settlement, or funds were used. Phase 6 requires separate approval.

## 8. What not to do

- Do not add features because they sound impressive but are not demonstrable.
- Do not replace the policy engine with an LLM prompt.
- Do not add a token just to appear Web3.
- Do not declare live, private, attested, testnet, or settled states without evidence.
- Do not delete these documents after completion. They are the project’s durable context and handoff system.
- Do not commit, push, deploy, change Vercel, or change repository visibility without separate explicit human approval.
