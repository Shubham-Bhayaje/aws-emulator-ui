import ServiceLayout from "@/components/ServiceLayout";
import { kmsNav } from "./kmsNav";
import { fetchCustomerManagedKeys } from "./actions";
import { CustomerKeysClient } from "./CustomerKeysClient";

export const dynamic = "force-dynamic";

export default async function KMSCustomerKeysPage() {
  const result = await fetchCustomerManagedKeys();

  return (
    <ServiceLayout serviceName="KMS" serviceColor="#E7157B" navItems={kmsNav}>
      <CustomerKeysClient keys={result.keys || []} />
    </ServiceLayout>
  );
}
