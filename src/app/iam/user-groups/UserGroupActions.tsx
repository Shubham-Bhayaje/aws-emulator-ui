/**
 * src/app/iam/user-groups/UserGroupActions.tsx – User Groups Table & Actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserGroupSummary, deleteGroup } from "../actions";

interface Props {
  groups: UserGroupSummary[];
  canCreateGroup?: boolean;
  canDeleteGroup?: boolean;
}

export function UserGroupActions({
  groups,
  canCreateGroup = true,
  canDeleteGroup = true,
}: Props) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filtered = groups.filter((g) =>
    g.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsersInGroups = groups.reduce((acc, g) => acc + g.userCount, 0);
  const totalAttachedPolicies = groups.reduce((acc, g) => acc + g.policyCount, 0);

  function handleDelete() {
    if (!selectedGroup || confirmInput !== selectedGroup) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteGroup(selectedGroup);
      if (res && res.error) {
        setError(res.error);
      } else {
        setSelectedGroup(null);
        setShowDeleteModal(false);
        setConfirmInput("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Total User Groups
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{groups.length}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Collections of IAM users</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Users in Groups
          </div>
          <div className="text-[24px] font-bold text-[#0073bb] mt-1">{totalUsersInGroups}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Assigned group memberships</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Attached Policies
          </div>
          <div className="text-[24px] font-bold text-[#1d8102] mt-1">{totalAttachedPolicies}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Inherited group permissions</div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold text-[12px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs">
        {/* Header Bar */}
        <div className="px-4 py-3 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-bold text-[#16191f]">
              User groups ({filtered.length})
            </h2>
            <div className="relative w-[280px]">
              <input
                type="text"
                placeholder="Filter user groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
              />
              <svg
                className="absolute left-2.5 top-2.5 text-[#545b64]"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedGroup) {
                  router.push(`/iam/user-groups/${encodeURIComponent(selectedGroup)}`);
                }
              }}
              disabled={!selectedGroup}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`h-[32px] px-3 border rounded-sm text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                selectedGroup
                  ? "border-[#aab7b8] text-[#16191f] bg-white hover:bg-[#f2f3f3]"
                  : "border-[#eaeded] text-[#aab7b8] cursor-not-allowed bg-white"
              }`}
            >
              View details
            </button>

            <button
              onClick={() => {
                setConfirmInput("");
                setShowDeleteModal(true);
              }}
              disabled={!selectedGroup || !canDeleteGroup}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`h-[32px] px-3 border rounded-sm text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                selectedGroup && canDeleteGroup
                  ? "border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1] bg-white"
                  : "border-[#eaeded] text-[#aab7b8] cursor-not-allowed bg-white"
              }`}
            >
              Delete group
            </button>

            <Link
              href="/iam/user-groups/create"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
            >
              Create group
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-4">Group name</th>
                <th className="py-2.5 px-3">Users</th>
                <th className="py-2.5 px-3">Attached policies</th>
                <th className="py-2.5 px-3">Creation time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#545b64]">
                    No user groups found. Click &quot;Create group&quot; to organize IAM users.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => {
                  const isSelected = selectedGroup === g.groupName;
                  return (
                    <tr
                      key={g.groupName}
                      onClick={() => setSelectedGroup(g.groupName)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedGroup"
                          checked={isSelected}
                          onChange={() => setSelectedGroup(g.groupName)}
                          className="accent-[#0073bb] cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                        <Link
                          href={`/iam/user-groups/${encodeURIComponent(g.groupName)}`}
                          className="hover:underline"
                        >
                          {g.groupName}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#16191f]">
                          {g.userCount} user{g.userCount === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#16191f]">
                          {g.policyCount} polic{g.policyCount === 1 ? "y" : "ies"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64] text-[12px]">{g.createDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Group Modal */}
      {showDeleteModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete user group</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete user group <strong className="text-[#16191f]">{selectedGroup}</strong>?
              Users in this group will lose permissions granted through this group.
            </p>
            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                To confirm deletion, enter the group name:
              </label>
              <input
                type="text"
                placeholder={selectedGroup}
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmInput !== selectedGroup || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#d13212] text-white rounded-sm text-[13px] font-bold hover:bg-[#b02008] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
