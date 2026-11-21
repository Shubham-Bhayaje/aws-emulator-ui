import ServiceLayout from "@/components/ServiceLayout";
import { kmsNav } from "../../kmsNav";
import { fetchIamPrincipalsAction } from "../../actions";
import { CreateKeyForm } from "./CreateKeyForm";

export const dynamic = "force-dynamic";

export default async function CreateKMSKeyPage() {
  const { principals, accountId } = await fetchIamPrincipalsAction();

  return (
    <ServiceLayout serviceName="KMS" serviceColor="#E7157B" navItems={kmsNav}>
      <CreateKeyForm initialPrincipals={principals || []} accountId={accountId || "000000000000"} />
    </ServiceLayout>
  );
}
