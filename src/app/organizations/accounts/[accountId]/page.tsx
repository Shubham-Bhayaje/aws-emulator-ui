/**
 * src/app/organizations/accounts/[accountId]/page.tsx – Account Detail Server Component.
 * Zero emojis, Cloudscape enterprise standard.
 */

import Link from "next/link";
import ServiceLayout from "@/components/ServiceLayout";
import { orgNav } from "../../page";
import { fetchOrganizationHierarchy } from "../../actions";
import { AccountDetailClient } from "./AccountDetailClient";

interface PageProps {
  params: Promise<{ accountId: string }>;
}

export const dynamic = "force-dynamic";

export default async function AccountDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const accountId = decodeURIComponent(resolvedParams.accountId);

  const data = await fetchOrganizationHierarchy();
  const account = data.allAccounts.find((a) => a.id === accountId);

  if (!account) {
    return (
      <ServiceLayout serviceName="Organizations" serviceColor="#C925D1" navItems={orgNav}>
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212] mb-4">
          Error: Account with ID "{accountId}" was not found in this organization.
        </div>
        <Link href="/organizations" className="text-[#0972d3] text-[13px] hover:underline font-semibold">
          Return to AWS accounts
        </Link>
      </ServiceLayout>
    );
  }

  // Find parent name
  let parentName = "Root";
  const parentRoot = data.roots.find((r) => r.id === account.parentId);
  if (parentRoot) {
    parentName = `${parentRoot.name} (${parentRoot.id})`;
  } else {
    const parentOU = data.allOUs.find((ou) => ou.id === account.parentId);
    if (parentOU) {
      parentName = `${parentOU.name} (${parentOU.id})`;
    }
  }

  // All parents
  const allParents = [
    ...data.roots.map((r) => ({ id: r.id, name: `${r.name} (${r.id}) [Root]` })),
    ...data.allOUs.map((ou) => ({ id: ou.id, name: `${ou.name} (${ou.id}) [OU]` })),
  ];

  // Attached & available policies
  const attachedPolicies = data.allPolicies.filter((p) =>
    account.attachedPolicies?.includes(p.id)
  );
  const availablePolicies = data.allPolicies.filter(
    (p) => !account.attachedPolicies?.includes(p.id)
  );

  return (
    <ServiceLayout serviceName="Organizations" serviceColor="#C925D1" navItems={orgNav}>
      <div>
        {/* Breadcrumbs */}
        <div className="flex items-center text-[12px] text-[#545b64] mb-4 gap-1.5">
          <Link href="/organizations" className="hover:underline">
            AWS accounts
          </Link>
          <span>/</span>
          <span className="text-[#16191f] font-semibold">{account.name}</span>
        </div>

        <AccountDetailClient
          account={account}
          parentName={parentName}
          allParents={allParents}
          attachedPolicies={attachedPolicies}
          availablePolicies={availablePolicies}
        />
      </div>
    </ServiceLayout>
  );
}
