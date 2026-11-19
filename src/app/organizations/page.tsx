/**
 * src/app/organizations/page.tsx – AWS Organizations Console (AWS accounts page).
 * Server Component: Queries live emulator Organization & Roots, provides
 * tree/list view of OUs and Accounts, plus management actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { fetchOrganizationHierarchy } from "./actions";
import { OrganizationsClient } from "./OrganizationsClient";

export const dynamic = "force-dynamic";

export const orgNav = [
  { label: "AWS accounts", href: "/organizations" },
  { label: "Policies", href: "/organizations/policies" },
  { label: "Invitations", href: "/organizations/invitations" },
  { label: "Settings", href: "/organizations/settings" },
];

export default async function OrganizationsPage() {
  const data = await fetchOrganizationHierarchy();

  return (
    <ServiceLayout serviceName="Organizations" serviceColor="#C925D1" navItems={orgNav}>
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#16191f] mb-1">AWS accounts</h1>
          <p className="text-[13px] text-[#545b64]">
            View and manage all AWS accounts in your organization, organize them into organizational units (OUs),
            and attach policies to enforce governance.
          </p>
        </div>

        {/* Client Component */}
        <OrganizationsClient data={data} />
      </div>
    </ServiceLayout>
  );
}
