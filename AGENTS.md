# Agent instructions

## Start here

Before making a change, read these files in order:

1. `README.md`
2. `memory.md`
3. `docs/agent-pack/01-PRD.md`
4. `docs/agent-pack/02-ARCHITECTURE.md`
5. `docs/agent-pack/03-DESIGN.md`
6. `docs/agent-pack/04-TASKS.md`
7. `docs/agent-pack/05-AGENT-MEMORY.md`

Then state the product purpose, completed work, next unchecked task, assumptions, and any conflict. Do not rewrite the project or replace working code as a first step.

## Working rules

- Treat the current human instruction as higher priority than the durable project documents. Work only on the explicitly approved stage; ask before beginning any later product-workflow phase.
- For each task, identify intended files and acceptance checks, make the smallest coherent change, run relevant checks, record evidence in `docs/agent-pack/04-TASKS.md`, and update durable decisions in `memory.md`.
- Do not mark work complete without verification. Be explicit about what is implemented, simulated, or absent.
- Phases 1–9 are committed and pushed to `Adelekejr/Private-SSD`, branch `phase-1-foundation`; Phase 9 documentation is at `797feaf8073081d9cc8a2094ba47d8d7d813aec5`. The current approval is limited to a local Phase 10 documentation slice: improve `README.md`, write a local 90–120 second demo run-of-show, and update the checklist and `memory.md` with verified progress. Do not change application code or commit/push this Phase 10 work without separate approval. Stop for owner review after the local documentation changes. No repository-visibility change, publication, X post, submission-data collection, submission JSON, submission, Vercel connection/deployment, provider/wallet connection, live/testnet/mainnet integration, or use of funds is authorized. Preserve the 1,000 USDC threshold and 4,920 USDC demo offer.
- Do not copy or import code from InvoiceLens. This repository is a separate, newly created project.

## Product and safety boundaries

- PrivateSpend Network is a constrained procurement workflow, not a generic chatbot.
- Language models may propose structured data; deterministic server-side policy must decide eligibility and execution.
- The default settlement mode is simulated. Never present a simulation as private inference, attested execution, testnet activity, live activity, or a completed settlement.
- No full-access private key may be placed in an agent or browser. Keep secrets out of source, logs, Git, and client bundles.
- Do not spend funds, sign transactions, deploy to mainnet, or perform irreversible external actions without explicit human approval.
- Keep sensitive procurement text and supplier documents out of public logs.
- Verify current official provider documentation before adding a real NEAR AI, NEAR Intents/1Click, wallet, persistence, or deployment integration.
