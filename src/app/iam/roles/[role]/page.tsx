/**
 * IAM Role detail page – Server component.
 * Loads role details, assume-role policy, and attached policies.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { iam } from "@/lib/aws";
import {
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  ListPoliciesCommand,
} from "@aws-sdk/client-iam";
import { RoleDetail, RoleDetailMeta } from "./RoleDetail";
import { iamNav } from "../../page";

interface PageProps {
  params: Promise<{ role: string }>;
}

export default async function RoleDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const roleName = decodeURIComponent(resolvedParams.role);

  let roleMeta: RoleDetailMeta | null = null;
  let allPolicies: { name: string; arn: string }[] = [];
  let error: string | null = null;

  try {
    const roleRes = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    const r = roleRes.Role;

    if (!r) {
      error = `Role "${roleName}" was not found.`;
    } else {
      let docObj: any = {};
      if (r.AssumeRolePolicyDocument) {
        try {
          docObj = JSON.parse(decodeURIComponent(r.AssumeRolePolicyDocument));
        } catch {
          docObj = { raw: r.AssumeRolePolicyDocument };
        }
      }

      const attachedRes = await iam.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
      const attachedPolicies = (attachedRes.AttachedPolicies ?? []).map((p) => ({
        name: p.PolicyName ?? "",
        arn: p.PolicyArn ?? "",
      }));

      roleMeta = {
        roleName: r.RoleName ?? roleName,
        roleId: r.RoleId ?? "—",
        arn: r.Arn ?? `arn:aws:iam::000000000000:role/${roleName}`,
        description: r.Description ?? "",
        createDate: r.CreateDate ? new Date(r.CreateDate).toLocaleString() : "—",
        assumeRolePolicyDocument: docObj,
        attachedPolicies,
      };

      const policiesRes = await iam.send(
        new ListPoliciesCommand({ Scope: "All", MaxItems: 200 })
      );
      allPolicies = (policiesRes.Policies ?? [])
        .map((p) => ({
          name: p.PolicyName ?? "",
          arn: p.Arn ?? p.PolicyArn ?? "",
        }))
        .filter((p) => p.name && p.arn)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      {error ? (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
          Error: {error}
        </div>
      ) : roleMeta ? (
        <RoleDetail role={roleMeta} allPolicies={allPolicies} />
      ) : (
        <div className="text-[13px] text-[#545b64]">Role not found.</div>
      )}
    </ServiceLayout>
  );
}
