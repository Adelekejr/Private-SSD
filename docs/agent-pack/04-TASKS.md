# PrivateSpend Network — Execution Tasks

## 1. How to use this file

Work from top to bottom. Select one unchecked task or one small group of dependent tasks. Implement it, run the relevant checks, update this file, and record important decisions in `memory.md`. Do not mark a task complete without evidence.

**Phase 1 historical scope:** The repository skeleton, documentation, names-only `.env.example`, package setup and lockfile, minimal placeholder app shell, and clean-install/build verification were approved and completed in Phase 1. The current approved scope is stated below.

**Current scope rule:** Phase 1 is complete and committed at `d8129aac8e4fe035690346e5d52fc51d748626f2`. Adeleke explicitly approved Phase 2, limited to the checklist below. Phase 3 and later remain unapproved. Do not commit, push, publish, deploy, change repository visibility, or modify Vercel without separate explicit approval; this overrides the source memory's generic checkpoint-commit step.

Mark tasks complete only when evidence is recorded below. Later phases remain unchecked until separately approved.

## 2. Phase 0 — preparation

- [ ] Re-read the current official `HACKATHON.md` on 1 November 2026.
- [ ] Confirm the final track IDs only after the working prototype demonstrates them.
- [ ] Confirm repository strategy and deployment target.
- [ ] Confirm no secrets, private keys, or mainnet actions are needed for the default demo.

## 3. Phase 1 — foundation

- [x] Create the repository structure from `02-ARCHITECTURE.md`.
- [x] Add a reproducible package manager lockfile (`package-lock.json`, pinned package versions).
- [x] Add `AGENTS.md`, `README.md`, `memory.md`, and all five agent-pack documents.
- [x] Add `.env.example` with names only and no secret values; verified all six entries are blank.
- [x] A separate page route manifest is not required: Next.js App Router routes are file-system based.
- [x] Make a clean install and production build pass.

### Phase 1 evidence (2026-10-23)

- `npm ci --no-audit --no-fund` completed from the project lockfile.
- `npm run lint` passed with ESLint 10.13.0, the official Next.js plugin, and TypeScript ESLint rules.
- `npm run typecheck` passed.
- `npm run build` passed with Next.js 16.4.3; the build reported `/` as static and `/api/health` as on-demand server-rendered.
- A local production-server smoke test confirmed the home page states that the product workflow is not implemented and `GET /api/health` returns `status: ok`, `service: privatespend-network`, `phase: foundation`. The local server was stopped afterward.
- Phase 1 was committed and pushed by the coordinator to `phase-1-foundation` as `d8129aac8e4fe035690346e5d52fc51d748626f2`. Phase 2 changes remain local and uncommitted; no Phase 2 deployment, Vercel change, or visibility change occurred.

## 4. Phase 2 — domain and persistence

- [x] Add typed mandate, constraint, offer, settlement, and audit-event models.
- [x] Add deterministic seed data for the three supplier offers.
- [x] Add local persistence or an in-memory adapter with a documented replacement boundary.
- [x] Add status transitions and reject invalid transitions.

### Phase 2 evidence (2026-10-23)

- Added TypeScript models in `src/domain/models.ts`, including a discriminated `Constraint` union, mandate/settlement statuses, offer policy labels, and redacted audit-event shape.
- Added deterministic demo data in `server/persistence/demo-seed.ts`: one cloud-compute mandate, three fixed offer fixtures (two labeled blocked and one pass), a `simulated`/`not_started` settlement record, and a redacted seed event. These policy labels are fixture data, not computed decisions.
- Added the async-shaped `ProcurementRepository` contract and `InMemoryProcurementRepository`; the documented replacement boundary and process-local/volatile limitation are in `server/persistence/README.md`.
- Added mandate and settlement transition graphs. Invalid transitions throw `InvalidStatusTransitionError` without mutating state; valid transitions append redacted audit events.
- `npm test` passed all 6 focused tests. `npm run lint`, `npm run typecheck`, and `npm run build` passed. The tests use Node's built-in runner and the existing TypeScript compiler; no test dependency was added.
- A local production-server smoke test confirmed the landing-page Phase 2/fixture copy and `GET /api/health` returns `status: ok`, `service: privatespend-network`, `phase: domain-persistence`; the server was stopped afterward.
- The landing page remains a non-interactive placeholder, and no product API, supplier agent, policy engine, AI/provider, wallet, or settlement execution was added. Phase 2 changes remain uncommitted and unpushed.

## 5. Phase 3 — mandate workflow

- [ ] Build mandate creation and editing.
- [ ] Support budget, asset, unit price, reliability, allowed chains, recipients, approval threshold, and privacy mode.
- [ ] Validate inputs on both browser and server.
- [ ] Record mandate creation and changes in the audit trail.

## 6. Phase 4 — agent offer workflow

- [ ] Implement buyer-agent parsing into typed constraints.
- [ ] Implement three deterministic supplier agents.
- [ ] Validate every agent response against a schema.
- [ ] Show offer comparison with evidence and risk reasons.
- [ ] Add a prompt-injection or malformed-offer fixture and show it being rejected.

## 7. Phase 5 — policy and security

- [ ] Implement deterministic budget and unit-price checks.
- [ ] Implement approved-recipient and destination-chain checks.
- [ ] Implement reliability and expiry checks.
- [ ] Implement approval threshold logic.
- [ ] Implement nonce and idempotency checks.
- [ ] Recheck all policy rules on the server before execution.
- [ ] Add tests for every blocked rule and one fully valid offer.

## 8. Phase 6 — private or simulated AI

- [ ] Add a provider-neutral private inference adapter interface.
- [ ] Add deterministic simulated-private fallback.
- [ ] If credentials are available, add the NEAR AI Cloud gateway integration server-side.
- [ ] Display verification/attestation status honestly.
- [ ] Ensure raw sensitive input does not enter public logs.

## 9. Phase 7 — settlement

- [ ] Add a settlement adapter interface.
- [ ] Add simulated quote, approval, execution, status, and receipt lifecycle.
- [ ] If a reliable route is available, add a NEAR Intents/1Click quote and status path.
- [ ] Validate quote expiry, destination, amount, asset, and recipient.
- [ ] Add testnet path only after the simulated path is stable.
- [ ] Never expose settlement keys in browser code.

## 10. Phase 8 — frontend and design

- [ ] Implement the route `MANDATE → OFFERS → POLICY → APPROVAL → SETTLEMENT → EVIDENCE`.
- [ ] Apply `03-DESIGN.md` without hiding policy and audit information.
- [ ] Add empty, loading, blocked, expired, and error states.
- [ ] Add responsive mobile layout.
- [ ] Add keyboard focus and reduced-motion behavior.
- [ ] Confirm every state includes a text label.

## 11. Phase 9 — validation

- [ ] Run unit tests for policy, schema validation, and status transitions.
- [ ] Run the end-to-end judge flow from clean state.
- [ ] Verify unsafe offers cannot reach execution.
- [ ] Verify approval is required above the threshold.
- [ ] Verify simulated mode is visible everywhere it matters.
- [ ] Run a clean install and production build.
- [ ] Inspect server logs for secrets or raw sensitive input.

## 12. Phase 10 — submission readiness

- [ ] Write `README.md` as do X → see Y testing instructions.
- [ ] Include threat model, architecture, limitations, and NEAR integration explanation.
- [ ] Record a 90–120 second demo.
- [ ] Ask the human to publish the repository.
- [ ] Ask the human to publish the X demo post.
- [ ] Collect the human’s project name, lead name, email, team size, tracks, mainnet payout address, repository URL, demo URL, and final description.
- [ ] Print the exact submission JSON for human confirmation.
- [ ] Submit exactly once after confirmation.

## 13. Definition of done

The product is done when a new judge can run the clean setup, create a mandate, see supplier agents compete, observe unsafe offers blocked, approve the winning offer, see a simulated or testnet settlement lifecycle, and inspect the evidence trail. The repository is public, the demo is public, and the README explains how to reproduce the result.
