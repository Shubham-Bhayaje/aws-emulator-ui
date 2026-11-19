import ServiceLayout from "@/components/ServiceLayout";
import { kmsNav } from "../kmsNav";
import { CustomKeyStoresClient } from "./CustomKeyStoresClient";

export const dynamic = "force-dynamic";

export default function CustomKeyStoresPage() {
  return (
    <ServiceLayout serviceName="KMS" serviceColor="#E7157B" navItems={kmsNav}>
      <CustomKeyStoresClient />
    </ServiceLayout>
  );
}
