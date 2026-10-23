# PrivateSpend Network

PrivateSpend Network is a planned confidential, multi-agent procurement and settlement system for small businesses. Its intended rule is: **agents can negotiate; deterministic constraints decide; NEAR may settle an approved outcome.**

## Current state

This repository is at the **Phase 1 foundation** stage. It contains a minimal Next.js application shell, a health endpoint, project instructions, and the product/design/architecture/task documents. The procurement workflow is **not implemented yet**: there are no mandates, supplier agents, offer evaluation, policy decisions, approval flow, private inference, wallet permissions, or settlement execution in this foundation. The later product-workflow stages require Adeleke's review and separate approval.

No provider is called and no NEAR account, key, testnet, mainnet, or funds are used here. No private or attested inference is claimed. Any later simulated flow must be labeled as simulated.

## Run locally

Requirements: Node.js 20.19+, 22.13+, or 24+ and npm 11.17.0. This Node range matches the pinned ESLint 10 toolchain.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` to see the foundation-only landing page. The infrastructure health check is `GET http://localhost:3000/api/health`; it reports service readiness only and does not exercise a product workflow.

Useful checks:

```sh
npm run lint
npm run typecheck
npm run build
```

## Project map

- `src/app/` — Next.js App Router shell and the minimal health route.
- `src/components/`, `src/domain/`, `src/styles/` — reserved frontend/domain structure.
- `server/agents/`, `server/policy/`, `server/settlement/`, `server/privacy/`, `server/audit/` — server-only boundaries reserved for later approved stages.
- `docs/agent-pack/` — the source-of-truth product, architecture, design, execution, and agent-memory documents.
- `AGENTS.md` and `memory.md` — repository operating instructions and durable project state.

## Environment variables

`.env.example` contains blank variable names only. There are no environment variables required to run this foundation, and its future integration names are provisional until a provider is selected and its official documentation is checked. Never put values or secrets in `.env.example`; use a local ignored `.env.local` only when a later approved integration requires it.

## Hackathon delivery notes

The currently published [NEAR HACKATHON rules](https://nearhackathon.com/HACKATHON.md) state that development runs from 1 November 2026 00:00 UTC through 14 November 2026 23:59 UTC, and the repository must be public by the end of that window for judges to access it. The rules must be re-read on 1 November and before submission because they may change. This repository remains private for now; changing visibility, publishing, pushing, or submitting requires Adeleke's separate explicit approval. The rules also require the human to publish the demo post and confirm the exact submission payload before the team submits once.

## Status

See `docs/agent-pack/04-TASKS.md` for evidence-backed phase status and `memory.md` for current decisions and the next approved step.
