import ServiceLayout from "@/components/ServiceLayout";
import { s3Nav } from "../s3Nav";
import { AccountSettingsClient } from "./AccountSettingsClient";

export const dynamic = "force-dynamic";

export default function AccountSettingsPage() {
  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <AccountSettingsClient />
    </ServiceLayout>
  );
}
