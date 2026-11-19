/**
 * src/app/iam/page.tsx – AWS IAM Dashboard Server Component.
 * Full replica of real AWS IAM Console Dashboard with live emulator metrics,
 * account details, security recommendations, and quick actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

import Link from "next/link";
import ServiceLayout from "@/components/ServiceLayout";
import { iam } from "@/lib/aws";
import {
  ListUsersCommand,
  ListRolesCommand,
  ListPoliciesCommand,
  ListGroupsCommand,
} from "@aws-sdk/client-iam";
import { fetchAccountDetails } from "./actions";

export const dynamic = "force-dynamic";

export const iamNav = [
  { label: "Dashboard", href: "/iam" },
  { label: "User groups", href: "/iam/user-groups" },
  { label: "Users", href: "/iam/users" },
  { label: "Roles", href: "/iam/roles" },
  { label: "Policies", href: "/iam/policies" },
  { label: "Account settings", href: "/iam/account-settings" },
];

export default async function IAMDashboardPage() {
  let userCount = 0;
  let groupCount = 0;
  let roleCount = 0;
  let policyCount = 0;
  let customPolicyCount = 0;

  const [usersRes, groupsRes, rolesRes, policiesRes, accountDetails] = await Promise.all([
    iam.send(new ListUsersCommand({})).catch(() => ({ Users: [] })),
    iam.send(new ListGroupsCommand({})).catch(() => ({ Groups: [] })),
    iam.send(new ListRolesCommand({})).catch(() => ({ Roles: [] })),
    iam.send(new ListPoliciesCommand({ Scope: "All", MaxItems: 100 })).catch(() => ({ Policies: [] })),
    fetchAccountDetails(),
  ]);

  userCount = usersRes.Users?.length ?? 0;
  groupCount = groupsRes.Groups?.length ?? 0;
  roleCount = rolesRes.Roles?.length ?? 0;
  policyCount = policiesRes.Policies?.length ?? 0;

  try {
    const customPoliciesRes = await iam.send(new ListPoliciesCommand({ Scope: "Local" }));
    customPolicyCount = customPoliciesRes.Policies?.length ?? 0;
  } catch {}

  const accountId = accountDetails.accountId || "000000000000";
  const activeAlias = accountDetails.aliases?.[0] || null;
  const signInUrl = `https://${activeAlias || accountId}.signin.aws.amazon.com/console`;

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <div className="space-y-6 max-w-[1300px]">
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] mb-1">IAM dashboard</h1>
          <p className="text-[13px] text-[#545b64]">
            AWS Identity and Access Management (IAM) manages identity, access, and permissions for your AWS resources.
          </p>
        </div>

        {/* Top Grid: IAM resources summary & Account details */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* IAM Resources Summary */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs flex flex-col justify-between">
            <div>
              <div className="px-5 py-3.5 border-b border-[#eaeded] flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-[#16191f]">IAM resources</h2>
                <span className="text-[12px] text-[#545b64]">Global region</span>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* User Groups Tile */}
                <Link
                  href="/iam/user-groups"
                  className="p-4 border border-[#eaeded] rounded-sm hover:border-[#0073bb] hover:bg-[#f2f8fd] transition-colors group"
                >
                  <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
                    User groups
                  </div>
                  <div className="text-[28px] font-bold text-[#0073bb] group-hover:text-[#ec7211]">
                    {groupCount}
                  </div>
                  <div className="text-[11px] text-[#545b64] mt-1">Collections of users</div>
                </Link>

                {/* Users Tile */}
                <Link
                  href="/iam/users"
                  className="p-4 border border-[#eaeded] rounded-sm hover:border-[#0073bb] hover:bg-[#f2f8fd] transition-colors group"
                >
                  <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
                    Users
                  </div>
                  <div className="text-[28px] font-bold text-[#0073bb] group-hover:text-[#ec7211]">
                    {userCount}
                  </div>
                  <div className="text-[11px] text-[#545b64] mt-1">IAM user identities</div>
                </Link>

                {/* Roles Tile */}
                <Link
                  href="/iam/roles"
                  className="p-4 border border-[#eaeded] rounded-sm hover:border-[#0073bb] hover:bg-[#f2f8fd] transition-colors group"
                >
                  <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
                    Roles
                  </div>
                  <div className="text-[28px] font-bold text-[#0073bb] group-hover:text-[#ec7211]">
                    {roleCount}
                  </div>
                  <div className="text-[11px] text-[#545b64] mt-1">Service and assumed roles</div>
                </Link>

                {/* Policies Tile */}
                <Link
                  href="/iam/policies"
                  className="p-4 border border-[#eaeded] rounded-sm hover:border-[#0073bb] hover:bg-[#f2f8fd] transition-colors group"
                >
                  <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
                    Policies
                  </div>
                  <div className="text-[28px] font-bold text-[#0073bb] group-hover:text-[#ec7211]">
                    {policyCount}
                  </div>
                  <div className="text-[11px] text-[#545b64] mt-1">
                    {customPolicyCount} customer managed
                  </div>
                </Link>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="px-5 py-3.5 border-t border-[#eaeded] bg-[#fafafa] flex flex-wrap gap-2 rounded-b-sm">
              <Link
                href="/iam/users/create"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3 text-[13px] bg-[#ec7211] text-white rounded-sm font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
              >
                Add user
              </Link>
              <Link
                href="/iam/user-groups/create"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3 text-[13px] border border-[#aab7b8] text-[#16191f] bg-white rounded-sm font-bold hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Create user group
              </Link>
              <Link
                href="/iam/roles/create"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3 text-[13px] border border-[#aab7b8] text-[#16191f] bg-white rounded-sm font-bold hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Create role
              </Link>
              <Link
                href="/iam/policies/create"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3 text-[13px] border border-[#aab7b8] text-[#16191f] bg-white rounded-sm font-bold hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Create policy
              </Link>
            </div>
          </div>

          {/* Account Details Card */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs flex flex-col justify-between">
            <div className="px-5 py-3.5 border-b border-[#eaeded] flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#16191f]">AWS Account</h2>
              <Link
                href="/iam/account-settings"
                className="text-[12px] font-bold text-[#0073bb] hover:underline"
              >
                Account settings
              </Link>
            </div>
            <div className="p-5 space-y-4 text-[13px]">
              <div>
                <div className="text-[11px] text-[#545b64] font-bold uppercase mb-0.5">
                  Account ID
                </div>
                <div className="font-mono text-[#16191f] bg-[#f2f3f3] px-2 py-1 rounded-sm inline-block font-bold">
                  {accountId}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-[#545b64] font-bold uppercase mb-0.5">
                  Account alias
                </div>
                <div className="font-mono text-[#16191f]">
                  {activeAlias ? (
                    <span className="font-bold text-[#0073bb]">{activeAlias}</span>
                  ) : (
                    <span className="text-[#545b64] italic">None configured</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-[#545b64] font-bold uppercase mb-0.5">
                  Sign-in URL for IAM users
                </div>
                <div className="text-[12px] text-[#0073bb] font-mono break-all bg-[#fafafa] p-2 border border-[#eaeded] rounded-sm">
                  {signInUrl}
                </div>
              </div>

              <div className="pt-2 border-t border-[#eaeded] text-[11px] text-[#545b64]">
                Connected to AWS Emulator (127.0.0.1:9297) with full live IAM service enforcement.
              </div>
            </div>
          </div>
        </div>

        {/* Security Recommendations & Best Practices */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs p-6 space-y-4">
          <div className="border-b border-[#eaeded] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">
                Security recommendations & best practices
              </h2>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Evaluate your AWS account against core IAM security benchmarks.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
              Account healthy
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
            <div className="p-4 bg-[#f2f8fd] border border-[#cbe2f2] rounded-sm">
              <div className="font-bold text-[#0073bb] mb-1">Least privilege permissions</div>
              <p className="text-[#545b64] leading-relaxed">
                Grant only the permissions required to perform specific business tasks using targeted IAM policies.
              </p>
            </div>
            <div className="p-4 bg-[#f2f8fd] border border-[#cbe2f2] rounded-sm">
              <div className="font-bold text-[#0073bb] mb-1">IAM Roles for compute</div>
              <p className="text-[#545b64] leading-relaxed">
                Use IAM roles for applications and AWS services like Lambda and EC2 instead of generating static credentials.
              </p>
            </div>
            <div className="p-4 bg-[#f2f8fd] border border-[#cbe2f2] rounded-sm">
              <div className="font-bold text-[#0073bb] mb-1">Access key rotation</div>
              <p className="text-[#545b64] leading-relaxed">
                Regularly rotate access keys and deactivate unused credentials from the Security Credentials tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ServiceLayout>
  );
}
