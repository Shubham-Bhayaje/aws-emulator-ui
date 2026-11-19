/**
 * src/app/organizations/policies/page.tsx – Policies list server component.
 * Zero emojis, Cloudscape enterprise standard.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { orgNav } from "../page";
import { fetchOrganizationHierarchy } from "../actions";
import { PoliciesClient } from "./PoliciesClient";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const data = await fetchOrganizationHierarchy();

  return (
    <ServiceLayout serviceName="Organizations" serviceColor="#C925D1" navItems={orgNav}>
      <div>
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Policies</h1>
          <p className="text-[13px] text-[#545b64]">
            Create and attach Service Control Policies (SCPs) to set fine-grained permission guardrails across
            your organization hierarchy.
          </p>
        </div>

        <PoliciesClient policies={data.allPolicies} />
      </div>
    </ServiceLayout>
  );
}
