/**
 * src/app/iam/user-groups/[group]/UserGroupDetail.tsx – User Group Details with Users and Permissions Tabs.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addUserToGroupAction,
  removeUserFromGroupAction,
  attachGroupPolicyAction,
  detachGroupPolicyAction,
  deleteGroup,
  inspectPolicy,
} from "../../actions";

interface Props {
  group: { name: string; id: string; arn: string; createDate: string };
  users: Array<{ userName: string; userId: string; arn: string; createDate: string }>;
  attachedPolicies: Array<{ name: string; arn: string }>;
  allUsers: Array<{ userName: string; userId: string }>;
  allPolicies: Array<{ name: string; arn: string; isAWSManaged: boolean }>;
}

export function UserGroupDetail({
  group,
  users,
  attachedPolicies,
  allUsers,
  allPolicies,
}: Props) {
  const [activeTab, setActiveTab] = useState<"users" | "permissions">("users");

  // Modals
  const [showAddUsersModal, setShowAddUsersModal] = useState(false);
  const [showAttachPolicyModal, setShowAttachPolicyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Inspect Policy Document Modal
  const [inspectedPolicy, setInspectedPolicy] = useState<{
    name: string;
    arn: string;
    document: any;
  } | null>(null);

  // Selections in modals
  const [selectedUserToAdd, setSelectedUserToAdd] = useState("");
  const [selectedPolicyToAttach, setSelectedPolicyToAttach] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [policySearch, setPolicySearch] = useState("");

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Users not currently in group
  const availableUsersToAdd = allUsers.filter(
    (u) => !users.some((mem) => mem.userName === u.userName)
  );

  // Policies not currently attached
  const availablePoliciesToAttach = allPolicies.filter(
    (p) => !attachedPolicies.some((att) => att.arn === p.arn)
  );

  async function handleInspect(policyArn: string, policyName: string) {
    const res = await inspectPolicy(policyArn);
    if (res.policy) {
      setInspectedPolicy({
        name: policyName,
        arn: policyArn,
        document: res.document,
      });
    }
  }

  function handleAddUser() {
    if (!selectedUserToAdd) return;
    startTransition(async () => {
      const res = await addUserToGroupAction(selectedUserToAdd, group.name);
      if (res.success) {
        setShowAddUsersModal(false);
        setSelectedUserToAdd("");
        router.refresh();
        setFeedback(`User "${selectedUserToAdd}" added to group successfully.`);
      } else {
        setFeedback(`Failed to add user: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleRemoveUser(userName: string) {
    startTransition(async () => {
      const res = await removeUserFromGroupAction(userName, group.name);
      if (res.success) {
        router.refresh();
        setFeedback(`User "${userName}" removed from group.`);
      } else {
        setFeedback(`Failed to remove user: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleAttachPolicy() {
    if (!selectedPolicyToAttach) return;
    startTransition(async () => {
      const res = await attachGroupPolicyAction(group.name, selectedPolicyToAttach);
      if (res.success) {
        setShowAttachPolicyModal(false);
        setSelectedPolicyToAttach("");
        router.refresh();
        setFeedback("Policy attached to group successfully.");
      } else {
        setFeedback(`Failed to attach policy: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDetachPolicy(policyArn: string) {
    startTransition(async () => {
      const res = await detachGroupPolicyAction(group.name, policyArn);
      if (res.success) {
        router.refresh();
        setFeedback("Policy detached from group.");
      } else {
        setFeedback(`Failed to detach policy: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDeleteGroup() {
    if (deleteConfirm !== group.name) return;
    startTransition(async () => {
      const res = await deleteGroup(group.name);
      if (res.success) {
        router.push("/iam/user-groups");
      } else {
        setFeedback(`Failed to delete group: ${res.error || "Unknown error"}`);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-[#16191f]">{group.name}</h1>
            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-[#f2f3f3] text-[#545b64]">
              User group
            </span>
          </div>
          <p className="text-[12px] text-[#545b64] font-mono mt-0.5">{group.arn}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/iam/user-groups"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
          >
            User groups
          </Link>
          <button
            onClick={() => {
              setDeleteConfirm("");
              setShowDeleteModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 border border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1] rounded-sm text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors bg-white"
          >
            Delete group
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-sm border text-[13px] flex items-center justify-between ${
            feedback.includes("Failed")
              ? "bg-[#fdf3f1] border-[#d13212] text-[#d13212]"
              : "bg-[#f2f8fd] border-[#0073bb] text-[#0073bb]"
          }`}
        >
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-[12px] font-bold hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Box */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-6 text-[13px]">
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">Group ID</div>
          <div className="font-mono text-[#16191f] mt-1">{group.id}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">Creation time</div>
          <div className="text-[#16191f] mt-1">{group.createDate}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">Active members</div>
          <div className="text-[#0073bb] font-bold mt-1">{users.length} users</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs">
        <div className="border-b border-[#eaeded] flex items-center px-4">
          <button
            onClick={() => setActiveTab("users")}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("permissions")}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
              activeTab === "permissions"
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Permissions ({attachedPolicies.length})
          </button>
        </div>

        <div className="p-5">
          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaeded]">
                <div>
                  <h3 className="text-[14px] font-bold text-[#16191f]">
                    Group members ({users.length})
                  </h3>
                  <p className="text-[12px] text-[#545b64]">
                    Users in this group inherit permissions from policies attached to this group.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUsersModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                >
                  Add users to group
                </button>
              </div>

              {users.length === 0 ? (
                <div className="p-8 text-center bg-[#fafafa] border border-[#eaeded] rounded-sm">
                  <p className="text-[13px] font-bold text-[#16191f]">No users in this group</p>
                  <p className="text-[12px] text-[#545b64] mt-1 mb-4">
                    Add IAM users to this group to grant them permissions.
                  </p>
                  <button
                    onClick={() => setShowAddUsersModal(true)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                  >
                    Add users to group
                  </button>
                </div>
              ) : (
                <div className="border border-[#eaeded] rounded-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">User name</th>
                        <th className="py-2.5 px-3">User ID</th>
                        <th className="py-2.5 px-3">ARN</th>
                        <th className="py-2.5 px-3">Created</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                      {users.map((u) => (
                        <tr key={u.userName} className="hover:bg-[#fafafa]">
                          <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                            <Link href={`/iam/users/${encodeURIComponent(u.userName)}`} className="hover:underline">
                              {u.userName}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">{u.userId}</td>
                          <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64] max-w-[260px] truncate">
                            {u.arn}
                          </td>
                          <td className="py-2.5 px-3 text-[#545b64] text-[12px]">{u.createDate}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleRemoveUser(u.userName)}
                              disabled={isPending}
                              className="text-[12px] font-bold text-[#d13212] hover:underline"
                            >
                              Remove from group
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === "permissions" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaeded]">
                <div>
                  <h3 className="text-[14px] font-bold text-[#16191f]">
                    Attached permissions policies ({attachedPolicies.length})
                  </h3>
                  <p className="text-[12px] text-[#545b64]">
                    Policies attached to this group apply to all group members.
                  </p>
                </div>
                <button
                  onClick={() => setShowAttachPolicyModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                >
                  Attach policies
                </button>
              </div>

              {attachedPolicies.length === 0 ? (
                <div className="p-8 text-center bg-[#fafafa] border border-[#eaeded] rounded-sm">
                  <p className="text-[13px] font-bold text-[#16191f]">No policies attached</p>
                  <p className="text-[12px] text-[#545b64] mt-1 mb-4">
                    Attach IAM policies to define what AWS services and resources group members can access.
                  </p>
                  <button
                    onClick={() => setShowAttachPolicyModal(true)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                  >
                    Attach policies
                  </button>
                </div>
              ) : (
                <div className="border border-[#eaeded] rounded-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Policy name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Policy ARN</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                      {attachedPolicies.map((p) => {
                        const isAWSManaged = p.arn.includes(":aws:policy");
                        return (
                          <tr key={p.arn} className="hover:bg-[#fafafa]">
                            <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                              <button
                                onClick={() => handleInspect(p.arn, p.name)}
                                className="hover:underline text-left"
                              >
                                {p.name}
                              </button>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#16191f]">
                                {isAWSManaged ? "AWS managed" : "Customer managed"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64] max-w-[280px] truncate">
                              {p.arn}
                            </td>
                            <td className="py-2.5 px-3 text-right space-x-3">
                              <button
                                onClick={() => handleInspect(p.arn, p.name)}
                                className="text-[12px] font-bold text-[#0073bb] hover:underline"
                              >
                                View policy
                              </button>
                              <button
                                onClick={() => handleDetachPolicy(p.arn)}
                                disabled={isPending}
                                className="text-[12px] font-bold text-[#d13212] hover:underline"
                              >
                                Detach
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add User to Group Modal */}
      {showAddUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Add user to {group.name}</h3>
              <button
                type="button"
                onClick={() => setShowAddUsersModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Select an IAM user to add:
              </label>
              {availableUsersToAdd.length === 0 ? (
                <p className="text-[13px] text-[#545b64] p-3 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                  All existing IAM users are already members of this group.
                </p>
              ) : (
                <select
                  value={selectedUserToAdd}
                  onChange={(e) => setSelectedUserToAdd(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
                >
                  <option value="">-- Choose a user --</option>
                  {availableUsersToAdd.map((u) => (
                    <option key={u.userName} value={u.userName}>
                      {u.userName} ({u.userId})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAddUsersModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddUser}
                disabled={!selectedUserToAdd || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
              >
                {isPending ? "Adding..." : "Add to group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attach Policy to Group Modal */}
      {showAttachPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Attach policy to {group.name}</h3>
              <button
                type="button"
                onClick={() => setShowAttachPolicyModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Select an IAM managed policy:
              </label>
              <select
                value={selectedPolicyToAttach}
                onChange={(e) => setSelectedPolicyToAttach(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
              >
                <option value="">-- Choose a policy --</option>
                {availablePoliciesToAttach.map((p) => (
                  <option key={p.arn} value={p.arn}>
                    {p.name} ({p.isAWSManaged ? "AWS managed" : "Customer managed"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAttachPolicyModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAttachPolicy}
                disabled={!selectedPolicyToAttach || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
              >
                {isPending ? "Attaching..." : "Attach policy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Policy Document Modal */}
      {inspectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-[#eaeded] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-[17px] font-bold text-[#16191f]">{inspectedPolicy.name}</h3>
                <p className="text-[11px] font-mono text-[#545b64] mt-0.5">{inspectedPolicy.arn}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedPolicy(null)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-[#16191f]">
              <pre className="text-[12px] font-mono text-[#59cbe8] whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(inspectedPolicy.document, null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t border-[#eaeded] flex items-center justify-end flex-shrink-0 bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setInspectedPolicy(null)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete user group</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete user group <strong className="text-[#16191f]">{group.name}</strong>?
            </p>
            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Type the group name to confirm:
              </label>
              <input
                type="text"
                placeholder={group.name}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
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
                onClick={handleDeleteGroup}
                disabled={deleteConfirm !== group.name || isPending}
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
