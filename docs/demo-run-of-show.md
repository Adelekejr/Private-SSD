# PrivateSpend Network — Local Demo Run of Show

**Target length:** about 1 minute 55 seconds (115 seconds)  
**Mode:** local app only; no recording or publication is included in this script task.

## Before recording

Use Node.js `^20.19.0`, `^22.13.0`, or `>=24` with npm `11.17.0`. From the repository root, run `npm ci` and `npm run dev`, then open <http://localhost:3000>. For a fresh rehearsal, stop and restart the server and refresh the page. Keep the seeded “Cloud compute capacity for one month” mandate selected; do not create or edit a mandate. The three suppliers are deterministic local fixtures. Avoid real procurement data.

## Timed script

| Time | On screen | Narration |
|---|---|---|
| 0:00–0:12 | Opening workspace header and workflow rail | “PrivateSpend is a constrained procurement workflow: agents can propose, deterministic policy decides, and a person keeps the approval authority. This build is a local simulation; NEAR is not connected.” |
| 0:12–0:26 | Seeded mandate details: 5,000 USDC budget, 1,000 USDC approval threshold, allowed destination and approved recipient | “The mandate defines the budget and allowed terms before offers are considered. This sample is preloaded so the same judge flow is reproducible.” |
| 0:26–0:42 | Click **Parse request + evaluate offers**. Show typed proposal and inference provenance | “The buyer request is parsed by local deterministic rules. The proposal is not applied to the mandate. No AI model or external provider is contacted, and verification and attestation are not performed.” |
| 0:42–1:02 | Scroll through Offer comparison and Rejected responses | “The server evaluates three sample offers against the saved mandate. Aster is blocked for exceeding budget and unit price; Northstar is blocked because its recipient is not approved. Ember is 4,920 USDC, above the 1,000 threshold, so it remains review-required. The prompt-injection fixture is rejected, and supplier risk notes are unverified.” |
| 1:02–1:15 | On Ember, click **Create SIMULATED quote**; show quote and pending approval | “Only this threshold-only review can continue in the simulator. The quote is short-lived, the policy still says review, and approval is pending. No provider, wallet, chain, or funds are involved.” |
| 1:15–1:30 | Check **I reviewed the displayed terms and approve this SIMULATED outcome only.** Click **Approve simulated quote** | “This is an explicit human action for the simulation only. Approval does not turn the policy result into a pass and does not sign a transaction.” |
| 1:30–1:44 | Click **Run simulated execution**; show receipt | “The local lifecycle completes with a simulated receipt. It explicitly says no money moved, no funds were transferred or signed, and the receipt is not on-chain.” |
| 1:44–1:55 | Show Evidence / Audit trail and end on receipt | “The audit view records redacted evidence of the approval and simulation. This is a local rehearsal—not a live supplier, private-inference, NEAR, or settlement integration.” |

## Expected final screen

The quote's policy result remains `REVIEW REQUIRED`; the receipt is `SIMULATED` and `moneyMoved: false`; the screen states `No money moved`, `Funds moved: NO`, and `Wallet / chain used: NO`. Redacted audit events appear in the Evidence panel. Do not narrate this as a real payment, on-chain event, private inference, or attested computation.

## Recovery

If a quote expires, the app asks for a new offer comparison. To return to the seeded initial state, stop the local server with `Ctrl+C`, run `npm run dev` again, and refresh the browser. The demo data is volatile process memory and resets on restart.
