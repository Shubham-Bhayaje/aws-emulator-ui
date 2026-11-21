"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResourceGroupItem } from "./types";
import { deleteGroupAction } from "./actions";

interface GroupsClientProps {
  initialGroups: ResourceGroupItem[];
}

export function GroupsClient({ initialGroups }: GroupsClientProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<ResourceGroupItem[]>(initialGroups);
  const [selectedGroup, setSelectedGroup] = useState<ResourceGroupItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filtered = groups.filter((g) => {
    const term = searchTerm.toLowerCase();
    return (
      g.name.toLowerCase().includes(term) ||
      (g.description || "").toLowerCase().includes(term) ||
      g.groupArn.toLowerCase().includes(term)
    );
  });

  const handleDelete = async () => {
    if (!selectedGroup) return;
    setDeleting(true);
    setBanner(null);
    try {
      const res = await deleteGroupAction(selectedGroup.name);
      if (res.success) {
        setGroups((prev) => prev.filter((g) => g.name !== selectedGroup.name));
        setBanner({
          type: "success",
          message: `Successfully deleted resource group "${selectedGroup.name}".`,
        });
        setSelectedGroup(null);
        setShowDeleteModal(false);
      } else {
        setBanner({
          type: "error",
          message: res.error || "Failed to delete resource group.",
        });
      }
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "An unexpected error occurred while deleting.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto text-[#16191f]">
      {/* Alert Banner */}
      {banner && (
        <div
          className={`mb-4 p-4 rounded text-sm flex items-start justify-between border ${
            banner.type === "success"
              ? "bg-[#f2fcf3] border-[#037f0c] text-[#037f0c]"
              : "bg-[#fdf3f2] border-[#d13212] text-[#d13212]"
          }`}
        >
          <div>{banner.message}</div>
          <button
            onClick={() => setBanner(null)}
            className="text-xs font-bold hover:opacity-80 ml-4"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#eaeded] mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#16191f]">
            Saved groups <span className="text-sm font-normal text-[#545b64]">({filtered.length})</span>
          </h1>
          <p className="text-xs text-[#545b64] mt-1">
            Resource groups let you manage and automate tasks on large numbers of AWS resources at one time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.refresh()}
            className="px-3 text-xs font-semibold bg-white border border-[#aab7b8] text-[#16191f] rounded hover:bg-[#f2f3f3]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Refresh
          </button>
          <Link
            href="/resource-groups/create"
            className="px-4 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create Resource Group
          </Link>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        {/* Table Actions Toolbar */}
        <div className="p-3 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3 bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by name, description, or ARN"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-[#aab7b8] rounded px-3 text-xs w-72 focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={!selectedGroup}
              onClick={() => {
                if (selectedGroup) {
                  router.push(`/resource-groups/${encodeURIComponent(selectedGroup.name)}`);
                }
              }}
              className={`px-3 text-xs font-semibold rounded border ${
                selectedGroup
                  ? "bg-white border-[#aab7b8] text-[#16191f] hover:bg-[#f2f3f3]"
                  : "bg-[#f2f3f3] border-[#eaeded] text-[#aab7b8] cursor-not-allowed"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              View details
            </button>
            <button
              disabled={!selectedGroup}
              onClick={() => setShowDeleteModal(true)}
              className={`px-3 text-xs font-semibold rounded border ${
                selectedGroup
                  ? "bg-white border-[#d13212] text-[#d13212] hover:bg-[#fdf3f2]"
                  : "bg-[#f2f3f3] border-[#eaeded] text-[#aab7b8] cursor-not-allowed"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Groups Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#f8f9fa] text-[#545b64] font-semibold">
                <th className="py-2.5 px-3 w-10"></th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Group type</th>
                <th className="py-2.5 px-3">Group ARN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#545b64]">
                    <div className="font-semibold text-sm mb-1">You don't have any resource groups</div>
                    <div className="text-xs text-[#545b64] mb-3">
                      Create a resource group to organize, manage, and automate tasks on large numbers of AWS resources at one time.
                    </div>
                    <Link
                      href="/resource-groups/create"
                      className="inline-flex items-center px-4 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    >
                      Create Resource Group
                    </Link>
                  </td>
                </tr>
              ) : (
                filtered.map((group) => {
                  const isSelected = selectedGroup?.name === group.name;
                  return (
                    <tr
                      key={group.groupArn}
                      onClick={() => setSelectedGroup(group)}
                      className={`hover:bg-[#fbfbfb] cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedGroup"
                          checked={isSelected}
                          onChange={() => setSelectedGroup(group)}
                          className="accent-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#0073bb]">
                        <Link
                          href={`/resource-groups/${encodeURIComponent(group.name)}`}
                          className="hover:underline"
                        >
                          {group.name}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64]">{group.description || "-"}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 text-[11px] font-medium bg-[#f2f8fd] text-[#0073bb] border border-[#a4c6eb] rounded">
                          Tag-based
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#545b64] truncate max-w-xs" title={group.groupArn}>
                        {group.groupArn}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#eaeded] shadow-lg max-w-md w-full p-6 text-[#16191f]">
            <h2 className="text-base font-bold mb-2">Delete resource group</h2>
            <p className="text-xs text-[#545b64] mb-4">
              Are you sure you want to delete the resource group{" "}
              <strong className="text-[#16191f]">{selectedGroup.name}</strong>? This action cannot be undone. The
              resources in this group will not be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-3 text-xs font-semibold border border-[#aab7b8] rounded bg-white hover:bg-[#f2f3f3]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 text-xs font-semibold text-white bg-[#d13212] rounded hover:bg-[#b02a0f]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
