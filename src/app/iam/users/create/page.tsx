/**
 * src/app/iam/users/create/page.tsx – Create IAM User Page.
 * Loads policies and user groups for full AWS console replica workflow.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { iam } from "@/lib/aws";
import { ListPoliciesCommand, ListGroupsCommand } from "@aws-sdk/client-iam";
import { CreateUserForm } from "./CreateUserForm";
import { iamNav } from "../../page";
import { getActiveIdentity } from "@/lib/identity";
import { evaluatePermissions } from "@/lib/permissions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

export const dynamic = "force-dynamic";

export default async function CreateUserPage() {
  let policies: { name: string; arn: string }[] = [];
  let groups: { name: string }[] = [];
  let pageError: string | null = null;

  const identity = await getActiveIdentity();
  const canCreateUser = evaluatePermissions(identity, "iam:CreateUser").allowed;

  if (!canCreateUser && identity.type !== "admin") {
    pageError = `AccessDeniedException: User: ${identity.arn} is not authorized to perform: iam:CreateUser on resource: * because no identity-based policy allows the iam:CreateUser action`;
  }

  try {
    const [policiesRes, groupsRes] = await Promise.all([
      iam.send(new ListPoliciesCommand({ Scope: "All", MaxItems: 150 })).catch((err: any) => {
        if (!pageError) {
          pageError = err?.message || String(err);
        }
        return { Policies: [] };
      }),
      iam.send(new ListGroupsCommand({})).catch(() => ({ Groups: [] })),
    ]);

    policies = (policiesRes.Policies ?? [])
      .map((p) => ({
        name: p.PolicyName ?? "",
        arn: p.Arn ?? "",
      }))
      .filter((p) => p.name && p.arn);

    groups = (groupsRes.Groups ?? []).map((g) => ({
      name: g.GroupName ?? "",
    })).filter((g) => g.name);
  } catch (err: any) {
    if (!pageError) {
      pageError = err?.message || String(err);
    }
  }

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Add user</h1>
        <p className="text-[13px] text-[#545b64] mb-6">
          Create an IAM user, configure console access, assign user groups, and attach permissions policies.
        </p>

        {pageError && (
          <EmulatorOfflineBanner error={pageError} className="mb-6" />
        )}

        <CreateUserForm policies={policies} groups={groups} />
      </div>
    </ServiceLayout>
  );
}
