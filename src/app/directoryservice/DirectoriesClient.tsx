/**
 * src/app/directoryservice/DirectoriesClient.tsx – AWS Directory Service Inventory Component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DirectorySummary, DirectoryStage } from "./types";
import {
  describeDirectoriesAction,
  deleteDirectoryAction,
  createSnapshotAction,
  resetUserPasswordAction,
} from "./actions";

interface DirectoriesClientProps {
  initialDirectories: DirectorySummary[];
}

export function DirectoriesClient({ initialDirectories }: DirectoriesClientProps) {
  const router = useRouter();
  const [directories, setDirectories] = useState<DirectorySummary[]>(initialDirectories);
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Snapshot modal
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  // Password Reset modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [resetUserName, setResetUserName] = useState("Administrator");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const selectedDirectory = directories.find((d) => d.directoryId === selectedDirectoryId);

  const totalDirectories = directories.length;
  const activeDirectories = directories.filter((d) => d.stage === "Active").length;
  const microsoftAdCount = directories.filter((d) => d.type === "MicrosoftAD" || d.type === "SharedMicrosoftAD").length;
  const simpleAdCount = directories.filter((d) => d.type === "SimpleAD").length;

  const filteredDirectories = directories.filter((d) => {
    if (typeFilter !== "ALL" && d.type !== typeFilter) return false;
    if (statusFilter !== "ALL" && d.stage !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = d.directoryId.toLowerCase().includes(q);
      const matchName = d.name.toLowerCase().includes(q);
      const matchShort = d.shortName?.toLowerCase().includes(q) || false;
      const matchVpc = d.vpcSettings?.vpcId?.toLowerCase().includes(q) || false;
      return matchId || matchName || matchShort || matchVpc;
    }
    return true;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setNotification(null);
    try {
      const res = await describeDirectoriesAction();
      if (res.success) {
        setDirectories(res.directories);
      } else {
        setNotification({ type: "error", message: res.error || "Failed to refresh directories" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDirectory) return;
    setIsDeleting(true);
    setNotification(null);
    try {
      const res = await deleteDirectoryAction(selectedDirectory.directoryId);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Directory "${selectedDirectory.directoryId}" deleted successfully.`,
        });
        setSelectedDirectoryId(null);
        setShowDeleteModal(false);
        setDeleteConfirmInput("");
        await handleRefresh();
      } else {
        setNotification({ type: "error", message: res.error || "Failed to delete directory" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!selectedDirectory) return;
    setIsCreatingSnapshot(true);
    setNotification(null);
    try {
      const res = await createSnapshotAction(selectedDirectory.directoryId, snapshotName);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Snapshot "${res.snapshotId}" created successfully for directory ${selectedDirectory.directoryId}.`,
        });
        setShowSnapshotModal(false);
        setSnapshotName("");
      } else {
        setNotification({ type: "error", message: res.error || "Failed to create snapshot" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedDirectory) return;
    if (resetNewPassword !== resetConfirmPassword) {
      setNotification({ type: "error", message: "Passwords do not match." });
      return;
    }
    setIsResettingPassword(true);
    setNotification(null);
    try {
      const res = await resetUserPasswordAction(selectedDirectory.directoryId, resetUserName, resetNewPassword);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Password for user "${resetUserName}" in directory ${selectedDirectory.directoryId} has been reset.`,
        });
        setShowPasswordModal(false);
        setResetNewPassword("");
        setResetConfirmPassword("");
      } else {
        setNotification({ type: "error", message: res.error || "Failed to reset password" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const renderStageBadge = (stage: DirectoryStage | string) => {
    switch (stage) {
      case "Active":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#edf7ed] text-[#1e4620] border border-[#55a559]">
            Active
          </span>
        );
      case "Creating":
      case "Requested":
      case "Restoring":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#f1faff] text-[#004a80] border border-[#0073bb]">
            {stage}
          </span>
        );
      case "Failed":
      case "Inoperable":
      case "RestoreFailed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#fdf2f2] text-[#900] border border-[#d13212]">
            {stage}
          </span>
        );
      case "Deleting":
      case "Deleted":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#f2f3f3] text-[#545b64] border border-[#aab7b8]">
            {stage}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#f2f3f3] text-[#545b64] border border-[#aab7b8]">
            {stage}
          </span>
        );
    }
  };

  const renderTypeLabel = (type: string) => {
    switch (type) {
      case "MicrosoftAD":
        return "AWS Managed Microsoft AD";
      case "SimpleAD":
        return "Simple AD";
      case "ADConnector":
        return "AD Connector";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64]">
        <span className="text-[#545b64]">AWS Directory Service</span> &gt;{" "}
        <span className="font-bold text-[#16191f]">Directories</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Directories</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            AWS Directory Service enables your directory-aware workloads and AWS resources to use managed Active Directory in the AWS Cloud.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/directoryservice/setup"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
          >
            Set up directory
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen(!actionsOpen)}
              disabled={!selectedDirectory}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border ${
                selectedDirectory
                  ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                  : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed bg-[#fafafa]"
              }`}
            >
              Actions
              <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {actionsOpen && selectedDirectory && (
              <div
                className="absolute right-0 mt-1 w-52 bg-white border border-[#eaeded] rounded shadow-lg z-20 py-1"
                onMouseLeave={() => setActionsOpen(false)}
              >
                <Link
                  href={`/directoryservice/directories/${selectedDirectory.directoryId}`}
                  className="block px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
                  onClick={() => setActionsOpen(false)}
                >
                  View details
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    setShowPasswordModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  Reset user password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    setShowSnapshotModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  Create snapshot
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] text-[#d13212] hover:bg-[#fdf2f2]"
                >
                  Delete directory
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded border text-[13px] flex items-start justify-between ${
            notification.type === "success"
              ? "bg-[#edf7ed] border-[#55a559] text-[#1e4620]"
              : "bg-[#fdf2f2] border-[#d13212] text-[#900]"
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-4 font-bold text-gray-500 hover:text-black"
          >
            &times;
          </button>
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Total Directories</div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalDirectories}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Active Directories</div>
          <div className="text-[24px] font-bold text-[#1e4620] mt-1">{activeDirectories}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Microsoft AD</div>
          <div className="text-[24px] font-bold text-[#0972d3] mt-1">{microsoftAdCount}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Simple AD</div>
          <div className="text-[24px] font-bold text-[#7d3c00] mt-1">{simpleAdCount}</div>
        </div>
      </div>

      {/* Directories Inventory Container */}
      <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
        {/* Filters bar */}
        <div className="p-3 border-b border-[#eaeded] flex flex-wrap items-center gap-3 bg-[#fafafa]">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search directories by Directory ID, Directory name, or Short name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-bold text-[#545b64]">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
            >
              <option value="ALL">All directory types</option>
              <option value="MicrosoftAD">AWS Managed Microsoft AD</option>
              <option value="SimpleAD">Simple AD</option>
              <option value="ADConnector">AD Connector</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-bold text-[#545b64]">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
            >
              <option value="ALL">All statuses</option>
              <option value="Active">Active</option>
              <option value="Creating">Creating</option>
              <option value="Failed">Failed</option>
              <option value="Deleted">Deleted</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-4">Directory ID</th>
                <th className="py-2.5 px-4">Directory Name</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Size / Edition</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Short Name</th>
                <th className="py-2.5 px-4">DNS Addresses</th>
                <th className="py-2.5 px-4">VPC</th>
                <th className="py-2.5 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[13px] text-[#16191f]">
              {filteredDirectories.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#545b64]">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="text-[16px] font-bold text-[#16191f]">No directories found</div>
                      <p className="text-[13px] text-[#545b64]">
                        {directories.length === 0
                          ? "You do not have any directories in this AWS Region. Set up a directory to connect or manage Active Directory in the AWS Cloud."
                          : "No directories match the search and filter criteria."}
                      </p>
                      {directories.length === 0 && (
                        <div className="pt-2">
                          <Link
                            href="/directoryservice/setup"
                            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                          >
                            Set up directory
                          </Link>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDirectories.map((dir) => {
                  const isSelected = selectedDirectoryId === dir.directoryId;
                  return (
                    <tr
                      key={dir.directoryId}
                      onClick={() => setSelectedDirectoryId(dir.directoryId)}
                      className={`cursor-pointer hover:bg-[#f2f8fd] ${
                        isSelected ? "bg-[#e7f2fa]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedDirectory"
                          checked={isSelected}
                          onChange={() => setSelectedDirectoryId(dir.directoryId)}
                          className="h-4 w-4 text-[#0972d3] border-gray-300 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium">
                        <Link
                          href={`/directoryservice/directories/${dir.directoryId}`}
                          className="text-[#0972d3] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {dir.directoryId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 font-bold">{dir.name}</td>
                      <td className="py-2.5 px-4 text-[12px]">{renderTypeLabel(dir.type)}</td>
                      <td className="py-2.5 px-4 text-[12px]">{dir.size || dir.edition || "-"}</td>
                      <td className="py-2.5 px-4">{renderStageBadge(dir.stage)}</td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">{dir.shortName || "-"}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-[#545b64]">
                        {dir.dnsIpAddrs.length > 0 ? dir.dnsIpAddrs.join(", ") : "-"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                        {dir.vpcSettings?.vpcId || "-"}
                      </td>
                      <td className="py-2.5 px-4 text-[12px] text-[#545b64]">{dir.launchTime || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#eaeded] text-[12px] text-[#545b64] bg-[#fafafa]">
          Showing {filteredDirectories.length} of {directories.length} directories
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDirectory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete directory {selectedDirectory.directoryId}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete directory <span className="font-bold">{selectedDirectory.name}</span>? This action removes all user accounts, groups, and directory policies. It cannot be undone.
            </p>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1 py-0.5 rounded">{selectedDirectory.directoryId}</code> below:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={selectedDirectory.directoryId}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmInput("");
                }}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || (deleteConfirmInput !== selectedDirectory.directoryId && deleteConfirmInput !== "delete")}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white ${
                  (deleteConfirmInput === selectedDirectory.directoryId || deleteConfirmInput === "delete") && !isDeleting
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-[#e8a397] cursor-not-allowed"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete directory"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Snapshot Modal */}
      {showSnapshotModal && selectedDirectory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Create snapshot for directory {selectedDirectory.directoryId}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Manual snapshots provide point-in-time backups of directory data, schemas, and configurations.
            </p>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">Snapshot name:</label>
              <input
                type="text"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="e.g. PreUpgradeBackup"
                maxLength={128}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
              <span className="text-[11px] text-[#545b64]">Maximum 128 characters.</span>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setShowSnapshotModal(false);
                  setSnapshotName("");
                }}
                disabled={isCreatingSnapshot}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSnapshot}
                disabled={isCreatingSnapshot || !snapshotName.trim()}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isCreatingSnapshot ? "Creating..." : "Create snapshot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedDirectory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Reset user password
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Reset credentials for directory <span className="font-bold">{selectedDirectory.name}</span>.
            </p>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">User name:</label>
              <input
                type="text"
                value={resetUserName}
                onChange={(e) => setResetUserName(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">New password:</label>
              <input
                type="password"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
              <span className="text-[11px] text-[#545b64]">8-64 characters with mixed case, numbers, and symbols.</span>
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">Confirm new password:</label>
              <input
                type="password"
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setResetNewPassword("");
                  setResetConfirmPassword("");
                }}
                disabled={isResettingPassword}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResettingPassword || !resetNewPassword || resetNewPassword !== resetConfirmPassword}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isResettingPassword ? "Resetting..." : "Reset password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
