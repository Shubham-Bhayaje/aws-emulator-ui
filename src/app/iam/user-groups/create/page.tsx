/**
 * src/app/iam/user-groups/create/page.tsx – Create User Group Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { iamNav } from "../../page";
import { iam } from "@/lib/aws";
import { ListUsersCommand, ListPoliciesCommand } from "@aws-sdk/client-iam";
import { CreateGroupForm } from "./CreateGroupForm";

export const dynamic = "force-dynamic";

export default async function CreateUserGroupPage() {
  let users: Array<{ userName: string; userId: string; createDate: string }> = [];
  let policies: Array<{ name: string; arn: string; description: string; isAWSManaged: boolean }> = [];

  try {
    const [usersRes, policiesRes] = await Promise.all([
      iam.send(new ListUsersCommand({})),
      iam.send(new ListPoliciesCommand({ Scope: "All", MaxItems: 100 })),
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
  } catch (err) {
    console.error("Error fetching users or policies for group creation:", err);
  }

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Create user group</h1>
        <p className="text-[13px] text-[#545b64] mb-6">
          Specify a group name, add users, and attach permissions policies.
        </p>

        <CreateGroupForm users={users} policies={policies} />
      </div>
    </ServiceLayout>
  );
}
