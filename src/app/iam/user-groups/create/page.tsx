/**
 * src/app/iam/user-groups/create/page.tsx – Create User Group Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { iamNav } from "../../page";
import { iam } from "@/lib/aws";
import { ListUsersCommand, ListPoliciesCommand } from "@aws-sdk/client-iam";
import { CreateGroupForm } from "./CreateGroupForm";
import { getActiveIdentity } from "@/lib/identity";
import { evaluatePermissions } from "@/lib/permissions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

export const dynamic = "force-dynamic";

export default async function CreateUserGroupPage() {
  let users: Array<{ userName: string; userId: string; createDate: string }> = [];
  let policies: Array<{ name: string; arn: string; description: string; isAWSManaged: boolean }> = [];
  let pageError: string | null = null;

  const identity = await getActiveIdentity();
  const canCreateGroup = evaluatePermissions(identity, "iam:CreateGroup").allowed;

  if (!canCreateGroup && identity.type !== "admin") {
    pageError = `AccessDeniedException: User: ${identity.arn} is not authorized to perform: iam:CreateGroup on resource: * because no identity-based policy allows the iam:CreateGroup action`;
  }

  try {
    const [usersRes, policiesRes] = await Promise.all([
      iam.send(new ListUsersCommand({})).catch((err: any) => {
        if (!pageError) pageError = err?.message || String(err);
        return { Users: [] };
      }),
      iam.send(new ListPoliciesCommand({ Scope: "All", MaxItems: 100 })).catch((err: any) => {
        if (!pageError) pageError = err?.message || String(err);
        return { Policies: [] };
      }),
    ]);

    users = (usersRes.Users || []).map((u) => ({
      userName: u.UserName || "",
      userId: u.UserId || "—",
      createDate: u.CreateDate ? new Date(u.CreateDate).toLocaleString() : "—",
    }));

    policies = (policiesRes.Policies || []).map((p) => ({
      name: p.PolicyName || "",
      arn: p.Arn || "",
      description: p.Description || "IAM policy",
      isAWSManaged: (p.Arn || "").includes(":aws:policy"),
    }));
  } catch (err: any) {
    if (!pageError) {
      pageError = err?.message || String(err);
    }
  }

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Create user group</h1>
        <p className="text-[13px] text-[#545b64] mb-6">
          Specify a group name, add users, and attach permissions policies.
        </p>

        {pageError && (
          <EmulatorOfflineBanner error={pageError} className="mb-6" />
        )}

        <CreateGroupForm users={users} policies={policies} />
      </div>
    </ServiceLayout>
  );
}
