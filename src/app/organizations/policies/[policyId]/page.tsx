/**
 * src/app/organizations/policies/[policyId]/page.tsx – Policy Detail Server Component.
 * Zero emojis, Cloudscape enterprise standard.
 */

import Link from "next/link";
import ServiceLayout from "@/components/ServiceLayout";
import { orgNav } from "../../page";
import { fetchOrganizationHierarchy } from "../../actions";
import { PolicyDetailClient } from "./PolicyDetailClient";

interface PageProps {
  params: Promise<{ policyId: string }>;
}

export const dynamic = "force-dynamic";

export default async function PolicyDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const policyId = decodeURIComponent(resolvedParams.policyId);

  const data = await fetchOrganizationHierarchy();
  const policy = data.allPolicies.find((p) => p.id === policyId);

  if (!policy) {
    return (
      <ServiceLayout serviceName="Organizations" serviceColor="#C925D1" navItems={orgNav}>
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212] mb-4">
          Error: Policy with ID "{policyId}" was not found.
        </div>
        <Link href="/organizations/policies" className="text-[#0972d3] text-[13px] hover:underline font-semibold">
          Return to Policies
        </Link>
      </ServiceLayout>
    );
  }

  // Targets that are not yet attached to this policy
  const attachedTargetIds = policy.attachedTargets.map((t) => t.id);
  const availableTargets: Array<{ id: string; name: string; type: "ROOT" | "OU" | "ACCOUNT" }> = [
    ...data.roots
      .filter((r) => !attachedTargetIds.includes(r.id))
      .map((r) => ({ id: r.id, name: r.name, type: "ROOT" as const })),
    ...data.allOUs
      .filter((ou) => !attachedTargetIds.includes(ou.id))
      .map((ou) => ({ id: ou.id, name: ou.name, type: "OU" as const })),
    ...data.allAccounts
      .filter((acc) => !attachedTargetIds.includes(acc.id))
      .map((acc) => ({ id: acc.id, name: acc.name, type: "ACCOUNT" as const })),
  ];

  return (
    <ServiceLayout serviceName="Organizations" serviceColor="#C925D1" navItems={orgNav}>
      <div>
        {/* Breadcrumbs */}
        <div className="flex items-center text-[12px] text-[#545b64] mb-4 gap-1.5">
          <Link href="/organizations/policies" className="hover:underline">
            Policies
          </Link>
          <span>/</span>
          <span className="text-[#16191f] font-semibold">{policy.name}</span>
        </div>

        <PolicyDetailClient policy={policy} availableTargets={availableTargets} />
      </div>
    </ServiceLayout>
  );
}
