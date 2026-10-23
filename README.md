# PrivateSpend Network

PrivateSpend Network is a constrained procurement workflow for small businesses. Its governing rule is: **agents can negotiate; deterministic constraints decide; a human approves; NEAR may settle an approved outcome.**

## Current state

The repository is at the **Phase 4 agent-offer workflow** stage. It includes mandate creation/editing, shared browser/server mandate validation, typed constraints, create/read/update API routes, and a redacted audit trail. The selected mandate also supports a deterministic buyer-request parser and three local supplier-offer fixtures. The buyer parser returns typed suggestions only; it cannot change the saved mandate. Each supplier response is validated against a strict schema, and a prompt-injection fixture is rejected before display. Offer comparison includes evidence and supplier-reported risk notes, which are explicitly unverified.

The offers are **SIMULATED** local fixtures. No supplier service, AI provider, wallet, NEAR account, testnet, mainnet, or funds are used. Policy decisions are not implemented: all new offers say `NOT EVALUATED`, and there is no approval or settlement action. The buyer request and generated comparison are not persisted. The Phase 2 seed still contains illustrative offer records; their static pass/block labels are not computed policy decisions.

Mandate data uses the Phase 2 in-memory repository. It is process-local and volatile: records and idempotency keys reset on restart and are not shared between workers or serverless instances. It is suitable for local development and tests, not durable production storage.

## Run locally

Requirements: Node.js 20.19+, 22.13+, or 24+ and npm 11.17.0. This Node range matches the pinned ESLint 10 toolchain.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` to create or edit a mandate, inspect its audit events, parse a buyer request, and compare the three simulated offers. `GET http://localhost:3000/api/health` reports service readiness and `phase: agent-offer-workflow`; it is an infrastructure check, not a procurement decision.

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
- `server/persistence/` — in-memory repository, seed fixtures, and the persistence replacement boundary.
- `tests/` — Node test-runner coverage for transitions, validation, agent responses, offer API behavior, idempotency, and audit redaction.
- `docs/agent-pack/` — product, architecture, design, execution checklist, and agent-memory documents.
- `AGENTS.md` and `memory.md` — repository operating instructions and durable project state.

## Environment variables

`.env.example` contains blank variable names only. No environment variables are required for the current local workflow. Never put values or secrets in `.env.example`; use a local ignored `.env.local` only if a separately approved integration later requires it.

## Hackathon delivery notes

The currently published [NEAR HACKATHON rules](https://nearhackathon.com/HACKATHON.md) state that development runs from 1 November 2026 00:00 UTC through 14 November 2026 23:59 UTC, and the repository must be public by the end of that window for judges to access it. The rules must be re-read on 1 November and before submission because they may change. This repository remains private for now; changing visibility, publishing, pushing, or submitting requires Adeleke's separate explicit approval. The rules also require the human to publish the demo post and confirm the exact submission payload before the team submits once.

## Status

Phase 4 is implemented locally and awaits Adeleke's review. Phase 5 and later remain out of scope until separately approved. No Phase 4 commit or push, deployment, Vercel change, or repository-visibility change has been made. See `docs/agent-pack/04-TASKS.md` for evidence-backed phase status and `memory.md` for durable decisions.
