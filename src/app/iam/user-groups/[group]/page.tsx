/**
 * src/app/iam/user-groups/[group]/page.tsx – User Group Detail Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import { notFound } from "next/navigation";
import ServiceLayout from "@/components/ServiceLayout";
import { iamNav } from "../../page";
import { fetchGroupDetail } from "../../actions";
import { iam } from "@/lib/aws";
import { ListUsersCommand, ListPoliciesCommand } from "@aws-sdk/client-iam";
import { UserGroupDetail } from "./UserGroupDetail";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ group: string }>;
}

export default async function UserGroupDetailPage({ params }: PageProps) {
  const { group: groupNameEncoded } = await params;
  const groupName = decodeURIComponent(groupNameEncoded);

  const [detailRes, usersRes, policiesRes] = await Promise.all([
    fetchGroupDetail(groupName),
    iam.send(new ListUsersCommand({})).catch(() => ({ Users: [] })),
    iam.send(new ListPoliciesCommand({ Scope: "All", MaxItems: 100 })).catch(() => ({ Policies: [] })),
  ]);

  if (!detailRes.success || !detailRes.group) {
    notFound();
  }

  const allUsers = (usersRes.Users || []).map((u) => ({
    userName: u.UserName || "",
    userId: u.UserId || "—",
  }));

  const allPolicies = (policiesRes.Policies || []).map((p) => ({
    name: p.PolicyName || "",
    arn: p.Arn || "",
    isAWSManaged: (p.Arn || "").includes(":aws:policy"),
  }));

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <UserGroupDetail
        group={detailRes.group}
        users={detailRes.users}
        attachedPolicies={detailRes.attachedPolicies}
        allUsers={allUsers}
        allPolicies={allPolicies}
      />
    </ServiceLayout>
  );
}
