/**
 * IAM Dashboard – Server component matching the real AWS IAM Console Dashboard.
 * Displays metric summary cards, quick access actions, and account details.
 */

import Link from "next/link";
import ServiceLayout from "@/components/ServiceLayout";
import { iam } from "@/lib/aws";
import {
  ListUsersCommand,
  ListRolesCommand,
  ListPoliciesCommand,
} from "@aws-sdk/client-iam";

export const iamNav = [
  { label: "Dashboard", href: "/iam" },
  { label: "Users", href: "/iam/users" },
  { label: "Roles", href: "/iam/roles" },
  { label: "Policies", href: "/iam/policies" },
];

export default async function IAMDashboardPage() {
  let userCount = 0;
  let roleCount = 0;
  let policyCount = 0;
  let customPolicyCount = 0;
  let accountId = "000000000000";

  try {
    const [usersRes, rolesRes, policiesRes] = await Promise.all([
      iam.send(new ListUsersCommand({})),
      iam.send(new ListRolesCommand({})),
      iam.send(new ListPoliciesCommand({ Scope: "All", MaxItems: 100 })),
    ]);

    userCount = usersRes.Users?.length ?? 0;
    roleCount = rolesRes.Roles?.length ?? 0;
    policyCount = policiesRes.Policies?.length ?? 0;

    const customPoliciesRes = await iam.send(
      new ListPoliciesCommand({ Scope: "Local" })
    );
    customPolicyCount = customPoliciesRes.Policies?.length ?? 0;
  } catch (err) {
    console.error("Error fetching IAM summary:", err);
  }

  return (
    <ServiceLayout serviceName="IAM" serviceColor="#BD0816" navItems={iamNav}>
      <div className="space-y-6 max-w-[1200px]">
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] mb-1">IAM dashboard</h1>
          <p className="text-[13px] text-[#545b64]">
            AWS Identity and Access Management (IAM) manages identity, access, and permissions for your AWS resources.
          </p>
        </div>

        {/* Top Grid: IAM resources summary & Account details */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* IAM Resources Summary */}
          <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
            <div className="px-5 py-3.5 border-b border-[#eaeded] flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#16191f]">IAM resources</h2>
              <span className="text-[12px] text-[#545b64]">Global region</span>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Users Tile */}
              <Link
                href="/iam/users"
                className="p-4 border border-[#eaeded] rounded hover:border-[#0073bb] hover:bg-[#f2f8fd] transition-colors group"
              >
                <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider mb-1">
                  Users
                </div>
                <div className="text-[28px] font-bold text-[#0073bb] group-hover:text-[#ec7211]">
                  {userCount}
                </div>
                <div className="text-[11px] text-[#545b64] mt-1">Manage IAM users</div>
              </Link>

              {/* Roles Tile */}
              <Link
                href="/iam/roles"
                className="p-4 border border-[#eaeded] rounded hover:border-[#0073bb] hover:bg-[#f2f8fd] transition-colors group"
              >
                <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider mb-1">
                  Roles
                </div>
                <div className="text-[28px] font-bold text-[#0073bb] group-hover:text-[#ec7211]">
                  {roleCount}
                </div>
                <div className="text-[11px] text-[#545b64] mt-1">Manage IAM roles</div>
              </Link>

              {/* Policies Tile */}
              <Link
                href="/iam/policies"
                className="p-4 border border-[#eaeded] rounded hover:border-[#0073bb] hover:bg-[#f2f8fd] transition-colors group"
              >
                <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider mb-1">
                  Policies
                </div>
                <div className="text-[28px] font-bold text-[#0073bb] group-hover:text-[#ec7211]">
                  {policyCount}+
                </div>
                <div className="text-[11px] text-[#545b64] mt-1">
                  {customPolicyCount} customer managed
                </div>
              </Link>
            </div>

            {/* Quick Actions Bar */}
            <div className="px-5 py-3 border-t border-[#eaeded] bg-[#fafafa] flex flex-wrap gap-2 rounded-b">
              <Link
                href="/iam/users/create"
                className="px-3 py-1.5 text-[12px] bg-[#ec7211] text-white rounded-sm font-medium hover:bg-[#eb5f07]"
              >
                + Add user
              </Link>
              <Link
                href="/iam/roles/create"
                className="px-3 py-1.5 text-[12px] border border-[#545b64] text-[#16191f] rounded-sm hover:bg-[#f2f3f3]"
              >
                + Create role
              </Link>
              <Link
                href="/iam/policies/create"
                className="px-3 py-1.5 text-[12px] border border-[#545b64] text-[#16191f] rounded-sm hover:bg-[#f2f3f3]"
              >
                + Create policy
              </Link>
            </div>
          </div>

          {/* Account Details Card */}
          <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
            <div className="px-5 py-3.5 border-b border-[#eaeded]">
              <h2 className="text-[15px] font-bold text-[#16191f]">AWS Account</h2>
            </div>
            <div className="p-5 space-y-4 text-[13px]">
              <div>
                <div className="text-[11px] text-[#545b64] font-bold uppercase mb-0.5">
                  Account ID
                </div>
                <div className="font-mono text-[#16191f] bg-[#f2f3f3] px-2 py-1 rounded inline-block">
                  {accountId}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64] font-bold uppercase mb-0.5">
                  Sign-in URL for IAM users
                </div>
                <div className="text-[12px] text-[#0073bb] font-mono break-all">
                  https://{accountId}.signin.aws.amazon.com/console
                </div>
              </div>
              <div className="pt-2 border-t border-[#eaeded] text-[12px] text-[#545b64]">
                Connected to local AWS Emulator with full IAM role delegation and policy
                simulation.
              </div>
            </div>
          </div>
        </div>

        {/* Security Best Practices Card */}
        <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow p-5">
          <h2 className="text-[15px] font-bold text-[#16191f] mb-3">
            Security status & best practices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
            <div className="p-3 bg-[#f2f8fd] border border-[#cbe2f2] rounded">
              <div className="font-bold text-[#0073bb] mb-1">Least Privilege</div>
              <p className="text-[#545b64]">
                Grant only the permissions required to perform specific business tasks.
              </p>
            </div>
            <div className="p-3 bg-[#f2f8fd] border border-[#cbe2f2] rounded">
              <div className="font-bold text-[#0073bb] mb-1">IAM Roles</div>
              <p className="text-[#545b64]">
                Use roles for applications and AWS services like Lambda and EC2 instead of long-term credentials.
              </p>
            </div>
            <div className="p-3 bg-[#f2f8fd] border border-[#cbe2f2] rounded">
              <div className="font-bold text-[#0073bb] mb-1">Policy Inspection</div>
              <p className="text-[#545b64]">
                Inspect policy documents to review allowed actions, effects, and target resources.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ServiceLayout>
  );
}
