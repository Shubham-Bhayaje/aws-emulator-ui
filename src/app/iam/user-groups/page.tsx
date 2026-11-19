/**
 * src/app/iam/user-groups/page.tsx – IAM User Groups List Page.
 * Zero emojis, Cloudscape enterprise styling.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { fetchLiveGroups } from "../actions";
import { UserGroupActions } from "./UserGroupActions";
import { iamNav } from "../page";
import { getActiveIdentity } from "@/lib/identity";
import { evaluatePermissions } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function IAMUserGroupsPage() {
  const [{ groups = [], error }, identity] = await Promise.all([
    fetchLiveGroups(),
    getActiveIdentity(),
  ]);

  const canCreateGroup = evaluatePermissions(identity, "iam:CreateGroup").allowed;
  const canDeleteGroup = evaluatePermissions(identity, "iam:DeleteGroup").allowed;

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">User groups</h1>
        <p className="text-[13px] text-[#545b64] mb-4">
          An IAM user group is a collection of IAM users. You can use groups to specify
          permissions for multiple users, which makes permissions management easier.
        </p>

        {error ? (
          <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
            Error: {error}
          </div>
        ) : (
          <UserGroupActions
            groups={groups}
            canCreateGroup={canCreateGroup}
            canDeleteGroup={canDeleteGroup}
          />
        )}
      </div>
    </ServiceLayout>
  );
}
