/**
 * src/app/organizations/ou/[ouId]/page.tsx – Organizational Unit Detail Server Component.
 * Zero emojis, Cloudscape enterprise standard.
 */

import Link from "next/link";
import ServiceLayout from "@/components/ServiceLayout";
import { orgNav } from "../../page";
import { fetchOrganizationHierarchy } from "../../actions";
import { OUDetailClient } from "./OUDetailClient";

interface PageProps {
  params: Promise<{ ouId: string }>;
}

export const dynamic = "force-dynamic";

export default async function OUDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const ouId = decodeURIComponent(resolvedParams.ouId);

  const data = await fetchOrganizationHierarchy();
  const ou = data.allOUs.find((o) => o.id === ouId);

  if (!ou) {
    return (
      <ServiceLayout serviceName="Organizations" serviceColor="#C925D1" navItems={orgNav}>
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212] mb-4">
          Error: Organizational Unit with ID "{ouId}" was not found in this organization.
        </div>
        <Link href="/organizations" className="text-[#0972d3] text-[13px] hover:underline font-semibold">
          Return to AWS accounts
        </Link>
      </ServiceLayout>
    );
  }

  // Parent name
  let parentName = "Root";
  const parentRoot = data.roots.find((r) => r.id === ou.parentId);
  if (parentRoot) {
    parentName = `${parentRoot.name} (${parentRoot.id})`;
  } else {
    const parentOU = data.allOUs.find((p) => p.id === ou.parentId);
    if (parentOU) {
      parentName = `${parentOU.name} (${parentOU.id})`;
    }
  }

  // Accounts directly in this OU
  const accounts = data.allAccounts.filter((a) => a.parentId === ouId);

  // Child OUs directly in this OU
  const childOUs = data.allOUs.filter((o) => o.parentId === ouId);

  // Policies attached to this OU
  const attachedPolicies = data.allPolicies.filter((p) =>
    p.attachedTargets.some((t) => t.id === ouId)
  );
  const availablePolicies = data.allPolicies.filter(
    (p) => !p.attachedTargets.some((t) => t.id === ouId)
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
          <span className="text-[#16191f] font-semibold">{ou.name}</span>
        </div>

        <OUDetailClient
          ou={ou}
          parentName={parentName}
          accounts={accounts}
          childOUs={childOUs}
          attachedPolicies={attachedPolicies}
          availablePolicies={availablePolicies}
        />
      </div>
    </ServiceLayout>
  );
}
