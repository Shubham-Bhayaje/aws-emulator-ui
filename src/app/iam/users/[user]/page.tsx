/**
 * src/app/iam/users/[user]/page.tsx – IAM User Detail Page.
 * Loads user details, attached policies, groups, access keys, and checks permissions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { iam } from "@/lib/aws";
import {
  GetUserCommand,
  ListAttachedUserPoliciesCommand,
  ListPoliciesCommand,
  ListGroupsCommand,
} from "@aws-sdk/client-iam";
import { UserDetail, UserDetailMeta } from "./UserDetail";
import { iamNav } from "../../page";
import { getActiveIdentity } from "@/lib/identity";
import { evaluatePermissions } from "@/lib/permissions";
import { fetchUserGroups, listAccessKeysAction, listMFADevicesAction, MFADeviceInfo } from "../../actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ user: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const userName = decodeURIComponent(resolvedParams.user);

  let userMeta: UserDetailMeta | null = null;
  let allPolicies: { name: string; arn: string }[] = [];
  let userGroups: Array<{ groupName: string; arn: string; createDate: string }> = [];
  let allGroups: Array<{ groupName: string }> = [];
  let initialAccessKeys: Array<{ accessKeyId: string; status: "Active" | "Inactive"; createDate: string }> = [];
  let initialMFADevices: MFADeviceInfo[] = [];
  let error: string | null = null;
  const identity = await getActiveIdentity();

  try {
    const [userRes, attachedRes, policiesRes, userGroupsRes, allGroupsRes, accessKeysRes, mfaDevicesRes] =
      await Promise.all([
        iam.send(new GetUserCommand({ UserName: userName })),
        iam.send(new ListAttachedUserPoliciesCommand({ UserName: userName })),
        iam.send(new ListPoliciesCommand({ Scope: "All", MaxItems: 200 })),
        fetchUserGroups(userName),
        iam.send(new ListGroupsCommand({})).catch(() => ({ Groups: [] })),
        listAccessKeysAction(userName),
        listMFADevicesAction(userName),
      ]);

    const u = userRes.User;
    if (!u) {
      error = `User "${userName}" was not found.`;
    } else {
      const attachedPolicies = (attachedRes.AttachedPolicies ?? []).map((p) => ({
        name: p.PolicyName ?? "",
        arn: p.PolicyArn ?? "",
      }));

      userMeta = {
        userName: u.UserName ?? userName,
        userId: u.UserId ?? "—",
        arn: u.Arn ?? `arn:aws:iam::000000000000:user/${userName}`,
        createDate: u.CreateDate ? new Date(u.CreateDate).toLocaleString() : "—",
        attachedPolicies,
      };

      allPolicies = (policiesRes.Policies ?? [])
        .map((p) => ({
          name: p.PolicyName ?? "",
          arn: p.Arn ?? "",
        }))
        .filter((p) => p.name && p.arn)
        .sort((a, b) => a.name.localeCompare(b.name));

      userGroups = userGroupsRes.groups || [];
      allGroups = (allGroupsRes.Groups || []).map((g) => ({ groupName: g.GroupName || "" }));
      initialAccessKeys = accessKeysRes.accessKeys || [];
      initialMFADevices = mfaDevicesRes.devices || [];
    }
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  const userArn = userMeta?.arn ?? `arn:aws:iam::${identity.accountId}:user/${userName}`;
  const canAttachPolicy = evaluatePermissions(identity, "iam:AttachUserPolicy", userArn).allowed;
  const canDetachPolicy = evaluatePermissions(identity, "iam:DetachUserPolicy", userArn).allowed;

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      {error ? (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
          Error: {error}
        </div>
      ) : userMeta ? (
        <UserDetail
          user={userMeta}
          allPolicies={allPolicies}
          userGroups={userGroups}
          allGroups={allGroups}
          initialAccessKeys={initialAccessKeys}
          initialMFADevices={initialMFADevices}
          canAttachPolicy={canAttachPolicy}
          canDetachPolicy={canDetachPolicy}
          activeIdentityName={identity.name}
          activeIdentityType={identity.type}
        />
      ) : (
        <div className="text-[13px] text-[#545b64]">User not found.</div>
      )}
    </ServiceLayout>
  );
}
