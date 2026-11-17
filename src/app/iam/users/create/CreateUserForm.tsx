/**
 * CreateUserForm – Form for creating an IAM user.
 * Allows entering user name and selecting an initial policy attachment.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createUser } from "../../actions";

interface PolicyOption {
  name: string;
  arn: string;
}

interface CreateUserFormProps {
  policies: PolicyOption[];
}

export function CreateUserForm({ policies }: CreateUserFormProps) {
  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [policySearch, setPolicySearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredPolicies = policies.filter((p) =>
    p.name.toLowerCase().includes(policySearch.toLowerCase())
  );

  async function handleSubmit(formData: FormData) {
    setError(null);
    if (selectedPolicy) {
      formData.set("policyArn", selectedPolicy);
    }

    startTransition(async () => {
      const res = await createUser(formData);
      if (res && res.error) {
        setError(res.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-[800px]">
      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      {/* User details */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">User details</h2>
          <p className="text-[12px] text-[#545b64]">
            Specify user details including user name.
          </p>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#16191f] mb-1">
            User name <span className="text-[#d13212]">*</span>
          </label>
          <input
            type="text"
            name="userName"
            required
            placeholder="e.g. dev-user"
            className="w-full max-w-[420px] border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
          />
          <p className="text-[11px] text-[#545b64] mt-1">
            Can include letters, numbers, and symbols: +=,.@-
          </p>
        </div>
      </div>

      {/* Permissions Section */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Set permissions (optional)</h2>
          <p className="text-[12px] text-[#545b64]">
            Attach an existing policy directly to give this user access to AWS services.
          </p>
        </div>

        <div>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Filter policies..."
              value={policySearch}
              onChange={(e) => setPolicySearch(e.target.value)}
              className="w-full max-w-[360px] border border-[#aab7b8] rounded px-3 py-1 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb]"
            />
          </div>

          <div className="max-h-[260px] overflow-y-auto border border-[#eaeded] rounded divide-y divide-[#eaeded]">
            <label className="flex items-center gap-3 px-3 py-2 hover:bg-[#f2f8fd] cursor-pointer">
              <input
                type="radio"
                name="policySelection"
                checked={selectedPolicy === ""}
                onChange={() => setSelectedPolicy("")}
                className="text-[#0073bb] focus:ring-[#0073bb]"
              />
              <div>
                <div className="text-[13px] font-medium text-[#16191f]">
                  No permissions (Attach later)
                </div>
                <div className="text-[11px] text-[#545b64]">
                  User will not have any policy attached initially.
                </div>
              </div>
            </label>

            {filteredPolicies.map((policy) => (
              <label
                key={policy.arn}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[#f2f8fd] cursor-pointer"
              >
                <input
                  type="radio"
                  name="policySelection"
                  checked={selectedPolicy === policy.arn}
                  onChange={() => setSelectedPolicy(policy.arn)}
                  className="text-[#0073bb] focus:ring-[#0073bb]"
                />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[#0073bb]">
                    {policy.name}
                  </div>
                  <div className="text-[11px] text-[#545b64] font-mono truncate">
                    {policy.arn}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/iam/users"
          className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-1.5 text-[13px] bg-[#ec7211] text-white rounded-sm font-medium hover:bg-[#eb5f07] transition-colors disabled:opacity-50"
        >
          {isPending ? "Creating user..." : "Create user"}
        </button>
      </div>
    </form>
  );
}
