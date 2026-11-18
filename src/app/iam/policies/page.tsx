/**
 * IAM Policies list page – Server component.
 * Lists all IAM policies (AWS managed & Customer managed) and checks active identity permissions.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { iam } from "@/lib/aws";
import { ListPoliciesCommand } from "@aws-sdk/client-iam";
import { PolicyActions, PolicySummary } from "./PolicyActions";
import { iamNav } from "../page";
import { getActiveIdentity } from "@/lib/identity";
import { evaluatePermissions } from "@/lib/permissions";

export default async function IAMPoliciesPage() {
  let policies: PolicySummary[] = [];
  let error: string | null = null;
  const identity = await getActiveIdentity();

  try {
    const res = await iam.send(
      new ListPoliciesCommand({ Scope: "All", MaxItems: 100 })
    );
    const rawPolicies = res.Policies ?? [];

    policies = rawPolicies.map((p) => {
      const arn = p.Arn ?? "";
      const isAWSManaged = arn.includes(":aws:policy");
      return {
        policyName: p.PolicyName ?? "",
        policyId: p.PolicyId ?? "—",
        arn,
        isAWSManaged,
        attachmentCount: p.AttachmentCount ?? 0,
        description: p.Description ?? (isAWSManaged ? "AWS managed policy" : "Customer managed policy"),
        updateDate: p.UpdateDate ? new Date(p.UpdateDate).toLocaleString() : "—",
      };
    });
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  const canCreatePolicy = evaluatePermissions(identity, "iam:CreatePolicy").allowed;
  const canDeletePolicy = evaluatePermissions(identity, "iam:DeletePolicy").allowed;

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Policies</h1>
        <p className="text-[13px] text-[#545b64] mb-4">
          An IAM policy is an object in AWS that, when associated with an identity or
          resource, defines their permissions.
        </p>

        {error ? (
          <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
            Error: {error}
          </div>
        ) : (
          <PolicyActions
            policies={policies}
            canCreatePolicy={canCreatePolicy}
            canDeletePolicy={canDeletePolicy}
            activeIdentityName={identity.name}
            activeIdentityType={identity.type}
          />
        )}
      </div>
    </ServiceLayout>
  );
}
