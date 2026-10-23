# PrivateSpend Network

PrivateSpend Network is a constrained procurement workflow for small businesses. Its governing rule is: **agents can negotiate; deterministic constraints decide; a human approves; NEAR may settle an approved outcome.**

## Current state

The repository is at the **Phase 3 mandate workflow** stage. The app now provides a mandate creation/editing screen, browser and server validation, typed constraints, create/read/update API routes, and a redacted audit trail for creation and field changes. The existing sample mandate remains available as a deterministic fixture.

Mandate data uses the Phase 2 in-memory repository. It is process-local and volatile: records and idempotency keys reset on restart and are not shared between workers or serverless instances. It is suitable for local development and tests, not durable production storage. The three sample offers remain fixed fixture records; their labels are not produced by a policy engine.

Privacy mode is recorded as a mandate preference only. No AI provider, attestation, supplier service, wallet, NEAR account, testnet, mainnet, or funds are used. Supplier agents, offer evaluation, policy decisions, approval actions, private inference, and settlement execution remain unimplemented. No live or private execution is claimed.

## Run locally

Requirements: Node.js 20.19+, 22.13+, or 24+ and npm 11.17.0. This Node range matches the pinned ESLint 10 toolchain.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` to create or edit a mandate and inspect its audit events. `GET http://localhost:3000/api/health` reports service readiness and `phase: mandate-workflow`; it is an infrastructure check, not a procurement decision.

Useful checks:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Project map

- `src/app/` — Next.js App Router workspace, health endpoint, and mandate API routes.
- `src/domain/` — typed procurement models and shared mandate validation/constraint construction.
- `src/components/mandate-workspace.tsx` — mandate creation, editing, and audit UI.
- `server/persistence/` — in-memory repository, deterministic fixtures, and the persistence replacement boundary.
- `server/agents/`, `server/policy/`, `server/settlement/`, `server/privacy/`, `server/audit/` — boundaries reserved for later approved stages.
- `tests/` — Node test-runner coverage for domain transitions, mandate validation, API writes, idempotency, and audit behavior.
- `docs/agent-pack/` — product, architecture, design, execution checklist, and agent-memory documents.
- `AGENTS.md` and `memory.md` — repository operating instructions and durable project state.

## Environment variables

`.env.example` contains blank variable names only. No environment variables are required for the current local mandate workflow. Never put values or secrets in `.env.example`; use a local ignored `.env.local` only if a separately approved integration later requires it.

## Hackathon delivery notes

The currently published [NEAR HACKATHON rules](https://nearhackathon.com/HACKATHON.md) state that development runs from 1 November 2026 00:00 UTC through 14 November 2026 23:59 UTC, and the repository must be public by the end of that window for judges to access it. The rules must be re-read on 1 November and before submission because they may change. This repository remains private for now; changing visibility, publishing, pushing, or submitting requires Adeleke's separate explicit approval. The rules also require the human to publish the demo post and confirm the exact submission payload before the team submits once.

## Status

See `docs/agent-pack/04-TASKS.md` for evidence-backed phase status and `memory.md` for current decisions. Phase 4 and later work, as well as commit/push/deploy/Vercel changes, require separate owner approval.
