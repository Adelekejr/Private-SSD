# PrivateSpend Network

PrivateSpend Network is a constrained procurement workflow for small businesses. Its governing rule is: **agents can negotiate; deterministic constraints decide; a human approves; NEAR may settle an approved outcome.**

## Current state

The repository includes the Phase 5 deterministic policy/security work, Phase 6 simulated private-inference boundary, Phase 7 local simulated settlement lifecycle, Phase 8 frontend/design refinements, and Phase 9 validation evidence. The six-stage route reports current workflow status and links to stage panels when available; empty, loading, blocked, expired, and error states have explicit text labels. The interface retains the mandate form, local offer comparison, deterministic policy evidence, explicit human approval, simulated quote/receipt, and redacted audit trail.

The demo remains at a **1,000 USDC approval threshold** and retains the **4,920 USDC Ember Compute offer**. The server-computed policy result stays `REVIEW REQUIRED` because the offer exceeds the threshold. A threshold-only review may receive a quote, but it advances only after a separate explicit human approval; approval does not rewrite the policy result. `BLOCKED` offers and other review outcomes, including a missing configured unit price, cannot enter the settlement lifecycle. The server revalidates quote expiry, destination, amount, asset, and recipient immediately before simulated receipt creation.

All offers, offer-run snapshots, quotes, statuses, and receipts are volatile process-local demo data. No settlement provider, supplier service, wallet, key, chain, testnet, mainnet, funds, or real transfer is used. The receipt explicitly states that no money moved and is not on-chain. This is not real private inference, attested execution, or a live settlement. Raw buyer request text is not written to application logs or persisted; the inference fallback remains deterministic local code, not an AI model or private-provider call. Supplier risk notes remain unverified.

## Run locally

Requirements: Node.js 20.19+, 22.13+, or 24+ and npm 11.17.0. This Node range matches the pinned ESLint 10 toolchain.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` to create or edit a mandate, compare simulated offers, review policy evidence, and complete the simulated quote → explicit approval → receipt flow. `GET http://localhost:3000/api/health` reports service readiness and `phase: settlement-simulation`; it is an infrastructure check, not a procurement decision.

Useful checks:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Phase 9 validation evidence (2026-10-23)

- A clean `npm ci --no-audit --no-fund` completed with Node.js 24.19.0 and npm 11.17.0. `npm test` passed all 38 tests; lint, typecheck, and the optimized Next.js 16.4.3 production build passed.
- A fresh local production server completed the seeded judge flow at the 1,000 USDC threshold: Aster Compute (5,180 USDC) and Northstar Compute (4,800 USDC) remained `BLOCKED`; both quote requests returned HTTP 422. Ember Compute (4,920 USDC) remained threshold-only `REVIEW`, could not execute before explicit human approval (HTTP 403), and yielded a `SIMULATED` receipt only after approval. The receipt reported `moneyMoved: false` and contained no transaction hash; audit events remained redacted.
- Headless Chromium triggered the offer comparison and displayed `SIMULATED`, `BLOCKED`, and `REVIEW REQUIRED` at fresh 320px, 375px, and 1280px page loads, with no horizontal overflow, browser runtime errors, or failed network requests. A synthetic sensitive-input marker did not appear in captured server output; existing console-capture tests also verify it is absent from application logs and the API response.
- Offer runs, quotes, approvals, receipts, audit entries, nonce state, and idempotency state remain volatile process-local demo data. They reset on restart and are not shared across workers or serverless instances. No provider, supplier, wallet, key, chain, testnet, mainnet, funds, Vercel, or deployment was used.

## Project map

- `src/app/` — Next.js workspace, health endpoint, mandate APIs, offer simulation, and simulated settlement quote/approval/execute/status APIs.
- `src/domain/` — procurement, policy, quote, receipt, transition, validation, and audit models.
- `src/components/mandate-workspace.tsx` — mandate creation/editing, simulated offer comparison, policy evidence, explicit simulated approval, receipt, and audit UI.
- `server/agents/` — deterministic local supplier agents, rejected prompt-injection fixture, and short-lived process-local offer-run snapshots.
- `server/policy/` — deterministic policy evaluation, server-side pre-execution recheck, and volatile idempotency support.
- `server/settlement/` — provider-neutral settlement adapter interface, local simulated quote/approval/execution/status/receipt lifecycle, API validation helpers, and redacted audit recording.
- `server/privacy/` — provider-neutral inference boundary and deterministic simulated fallback; no provider SDK or gateway is configured.
- `server/persistence/` — in-memory repository, seed fixtures, and persistence replacement boundary.
- `tests/` — Node test-runner coverage for policy, settlement lifecycle, API gates, expiry, revalidation, idempotency, and audit redaction.
- `docs/agent-pack/` — product, architecture, design, execution checklist, and agent-memory documents.
- `AGENTS.md` and `memory.md` — repository operating instructions and durable project state.

## Environment variables

`.env.example` contains blank variable names only. No environment variables are required for the current local workflow. Never put values or secrets in `.env.example`; use a local ignored `.env.local` only if a separately approved integration later requires it.

## Hackathon delivery notes

The currently published [NEAR HACKATHON rules](https://nearhackathon.com/HACKATHON.md) state that development runs from 1 November 2026 00:00 UTC through 14 November 2026 23:59 UTC, and the repository must be public by the end of that window for judges to access it. The rules must be re-read on 1 November and before submission because they may change. This repository remains private for now; changing visibility, publishing, pushing, or submitting requires Adeleke's separate explicit approval. The rules also require the human to publish the demo post and confirm the exact submission payload before the team submits once.

## Status

Phases 1–8 are committed and pushed to `Adelekejr/Private-SSD`, branch `phase-1-foundation`, through commit `1165ae854b62056cdf45e18d509d98a8c791719c`. Phase 9 validation is complete locally; its documentation updates remain uncommitted and unpushed. Phase 10 has not started and requires separate approval. No provider, supplier, wallet, live/testnet route, funds, Vercel connection/change, deployment, publication, or visibility change has been made. See `docs/agent-pack/04-TASKS.md` for Phase 9 evidence and `memory.md` for durable decisions.
