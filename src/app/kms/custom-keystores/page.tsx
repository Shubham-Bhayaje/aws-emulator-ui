import ServiceLayout from "@/components/ServiceLayout";
import { kmsNav } from "../kmsNav";
import { fetchCustomKeyStoresAction } from "../actions";
import { CustomKeyStoresClient } from "./CustomKeyStoresClient";

export const dynamic = "force-dynamic";

export default async function CustomKeyStoresPage() {
  const result = await fetchCustomKeyStoresAction();

  return (
    <ServiceLayout serviceName="KMS" serviceColor="#E7157B" navItems={kmsNav}>
      <CustomKeyStoresClient customKeyStores={result.customKeyStores || []} />
    </ServiceLayout>
  );
}
