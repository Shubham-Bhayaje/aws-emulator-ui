import ServiceLayout from "@/components/ServiceLayout";
import { kmsNav } from "../../kmsNav";
import { CreateKeyForm } from "./CreateKeyForm";

export const dynamic = "force-dynamic";

export default function CreateKMSKeyPage() {
  return (
    <ServiceLayout serviceName="KMS" serviceColor="#E7157B" navItems={kmsNav}>
      <CreateKeyForm />
    </ServiceLayout>
  );
}
