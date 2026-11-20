"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RAMResourceShare } from "./types";
import { deleteResourceShareAction, updateResourceShareAction } from "./actions";
import { formatRAMDate } from "./dateUtils";

interface ResourceSharesClientProps {
  initialShares: RAMResourceShare[];
}

export default function ResourceSharesClient({ initialShares }: ResourceSharesClientProps) {
  const router = useRouter();
  const [shares, setShares] = useState<RAMResourceShare[]>(initialShares);
  const [selectedArns, setSelectedArns] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAllowExternal, setEditAllowExternal] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filtered shares
  const filteredShares = shares.filter((share) => {
    const matchesSearch =
      share.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.arn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || share.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const allSelected =
    filteredShares.length > 0 && selectedArns.length === filteredShares.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedArns([]);
    } else {
      setSelectedArns(filteredShares.map((s) => s.arn));
    }
  };

  const toggleSelectOne = (arn: string) => {
    if (selectedArns.includes(arn)) {
      setSelectedArns(selectedArns.filter((a) => a !== arn));
    } else {
      setSelectedArns([...selectedArns, arn]);
    }
  };

  const selectedShare = shares.find((s) => s.arn === selectedArns[0]);

  const openEditModal = () => {
    if (!selectedShare) return;
    setEditName(selectedShare.name);
    setEditAllowExternal(selectedShare.allowExternalPrincipals);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedShare || !editName.trim()) return;
    setIsSavingEdit(true);
    setBanner(null);
    try {
      const res = await updateResourceShareAction(
        selectedShare.arn,
        editName.trim(),
        editAllowExternal
      );
      if (res.success) {
        setShares((prev) =>
          prev.map((s) =>
            s.arn === selectedShare.arn
              ? { ...s, name: editName.trim(), allowExternalPrincipals: editAllowExternal }
              : s
          )
        );
        setShowEditModal(false);
        setBanner({
          type: "success",
          message: `Successfully updated resource share "${editName.trim()}".`,
        });
      } else {
        setBanner({ type: "error", message: res.error || "Failed to update resource share." });
      }
    } catch (e: any) {
      setBanner({ type: "error", message: e.message || "An error occurred." });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (selectedArns.length === 0) return;
    setIsDeleting(true);
    setBanner(null);
    try {
      let failed = 0;
      for (const arn of selectedArns) {
        const res = await deleteResourceShareAction(arn);
        if (!res.success) {
          failed++;
        }
      }
      if (failed === 0) {
        setShares((prev) => prev.filter((s) => !selectedArns.includes(s.arn)));
        setSelectedArns([]);
        setShowDeleteModal(false);
        setBanner({
          type: "success",
          message: `Successfully deleted ${selectedArns.length} resource share(s).`,
        });
      } else {
        setBanner({
          type: "error",
          message: `Failed to delete ${failed} of ${selectedArns.length} resource share(s).`,
        });
      }
    } catch (e: any) {
      setBanner({ type: "error", message: e.message || "An error occurred during deletion." });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "ACTIVE") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ecf7ed] text-[#1d8102] border border-[#a4e7a5]">
          Active
        </span>
      );
    }
    if (s === "PENDING") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f1faff] text-[#0073bb] border border-[#9fd8f6]">
          Pending
        </span>
      );
    }
    if (s === "FAILED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#fdf2f2] text-[#d13212] border border-[#f8b4b4]">
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16191f]">Resource shares</h1>
          <p className="text-sm text-[#545b64] mt-1">
            Resource shares created by your account to share resources with other AWS accounts or your AWS Organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.refresh()}
            className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-3 rounded-[2px] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            title="Refresh"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
          <button
            onClick={openEditModal}
            disabled={selectedArns.length !== 1}
            className={`font-bold text-[13px] px-3 rounded-[2px] transition-colors border ${
              selectedArns.length === 1
                ? "bg-white border-[#879596] hover:bg-[#f2f3f3] text-[#16191f]"
                : "bg-[#f2f3f3] border-[#eaeded] text-[#959da5] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Modify
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={selectedArns.length === 0}
            className={`font-bold text-[13px] px-3 rounded-[2px] transition-colors border ${
              selectedArns.length > 0
                ? "bg-white border-[#d13212] text-[#d13212] hover:bg-[#fff5f5]"
                : "bg-[#f2f3f3] border-[#eaeded] text-[#959da5] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
          <Link
            href="/ram/create"
            className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm inline-flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create resource share
          </Link>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`p-4 rounded border text-sm flex items-start justify-between ${
            banner.type === "success"
              ? "bg-[#ecf7ed] border-[#a4e7a5] text-[#1d8102]"
              : "bg-[#fdf2f2] border-[#f8b4b4] text-[#d13212]"
          }`}
        >
          <span>{banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            className="text-gray-500 hover:text-black font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Find resource shares"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 pl-8 border border-[#aab7b8] rounded-[2px] focus:outline-none focus:border-[#0073bb]"
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
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] bg-white focus:outline-none focus:border-[#0073bb]"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>
          <div className="text-xs text-[#545b64] self-center">
            {filteredShares.length} {filteredShares.length === 1 ? "resource share" : "resource shares"}
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto border border-[#eaeded] rounded">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase tracking-wider border-b border-[#eaeded]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                    className="rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                  />
                </th>
                <th className="p-3">Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Allow external principals</th>
                <th className="p-3">Last updated</th>
                <th className="p-3">Creation time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredShares.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#545b64]">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <p className="font-semibold text-base text-[#16191f]">No resource shares</p>
                      <p className="max-w-md text-sm">
                        You have not shared any resources yet. Create a resource share to start sharing resources with other AWS accounts or within your AWS Organization.
                      </p>
                      <Link
                        href="/ram/create"
                        className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm inline-flex items-center justify-center mt-2"
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      >
                        Create resource share
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredShares.map((share) => {
                  const isChecked = selectedArns.includes(share.arn);
                  return (
                    <tr
                      key={share.arn}
                      className={`hover:bg-[#f9f9f9] transition-colors ${
                        isChecked ? "bg-[#f2f8fd]" : ""
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(share.arn)}
                          aria-label={`Select ${share.name}`}
                          className="rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                        />
                      </td>
                      <td className="p-3 font-medium">
                        <Link
                          href={`/ram/${encodeURIComponent(share.arn)}`}
                          className="text-[#0073bb] hover:underline hover:text-[#005580]"
                        >
                          {share.name}
                        </Link>
                      </td>
                      <td className="p-3">{getStatusBadge(share.status)}</td>
                      <td className="p-3 font-mono text-xs">{share.owner || "Self"}</td>
                      <td className="p-3">{share.allowExternalPrincipals ? "Yes" : "No"}</td>
                      <td className="p-3 text-xs text-[#545b64]">
                        <span suppressHydrationWarning>{formatRAMDate(share.lastUpdatedTime)}</span>
                      </td>
                      <td className="p-3 text-xs text-[#545b64]">
                        <span suppressHydrationWarning>{formatRAMDate(share.creationTime)}</span>
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
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">
              Delete resource {selectedArns.length === 1 ? "share" : "shares"}?
            </h3>
            <p className="text-sm text-[#545b64]">
              Are you sure you want to delete {selectedArns.length} resource share(s)? Resources will no longer be shared with associated principals. This action cannot be undone.
            </p>
            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-xs font-mono max-h-32 overflow-y-auto">
              {selectedArns.map((arn) => {
                const s = shares.find((item) => item.arn === arn);
                return (
                  <div key={arn} className="truncate">
                    <strong>{s?.name || "Resource share"}</strong> ({arn})
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-[#d13212] hover:bg-[#a82a0c] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Modal */}
      {showEditModal && selectedShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Modify resource share</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] focus:outline-none focus:border-[#0073bb]"
                />
              </div>
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editAllowExternal"
                  checked={editAllowExternal}
                  onChange={(e) => setEditAllowExternal(e.target.checked)}
                  className="mt-1 rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                />
                <label htmlFor="editAllowExternal" className="text-xs text-[#16191f]">
                  <span className="font-bold block">Allow sharing with external principals</span>
                  Allow sharing with any AWS account, including accounts outside your organization.
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSavingEdit}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editName.trim()}
                className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {isSavingEdit ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
