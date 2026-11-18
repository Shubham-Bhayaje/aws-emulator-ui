/**
 * IAM User detail page – Server component.
 * Loads user details, attached policies, and evaluates active identity permissions.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { iam } from "@/lib/aws";
import {
  GetUserCommand,
  ListAttachedUserPoliciesCommand,
  ListPoliciesCommand,
} from "@aws-sdk/client-iam";
import { UserDetail, UserDetailMeta } from "./UserDetail";
import { iamNav } from "../../page";
import { getActiveIdentity } from "@/lib/identity";
import { evaluatePermissions } from "@/lib/permissions";

interface PageProps {
  params: Promise<{ user: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const userName = decodeURIComponent(resolvedParams.user);

  let userMeta: UserDetailMeta | null = null;
  let allPolicies: { name: string; arn: string }[] = [];
  let error: string | null = null;
  const identity = await getActiveIdentity();

  try {
    const userRes = await iam.send(new GetUserCommand({ UserName: userName }));
    const u = userRes.User;

    if (!u) {
      error = `User "${userName}" was not found.`;
    } else {
      const attachedRes = await iam.send(
        new ListAttachedUserPoliciesCommand({ UserName: userName })
      );
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
