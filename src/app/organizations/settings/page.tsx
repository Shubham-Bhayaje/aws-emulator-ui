/**
 * src/app/organizations/settings/page.tsx – Settings Server Component.
 * Zero emojis, Cloudscape enterprise standard.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { orgNav } from "../page";
import { fetchOrganizationHierarchy } from "../actions";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const data = await fetchOrganizationHierarchy();

  return (
    <ServiceLayout serviceName="Organizations" serviceColor="#C925D1" navItems={orgNav}>
      <div>
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Organization settings</h1>
          <p className="text-[13px] text-[#545b64]">
            Manage organization attributes, trusted access for AWS services, and view management account details.
          </p>
        </div>

        <SettingsClient data={data} />
      </div>
    </ServiceLayout>
  );
}
