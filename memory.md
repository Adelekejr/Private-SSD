# Project memory

## Current status

- Product: PrivateSpend Network, a confidential multi-agent procurement and settlement system for small businesses. Its rule is: agents may negotiate, deterministic constraints decide, and a human retains approval authority before any real settlement.
- Repository: `Adelekejr/Private-SSD`, a private repository separate from InvoiceLens.
- Phase 1 foundation is committed and pushed on branch `phase-1-foundation` at `d8129aac8e4fe035690346e5d52fc51d748626f2`.
- Adeleke explicitly approved starting Phase 2. Phase 2 is implemented locally on the current branch; those changes remain uncommitted and unpushed.
- Phase 2 adds typed mandate, constraint, offer, settlement, and audit models; deterministic demo seed data; an in-memory repository behind an async-shaped interface; and guarded mandate/settlement transitions that emit redacted audit events.
- Verification passed on 2026-10-23: `npm test` (6 tests), `npm run lint`, `npm run typecheck`, and `npm run build` with Next.js 16.4.3. A local production-server smoke test confirmed the updated landing-page status copy and `/api/health` reports `phase: domain-persistence`; the server was stopped afterward.
- No supplier was contacted, no policy engine or private inference ran, no wallet/provider was connected, and no settlement was submitted. No Vercel setting or deployment was changed.

## Important source conflict

`docs/agent-pack/05-AGENT-MEMORY.md` records an existing PrivateSpend dashboard and simulated server boundary. That statement conflicts with the verified empty state of this new repository. Treat it as historical source context, not as code or a current implementation. Do not search InvoiceLens for reusable code or assume an earlier PrivateSpend implementation exists.

Older project documentation also described Phase 1 as the only approved scope. Adeleke's explicit current approval supersedes that scope restriction for Phase 2 only; it does not authorize Phase 3 or any commit, push, publication, deployment, or Vercel change for Phase 2.

## Durable decisions

- Phase 2 remains domain and persistence only. Do not add mandate UI, supplier agents, a policy engine, real AI, wallet integration, or settlement workflow in this stage.
- Offer `policyResult` and `riskReasons` values in the demo seed are fixed illustrative fixture data; they are not computed policy decisions.
- The repository boundary is `server/persistence/repository.ts`. The current adapter is process-local and volatile: its state resets on restart and is not shared between workers or serverless instances. It is suitable for local domain work and tests, not durable production use.
- The settlement seed is labeled `simulated` and `not_started`; it does not perform or claim a settlement.
- The health endpoint reports infrastructure readiness and the informational phase `domain-persistence`; it does not exercise a procurement workflow.
- Use deterministic behavior and clearly label simulations. No provider or transaction claims without verified evidence.
- Do not commit or push Phase 2, publish, deploy, alter repository visibility, or modify Vercel without a new separate explicit user approval.
- The current official event rules were previously checked at `https://nearhackathon.com/HACKATHON.md`. Re-read them on 1 November 2026 and again before submission.

## Next step

Stop for Adele's review of Phase 2. The next proposed stage is Phase 3 (mandate creation/editing and input validation), but do not start it until separately approved.
