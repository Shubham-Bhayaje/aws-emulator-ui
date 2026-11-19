import ServiceLayout from "@/components/ServiceLayout";
import { kmsNav } from "../kmsNav";
import { fetchAWSManagedKeys } from "../actions";
import { AWSManagedKeysClient } from "./AWSManagedKeysClient";

export const dynamic = "force-dynamic";

export default async function AWSManagedKeysPage() {
  const result = await fetchAWSManagedKeys();

  return (
    <ServiceLayout serviceName="KMS" serviceColor="#E7157B" navItems={kmsNav}>
      <AWSManagedKeysClient keys={result.keys || []} />
    </ServiceLayout>
  );
}
