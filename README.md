# PrivateSpend Network

PrivateSpend Network is a small-business procurement workflow designed to keep proposal-making separate from spending authority: **agents propose; deterministic server-side rules decide; a human retains approval authority.** The current repository demonstrates that workflow locally with fixtures and a settlement simulator. It does not make a real payment or connect to NEAR.

## Current state

The local workspace covers a mandate, three deterministic supplier fixtures, server-evaluated policy outcomes, an explicit simulated-approval gate, a simulated receipt, and a redacted audit view. The default demo keeps a **5,000 USDC budget**, a **1,000 USDC approval threshold**, and the **4,920 USDC Ember Compute offer**. Aster Compute (5,180 USDC) is blocked by the budget and unit-price limits; Northstar Compute (4,800 USDC) is blocked because its recipient is not approved; Ember is `REVIEW REQUIRED` because its amount is above the approval threshold. Human approval does not change that policy result.

Buyer-request parsing is deterministic local code, not an AI model or private-inference provider. Supplier offers are local fixtures, not live suppliers. Settlement is a process-local simulation. The receipt says `SIMULATED`, `moneyMoved: false`, and that no funds were transferred, reserved, or signed; it is not on-chain. Supplier risk notes are unverified.

Mandates, audit events, offer runs, quotes, approvals, receipts, nonces, and idempotency records are volatile process-local data. They reset when the server process restarts and are not shared across workers or serverless instances. This is not production persistence or a multi-user service.

## Run locally

Requirements: Node.js `^20.19.0`, `^22.13.0`, or `>=24`, and npm `11.17.0` (the version pinned by `package.json`). No environment variables, provider credentials, wallet, or external service are needed for this demo.

```sh
npm ci
npm run dev
```

Open <http://localhost:3000>. A fresh server process loads the seeded demo mandate; you do not need to create a mandate for the judge flow. The app is intended to run locally with sample data. Do not expose it to a public network or enter real procurement secrets.

## Reproduce the judge flow: do X → see Y

1. **Open the fresh local workspace.** See the seeded “Cloud compute capacity for one month” mandate, the 5,000 USDC budget, the `near-testnet` destination label, the approved demo recipient, and the 1,000 USDC approval threshold. The header says `NEAR NOT CONNECTED` and `SIMULATED FLOW`.
2. **Click `Parse request + evaluate offers`.** See the buyer proposal marked `NOT APPLIED`, provenance `SIMULATED_PRIVATE_AI`, `External provider contacted: NO`, and verification/attestation as `NOT PERFORMED`. These are deterministic local rules, not a model call. The saved mandate remains the policy authority.
3. **Inspect the offer comparison and rejected responses.** See Aster Compute at 5,180 USDC marked `BLOCKED` for exceeding the budget and unit-price limit; Northstar Compute at 4,800 USDC marked `BLOCKED` for its unapproved recipient; and Ember Compute at 4,920 USDC marked `REVIEW REQUIRED` because it exceeds the 1,000 USDC threshold. The prompt-injection fixture is rejected by schema validation. Supplier risk notes are labeled unverified.
4. **On Ember, click `Create SIMULATED quote`.** See a short-lived quote with policy `REVIEW REQUIRED` and human approval `PENDING`. The blocked offers have no quote action; the server rejects attempts to quote them.
5. **Check `I reviewed the displayed terms and approve this SIMULATED outcome only.` and click `Approve simulated quote`.** See approval recorded while the policy result remains `REVIEW REQUIRED`. This is a human action in the local demo, not a wallet approval or signature.
6. **Click `Run simulated execution`.** See a `SIMULATED RECEIPT · NOT ON-CHAIN`, `No money moved`, `Funds moved: NO`, and `Wallet / chain used: NO`. The Evidence panel shows redacted audit events for the local simulation.

For a clean repeat, stop the dev server with `Ctrl+C`, run `npm run dev` again, then refresh the page. Process-local demo state resets when the server restarts. The health endpoint at <http://localhost:3000/api/health> checks service readiness and reports `phase: settlement-simulation`; it is not a procurement decision or proof of a chain connection.

A timed local recording plan is in [`docs/demo-run-of-show.md`](docs/demo-run-of-show.md). It is a script only; no demo video has been recorded or published as part of this documentation work.

## Architecture

The app uses Next.js App Router, React, and TypeScript. `src/app/` contains the page and API routes; `src/components/mandate-workspace.tsx` renders the workflow. `src/domain/` contains the typed mandate, offer, policy, settlement, and audit models plus validation, parsing, and transition rules. The buyer parser and supplier fixtures are deterministic local implementations. Server-side routes validate inputs; mandates and audit events live in an in-memory repository, while offer-run and simulated-settlement state live in separate process-local stores.

The offer API treats parsed buyer terms as reviewable suggestions, not mandate changes. Strict supplier-response validation feeds a deterministic server policy engine that checks amount/budget, asset, unit price, recipient allowlist, destination, reliability, expiry, nonce, and threshold. The settlement adapter accepts server-issued offer-run references, requires explicit human approval for the threshold-only review, and rechecks the current mandate and quote before creating a simulated receipt. API and domain tests cover those gates. The simulated inference and settlement adapters are boundaries for possible future implementations; they are not live integrations.

## Threat model and safety limits

**The demo treats buyer text, supplier responses, and browser-submitted values as untrusted.** Relevant risks include a supplier instruction attempting to override policy, malformed or unexpected offer fields, a client trying to substitute an amount or recipient, replayed requests, and stale or expired quotes. Implemented controls include strict server-side schema validation, server-computed policy decisions, server-issued offer-run references, idempotency and nonce checks within the process, an explicit human approval step, expiry checks, and current-policy revalidation immediately before the simulated receipt. A prompt-injection fixture is rejected without echoing its instruction. Raw buyer free text is not persisted or written to application logs; audit summaries are redacted.

These controls are limited to this local prototype. The app has no user authentication, authorization, or multi-tenant isolation; no durable database or tamper-proof audit store; and no cross-process coordination for in-memory idempotency or nonce state. It does not establish that supplier claims are true, protect a compromised host, or provide production-grade confidentiality, private computation, or transaction security. There is no independent security audit or certification claim. Use only the provided sample data; do not enter real sensitive procurement information, secrets, wallet keys, or funds, and do not expose this development server publicly.

## NEAR relationship

NEAR is a future integration target, not an implemented connection in this repository. The seeded mandate contains the literal destination string `near-testnet`; current policy only compares that value with the mandate's allowed-destination list. The app does not use a NEAR SDK, account, RPC, contract call, wallet, signer, NEAR AI Cloud, NEAR Intents/1Click, testnet, mainnet, or chain transaction. No funds are reserved, transferred, or signed. Do not describe the current demo as NEAR-integrated, private inference, attested execution, or on-chain settlement.

## Validation evidence

Phase 9 validation was completed against the application and recorded in the repository. A clean install on Node.js 24.19.0/npm 11.17.0 passed; `npm test` passed all 38 tests; lint, typecheck, and the optimized Next.js 16.4.3 production build passed. A fresh local production-server rehearsal confirmed the three policy results, blocked-offer quote rejection, the required explicit approval, a simulated receipt with `moneyMoved: false` and no transaction hash, and redacted audit events. Headless Chromium verified `SIMULATED`, `BLOCKED`, and `REVIEW REQUIRED` at 320px, 375px, and 1280px without horizontal overflow, browser runtime errors, or failed network requests. The synthetic sensitive-input marker was absent from captured server output and the API response. These checks used no provider, supplier, wallet, chain, testnet, mainnet, funds, Vercel, or deployment. See [`docs/agent-pack/04-TASKS.md`](docs/agent-pack/04-TASKS.md) and the tests under `tests/` for details.

Useful validation commands:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Hackathon delivery notes

The currently linked [official rules](https://nearhackathon.com/HACKATHON.md) state that the event runs from 1 November 2026 00:00 UTC through 14 November 2026 23:59 UTC, that the repository must be public before the deadline, and that the human publishes the demo post on X with the demo video or screenshots. They also specify one submission per team and no signup before final submission. Re-read the live rules on 1 November and before submission because they may change.

The repository remains private while building. No repository visibility change, public post, Vercel connection or deployment, submission data collection, submission JSON, or hackathon submission is authorized by this local documentation work. Each public or submission action requires the owner's later review and explicit authorization. Do not invent personal details or payout information.

## Project status

Phases 1–9 are committed and pushed to `Adelekejr/Private-SSD`, branch `phase-1-foundation`; Phase 9 documentation is at commit `797feaf8073081d9cc8a2094ba47d8d7d813aec5`. The approved Phase 10 slice is local documentation only: this README, the local demo run-of-show, and progress notes. Those changes are intentionally uncommitted and unpushed pending owner review. No application code was changed. Stop before any commit/push, visibility change, publication, Vercel action, NEAR/testnet/mainnet integration, submission-data collection, JSON generation, or submission.
