import type { Constraint, MandateTerms, PrivacyMode } from "./models";

export type MandateValidationErrors = Partial<
  Record<keyof MandateTerms, string>
>;

export type MandateValidationResult =
  | { success: true; data: MandateTerms }
  | { success: false; errors: MandateValidationErrors };

const PRIVACY_MODES: readonly PrivacyMode[] = [
  "simulated",
  "private-ai",
  "private-ai-attested",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPositiveNumber(
  value: unknown,
  field: keyof MandateTerms,
  errors: MandateValidationErrors,
  options: { optional?: boolean; minimum?: number; maximum?: number } = {},
): number | undefined {
  if (options.optional && (value === undefined || value === null)) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors[field] = "Enter a valid number.";
    return undefined;
  }
  const minimum = options.minimum ?? 0;
  const maximum = options.maximum ?? 1_000_000_000_000;
  if (value < minimum || value > maximum) {
    errors[field] = `Enter a value from ${minimum} to ${maximum}.`;
    return undefined;
  }
  return value;
}

function readList(
  value: unknown,
  field: "allowedDestinations" | "approvedRecipients",
  errors: MandateValidationErrors,
): string[] | undefined {
  const label = field === "allowedDestinations" ? "chain" : "recipient";
  if (!Array.isArray(value)) {
    errors[field] = `Add at least one approved ${label}.`;
    return undefined;
  }
  const maxItems = field === "allowedDestinations" ? 20 : 50;
  if (value.length === 0 || value.length > maxItems) {
    errors[field] = `Add between 1 and ${maxItems} ${label}s.`;
    return undefined;
  }

  const pattern =
    field === "allowedDestinations"
      ? /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/
      : /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,127}$/;
  const items: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      errors[field] = `Each ${label} must be text.`;
      return undefined;
    }
    const trimmed = item.trim();
    if (!pattern.test(trimmed)) {
      errors[field] = `Each ${label} must be 1–${field === "allowedDestinations" ? 80 : 128} characters with no spaces.`;
      return undefined;
    }
    items.push(trimmed);
  }

  const normalized = items.map((item) => item.toLowerCase());
  if (new Set(normalized).size !== items.length) {
    errors[field] = `Remove duplicate ${label}s.`;
    return undefined;
  }
  return items;
}

export function parseMandateTerms(input: unknown): MandateValidationResult {
  if (!isRecord(input)) {
    return {
      success: false,
      errors: { purpose: "Enter mandate details and try again." },
    };
  }

  const errors: MandateValidationErrors = {};
  const purpose = typeof input.purpose === "string" ? input.purpose.trim() : "";
  if (purpose.length === 0 || purpose.length > 240) {
    errors.purpose = "Purpose is required and must be 240 characters or fewer.";
  }

  const rawAsset = typeof input.asset === "string" ? input.asset.trim() : "";
  if (!/^[A-Za-z][A-Za-z0-9._-]{1,15}$/.test(rawAsset)) {
    errors.asset = "Enter an asset symbol using 2–16 letters, numbers, dots, or dashes.";
  }
  const asset = rawAsset.toUpperCase();

  const budget = readPositiveNumber(input.budget, "budget", errors, {
    minimum: 0.00000001,
  });
  const maxUnitPrice = readPositiveNumber(input.maxUnitPrice, "maxUnitPrice", errors, {
    optional: true,
    minimum: 0.00000001,
  });
  const minReliability = readPositiveNumber(
    input.minReliability,
    "minReliability",
    errors,
    { optional: true, minimum: 0, maximum: 1 },
  );
  const approvalThreshold = readPositiveNumber(
    input.approvalThreshold,
    "approvalThreshold",
    errors,
    { maximum: 1_000_000_000_000 },
  );
  if (
    budget !== undefined &&
    approvalThreshold !== undefined &&
    approvalThreshold > budget
  ) {
    errors.approvalThreshold = "Approval threshold cannot exceed the total budget.";
  }

  const allowedDestinations = readList(
    input.allowedDestinations,
    "allowedDestinations",
    errors,
  );
  const approvedRecipients = readList(
    input.approvedRecipients,
    "approvedRecipients",
    errors,
  );
  const privacyMode = input.privacyMode;
  if (!PRIVACY_MODES.includes(privacyMode as PrivacyMode)) {
    errors.privacyMode = "Choose a supported privacy mode.";
  }

  if (
    Object.keys(errors).length > 0 ||
    budget === undefined ||
    approvalThreshold === undefined ||
    allowedDestinations === undefined ||
    approvedRecipients === undefined
  ) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      purpose,
      asset,
      budget,
      ...(maxUnitPrice === undefined ? {} : { maxUnitPrice }),
      ...(minReliability === undefined ? {} : { minReliability }),
      allowedDestinations,
      approvedRecipients,
      approvalThreshold,
      privacyMode: privacyMode as PrivacyMode,
    },
  };
}

export function buildMandateConstraints(terms: MandateTerms): Constraint[] {
  return [
    { id: "constraint-budget", kind: "budget", amount: terms.budget, asset: terms.asset },
    ...(terms.maxUnitPrice === undefined
      ? []
      : [
          {
            id: "constraint-unit-price",
            kind: "max_unit_price" as const,
            amount: terms.maxUnitPrice,
            asset: terms.asset,
            unit: "unspecified",
          },
        ]),
    ...(terms.minReliability === undefined
      ? []
      : [
          {
            id: "constraint-reliability",
            kind: "min_reliability" as const,
            score: terms.minReliability,
          },
        ]),
    {
      id: "constraint-destinations",
      kind: "allowed_destinations",
      chains: [...terms.allowedDestinations],
    },
    {
      id: "constraint-recipients",
      kind: "approved_recipients",
      recipients: [...terms.approvedRecipients],
    },
    {
      id: "constraint-approval",
      kind: "approval_threshold",
      amount: terms.approvalThreshold,
      asset: terms.asset,
    },
  ];
}
