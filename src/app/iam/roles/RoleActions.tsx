/**
 * RoleActions – Client component for IAM Roles list.
 * Search, select, delete role modal, and link to role details.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteRole } from "../actions";

export interface RoleSummary {
  roleName: string;
  roleId: string;
  arn: string;
  description: string;
  createDate: string;
  trustedEntity: string;
}

interface RoleActionsProps {
  roles: RoleSummary[];
}

export function RoleActions({ roles }: RoleActionsProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filteredRoles = roles.filter((r) =>
    r.roleName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleDelete() {
    if (!selectedRole || confirmInput !== selectedRole) return;

    startTransition(async () => {
      const res = await deleteRole(selectedRole);
      if (res && res.error) {
        setError(res.error);
      } else {
        setSelectedRole(null);
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
            Roles ({filteredRoles.length})
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
              placeholder="Find roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-[#aab7b8] rounded px-2.5 pl-8 py-[4px] text-[13px] text-[#16191f] placeholder-[#8d9ba8] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedRole) {
                router.push(`/iam/roles/${encodeURIComponent(selectedRole)}`);
              }
            }}
            disabled={!selectedRole}
            className={`px-3 py-[4px] text-[13px] rounded-sm border font-normal ${
              selectedRole
                ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed"
            }`}
          >
            View details
          </button>
          <button
            onClick={() => {
              setConfirmInput("");
              setShowDeleteModal(true);
            }}
            disabled={!selectedRole || isPending}
            className={`px-3 py-[4px] text-[13px] rounded-sm border font-normal ${
              selectedRole && !isPending
                ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed"
            }`}
          >
            Delete role
          </button>
          <Link
            href="/iam/roles/create"
            className="px-3 py-[4px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] font-medium transition-colors"
          >
            Create role
          </Link>
        </div>
      </div>

      {error && (
        <div className="m-4 p-3 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {error}
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
              <th className="px-4 py-2.5 font-bold text-[#16191f]">Role name</th>
              <th className="px-4 py-2.5">Trusted entities</th>
              <th className="px-4 py-2.5">Description</th>
              <th className="px-4 py-2.5">Creation time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filteredRoles.map((role) => {
              const isSelected = selectedRole === role.roleName;
              return (
                <tr
                  key={role.roleName}
                  onClick={() =>
                    setSelectedRole(isSelected ? null : role.roleName)
                  }
                  className={`hover:bg-[#f2f8fd] cursor-pointer transition-colors ${
                    isSelected ? "bg-[#f2f8fd]" : ""
                  }`}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="radio"
                      name="selectedRole"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedRole(isSelected ? null : role.roleName)
                      }
                      className="cursor-pointer text-[#0073bb] focus:ring-[#0073bb]"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/iam/roles/${encodeURIComponent(role.roleName)}`}
                      className="text-[#0073bb] hover:text-[#ec7211] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {role.roleName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[11px] bg-[#f2f3f3] px-2 py-0.5 rounded text-[#16191f]">
                      {role.trustedEntity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#545b64] max-w-[240px] truncate">
                    {role.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-[#545b64]">{role.createDate}</td>
                </tr>
              );
            })}

            {filteredRoles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#545b64]">
                  {roles.length === 0
                    ? "No roles exist. Click 'Create role' to create one."
                    : `No roles match "${searchQuery}".`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-[#eaeded] text-[12px] text-[#545b64]">
        {filteredRoles.length} {filteredRoles.length === 1 ? "role" : "roles"}
      </div>

      {/* Delete Role Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-[500px] w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete role: {selectedRole}
            </h3>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Are you sure you want to delete role <strong>{selectedRole}</strong>?
              Services or applications assuming this role will immediately lose access.
            </p>
            <div>
              <label className="block text-[13px] font-medium text-[#16191f] mb-1">
                To confirm deletion, type <strong>{selectedRole}</strong> in the box below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={selectedRole || ""}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#d13212] focus:ring-1 focus:ring-[#d13212]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmInput !== selectedRole || isPending}
                className={`px-4 py-1.5 text-[13px] text-white rounded-sm font-medium ${
                  confirmInput === selectedRole && !isPending
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-[#eaeded] text-[#aab7b8] cursor-not-allowed"
                }`}
              >
                {isPending ? "Deleting..." : "Delete role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
