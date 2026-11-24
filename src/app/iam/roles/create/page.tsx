/**
 * Create IAM Role page – Server component.
 * Loads policies and renders CreateRoleForm.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { iam } from "@/lib/aws";
import { ListPoliciesCommand } from "@aws-sdk/client-iam";
import { CreateRoleForm } from "./CreateRoleForm";
import { iamNav } from "../../page";
import { getActiveIdentity } from "@/lib/identity";
import { evaluatePermissions } from "@/lib/permissions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

export const dynamic = "force-dynamic";

export default async function CreateRolePage() {
  let policies: { name: string; arn: string }[] = [];
  let pageError: string | null = null;

  const identity = await getActiveIdentity();
  const canCreateRole = evaluatePermissions(identity, "iam:CreateRole").allowed;

  if (!canCreateRole && identity.type !== "admin") {
    pageError = `AccessDeniedException: User: ${identity.arn} is not authorized to perform: iam:CreateRole on resource: * because no identity-based policy allows the iam:CreateRole action`;
  }

  try {
    const res = await iam.send(
      new ListPoliciesCommand({ Scope: "All", MaxItems: 100 })
    ).catch((err: any) => {
      if (!pageError) {
        pageError = err?.message || String(err);
      }
      return { Policies: [] };
    });
    policies = (res.Policies ?? [])
      .map((p) => ({
        name: p.PolicyName ?? "",
        arn: p.Arn ?? "",
      }))
      .filter((p) => p.name && p.arn);
  } catch (err: any) {
    if (!pageError) {
      pageError = err?.message || String(err);
    }
  }

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Create role</h1>
        <p className="text-[13px] text-[#545b64] mb-6">
          Create an IAM role to delegate permissions to AWS services or identities.
        </p>

        {pageError && (
          <EmulatorOfflineBanner error={pageError} className="mb-6" />
        )}

        <CreateRoleForm policies={policies} />
      </div>
    </ServiceLayout>
  );
}
