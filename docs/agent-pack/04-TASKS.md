# PrivateSpend Network — Execution Tasks

## 1. How to use this file

Work from top to bottom. Select one unchecked task or one small group of dependent tasks. Implement it, run the relevant checks, update this file, and record important decisions in `memory.md`. Do not mark a task complete without evidence.

**Current Phase 1 scope rule:** The user approved the repository skeleton, documentation, names-only `.env.example`, package setup and lockfile, minimal placeholder app shell, and clean-install/build verification. Product workflow features remain out of scope until review and separate approval. No commit, push, deploy, Vercel change, or repository visibility change may occur without separate explicit human approval. This rule overrides the source memory’s generic checkpoint-commit step.

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
- The current branch remains local and has no commits; nothing was pushed, deployed, or made public.

## 4. Phase 2 — domain and persistence

- [ ] Add typed mandate, constraint, offer, settlement, and audit-event models.
- [ ] Add deterministic seed data for the three supplier offers.
- [ ] Add local persistence or an in-memory adapter with a documented replacement boundary.
- [ ] Add status transitions and reject invalid transitions.

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
