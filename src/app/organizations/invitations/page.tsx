/**
 * src/app/organizations/invitations/page.tsx – Invitations Server Component.
 * Zero emojis, Cloudscape enterprise standard.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { orgNav } from "../page";
import { fetchOrganizationHierarchy } from "../actions";
import { InvitationsClient } from "./InvitationsClient";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
  const data = await fetchOrganizationHierarchy();

  const invitedAccounts = data.allAccounts.filter((a) => a.joinedMethod === "INVITED");

  const parentOptions = [
    ...data.roots.map((r) => ({ id: r.id, name: `${r.name} (${r.id}) [Root]` })),
    ...data.allOUs.map((ou) => ({ id: ou.id, name: `${ou.name} (${ou.id}) [OU]` })),
  ];

  return (
    <ServiceLayout serviceName="Organizations" serviceColor="#C925D1" navItems={orgNav}>
      <div>
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Invitations</h1>
          <p className="text-[13px] text-[#545b64]">
            Manage invitations sent to other AWS accounts to join this organization.
          </p>
        </div>

        <InvitationsClient invitedAccounts={invitedAccounts} parentOptions={parentOptions} />
      </div>
    </ServiceLayout>
  );
}
