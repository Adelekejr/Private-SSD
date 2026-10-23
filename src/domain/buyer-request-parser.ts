import type { Constraint, MandateTerms, ProcurementMandate } from "./models";
import { buildMandateConstraints, parseMandateTerms } from "./mandate-validation";

export interface BuyerRequestProposal {
  constraints: Constraint[];
  extractedFields: string[];
  inheritedFields: string[];
  warnings: string[];
}

const FIELD_ORDER = [
  "purpose",
  "budget",
  "asset",
  "maxUnitPrice",
  "minReliability",
  "allowedDestinations",
  "approvedRecipients",
  "approvalThreshold",
] as const;

type ParsedField = (typeof FIELD_ORDER)[number];

function readNumber(value: string): number | undefined {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function matchNumber(input: string, expression: RegExp): number | undefined {
  const match = expression.exec(input);
  return match?.[1] ? readNumber(match[1]) : undefined;
}

function matchList(input: string, expression: RegExp): string[] | undefined {
  const match = expression.exec(input);
  if (!match?.[1]) return undefined;
  const values = match[1]
    .split(",")
    .map((value) => value.trim().replace(/[.;]+$/, ""))
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function baseTerms(mandate: ProcurementMandate): MandateTerms {
  return {
    purpose: mandate.purpose,
    asset: mandate.asset,
    budget: mandate.budget,
    ...(mandate.maxUnitPrice === undefined
      ? {}
      : { maxUnitPrice: mandate.maxUnitPrice }),
    ...(mandate.minReliability === undefined
      ? {}
      : { minReliability: mandate.minReliability }),
    allowedDestinations: [...mandate.allowedDestinations],
    approvedRecipients: [...mandate.approvedRecipients],
    approvalThreshold: mandate.approvalThreshold,
    privacyMode: mandate.privacyMode,
  };
}

/**
 * Extracts only explicit, recognizable values using deterministic rules. The
 * result is a suggestion for human inspection; it never writes to a mandate.
 */
export function parseBuyerRequest(
  requestText: string,
  mandate: ProcurementMandate,
): BuyerRequestProposal {
  const current = baseTerms(mandate);
  const candidate: MandateTerms = { ...current };
  const found = new Set<ParsedField>();
  const warnings: string[] = [];
  const input = requestText.trim();

  if (input.length > 0) {
    const purpose = /\bpurpose\s*[:=]\s*([^;\n]{1,240})/i.exec(input)?.[1]?.trim();
    if (purpose) {
      candidate.purpose = purpose;
      found.add("purpose");
    }

    const budgetPattern =
      /\b(?:total\s+budget|budget|spend\s+limit|up\s+to)\s*(?:is|of|:|=)?\s*\$?([\d,]+(?:\.\d+)?)\s*(USDC|USDT|DAI|USD|NEAR)?\b/i;
    const budgetMatch = budgetPattern.exec(input);
    const genericAmountMatch = /\$?([\d,]+(?:\.\d+)?)\s+(USDC|USDT|DAI|USD|NEAR)\b/i.exec(input);
    const chosenBudgetMatch = budgetMatch ?? genericAmountMatch;
    if (chosenBudgetMatch?.[1]) {
      const amount = readNumber(chosenBudgetMatch[1]);
      if (amount !== undefined) {
        candidate.budget = amount;
        found.add("budget");
      }
      if (chosenBudgetMatch[2]) {
        candidate.asset = chosenBudgetMatch[2].toUpperCase();
        found.add("asset");
      }
    }
    const explicitAsset = /\basset\s*(?:is|:|=)\s*([A-Za-z][A-Za-z0-9._-]{1,15})\b/i.exec(input)?.[1];
    if (explicitAsset) {
      candidate.asset = explicitAsset.toUpperCase();
      found.add("asset");
    }

    const maxUnitPrice = matchNumber(
      input,
      /\bmax(?:imum)?\s+(?:unit\s+)?price\s*(?:is|of|:|=)?\s*\$?([\d,]+(?:\.\d+)?)/i,
    );
    if (maxUnitPrice !== undefined) {
      candidate.maxUnitPrice = maxUnitPrice;
      found.add("maxUnitPrice");
    }

    const reliabilityMatch = /\bmin(?:imum)?\s+(?:supplier\s+)?reliability\s*(?:is|of|:|=)?\s*([\d.]+)\s*(%)?/i.exec(input);
    if (reliabilityMatch?.[1]) {
      const score = readNumber(reliabilityMatch[1]);
      if (score !== undefined) {
        candidate.minReliability = reliabilityMatch[2] || score > 1 ? score / 100 : score;
        found.add("minReliability");
      }
    }

    const destinations = matchList(
      input,
      /\b(?:allowed\s+)?destinations?(?:\s+chains?)?\s*(?:are|is|:|=)?\s*([A-Za-z0-9._:-]+(?:\s*,\s*[A-Za-z0-9._:-]+)*)/i,
    );
    if (destinations) {
      candidate.allowedDestinations = destinations;
      found.add("allowedDestinations");
    }

    const recipients = matchList(
      input,
      /\bapproved\s+recipients?\s*(?:are|is|:|=)?\s*([A-Za-z0-9._:@/-]+(?:\s*,\s*[A-Za-z0-9._:@/-]+)*)/i,
    );
    if (recipients) {
      candidate.approvedRecipients = recipients;
      found.add("approvedRecipients");
    }

    const approvalThreshold = matchNumber(
      input,
      /\b(?:approval\s+threshold|human\s+review\s+above|approval\s+required\s+above)\s*(?:is|of|:|=)?\s*\$?([\d,]+(?:\.\d+)?)/i,
    );
    if (approvalThreshold !== undefined) {
      candidate.approvalThreshold = approvalThreshold;
      found.add("approvalThreshold");
    }
  }

  const parsed = parseMandateTerms(candidate);
  const terms = parsed.success ? parsed.data : current;
  if (!parsed.success && found.size > 0) {
    warnings.push(
      "The extracted request did not pass mandate validation; saved terms are shown instead.",
    );
    found.clear();
  }
  if (input.length > 0 && found.size === 0 && warnings.length === 0) {
    warnings.push(
      "No supported fields were recognized; saved terms are shown instead.",
    );
  }
  if (input.length === 0) {
    warnings.push(
      "No free-text request was supplied; the typed proposal mirrors the saved mandate.",
    );
  }

  return {
    constraints: buildMandateConstraints(terms),
    extractedFields: FIELD_ORDER.filter((field) => found.has(field)),
    inheritedFields: FIELD_ORDER.filter((field) => !found.has(field)),
    warnings,
  };
}
