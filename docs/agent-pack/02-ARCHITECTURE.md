# PrivateSpend Network — Architecture

## 1. Architectural principle

The language model may propose structured data. It may not be the final authority for policy or money movement. Every path to execution passes through deterministic server-side validation and an explicit approval gate.

```text
User mandate
    → buyer agent
    → supplier offers
    → schema validation
    → private/simulated extraction
    → deterministic policy and risk engine
    → human approval
    → NEAR permission boundary
    → Intents or simulated settlement
    → audit evidence
```

## 2. Recommended stack

- TypeScript end to end.
- React or Next.js frontend.
- Node.js server API.
- NEAR JavaScript SDK for accounts and contract calls.
- 1Click REST API or TypeScript SDK for Intents when configured.
- Zod or JSON Schema for every agent message.
- SQLite for deterministic local-demo persistence; upgrade to Postgres only if deployment needs it.
- Vitest for policy and risk tests.
- Playwright for the single end-to-end demo path.

The application must work without paid services through deterministic agents and simulated settlement.

### Phase 1 package decisions

The foundation uses Next.js 16.4.3 with the App Router, React 19.3.1, TypeScript 5.9.3, Node.js 20.19+, 22.13+, or 24+, and npm 11.17.0 with an exact `package-lock.json`. Linting uses ESLint 10.13.0, the official `@next/eslint-plugin-next` directly, and `typescript-eslint` 8.72.0. This follows the Next.js direct-plugin guidance and avoids the current React lint-plugin peer conflict in `eslint-config-next`. These are foundation choices, not product integrations.

## 3. Repository structure

```text
project/
├── AGENTS.md
├── README.md
├── memory.md
├── package.json
├── docs/agent-pack/
│   ├── 01-PRD.md
│   ├── 02-ARCHITECTURE.md
│   ├── 03-DESIGN.md
│   ├── 04-TASKS.md
│   └── 05-AGENT-MEMORY.md
├── src/
│   ├── app/
│   ├── components/
│   ├── domain/
│   └── styles/
├── server/
│   ├── api/
│   ├── agents/
│   ├── policy/
│   ├── settlement/
│   ├── privacy/
│   └── audit/
├── tests/
└── public/
```

## 4. Domain objects

```ts
interface ProcurementMandate {
  id: string;
  buyerAccount: string;
  purpose: string;
  asset: string;
  budget: number;
  maxUnitPrice?: number;
  minReliability?: number;
  constraints: Constraint[];
  allowedDestinations: string[];
  approvedRecipients: string[];
  approvalThreshold: number;
  privacyMode: 'simulated' | 'private-ai' | 'private-ai-attested';
  status: 'draft' | 'open' | 'review' | 'approved' | 'settling' | 'settled' | 'blocked';
}

interface SupplierOffer {
  id: string;
  mandateId: string;
  supplierAgent: string;
  amount: number;
  unitPrice?: number;
  asset: string;
  destinationChain: string;
  recipient: string;
  reliabilityScore: number;
  evidence: string[];
  policyResult: 'pass' | 'blocked' | 'review';
  riskReasons: string[];
}

interface SettlementIntent {
  id: string;
  mandateId: string;
  quoteId?: string;
  sourceAsset: string;
  destinationAsset: string;
  destinationChain: string;
  amount: number;
  status: 'not_started' | 'quoted' | 'approved' | 'deposit_pending' | 'settling' | 'settled' | 'refunded' | 'simulated';
  mode: 'simulated' | 'testnet' | 'live';
}
```

## 5. Server API

```text
GET    /api/health
GET    /api/mandates
POST   /api/mandates
GET    /api/mandates/:id
PUT    /api/mandates/:id
POST   /api/mandates/:id/offers/simulate
POST   /api/mandates/:id/settlement/quote
POST   /api/mandates/:id/settlement/:quoteId/approve
POST   /api/mandates/:id/settlement/:quoteId/execute
GET    /api/mandates/:id/settlement/:quoteId
```

Every write endpoint must validate input, attach an idempotency key, record an audit event, and return a typed response. `/api/settlement/execute` must re-evaluate the selected offer server-side immediately before execution.

## 6. Agent design

Use deterministic supplier agents for the first demo. Each agent receives a sanitized mandate and returns a schema-validated offer. A future model-backed agent can be added behind the same interface.

The buyer agent may:

- Parse the user request.
- Suggest structured constraints.
- Compare offers.
- Explain tradeoffs.

The buyer agent may not:

- Change a hard policy constraint.
- Approve its own payment.
- Choose arbitrary methods.
- Bypass the server policy engine.
- Access a full-access wallet key.

## 7. Privacy design

Keep raw procurement text and supplier documents out of public logs. Store a content hash, redacted summary, and structured fields for the audit view. If NEAR AI Cloud is configured, call it server-side through the documented gateway path and show whether verification/attestation was available. If it is unavailable, use `SIMULATED_PRIVATE_AI` and say so.

## 8. NEAR integration boundaries

### 8.1 NEAR Intents / 1Click

The settlement adapter should create a desired outcome, request a quote, validate expiry and destination, require human approval, and track status. A simulated adapter must expose the same lifecycle without claiming real settlement. The current Phase 7 adapter is simulated-only and process-local: it never calls a provider, wallet, or chain, and its receipt never implies funds moved. Its policy gate permits a threshold-only `REVIEW REQUIRED` outcome only after explicit human approval; blocked and unrelated review outcomes remain ineligible. Any provider or testnet integration is a separate owner decision.

### 8.2 Restricted permissions

The agent account or key may call only explicitly allowed methods. Enforce method, contract, amount, recipient, chain, expiry, and nonce constraints on the server and, where possible, in the contract layer.

### 8.3 Chain Signatures

Use only if they provide a real demo capability. Bind payloads to a specific chain and use distinct derivation paths per network. Never sign an ambiguous payload.

### 8.4 Meta transactions

Optional for onboarding or low-value actions. Do not let gas sponsorship complicate the core demo.

## 9. Security controls

- Zod/JSON Schema validation on every model and agent response.
- Deterministic policy engine outside the model.
- Recipient and destination allowlists.
- Budget, unit-price, reliability, and expiry checks.
- Nonce and idempotency enforcement.
- Human approval threshold.
- Server-side recheck before execution.
- Prompt-injection fixture in tests.
- Redacted audit records.
- Secrets supplied only through environment variables.
- Default simulated settlement.

## 10. Deployment

A Vercel-style request-driven deployment can host the frontend and serverless API handlers. Long-running agent workers, scheduled jobs, or persistent streams should be avoided in the first demo or moved to a separate worker service. Use a free-tier deployment only after verifying current limits. A static frontend plus serverless endpoints is enough for the judge flow.

Deployment, Vercel changes, commits, pushes, and visibility changes require separate explicit human approval. Phase 8 was pushed at `1165ae854b62056cdf45e18d509d98a8c791719c`; Phase 9 validation is complete locally and its documentation changes remain uncommitted/unpushed. No Vercel change or deployment occurred. Stop before Phase 10 until separately approved.

## 11. Failure behavior

If a live provider is unavailable, the UI must show the provider as unavailable and switch to a safe simulated adapter. Never silently return fake live status. If settlement is pending or uncertain, do not resubmit automatically; show the existing request ID and status.
