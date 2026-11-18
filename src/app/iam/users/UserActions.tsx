/**
 * UserActions – Client component for IAM Users list.
 * Search, select, delete user modal, and links to user details.
 * Enforces IAM permission boundaries with authentic AWS AccessDenied messaging.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteUser } from "../actions";

export interface UserSummary {
  userName: string;
  userId: string;
  arn: string;
  createDate: string;
  policyCount: number;
}

interface UserActionsProps {
  users: UserSummary[];
  canCreateUser?: boolean;
  canDeleteUser?: boolean;
  activeIdentityName?: string;
  activeIdentityType?: string;
}

export function UserActions({
  users,
  canCreateUser = true,
  canDeleteUser = true,
  activeIdentityName = "Administrator",
  activeIdentityType = "admin",
}: UserActionsProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filteredUsers = users.filter((u) =>
    u.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleDelete() {
    if (!selectedUser || confirmInput !== selectedUser) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteUser(selectedUser);
      if (res && res.error) {
        setError(res.error);
      } else {
        setSelectedUser(null);
        setShowDeleteModal(false);
        setConfirmInput("");
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[14px] font-bold text-[#16191f]">
            Users ({filteredUsers.length})
          </h2>
          <div className="relative w-[260px]">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#545b64]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Find users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-[#aab7b8] rounded px-2.5 pl-8 py-[4px] text-[13px] text-[#16191f] placeholder-[#8d9ba8] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedUser) {
                router.push(`/iam/users/${encodeURIComponent(selectedUser)}`);
              }
            }}
            disabled={!selectedUser}
            className={`px-3 py-[4px] text-[13px] rounded-sm border font-normal ${
              selectedUser
                ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed"
            }`}
          >
            View details
          </button>
          <button
            onClick={() => {
              setError(null);
              setConfirmInput("");
              setShowDeleteModal(true);
            }}
            disabled={!selectedUser || isPending || !canDeleteUser}
            title={!canDeleteUser ? "Missing iam:DeleteUser permission" : undefined}
            className={`px-3 py-[4px] text-[13px] rounded-sm border font-normal ${
              selectedUser && !isPending && canDeleteUser
                ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed opacity-60"
            }`}
          >
            Delete user
          </button>
          {canCreateUser ? (
            <Link
              href="/iam/users/create"
              className="px-3 py-[4px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] font-medium transition-colors"
            >
              Add users
            </Link>
          ) : (
            <span
              title="Missing iam:CreateUser permission"
              className="px-3 py-[4px] text-[13px] bg-[#eaeded] text-[#879596] rounded-sm font-medium cursor-not-allowed"
            >
              Add users
            </span>
          )}
        </div>
      </div>

      {/* Permission boundary notice if restricted */}
      {!canDeleteUser && activeIdentityType !== "admin" && (
        <div className="mx-4 mt-3 p-3 bg-[#f2f8fd] border border-[#0073bb] rounded text-[12px] text-[#16191f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0073bb" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              Read-only mode active: Identity <strong>{activeIdentityName}</strong> cannot create or delete users.
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#0073bb] bg-white px-2 py-0.5 rounded border border-[#0073bb]/30">
            iam:CreateUser / iam:DeleteUser restricted
          </span>
        </div>
      )}

      {error && (
        <div className="m-4 p-3 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212] flex items-start gap-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d13212" strokeWidth="2" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <div className="font-bold">Access Denied</div>
            <div className="text-[12px] text-[#545b64] mt-0.5 leading-relaxed">{error}</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
            <tr>
              <th className="w-10 px-4 py-2.5">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-4 py-2.5 font-bold text-[#16191f]">User name</th>
              <th className="px-4 py-2.5">Attached policies</th>
              <th className="px-4 py-2.5">User ID</th>
              <th className="px-4 py-2.5">Creation time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filteredUsers.map((user) => {
              const isSelected = selectedUser === user.userName;
              return (
                <tr
                  key={user.userName}
                  onClick={() =>
                    setSelectedUser(isSelected ? null : user.userName)
                  }
                  className={`hover:bg-[#f2f8fd] cursor-pointer transition-colors ${
                    isSelected ? "bg-[#f2f8fd]" : ""
                  }`}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="radio"
                      name="selectedUser"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedUser(isSelected ? null : user.userName)
                      }
                      className="cursor-pointer text-[#0073bb] focus:ring-[#0073bb]"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/iam/users/${encodeURIComponent(user.userName)}`}
                      className="text-[#0073bb] hover:text-[#ec7211] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {user.userName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#16191f]">
                    <span className="bg-[#f2f3f3] text-[#545b64] px-2 py-0.5 rounded text-[11px] font-mono">
                      {user.policyCount} {user.policyCount === 1 ? "policy" : "policies"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-[#545b64]">
                    {user.userId}
                  </td>
                  <td className="px-4 py-3 text-[#545b64]">{user.createDate}</td>
                </tr>
              );
            })}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#545b64]">
                  {users.length === 0
                    ? "No users exist. Click 'Add users' to create one."
                    : `No users match "${searchQuery}".`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-[#eaeded] text-[12px] text-[#545b64]">
        {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
      </div>

      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-[500px] w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete user: {selectedUser}
            </h3>

            {error && (
              <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212] flex items-start gap-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d13212" strokeWidth="2" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <div className="font-bold">Access Denied</div>
                  <div className="text-[12px] text-[#545b64] mt-0.5 leading-relaxed">{error}</div>
                </div>
              </div>
            )}

            {!canDeleteUser && !error && (
              <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212] flex items-start gap-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d13212" strokeWidth="2" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <div className="font-bold">Access Denied</div>
                  <div className="text-[12px] text-[#545b64] mt-0.5 leading-relaxed">
                    User <strong>{activeIdentityName}</strong> is not authorized to perform: <code>iam:DeleteUser</code> on resource: <code>arn:aws:iam:::user/{selectedUser}</code>.
                  </div>
                </div>
              </div>
            )}

            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Are you sure you want to delete user <strong>{selectedUser}</strong>? Any
              access keys and permissions attached to this user will be revoked immediately.
            </p>
            <div>
              <label className="block text-[13px] font-medium text-[#16191f] mb-1">
                To confirm deletion, type <strong>{selectedUser}</strong> in the box below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={selectedUser || ""}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#d13212] focus:ring-1 focus:ring-[#d13212]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setError(null);
                }}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmInput !== selectedUser || isPending || !canDeleteUser}
                title={!canDeleteUser ? "Missing iam:DeleteUser permission" : undefined}
                className={`px-4 py-1.5 text-[13px] text-white rounded-sm font-medium ${
                  confirmInput === selectedUser && !isPending && canDeleteUser
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-[#eaeded] text-[#aab7b8] cursor-not-allowed"
                }`}
              >
                {isPending ? "Deleting..." : "Delete user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
