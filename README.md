# PrivateSpend Network

PrivateSpend Network is a constrained procurement workflow for small businesses. Its governing rule is: **agents can negotiate; deterministic constraints decide; a human approves; NEAR may settle an approved outcome.**

## Current state

The repository now includes the **Phase 5 policy and security** work on top of the Phase 4 agent-offer workflow. It supports mandate creation/editing, shared browser/server mandate validation, typed constraints, create/read/update API routes, and a redacted audit trail. A deterministic buyer parser returns non-binding suggestions, and three local supplier fixtures pass strict schema validation. A separate server-side policy engine checks offers against the saved mandate, showing blocked, review-required, and pass outcomes with reasons; buyer suggestions never become policy authority.

Offers are **SIMULATED** local fixtures. No supplier service, AI provider, wallet, NEAR account, testnet, mainnet, or funds are used. Policy outcomes are volatile API responses and are not persisted. There is no human approval action or settlement action. The Phase 2 seed still contains illustrative offer records; their static pass/block labels are not computed policy decisions. Supplier risk notes remain unverified.

Mandate data uses the Phase 2 in-memory repository. It is process-local and volatile: records and idempotency keys reset on restart and are not shared between workers or serverless instances. Offer-simulation idempotency is also process-local, expires after 15 minutes, and is not durable production storage. The buyer request is not persisted or logged; the cache stores only its digest alongside a short-lived response.

## Run locally

Requirements: Node.js 20.19+, 22.13+, or 24+ and npm 11.17.0. This Node range matches the pinned ESLint 10 toolchain.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` to create or edit a mandate, inspect its audit events, parse a buyer request, and compare the three simulated offers. `GET http://localhost:3000/api/health` reports service readiness and `phase: policy-security`; it is an infrastructure check, not a procurement decision.

Useful checks:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Project map

- `src/app/` — Next.js App Router workspace, health endpoint, mandate API routes, and simulated-offer endpoint.
- `src/domain/` — typed procurement models, mandate validation, deterministic buyer parsing, and strict offer-response validation.
- `src/components/mandate-workspace.tsx` — mandate creation/editing, buyer parsing, simulated comparison, and audit UI.
- `server/agents/` — deterministic local supplier agents and rejected prompt-injection fixture.
- `server/policy/` — deterministic policy evaluation, a no-execution pre-execution recheck guard, and volatile idempotency support.
- `server/persistence/` — in-memory repository, seed fixtures, and the persistence replacement boundary.
- `tests/` — Node test-runner coverage for transitions, validation, agent responses, offer API behavior, idempotency, and audit redaction.
- `docs/agent-pack/` — product, architecture, design, execution checklist, and agent-memory documents.
- `AGENTS.md` and `memory.md` — repository operating instructions and durable project state.

## Environment variables

`.env.example` contains blank variable names only. No environment variables are required for the current local workflow. Never put values or secrets in `.env.example`; use a local ignored `.env.local` only if a separately approved integration later requires it.

## Hackathon delivery notes

The currently published [NEAR HACKATHON rules](https://nearhackathon.com/HACKATHON.md) state that development runs from 1 November 2026 00:00 UTC through 14 November 2026 23:59 UTC, and the repository must be public by the end of that window for judges to access it. The rules must be re-read on 1 November and before submission because they may change. This repository remains private for now; changing visibility, publishing, pushing, or submitting requires Adeleke's separate explicit approval. The rules also require the human to publish the demo post and confirm the exact submission payload before the team submits once.

## Status

Phase 4 was committed and pushed by the coordinator to `Adelekejr/Private-SSD`, branch `phase-1-foundation`, at `fb37b33fa6564bc7a1994c2628287c33dfad5a4c`. Phase 5 policy/security is implemented locally and remains uncommitted/unpushed for review. No Vercel connection or change, deployment, publication, or visibility change has been made. See `docs/agent-pack/04-TASKS.md` for evidence-backed status and `memory.md` for durable decisions.
