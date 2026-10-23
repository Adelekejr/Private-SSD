# PrivateSpend Network — Design System

## 1. Design goal

The visual system should make complex agent activity feel understandable, cautious, and inspectable. The optional reference direction is the black-and-white technical interface seen in the provided image: sparse white canvas, thin engineering grid, black typography, compact mono labels, and small green motion. It is a direction, not a requirement to copy the reference site.

The product should feel like a calm procurement control room, not a generic SaaS dashboard and not a crypto casino.

## 2. Principles

1. Show authority clearly: agent suggestion, policy decision, human approval, settlement.
2. Use color for state, not decoration.
3. Prefer evidence, labels, and whitespace over visual noise.
4. Make unsafe actions feel blocked before they can happen.

## 3. Palette

| Token | Value | Use |
|---|---|---|
| Background | `#FFFFFF` or `#FAFAF8` | Page background |
| Primary text | `#111111` | Main text |
| Secondary text | `#666666` | Supporting text |
| Muted text | `#969696` | Low-emphasis text |
| Border | `#DCDCDC` | Rules and borders |
| Soft surface | `#F4F4F1` | Subtle surfaces |
| Signal green | `#16D96B` | Verified, allowed, active, completed states |
| Readable green | `#087A43` | Readable green text |
| Review amber | `#B77B2A` | Review state |
| Blocked red | `#B84E46` | Blocked state, used sparingly |

Default pages should be mostly black, white, gray, and whitespace. Green is reserved for verified, allowed, active, or completed states.

## 4. Typography

Use a geometric sans-serif such as Space Grotesk, Sora, Inter, or IBM Plex Sans. Use IBM Plex Mono, JetBrains Mono, or DM Mono for IDs, timestamps, system labels, and amounts.

Headings are bold, compact, and black. Labels are small uppercase monospace with letter spacing. Body copy is short and direct. Amounts use tabular numerals.

## 5. Layout

Use a compact header, a clear workspace identity, a large working area, and an evidence rail or audit section. Avoid placing every element in a rounded card. Prefer 1px rules, open data rows, and small corner radii of 2–6px.

The main route should read:

```text
MANDATE → OFFERS → POLICY → APPROVAL → SETTLEMENT → EVIDENCE
```

On desktop, use a wide composition with mandate and offer comparison in the main column and policy/evidence in a secondary column. On mobile, stack sections without horizontal scrolling.

## 6. Required screens

### 6.1 Workspace

Show the business name, NEAR/testnet context, current mandate, budget, and system status.

### 6.2 Mandate creation

Show the purpose, budget, asset, unit-price limit, reliability requirement, allowed chains, approved recipients, approval threshold, and privacy mode.

### 6.3 Offer comparison

Show three supplier offers with price, reliability, recipient, destination chain, evidence, policy result, and risk reasons. The eligible offer must be visually distinct but not over-decorated.

### 6.4 Policy evidence

Display exact violations such as:

- Amount exceeds budget.
- Unit price exceeds the mandate limit.
- Recipient is not approved.
- Destination chain is not allowed.
- Offer expired.
- Supplier instruction attempted to change policy.

### 6.5 Settlement

Show quote or simulated quote, expiry, destination, asset, amount, human approval state, and settlement status. Never show simulated settlement as live.

### 6.6 Audit

Use a sparse vertical timeline with timestamp, actor, event, detail, and a small state marker. Raw sensitive input is never exposed.

## 7. Motion

Use restrained motion only:

- Subtle grid drift of 1–2px over 8–12 seconds.
- A 250–450ms transition when an offer changes state.
- Thin line movement along the mandate-to-settlement route.
- A small fade/translate when an audit event is appended.
- A 1px button shift on hover.
- A green node moving along a route only while a request is genuinely processing.

Respect `prefers-reduced-motion`. Do not animate money as if it settled before settlement is confirmed.

## 8. Components and state labels

Buttons are rectangular, compact, and explicit. Primary actions may use signal green with black text. Secondary actions use transparent backgrounds and thin borders. Important states always include text, not color alone.

Status labels should use terms such as `SIMULATED`, `TESTNET`, `LIVE`, `REVIEW REQUIRED`, `BLOCKED`, `APPROVED`, and `SETTLED`.

Use open data rows for financial values. Use small line icons only when they clarify meaning. Do not use decorative crypto icons or glossy gradients.

## 9. Accessibility

Use semantic headings, visible focus states, accessible labels, keyboard navigation, strong contrast, and reduced-motion support. Every blocked or approved state must be readable without color.

## 10. Logo and brand direction

The logo should be original and expressive rather than corporate. Preferred concept: a protected payment flow, such as an open wallet or pocket shape containing a moving green signal node. Avoid literal dollar signs, generic shields, and overly formal bank marks. The wordmark should remain simple and secondary to the symbol.

## 11. Design acceptance

A judge should immediately identify the current mandate, what agents proposed, what policy allowed or blocked, whether human approval is required, whether settlement is simulated/testnet/live, and where evidence is stored. The design must serve the backend workflow instead of hiding it.
