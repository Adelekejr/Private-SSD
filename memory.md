# Project memory

## Current status

- Product: PrivateSpend Network, a confidential multi-agent procurement and settlement system for small businesses.
- Repository: `Adelekejr/Private-SSD`, a new private repository separate from InvoiceLens.
- Verified initial state: the GitHub repository cloned successfully and was empty (no commits or application files). Work is local on branch `phase-1-foundation`.
- Approved stage: Phase 1 foundation only. Do not implement procurement workflow features until Adeleke reviews the foundation and approves a later stage.
- Phase 1 is complete locally: repository skeleton, minimal app shell and health endpoint, required documents, names-only `.env.example`, exact package pins, lockfile, and baseline lint/type-check/build setup are in place.
- Verification passed: `npm ci --no-audit --no-fund`, `npm run lint`, `npm run typecheck`, and `npm run build`. A local production smoke test confirmed the foundation-only landing-page copy and `/api/health` JSON response. See `docs/agent-pack/04-TASKS.md` for evidence.
- External actions: no commit, push, repository visibility change, deployment, Vercel change, wallet action, or provider integration is authorized. The branch has no commits and remains local.

## Important source conflict

`docs/agent-pack/05-AGENT-MEMORY.md` records an existing PrivateSpend dashboard and simulated server boundary. That statement conflicts with the verified empty state of this new repository. Treat it as historical source context, not as code or a current implementation. Do not search InvoiceLens for reusable code or assume an earlier PrivateSpend implementation exists.

## Durable decisions

- The user-approved current stage takes precedence over the PDFs' suggested build sequence and generic agent loop.
- Phase 1 does not include mandates, supplier agents, policy evaluation, approvals, private inference, wallet/permission code, or settlement functionality.
- The starter route and `/api/health` endpoint are infrastructure placeholders only; they are not a product workflow.
- The foundation uses Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, ESLint 10.13.0 with the official Next.js plugin, and npm 11.17.0. Exact dependency pins are recorded in `package.json` and `package-lock.json`.
- Use deterministic behavior and clearly labeled simulation in future stages; no live provider or transaction claims without verified evidence.
- Do not commit, push, publish, deploy, alter visibility, or modify Vercel without a separate explicit user approval. This overrides the generic checkpoint-commit item in the supplied agent-memory PDF.
- The current official event rules have been checked at `https://nearhackathon.com/HACKATHON.md`. Re-read them on 1 November 2026 and again before submission.

## Next step

Stop for Adele's review. Propose Phase 2 (domain models, deterministic supplier seed data, persistence boundary, and state transitions) as the next stage, but do not start it until separately approved.
