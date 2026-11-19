/**
 * src/app/organizations/policies/create/page.tsx – Create Policy Server Component.
 * Zero emojis, Cloudscape enterprise standard.
 */

import Link from "next/link";
import ServiceLayout from "@/components/ServiceLayout";
import { orgNav } from "../../page";
import { fetchOrganizationHierarchy } from "../../actions";
import { CreatePolicyClient } from "./CreatePolicyClient";

export const dynamic = "force-dynamic";

export default async function CreatePolicyPage() {
  const data = await fetchOrganizationHierarchy();

  const targets: Array<{ id: string; name: string; type: "ROOT" | "OU" | "ACCOUNT" }> = [
    ...data.roots.map((r) => ({ id: r.id, name: r.name, type: "ROOT" as const })),
    ...data.allOUs.map((ou) => ({ id: ou.id, name: ou.name, type: "OU" as const })),
    ...data.allAccounts.map((acc) => ({ id: acc.id, name: acc.name, type: "ACCOUNT" as const })),
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
          <span className="text-[#16191f] font-semibold">Create policy</span>
        </div>

        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Create policy</h1>
          <p className="text-[13px] text-[#545b64]">
            Specify policy details and write or load a JSON statement defining the policy guardrails.
          </p>
        </div>

        <CreatePolicyClient targets={targets} />
      </div>
    </ServiceLayout>
  );
}
