import {
  buildMandateConstraints,
  parseMandateTerms,
} from "../../../domain/mandate-validation";
import type { NewProcurementMandate } from "../../../domain/models";
import { getProcurementRepository } from "../../../../server/persistence/in-memory-repository";
import { RepositoryIdempotencyConflictError } from "../../../../server/persistence/repository";

export const runtime = "nodejs";

function validIdempotencyKey(request: Request): string | null {
  const key = request.headers.get("Idempotency-Key");
  return key && /^[A-Za-z0-9._:-]{8,128}$/.test(key) ? key : null;
}

export async function GET() {
  const mandates = await getProcurementRepository().listMandates();
  return Response.json({ mandates });
}

export async function POST(request: Request) {
  const idempotencyKey = validIdempotencyKey(request);
  if (!idempotencyKey) {
    return Response.json(
      { error: "A valid Idempotency-Key header is required." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = parseMandateTerms(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Check the mandate fields and try again.", errors: parsed.errors },
      { status: 400 },
    );
  }

  const mandate: NewProcurementMandate = {
    ...parsed.data,
    buyerAccount: "demo-finance-workspace",
    constraints: buildMandateConstraints(parsed.data),
    status: "draft",
  };

  try {
    const repository = getProcurementRepository();
    const created = await repository.createMandate(mandate, idempotencyKey);
    const auditEvents = await repository.listAuditEvents(created.id);
    return Response.json({ mandate: created, auditEvents }, { status: 201 });
  } catch (error) {
    if (error instanceof RepositoryIdempotencyConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
