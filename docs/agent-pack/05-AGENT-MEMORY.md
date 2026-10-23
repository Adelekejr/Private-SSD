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

The current human instruction authorizes **Phase 4 local implementation only**, building on completed Phases 1–3. Stop for review after Phase 4; Phase 5 and later remain unapproved. **Do not commit or push Phase 4, deploy, change Vercel, or change repository visibility without separate explicit human approval.** This live scope supersedes older phase-only approval notes.

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
- Offer results are ephemeral and explicitly `NOT EVALUATED`; there is no policy engine, approval, private inference, supplier integration, wallet, or settlement in this phase.
- `npm test` passed 17 tests; lint, type-check, production build, and local production-server smoke checks passed. Phase 4 remains local and uncommitted/unpushed pending Adeleke's review. No Vercel or deployment change occurred. Phase 5 requires separate approval.

## 8. What not to do

- Do not add features because they sound impressive but are not demonstrable.
- Do not replace the policy engine with an LLM prompt.
- Do not add a token just to appear Web3.
- Do not declare live, private, attested, testnet, or settled states without evidence.
- Do not delete these documents after completion. They are the project’s durable context and handoff system.
- Do not commit, push, deploy, change Vercel, or change repository visibility without separate explicit human approval.
