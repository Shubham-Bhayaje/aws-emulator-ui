/**
 * src/app/iam/user-groups/create/CreateGroupForm.tsx – AWS Replica Create User Group Wizard.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createGroupWithDetails } from "../../actions";

interface Props {
  users: Array<{ userName: string; userId: string; createDate: string }>;
  policies: Array<{ name: string; arn: string; description: string; isAWSManaged: boolean }>;
}

export function CreateGroupForm({ users, policies }: Props) {
  const [groupName, setGroupName] = useState("");
  const [selectedUserNames, setSelectedUserNames] = useState<string[]>([]);
  const [selectedPolicyArns, setSelectedPolicyArns] = useState<string[]>([]);

  const [userSearch, setUserSearch] = useState("");
  const [policySearch, setPolicySearch] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredUsers = users.filter((u) =>
    u.userName.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPolicies = policies.filter(
    (p) =>
      p.name.toLowerCase().includes(policySearch.toLowerCase()) ||
      p.description.toLowerCase().includes(policySearch.toLowerCase())
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) {
      setError("User group name is required.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await createGroupWithDetails({
        groupName: groupName.trim(),
        userNames: selectedUserNames,
        policyArns: selectedPolicyArns,
      });

      if (res.success) {
        router.push("/iam/user-groups");
      } else {
        setError(res.error || "Failed to create user group.");
      }
    });
  }

  function toggleUser(name: string) {
    setSelectedUserNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  function togglePolicy(arn: string) {
    setSelectedPolicyArns((prev) =>
      prev.includes(arn) ? prev.filter((a) => a !== arn) : [...prev, arn]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-[1000px]">
      {error && (
        <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      {/* Step 1: Group Name */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Group details</h2>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Specify a unique name for the user group.
          </p>
        </div>

        <div>
          <label className="block text-[12px] font-bold text-[#16191f] mb-1">
            User group name <span className="text-[#d13212]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Developers"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
          />
          <p className="text-[11px] text-[#545b64] mt-1">
            Can contain alphanumeric characters, underscores, and hyphens.
          </p>
        </div>
      </div>

      {/* Step 2: Add Users */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">
            Add users to the group (Optional)
          </h2>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Selected users will become members of this user group and inherit its permissions.
          </p>
        </div>

        <div className="border border-[#eaeded] rounded-sm">
          <div className="p-2.5 bg-[#fafafa] border-b border-[#eaeded] flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#16191f]">
              Users ({selectedUserNames.length} of {users.length} selected)
            </span>
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-64 px-2.5 py-1 border border-[#aab7b8] rounded-sm text-[12px] bg-white text-[#16191f]"
            />
          </div>

          <div className="max-h-[220px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredUsers.length > 0 &&
                        filteredUsers.every((u) => selectedUserNames.includes(u.userName))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserNames(Array.from(new Set([...selectedUserNames, ...filteredUsers.map((u) => u.userName)])));
                        } else {
                          setSelectedUserNames(selectedUserNames.filter((n) => !filteredUsers.some((u) => u.userName === n)));
                        }
                      }}
                      className="accent-[#0073bb] cursor-pointer"
                    />
                  </th>
                  <th className="py-2 px-3">User name</th>
                  <th className="py-2 px-3">User ID</th>
                  <th className="py-2 px-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#545b64]">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isChecked = selectedUserNames.includes(u.userName);
                    return (
                      <tr
                        key={u.userName}
                        onClick={() => toggleUser(u.userName)}
                        className={`cursor-pointer transition-colors ${
                          isChecked ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                        }`}
                      >
                        <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleUser(u.userName)}
                            className="accent-[#0073bb] cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#0073bb]">{u.userName}</td>
                        <td className="py-2 px-3 font-mono text-[#545b64]">{u.userId}</td>
                        <td className="py-2 px-3 text-[#545b64]">{u.createDate}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Step 3: Attach Policies */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">
            Attach permissions policies (Optional)
          </h2>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Attach managed policies to define what AWS actions members of this group can perform.
          </p>
        </div>

        <div className="border border-[#eaeded] rounded-sm">
          <div className="p-2.5 bg-[#fafafa] border-b border-[#eaeded] flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#16191f]">
              Policies ({selectedPolicyArns.length} of {policies.length} selected)
            </span>
            <input
              type="text"
              placeholder="Search policies..."
              value={policySearch}
              onChange={(e) => setPolicySearch(e.target.value)}
              className="w-64 px-2.5 py-1 border border-[#aab7b8] rounded-sm text-[12px] bg-white text-[#16191f]"
            />
          </div>

          <div className="max-h-[260px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3 w-10 text-center"></th>
                  <th className="py-2 px-3">Policy name</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                {filteredPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#545b64]">
                      No policies found.
                    </td>
                  </tr>
                ) : (
                  filteredPolicies.map((p) => {
                    const isChecked = selectedPolicyArns.includes(p.arn);
                    return (
                      <tr
                        key={p.arn}
                        onClick={() => togglePolicy(p.arn)}
                        className={`cursor-pointer transition-colors ${
                          isChecked ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                        }`}
                      >
                        <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePolicy(p.arn)}
                            className="accent-[#0073bb] cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#0073bb]">{p.name}</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#f2f3f3] text-[#545b64]">
                            {p.isAWSManaged ? "AWS managed" : "Customer managed"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#545b64] truncate max-w-[320px]">
                          {p.description}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
        <Link
          href="/iam/user-groups"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={!groupName.trim() || isPending}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
        >
          {isPending ? "Creating group..." : "Create user group"}
        </button>
      </div>
    </form>
  );
}
