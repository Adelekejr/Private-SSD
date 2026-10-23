# PrivateSpend Network — Product Requirements

## 1. Product

PrivateSpend Network is a confidential multi-agent procurement and settlement system for small businesses. A business creates a constrained procurement mandate; supplier agents respond with offers; a private or simulated AI layer normalizes sensitive information; a deterministic policy engine blocks unsafe offers; a human approves the chosen outcome; and NEAR provides the account, permission, intent, and cross-chain settlement rails.

> **Product statement:** Agents can negotiate. Constraints decide. NEAR settles the outcome.

## 2. Problem

Small businesses increasingly need software, data, compute, and services from multiple vendors and chains. Existing automation either requires manual comparison and payment or gives AI too much authority over money. PrivateSpend Network makes the economic workflow agentic while keeping policy, privacy, approval, and evidence explicit.

## 3. Primary user

A small-business operator or finance lead who wants to procure a service under a budget and risk policy without manually comparing every offer or handing an AI unrestricted wallet access.

## 4. Core workflow

1. The user creates a procurement mandate.
2. The buyer agent converts the request into typed constraints.
3. Supplier agents submit structured offers.
4. Private or simulated AI extracts and normalizes sensitive offer data.
5. The policy engine evaluates every offer deterministically.
6. The user compares eligible offers and evidence.
7. The user approves or rejects the selected offer.
8. The settlement adapter requests a NEAR Intents quote or runs a clearly labeled simulation.
9. The system records the result in an audit trail.

## 5. MVP scope

The MVP must demonstrate one complete procurement case from mandate to settlement receipt. It must include:

- Workspace and treasury context.
- A procurement mandate form.
- Budget, asset, destination, recipient, price, reliability, and approval constraints.
- Three deterministic supplier agents.
- Typed offer comparison.
- Policy pass, review, and block results.
- At least one prompt-injection or malformed-offer rejection.
- A human approval gate.
- Simulated settlement by default.
- An optional NEAR testnet or 1Click/Intents adapter behind server-side configuration.
- An audit timeline with redacted data or hashes.
- Clear `SIMULATED`, `TESTNET`, and `LIVE` labels.

## 6. Demo scenario

A company needs 5,000 USDC of cloud compute for one month. The mandate has a maximum unit price, minimum reliability, allowed settlement assets, allowed destination chains, an approved supplier list, and a human approval threshold.

Three supplier agents respond:

- One exceeds the price constraint.
- One uses an unapproved recipient or contains a prompt-injection instruction.
- One offers 4,920 USDC, above the 1,000 USDC approval threshold, and requires explicit human approval.

The user approves the threshold-review offer. The system produces a simulated receipt and shows why every decision happened; the simulation does not move funds.

## 7. Out of scope for the first submission

- Fully autonomous mainnet payments.
- Custody of user funds by the AI.
- Arbitrary model-generated contract calls.
- A general-purpose chat assistant.
- A token launch or speculative trading feature.
- Many shallow live integrations.
- A mobile app.
- A large multi-tenant SaaS product.

## 8. Success criteria

A judge can understand the product in 30 seconds and complete the demo in two minutes. Unsafe offers are visibly blocked. The winning offer requires explicit approval. The server rechecks policy before execution. The settlement mode is honest. The audit trail explains the outcome. A clean install and production build succeed.

## 9. Track fit

- **Primary:** Autonomous Business (`business`).
- **Supporting tracks only if visibly demonstrated:** AI Swarms (`swarms`), AI Security & Defense (`security`), Privacy & Private AI (`privacy`), Agent Economy (`agents`), and Real-World Money (`realworld`).

## 10. Rules and timing

The current official schedule says the development window is **1 November 2026 00:00 UTC through 14 November 2026 23:59 UTC**. Re-read the live `HACKATHON.md` on 1 November and before submission because rules may change. The repository must be public before the deadline, the human must publish the demo post, and the team must submit exactly once after confirming the final payload.

## 11. Non-negotiable safety

- No full-access private keys.
- No secrets in browser code or Git.
- No mainnet deployment or spending without explicit human action.
- No claim of private inference, TEE attestation, or cross-chain settlement unless it was actually performed and verified.
- Simulation is the default fallback and must be labeled.

## 12. Current human-scope rule

Phases 1–8 are committed and pushed to `Adelekejr/Private-SSD`, branch `phase-1-foundation`, through commit `1165ae854b62056cdf45e18d509d98a8c791719c`. Phase 9 validation was authorized and completed locally; its documentation updates remain uncommitted and unpushed. Stop before Phase 10 until separately approved. Preserve the 1,000 USDC threshold and 4,920 USDC demo offer. Only a threshold-only `REVIEW REQUIRED` outcome needs explicit human approval before simulation; blocked and unrelated review outcomes remain ineligible. No external provider, wallet, live/testnet route, funds, Vercel change, deployment, publication, or repository visibility change is authorized. The current owner instruction controls over older phase notes.

The current page supports mandate creation/editing, a redacted audit view, deterministic simulated inference, three schema-validated local supplier proposals, deterministic server-side policy evaluation, and a local simulated settlement quote → explicit approval → status/receipt lifecycle. Phase 8 refines the six-step route, explicit state labels, responsive behavior, and accessibility without changing server policy or settlement semantics. A review-required offer retains its policy label through human approval; the simulated receipt explicitly states that no money moved. No external provider, supplier, wallet, NEAR account, testnet, mainnet, real transfer, private inference, or attestation is used.
