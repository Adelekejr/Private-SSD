import { MandateWorkspace } from "../components/mandate-workspace";
import { getProcurementRepository } from "../../server/persistence/in-memory-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const repository = getProcurementRepository();
  const mandates = await repository.listMandates();
  const auditEvents = mandates[0]
    ? await repository.listAuditEvents(mandates[0].id)
    : [];

  return (
    <MandateWorkspace
      initialMandates={mandates}
      initialAuditEvents={auditEvents}
    />
  );
}
