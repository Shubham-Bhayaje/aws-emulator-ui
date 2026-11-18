/**
 * IAM Roles list page – Server component.
 * Lists all IAM roles with their trusted entities and checks active identity permissions.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { iam } from "@/lib/aws";
import { ListRolesCommand } from "@aws-sdk/client-iam";
import { RoleActions, RoleSummary } from "./RoleActions";
import { iamNav } from "../page";
import { getActiveIdentity } from "@/lib/identity";
import { evaluatePermissions } from "@/lib/permissions";

function extractTrustedEntity(docStr?: string): string {
  if (!docStr) return "AWS Service";
  try {
    const parsed = JSON.parse(decodeURIComponent(docStr));
    const principal = parsed.Statement?.[0]?.Principal;
    if (principal?.Service) {
      return Array.isArray(principal.Service)
        ? principal.Service.join(", ")
        : String(principal.Service);
    }
    if (principal?.AWS) {
      return "AWS Account / User";
    }
    return "Custom Principal";
  } catch {
    return "AWS Service";
  }
}

export default async function IAMRolesPage() {
  let roles: RoleSummary[] = [];
  let error: string | null = null;
  const identity = await getActiveIdentity();

  try {
    const res = await iam.send(new ListRolesCommand({}));
    const rawRoles = res.Roles ?? [];

    roles = rawRoles.map((r) => ({
      roleName: r.RoleName ?? "",
      roleId: r.RoleId ?? "—",
      arn: r.Arn ?? "—",
      description: r.Description ?? "—",
      createDate: r.CreateDate ? new Date(r.CreateDate).toLocaleString() : "—",
      trustedEntity: extractTrustedEntity(r.AssumeRolePolicyDocument),
    }));
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  const canCreateRole = evaluatePermissions(identity, "iam:CreateRole").allowed;
  const canDeleteRole = evaluatePermissions(identity, "iam:DeleteRole").allowed;

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Roles</h1>
        <p className="text-[13px] text-[#545b64] mb-4">
          An IAM role is an IAM identity that you can create in your account that has
          specific permissions.
        </p>

        {error ? (
          <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
            Error: {error}
          </div>
        ) : (
          <RoleActions
            roles={roles}
            canCreateRole={canCreateRole}
            canDeleteRole={canDeleteRole}
            activeIdentityName={identity.name}
            activeIdentityType={identity.type}
          />
        )}
      </div>
    </ServiceLayout>
  );
}
