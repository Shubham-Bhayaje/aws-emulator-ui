/**
 * src/app/directoryservice/directories/[directoryId]/DirectoryDetailClient.tsx – Directory Details View.
 * Displays Directory details, Snapshots, Application Management, Trusts/Forwarders, and Tags.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DirectorySummary,
  DirectoryStage,
  DirectorySnapshot,
  DirectoryTrust,
  ConditionalForwarder,
  DirectoryTag,
} from "../../types";
import {
  describeDirectoryAction,
  describeSnapshotsAction,
  createSnapshotAction,
  deleteSnapshotAction,
  deleteDirectoryAction,
  createAliasAction,
  enableSsoAction,
  disableSsoAction,
  resetUserPasswordAction,
  addTagsToResourceAction,
  removeTagsFromResourceAction,
} from "../../actions";

interface DirectoryDetailClientProps {
  initialDirectory: DirectorySummary;
  initialSnapshots: DirectorySnapshot[];
  initialTrusts: DirectoryTrust[];
  initialForwarders: ConditionalForwarder[];
  initialTags: DirectoryTag[];
  initialTab?: string;
}

export function DirectoryDetailClient({
  initialDirectory,
  initialSnapshots,
  initialTrusts,
  initialForwarders,
  initialTags,
  initialTab = "details",
}: DirectoryDetailClientProps) {
  const router = useRouter();
  const [directory, setDirectory] = useState<DirectorySummary>(initialDirectory);
  const [snapshots, setSnapshots] = useState<DirectorySnapshot[]>(initialSnapshots);
  const [trusts, setTrusts] = useState<DirectoryTrust[]>(initialTrusts);
  const [forwarders, setForwarders] = useState<ConditionalForwarder[]>(initialForwarders);
  const [tags, setTags] = useState<DirectoryTag[]>(initialTags);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [resetUserName, setResetUserName] = useState("Administrator");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  const [snapshotToDelete, setSnapshotToDelete] = useState<DirectorySnapshot | null>(null);
  const [isDeletingSnapshot, setIsDeletingSnapshot] = useState(false);

  const [showAliasModal, setShowAliasModal] = useState(false);
  const [aliasName, setAliasName] = useState("");
  const [isCreatingAlias, setIsCreatingAlias] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeletingDirectory, setIsDeletingDirectory] = useState(false);

  const [isTogglingSso, setIsTogglingSso] = useState(false);

  // Tags modal
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setNotification(null);
    try {
      const [dirRes, snapRes] = await Promise.all([
        describeDirectoryAction(directory.directoryId),
        describeSnapshotsAction(directory.directoryId),
      ]);
      if (dirRes.success && dirRes.directory) setDirectory(dirRes.directory);
      if (snapRes.success) setSnapshots(snapRes.snapshots);
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetPassword = async () => {
    if (resetNewPassword !== resetConfirmPassword) {
      setNotification({ type: "error", message: "Passwords do not match." });
      return;
    }
    setIsResettingPassword(true);
    setNotification(null);
    try {
      const res = await resetUserPasswordAction(directory.directoryId, resetUserName, resetNewPassword);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Password for "${resetUserName}" has been reset successfully.`,
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

  const handleCreateSnapshot = async () => {
    setIsCreatingSnapshot(true);
    setNotification(null);
    try {
      const res = await createSnapshotAction(directory.directoryId, snapshotName);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Snapshot "${res.snapshotId}" created successfully.`,
        });
        setShowSnapshotModal(false);
        setSnapshotName("");
        await handleRefresh();
      } else {
        setNotification({ type: "error", message: res.error || "Failed to create snapshot" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const handleDeleteSnapshot = async () => {
    if (!snapshotToDelete) return;
    setIsDeletingSnapshot(true);
    setNotification(null);
    try {
      const res = await deleteSnapshotAction(snapshotToDelete.snapshotId, directory.directoryId);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Snapshot "${snapshotToDelete.snapshotId}" deleted successfully.`,
        });
        setSnapshotToDelete(null);
        await handleRefresh();
      } else {
        setNotification({ type: "error", message: res.error || "Failed to delete snapshot" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsDeletingSnapshot(false);
    }
  };

  const handleCreateAlias = async () => {
    setIsCreatingAlias(true);
    setNotification(null);
    try {
      const res = await createAliasAction(directory.directoryId, aliasName.trim());
      if (res.success) {
        setNotification({
          type: "success",
          message: `Access URL alias "${res.alias}" created successfully.`,
        });
        setShowAliasModal(false);
        setAliasName("");
        await handleRefresh();
      } else {
        setNotification({ type: "error", message: res.error || "Failed to create alias" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsCreatingAlias(false);
    }
  };

  const handleToggleSso = async () => {
    setIsTogglingSso(true);
    setNotification(null);
    try {
      if (directory.ssoEnabled) {
        const res = await disableSsoAction(directory.directoryId);
        if (res.success) {
          setNotification({ type: "success", message: "SSO has been disabled." });
          await handleRefresh();
        } else {
          setNotification({ type: "error", message: res.error || "Failed to disable SSO" });
        }
      } else {
        const res = await enableSsoAction(directory.directoryId);
        if (res.success) {
          setNotification({ type: "success", message: "SSO has been enabled." });
          await handleRefresh();
        } else {
          setNotification({ type: "error", message: res.error || "Failed to enable SSO" });
        }
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsTogglingSso(false);
    }
  };

  const handleDeleteDirectory = async () => {
    setIsDeletingDirectory(true);
    setNotification(null);
    try {
      const res = await deleteDirectoryAction(directory.directoryId);
      if (res.success) {
        router.push("/directoryservice");
      } else {
        setNotification({ type: "error", message: res.error || "Failed to delete directory" });
        setIsDeletingDirectory(false);
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
      setIsDeletingDirectory(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagKey.trim()) return;
    setIsUpdatingTags(true);
    try {
      const res = await addTagsToResourceAction(directory.directoryId, [
        { Key: newTagKey.trim(), Value: newTagValue.trim() },
      ]);
      if (res.success) {
        setTags((prev) => [...prev, { Key: newTagKey.trim(), Value: newTagValue.trim() }]);
        setNewTagKey("");
        setNewTagValue("");
      } else {
        setNotification({ type: "error", message: res.error || "Failed to add tag" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsUpdatingTags(false);
    }
  };

  const handleRemoveTag = async (key: string) => {
    setIsUpdatingTags(true);
    try {
      const res = await removeTagsFromResourceAction(directory.directoryId, [key]);
      if (res.success) {
        setTags((prev) => prev.filter((t) => t.Key !== key));
      } else {
        setNotification({ type: "error", message: res.error || "Failed to remove tag" });
      }
    } catch (err: unknown) {
      setNotification({ type: "error", message: String(err) });
    } finally {
      setIsUpdatingTags(false);
    }
  };

  const renderStageBadge = (stage: DirectoryStage | string) => {
    switch (stage) {
      case "Active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#edf7ed] text-[#1e4620] border border-[#55a559]">
            Active
          </span>
        );
      case "Creating":
      case "Requested":
      case "Restoring":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#f1faff] text-[#004a80] border border-[#0073bb]">
            {stage}
          </span>
        );
      case "Failed":
      case "Inoperable":
      case "RestoreFailed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#fdf2f2] text-[#900] border border-[#d13212]">
            {stage}
          </span>
        );
      case "Deleting":
      case "Deleted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#f2f3f3] text-[#545b64] border border-[#aab7b8]">
            {stage}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold bg-[#f2f3f3] text-[#545b64] border border-[#aab7b8]">
            {stage}
          </span>
        );
    }
  };

  const renderTypeLabel = (t: string) => {
    switch (t) {
      case "MicrosoftAD":
        return "AWS Managed Microsoft AD";
      case "SimpleAD":
        return "Simple AD";
      case "ADConnector":
        return "AD Connector";
      default:
        return t;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64]">
        <Link href="/directoryservice" className="hover:underline text-[#0972d3]">
          Directory Service
        </Link>{" "}
        &gt;{" "}
        <Link href="/directoryservice" className="hover:underline text-[#0972d3]">
          Directories
        </Link>{" "}
        &gt; <span className="font-bold text-[#16191f] font-mono">{directory.directoryId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#16191f]">{directory.name}</h1>
            {renderStageBadge(directory.stage)}
          </div>
          <p className="text-[13px] font-mono text-[#545b64] mt-0.5">
            {directory.directoryId} {directory.shortName ? `(${directory.shortName})` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
          >
            Reset user password
          </button>
          <button
            type="button"
            onClick={() => setShowSnapshotModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
          >
            Create snapshot
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen(!actionsOpen)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
            >
              Actions
              <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {actionsOpen && (
              <div
                className="absolute right-0 mt-1 w-52 bg-white border border-[#eaeded] rounded shadow-lg z-20 py-1"
                onMouseLeave={() => setActionsOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    setShowAliasModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  Create access URL / alias
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

      {/* Tabs */}
      <div className="flex border-b border-[#eaeded]">
        {[
          { id: "details", label: "Directory details" },
          { id: "snapshots", label: `Snapshots (${snapshots.length})` },
          { id: "sso", label: "Application management" },
          { id: "trusts", label: `Trusts & Forwarders` },
          { id: "tags", label: `Tags (${tags.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-4 text-[13px] font-medium border-b-2 -mb-[1px] transition-colors ${
              activeTab === tab.id
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Directory details */}
      {activeTab === "details" && (
        <div className="space-y-6">
          {/* General Information Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6">
            <h2 className="text-[16px] font-bold text-[#16191f] mb-4">General information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Directory ID</div>
                <div className="text-[13px] font-mono font-medium text-[#16191f] mt-1">{directory.directoryId}</div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Directory DNS name</div>
                <div className="text-[13px] font-mono font-medium text-[#16191f] mt-1">{directory.name}</div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Short name (NetBIOS)</div>
                <div className="text-[13px] font-mono text-[#16191f] mt-1">{directory.shortName || "-"}</div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Directory type</div>
                <div className="text-[13px] font-medium text-[#16191f] mt-1">{renderTypeLabel(directory.type)}</div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Size / Edition</div>
                <div className="text-[13px] text-[#16191f] mt-1">{directory.size || directory.edition || "-"}</div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Access URL</div>
                <div className="text-[13px] text-[#0972d3] font-mono mt-1">
                  {directory.accessUrl ? `https://${directory.accessUrl}` : "-"}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">SSO Status</div>
                <div className="text-[13px] text-[#16191f] mt-1">
                  {directory.ssoEnabled ? (
                    <span className="font-bold text-[#1e4620]">Enabled</span>
                  ) : (
                    <span className="text-[#545b64]">Disabled</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Created at</div>
                <div className="text-[13px] text-[#545b64] mt-1">{directory.launchTime || "-"}</div>
              </div>
            </div>
          </div>

          {/* Networking & DNS Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6">
            <h2 className="text-[16px] font-bold text-[#16191f] mb-4">Networking & DNS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">DNS IP Addresses</div>
                <div className="text-[13px] font-mono text-[#16191f] mt-1">
                  {directory.dnsIpAddrs.length > 0 ? directory.dnsIpAddrs.join(", ") : "-"}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">VPC ID</div>
                <div className="text-[13px] font-mono text-[#0972d3] mt-1">
                  {directory.vpcSettings?.vpcId || "-"}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Security Group ID</div>
                <div className="text-[13px] font-mono text-[#0972d3] mt-1">
                  {directory.vpcSettings?.securityGroupId || "-"}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">Subnets</div>
                <div className="text-[13px] font-mono text-[#16191f] mt-1">
                  {directory.vpcSettings?.subnetIds?.join(", ") || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Snapshots */}
      {activeTab === "snapshots" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[#545b64]">
              Snapshots are point-in-time backups of directory data, schemas, and configurations.
            </p>
            <button
              type="button"
              onClick={() => setShowSnapshotModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Create snapshot
            </button>
          </div>

          <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Snapshot ID</th>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Start Time</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded] text-[13px]">
                {snapshots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#545b64]">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="text-[16px] font-bold text-[#16191f]">No snapshots found</div>
                        <p className="text-[13px] text-[#545b64]">
                          You can create manual snapshots at any time to preserve directory state.
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setShowSnapshotModal(true)}
                            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                          >
                            Create snapshot
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  snapshots.map((s) => (
                    <tr key={s.snapshotId} className="hover:bg-[#f2f8fd]">
                      <td className="py-2.5 px-4 font-mono font-medium text-[#0972d3]">{s.snapshotId}</td>
                      <td className="py-2.5 px-4 font-medium">{s.name || "-"}</td>
                      <td className="py-2.5 px-4">{s.type}</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#edf7ed] text-[#1e4620] border border-[#55a559]">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">{s.startTime || "-"}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSnapshotToDelete(s)}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          className="inline-flex items-center justify-center font-bold text-[12px] px-3 rounded border border-[#d13212] text-[#d13212] hover:bg-[#fdf2f2]"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Application management */}
      {activeTab === "sso" && (
        <div className="space-y-6">
          {/* Access URL */}
          <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Access URL</h2>
            <p className="text-[13px] text-[#545b64]">
              Users can sign in to AWS applications (WorkSpaces, WorkDocs, AWS Console) using this URL.
            </p>
            {directory.accessUrl ? (
              <div className="p-4 rounded border border-[#eaeded] bg-[#fafafa] flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-bold text-[#545b64]">Current Access URL</div>
                  <div className="text-[14px] font-mono font-bold text-[#0972d3] mt-0.5">
                    https://{directory.accessUrl}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded border border-[#eaeded] bg-[#fafafa] space-y-2">
                <p className="text-[13px] text-[#545b64]">
                  An access URL has not been created for this directory. An alias is required before enabling SSO.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAliasModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Create access URL
                </button>
              </div>
            )}
          </div>

          {/* Single Sign-On (SSO) */}
          <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">AWS Single Sign-On (SSO)</h2>
            <p className="text-[13px] text-[#545b64]">
              Allow users to authenticate with their directory credentials when accessing AWS Management Console and supported applications.
            </p>
            <div className="flex items-center justify-between p-4 rounded border border-[#eaeded] bg-[#fafafa]">
              <div>
                <div className="text-[13px] font-bold text-[#16191f]">
                  Status: {directory.ssoEnabled ? "Enabled" : "Disabled"}
                </div>
                <div className="text-[12px] text-[#545b64]">
                  {directory.ssoEnabled
                    ? "Directory users can sign in via the Access URL."
                    : "Single Sign-On is currently turned off."}
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSso}
                disabled={isTogglingSso}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded ${
                  directory.ssoEnabled
                    ? "border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                    : "bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                }`}
              >
                {isTogglingSso ? "Updating..." : directory.ssoEnabled ? "Disable SSO" : "Enable SSO"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Trusts & Forwarders */}
      {activeTab === "trusts" && (
        <div className="space-y-6">
          {/* Trusts */}
          <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Trust relationships</h2>
            <p className="text-[13px] text-[#545b64]">
              Trust relationships enable resource sharing and user authentication between your AWS Managed Microsoft AD and on-premises Active Directory domains.
            </p>
            <div className="border border-[#eaeded] rounded overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Remote Domain</th>
                    <th className="py-2.5 px-4">Trust Type</th>
                    <th className="py-2.5 px-4">Direction</th>
                    <th className="py-2.5 px-4">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded] text-[13px]">
                  {trusts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#545b64]">
                        No trust relationships configured.
                      </td>
                    </tr>
                  ) : (
                    trusts.map((t) => (
                      <tr key={t.trustId}>
                        <td className="py-2.5 px-4 font-mono font-medium">{t.remoteDomainName}</td>
                        <td className="py-2.5 px-4">{t.trustType}</td>
                        <td className="py-2.5 px-4">{t.trustDirection}</td>
                        <td className="py-2.5 px-4">{t.trustState}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conditional Forwarders */}
          <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Conditional forwarders</h2>
            <p className="text-[13px] text-[#545b64]">
              Conditional forwarders allow directory DNS servers to resolve queries for external or on-premises domain names.
            </p>
            <div className="border border-[#eaeded] rounded overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Domain Name</th>
                    <th className="py-2.5 px-4">DNS IP Addresses</th>
                    <th className="py-2.5 px-4">Replication Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded] text-[13px]">
                  {forwarders.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-[#545b64]">
                        No conditional forwarders configured.
                      </td>
                    </tr>
                  ) : (
                    forwarders.map((f) => (
                      <tr key={f.remoteDomainName}>
                        <td className="py-2.5 px-4 font-mono font-medium">{f.remoteDomainName}</td>
                        <td className="py-2.5 px-4 font-mono">{f.dnsIpAddrs.join(", ")}</td>
                        <td className="py-2.5 px-4">{f.replicationScope || "Domain"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Tags */}
      {activeTab === "tags" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[#545b64]">
              Tags assigned to this directory resource.
            </p>
            <button
              type="button"
              onClick={() => setShowTagsModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
            >
              Manage tags
            </button>
          </div>

          <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Key</th>
                  <th className="py-2.5 px-4">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded] text-[13px]">
                {tags.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-[#545b64]">
                      No tags attached to this directory.
                    </td>
                  </tr>
                ) : (
                  tags.map((t) => (
                    <tr key={t.Key}>
                      <td className="py-2.5 px-4 font-medium">{t.Key}</td>
                      <td className="py-2.5 px-4 text-[#545b64]">{t.Value}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Reset user password</h3>
            <p className="text-[13px] text-[#545b64]">
              Reset credentials for user in directory <span className="font-bold">{directory.name}</span>.
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

      {/* Create Snapshot Modal */}
      {showSnapshotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create snapshot</h3>
            <p className="text-[13px] text-[#545b64]">
              Create a manual point-in-time snapshot of directory <span className="font-mono font-bold">{directory.directoryId}</span>.
            </p>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">Snapshot name:</label>
              <input
                type="text"
                placeholder="e.g. ManualBackup1"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                maxLength={128}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowSnapshotModal(false)}
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

      {/* Delete Snapshot Modal */}
      {snapshotToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete snapshot</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete snapshot <span className="font-mono font-bold">{snapshotToDelete.snapshotId}</span> ({snapshotToDelete.name || "Manual"})?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setSnapshotToDelete(null)}
                disabled={isDeletingSnapshot}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSnapshot}
                disabled={isDeletingSnapshot}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#d13212] text-white hover:bg-[#b02a0f]"
              >
                {isDeletingSnapshot ? "Deleting..." : "Delete snapshot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Access URL Alias Modal */}
      {showAliasModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create access URL alias</h3>
            <p className="text-[13px] text-[#545b64]">
              Create a custom alias for your directory. Your access URL will be: <code className="bg-[#f2f3f3] px-1 py-0.5 rounded font-bold">https://&lt;alias&gt;.awsapps.com</code>
            </p>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">Alias name:</label>
              <input
                type="text"
                placeholder="e.g. corpexample"
                value={aliasName}
                onChange={(e) => setAliasName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                maxLength={62}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] font-mono"
              />
              <span className="text-[11px] text-[#545b64]">Lowercase letters, numbers, and hyphens. Max 62 characters.</span>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setShowAliasModal(false);
                  setAliasName("");
                }}
                disabled={isCreatingAlias}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAlias}
                disabled={isCreatingAlias || !aliasName.trim()}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isCreatingAlias ? "Creating..." : "Create alias"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Directory Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete directory {directory.directoryId}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete directory <span className="font-bold">{directory.name}</span>? This action is permanent and will remove all user accounts, groups, and policies.
            </p>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#16191f]">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1 py-0.5 rounded">{directory.directoryId}</code> below:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={directory.directoryId}
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
                disabled={isDeletingDirectory}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDirectory}
                disabled={isDeletingDirectory || (deleteConfirmInput !== directory.directoryId && deleteConfirmInput !== "delete")}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white ${
                  (deleteConfirmInput === directory.directoryId || deleteConfirmInput === "delete") && !isDeletingDirectory
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-[#e8a397] cursor-not-allowed"
                }`}
              >
                {isDeletingDirectory ? "Deleting..." : "Delete directory"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Tags Modal */}
      {showTagsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Manage tags</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={newTagKey}
                  onChange={(e) => setNewTagKey(e.target.value)}
                  className="w-1/3 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  className="w-1/2 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={isUpdatingTags || !newTagKey.trim()}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-3 font-bold text-[12px] bg-[#ec7211] text-white rounded hover:bg-[#eb5f07] disabled:opacity-50"
                >
                  Add
                </button>
              </div>

              <div className="border border-[#eaeded] rounded max-h-48 overflow-y-auto divide-y divide-[#eaeded]">
                {tags.length === 0 ? (
                  <div className="p-3 text-[12px] text-[#545b64] text-center">No tags attached.</div>
                ) : (
                  tags.map((t) => (
                    <div key={t.Key} className="flex items-center justify-between p-2 text-[12px]">
                      <div>
                        <strong className="text-[#16191f]">{t.Key}</strong>: <span className="text-[#545b64]">{t.Value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t.Key)}
                        disabled={isUpdatingTags}
                        className="text-[#d13212] font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowTagsModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
