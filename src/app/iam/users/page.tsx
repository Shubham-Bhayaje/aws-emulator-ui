/**
 * IAM Users list page – Server component.
 * Lists all users with attached policy counts.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { iam } from "@/lib/aws";
import {
  ListUsersCommand,
  ListAttachedUserPoliciesCommand,
} from "@aws-sdk/client-iam";
import { UserActions, UserSummary } from "./UserActions";
import { iamNav } from "../page";

export default async function IAMUsersPage() {
  let users: UserSummary[] = [];
  let error: string | null = null;

  try {
    const res = await iam.send(new ListUsersCommand({}));
    const rawUsers = res.Users ?? [];

    users = await Promise.all(
      rawUsers.map(async (u) => {
        const userName = u.UserName ?? "unknown";
        let policyCount = 0;
        try {
          const attached = await iam.send(
            new ListAttachedUserPoliciesCommand({ UserName: userName })
          );
          policyCount = attached.AttachedPolicies?.length ?? 0;
        } catch { /* ignore */ }

        return {
          userName,
          userId: u.UserId ?? "—",
          arn: u.Arn ?? "—",
          createDate: u.CreateDate
            ? new Date(u.CreateDate).toLocaleString()
            : "—",
          policyCount,
        };
      })
    );
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Users</h1>
        <p className="text-[13px] text-[#545b64] mb-4">
          IAM users are entities that you create in AWS to represent the people or
          applications that interact with AWS.
        </p>

        {error ? (
          <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
            Error: {error}
          </div>
        ) : (
          <UserActions users={users} />
        )}
      </div>
    </ServiceLayout>
  );
}
