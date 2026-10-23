import { parseMandateTerms } from "../../../../domain/mandate-validation";
import { getProcurementRepository } from "../../../../../server/persistence/in-memory-repository";
import {
  RepositoryEntityNotFoundError,
  RepositoryIdempotencyConflictError,
} from "../../../../../server/persistence/repository";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function validIdempotencyKey(request: Request): string | null {
  const key = request.headers.get("Idempotency-Key");
  return key && /^[A-Za-z0-9._:-]{8,128}$/.test(key) ? key : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const repository = getProcurementRepository();
  const mandate = await repository.getMandate(id);
  if (!mandate) {
    return Response.json({ error: "Mandate not found." }, { status: 404 });
  }
  const auditEvents = await repository.listAuditEvents(id);
  return Response.json({ mandate, auditEvents });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
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

  try {
    const repository = getProcurementRepository();
    const mandate = await repository.updateMandate(
      id,
      parsed.data,
      idempotencyKey,
    );
    const auditEvents = await repository.listAuditEvents(id);
    return Response.json({ mandate, auditEvents });
  } catch (error) {
    if (error instanceof RepositoryEntityNotFoundError) {
      return Response.json({ error: "Mandate not found." }, { status: 404 });
    }
    if (error instanceof RepositoryIdempotencyConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
