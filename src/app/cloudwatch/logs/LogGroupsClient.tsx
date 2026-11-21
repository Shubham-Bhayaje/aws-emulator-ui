"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogGroupSummary, KmsKeyOption } from "./types";
import {
  createLogGroupAction,
  deleteLogGroupAction,
  putRetentionPolicyAction,
  deleteRetentionPolicyAction,
} from "./actions";
import { formatBytes, formatRetention, formatLogDate } from "./dateUtils";

interface LogGroupsClientProps {
  initialLogGroups: LogGroupSummary[];
  kmsKeys: KmsKeyOption[];
  initialError?: string;
}

const RETENTION_OPTIONS = [
  { value: 0, label: "Never expire" },
  { value: 1, label: "1 day (24 hours)" },
  { value: 3, label: "3 days" },
  { value: 5, label: "5 days" },
  { value: 7, label: "1 week (7 days)" },
  { value: 14, label: "2 weeks (14 days)" },
  { value: 30, label: "1 month (30 days)" },
  { value: 60, label: "2 months (60 days)" },
  { value: 90, label: "3 months (90 days)" },
  { value: 120, label: "4 months (120 days)" },
  { value: 150, label: "5 months (150 days)" },
  { value: 180, label: "6 months (180 days)" },
  { value: 365, label: "1 year (365 days)" },
  { value: 400, label: "13 months (400 days)" },
  { value: 545, label: "18 months (545 days)" },
  { value: 730, label: "2 years (730 days)" },
  { value: 1096, label: "3 years (1096 days)" },
  { value: 1827, label: "5 years (1827 days)" },
  { value: 2192, label: "6 years (2192 days)" },
  { value: 2557, label: "7 years (2557 days)" },
  { value: 2922, label: "8 years (2922 days)" },
  { value: 3288, label: "9 years (3288 days)" },
  { value: 3653, label: "10 years (3653 days)" },
];

export default function LogGroupsClient({
  initialLogGroups,
  kmsKeys,
  initialError,
}: LogGroupsClientProps) {
  const router = useRouter();
  const [logGroups, setLogGroups] = useState<LogGroupSummary[]>(initialLogGroups);
  const [selectedGroupNames, setSelectedGroupNames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(initialError || null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Dropdown & Modal States
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [showExportNoticeModal, setShowExportNoticeModal] = useState(false);

  // Create Form State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupClass, setNewGroupClass] = useState("STANDARD");
  const [newRetentionDays, setNewRetentionDays] = useState(0);
  const [newKmsType, setNewKmsType] = useState<"default" | "custom">("default");
  const [newKmsKeyArn, setNewKmsKeyArn] = useState("");
  const [newTags, setNewTags] = useState<Array<{ key: string; value: string }>>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, startCreateTransition] = useTransition();

  // Retention Edit State
  const [editRetentionDays, setEditRetentionDays] = useState(0);
  const [isUpdatingRetention, startUpdateRetentionTransition] = useTransition();

  // Delete State
  const [deleteInputText, setDeleteInputText] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();

  // Statistics
  const totalStoredBytes = logGroups.reduce((acc, lg) => acc + (lg.storedBytes || 0), 0);
  const totalMetricFilters = logGroups.reduce((acc, lg) => acc + (lg.metricFilterCount || 0), 0);
  const infrequentAccessCount = logGroups.filter((lg) => lg.logGroupClass === "INFREQUENT_ACCESS").length;

  // Filtered List
  const filteredGroups = logGroups.filter((lg) =>
    lg.logGroupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedGroup = logGroups.find((lg) => selectedGroupNames.includes(lg.logGroupName));

  // Selection Handlers
  function toggleSelectAll() {
    if (selectedGroupNames.length === filteredGroups.length) {
      setSelectedGroupNames([]);
    } else {
      setSelectedGroupNames(filteredGroups.map((g) => g.logGroupName));
    }
  }

  function toggleSelectGroup(name: string) {
    if (selectedGroupNames.includes(name)) {
      setSelectedGroupNames(selectedGroupNames.filter((n) => n !== name));
    } else {
      setSelectedGroupNames([...selectedGroupNames, name]);
    }
  }

  // Action Handlers
  function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      setCreateError("Log group name is required.");
      return;
    }

    if (!/^[\.\-_/#A-Za-z0-9]+$/.test(trimmed)) {
      setCreateError(
        "Log group name must contain only letters, numbers, periods, hyphens, underscores, forward slashes, and hash marks."
      );
      return;
    }

    const tagsMap: Record<string, string> = {};
    for (const t of newTags) {
      if (t.key.trim()) {
        tagsMap[t.key.trim()] = t.value.trim();
      }
    }

    startCreateTransition(async () => {
      const res = await createLogGroupAction({
        logGroupName: trimmed,
        logGroupClass: newGroupClass,
        retentionInDays: newRetentionDays > 0 ? newRetentionDays : undefined,
        kmsKeyId: newKmsType === "custom" && newKmsKeyArn ? newKmsKeyArn : undefined,
        tags: Object.keys(tagsMap).length > 0 ? tagsMap : undefined,
      });

      if (res.success) {
        setShowCreateModal(false);
        setNewGroupName("");
        setNewGroupClass("STANDARD");
        setNewRetentionDays(0);
        setNewKmsType("default");
        setNewKmsKeyArn("");
        setNewTags([]);
        setSuccessBanner(`Successfully created log group '${trimmed}'.`);
        router.refresh();
      } else {
        setCreateError(res.error || "Failed to create log group.");
      }
    });
  }

  function handleDeleteGroups() {
    if (selectedGroupNames.length === 0 || deleteInputText.trim().toLowerCase() !== "delete") return;
    setError(null);
    startDeleteTransition(async () => {
      let failedCount = 0;
      let lastErrMsg = "";

      for (const name of selectedGroupNames) {
        const res = await deleteLogGroupAction(name);
        if (!res.success) {
          failedCount++;
          lastErrMsg = res.error || "Failed to delete log group.";
        }
      }

      if (failedCount === 0) {
        setSuccessBanner(
          selectedGroupNames.length === 1
            ? `Successfully deleted log group '${selectedGroupNames[0]}'.`
            : `Successfully deleted ${selectedGroupNames.length} log groups.`
        );
        setSelectedGroupNames([]);
        setShowDeleteModal(false);
        setDeleteInputText("");
        router.refresh();
      } else {
        setError(`Failed to delete ${failedCount} log group(s): ${lastErrMsg}`);
        setShowDeleteModal(false);
      }
    });
  }

  function handleUpdateRetention() {
    if (selectedGroupNames.length === 0) return;
    setError(null);
    startUpdateRetentionTransition(async () => {
      let failedCount = 0;
      let lastErrMsg = "";

      for (const name of selectedGroupNames) {
        const res =
          editRetentionDays === 0
            ? await deleteRetentionPolicyAction(name)
            : await putRetentionPolicyAction(name, editRetentionDays);

        if (!res.success) {
          failedCount++;
          lastErrMsg = res.error || "Failed to update retention policy.";
        }
      }

      if (failedCount === 0) {
        setSuccessBanner(
          `Retention policy updated for ${selectedGroupNames.length} log group(s).`
        );
        setShowRetentionModal(false);
        router.refresh();
      } else {
        setError(`Failed to update retention on ${failedCount} group(s): ${lastErrMsg}`);
        setShowRetentionModal(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Notifications */}
      {error && (
        <div className="bg-[#fdf2f2] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-start justify-between shadow-sm">
          <div>
            <span className="font-bold">Error: </span>
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-[12px] font-bold text-[#545b64] hover:text-[#16191f] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {successBanner && (
        <div className="bg-[#f2f8f4] border border-[#037f0c] rounded p-3 text-[13px] text-[#037f0c] flex items-start justify-between shadow-sm">
          <div>
            <span className="font-bold">Success: </span>
            {successBanner}
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-[12px] font-bold text-[#545b64] hover:text-[#16191f] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">Log groups</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            Amazon CloudWatch Logs enables you to monitor, store, and access your log files from Amazon EC2 instances, AWS CloudTrail, Lambda functions, and other sources.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              disabled={selectedGroupNames.length === 0}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`px-3 border rounded text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors ${
                selectedGroupNames.length === 0
                  ? "bg-[#f2f3f3] text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
                  : "bg-white text-[#16191f] border-[#545b64] hover:bg-[#fafafa]"
              }`}
            >
              Actions
              <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
                <path d="M0 0.5L5 5.5L10 0.5H0Z" />
              </svg>
            </button>

            {showActionsDropdown && selectedGroupNames.length > 0 && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white border border-[#eaeded] rounded shadow-lg z-20 py-1 text-[13px]"
                onMouseLeave={() => setShowActionsDropdown(false)}
              >
                <button
                  onClick={() => {
                    setShowActionsDropdown(false);
                    setEditRetentionDays(selectedGroup?.retentionInDays || 0);
                    setShowRetentionModal(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f2f3f3] text-[#16191f]"
                >
                  Edit retention setting
                </button>
                {selectedGroupNames.length === 1 && (
                  <Link
                    href={`/cloudwatch/logs/group/${encodeURIComponent(selectedGroupNames[0])}`}
                    className="block w-full text-left px-4 py-2 hover:bg-[#f2f3f3] text-[#16191f]"
                  >
                    View log events
                  </Link>
                )}
                <button
                  onClick={() => {
                    setShowActionsDropdown(false);
                    setShowExportNoticeModal(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f2f3f3] text-[#16191f]"
                >
                  Create export to Amazon S3
                </button>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  onClick={() => {
                    setShowActionsDropdown(false);
                    setDeleteInputText("");
                    setShowDeleteModal(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#fdf2f2] text-[#d13212]"
                >
                  Delete log group(s)
                </button>
              </div>
            )}
          </div>

          {/* Primary Create Button */}
          <button
            onClick={() => {
              setCreateError(null);
              setShowCreateModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm transition-colors inline-flex items-center justify-center"
          >
            Create log group
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded-lg p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Total Log Groups
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">
            {logGroups.length}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">Across this Region</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-lg p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Stored Bytes
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">
            {formatBytes(totalStoredBytes)}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">Total compressed volume</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-lg p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Metric Filters
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">
            {totalMetricFilters}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">Transforming logs to metrics</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded-lg p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Infrequent Access
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">
            {infrequentAccessCount}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">Cost-optimized classes</div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#eaeded] rounded-lg shadow-sm">
        {/* Search Bar & Table Controls */}
        <div className="p-4 border-b border-[#eaeded] flex items-center justify-between gap-4">
          <div className="max-w-md w-full relative">
            <input
              type="text"
              placeholder="Search log groups by prefix or name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] placeholder-[#879596] focus:outline-none focus:border-[#ec7211]"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.refresh()}
              title="Refresh"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-2.5 border border-[#545b64] rounded text-[#16191f] hover:bg-[#f2f3f3] transition-colors inline-flex items-center justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>
            <span className="text-[12px] text-[#545b64]">
              Showing {filteredGroups.length} of {logGroups.length} log groups
            </span>
          </div>
        </div>

        {/* Table / Empty State */}
        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-[16px] font-bold text-[#16191f]">No log groups found</div>
            <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
              {searchQuery
                ? `No log groups match the search query "${searchQuery}".`
                : "You do not have any CloudWatch Logs log groups in this Region. To get started, create a log group."}
            </p>
            {!searchQuery && (
              <div className="pt-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm transition-colors inline-flex items-center justify-center"
                >
                  Create log group
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#16191f]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[12px] font-bold text-[#545b64]">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        filteredGroups.length > 0 &&
                        selectedGroupNames.length === filteredGroups.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-[#aab7b8] text-[#ec7211] focus:ring-0"
                    />
                  </th>
                  <th className="px-4 py-3">Log group name</th>
                  <th className="px-4 py-3">Log class</th>
                  <th className="px-4 py-3">Retention</th>
                  <th className="px-4 py-3">Stored bytes</th>
                  <th className="px-4 py-3">Metric filters</th>
                  <th className="px-4 py-3">KMS key ID</th>
                  <th className="px-4 py-3">Creation time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {filteredGroups.map((lg) => {
                  const isChecked = selectedGroupNames.includes(lg.logGroupName);
                  return (
                    <tr
                      key={lg.logGroupName}
                      className={`hover:bg-[#f2f8fd] transition-colors ${
                        isChecked ? "bg-[#f2f8fd]" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectGroup(lg.logGroupName)}
                          className="rounded border-[#aab7b8] text-[#ec7211] focus:ring-0"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <Link
                          href={`/cloudwatch/logs/group/${encodeURIComponent(lg.logGroupName)}`}
                          className="text-[#0972d3] hover:underline"
                        >
                          {lg.logGroupName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            lg.logGroupClass === "INFREQUENT_ACCESS"
                              ? "bg-[#ebf3fb] text-[#0972d3]"
                              : "bg-[#f2f3f3] text-[#16191f]"
                          }`}
                        >
                          {lg.logGroupClass === "INFREQUENT_ACCESS"
                            ? "Infrequent Access"
                            : "Standard"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {formatRetention(lg.retentionInDays)}
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {formatBytes(lg.storedBytes)}
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {lg.metricFilterCount}
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {lg.kmsKeyId ? (
                          <span className="font-mono text-[12px]">{lg.kmsKeyId}</span>
                        ) : (
                          "Default (AWS)"
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#545b64]" suppressHydrationWarning>
                        {lg.creationTime
                          ? isMounted
                            ? new Date(lg.creationTime).toLocaleString()
                            : formatLogDate(lg.creationTime)
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Log Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h2 className="text-[18px] font-bold text-[#16191f]">Create log group</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#545b64] hover:text-[#16191f] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="bg-[#fdf2f2] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212]">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-bold text-[#16191f] mb-1">
                  Log group name <span className="text-[#d13212]">*</span>
                </label>
                <p className="text-[12px] text-[#545b64] mb-1.5">
                  Must be unique in the Region. Can include numbers, letters, underscores, hyphens, periods, and forward slashes.
                </p>
                <input
                  type="text"
                  placeholder="/aws/lambda/my-function"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 font-mono text-[13px] focus:outline-none focus:border-[#ec7211]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#16191f] mb-1">Log class</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label
                    className={`border rounded p-3 cursor-pointer flex flex-col justify-between ${
                      newGroupClass === "STANDARD"
                        ? "border-[#ec7211] bg-[#fffaf5]"
                        : "border-[#eaeded] hover:bg-[#fafafa]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="logClass"
                        value="STANDARD"
                        checked={newGroupClass === "STANDARD"}
                        onChange={() => setNewGroupClass("STANDARD")}
                        className="text-[#ec7211] focus:ring-0"
                      />
                      <span className="font-bold text-[#16191f]">Standard</span>
                    </div>
                    <span className="text-[11px] text-[#545b64] mt-2">
                      Real-time analysis, metric filters, live tail, and subscriptions.
                    </span>
                  </label>

                  <label
                    className={`border rounded p-3 cursor-pointer flex flex-col justify-between ${
                      newGroupClass === "INFREQUENT_ACCESS"
                        ? "border-[#ec7211] bg-[#fffaf5]"
                        : "border-[#eaeded] hover:bg-[#fafafa]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="logClass"
                        value="INFREQUENT_ACCESS"
                        checked={newGroupClass === "INFREQUENT_ACCESS"}
                        onChange={() => setNewGroupClass("INFREQUENT_ACCESS")}
                        className="text-[#ec7211] focus:ring-0"
                      />
                      <span className="font-bold text-[#16191f]">Infrequent Access</span>
                    </div>
                    <span className="text-[11px] text-[#545b64] mt-2">
                      Cost-optimized log class for scheduled queries and archival.
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#16191f] mb-1">
                  Retention setting
                </label>
                <p className="text-[12px] text-[#545b64] mb-1.5">
                  Determine how long log events are retained in this log group.
                </p>
                <select
                  value={newRetentionDays}
                  onChange={(e) => setNewRetentionDays(Number(e.target.value))}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 bg-white focus:outline-none focus:border-[#ec7211]"
                >
                  {RETENTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#16191f] mb-1">
                  KMS key encryption
                </label>
                <div className="space-y-2 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kmsOption"
                      checked={newKmsType === "default"}
                      onChange={() => setNewKmsType("default")}
                      className="text-[#ec7211] focus:ring-0"
                    />
                    <span>Default encryption (AWS managed key)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kmsOption"
                      checked={newKmsType === "custom"}
                      onChange={() => setNewKmsType("custom")}
                      className="text-[#ec7211] focus:ring-0"
                    />
                    <span>Customer managed key (AWS KMS)</span>
                  </label>
                </div>

                {newKmsType === "custom" && (
                  <div className="mt-2 pl-6">
                    {kmsKeys.length === 0 ? (
                      <p className="text-[12px] text-[#545b64]">
                        No KMS keys found in this Region.{" "}
                        <Link href="/kms" className="text-[#0972d3] hover:underline">
                          Create a KMS key
                        </Link>
                      </p>
                    ) : (
                      <select
                        value={newKmsKeyArn}
                        onChange={(e) => setNewKmsKeyArn(e.target.value)}
                        className="w-full border border-[#aab7b8] rounded px-3 py-1.5 bg-white focus:outline-none focus:border-[#ec7211]"
                      >
                        <option value="">Select a KMS key...</option>
                        {kmsKeys.map((k) => (
                          <option key={k.arn} value={k.arn}>
                            {k.aliasName || k.keyId} ({k.arn.slice(-12)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Tags Section */}
              <div className="border-t border-[#eaeded] pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-[#16191f]">Tags (optional)</label>
                  <button
                    type="button"
                    onClick={() => setNewTags([...newTags, { key: "", value: "" }])}
                    className="text-[12px] text-[#0972d3] hover:underline font-medium"
                  >
                    + Add new tag
                  </button>
                </div>
                {newTags.map((tag, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={tag.key}
                      onChange={(e) => {
                        const copy = [...newTags];
                        copy[idx].key = e.target.value;
                        setNewTags(copy);
                      }}
                      className="flex-1 border border-[#aab7b8] rounded px-2.5 py-1 text-[12px]"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={tag.value}
                      onChange={(e) => {
                        const copy = [...newTags];
                        copy[idx].value = e.target.value;
                        setNewTags(copy);
                      }}
                      className="flex-1 border border-[#aab7b8] rounded px-2.5 py-1 text-[12px]"
                    />
                    <button
                      type="button"
                      onClick={() => setNewTags(newTags.filter((_, i) => i !== idx))}
                      className="text-[#d13212] hover:opacity-80 px-1 font-bold text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 border border-[#545b64] rounded text-[#16191f] hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold rounded shadow-sm disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Retention Modal */}
      {showRetentionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">
              Edit retention setting
            </h2>
            <p className="text-[13px] text-[#545b64]">
              Updating retention setting for {selectedGroupNames.length} selected log group(s).
            </p>

            <div>
              <label className="block font-bold text-[#16191f] text-[13px] mb-1">
                Retention period
              </label>
              <select
                value={editRetentionDays}
                onChange={(e) => setEditRetentionDays(Number(e.target.value))}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#ec7211]"
              >
                {RETENTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowRetentionModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#545b64] rounded text-[13px] text-[#16191f] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRetention}
                disabled={isUpdatingRetention}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm disabled:opacity-50"
              >
                {isUpdatingRetention ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#fdf2f2] text-[#d13212] flex items-center justify-center flex-shrink-0 font-bold">
                !
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-[#16191f]">
                  Delete {selectedGroupNames.length} log group(s)?
                </h2>
                <p className="text-[13px] text-[#545b64] mt-1">
                  This action cannot be undone. All log streams, log events, metric filters, and subscription filters in the selected log group(s) will be permanently deleted.
                </p>
              </div>
            </div>

            <div className="bg-[#f2f3f3] p-3 rounded text-[12px] font-mono max-h-32 overflow-y-auto">
              {selectedGroupNames.map((name) => (
                <div key={name} className="truncate">
                  {name}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                To confirm deletion, type <span className="font-mono text-[#d13212]">delete</span> below:
              </label>
              <input
                type="text"
                value={deleteInputText}
                onChange={(e) => setDeleteInputText(e.target.value)}
                placeholder="delete"
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#d13212]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteInputText("");
                }}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#545b64] rounded text-[13px] text-[#16191f] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGroups}
                disabled={isDeleting || deleteInputText.trim().toLowerCase() !== "delete"}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#d13212] hover:bg-[#a82a0f] text-white font-bold text-[13px] rounded shadow-sm disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export to S3 Notice Modal */}
      {showExportNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">
              Create export to Amazon S3
            </h2>
            <div className="p-3 bg-[#f2f8fd] border border-[#0972d3] rounded text-[13px] text-[#16191f]">
              <span className="font-bold text-[#0972d3]">Emulator Limitation: </span>
              Asynchronous bulk log export tasks to Amazon S3 (<code>CreateExportTask</code>) are not supported by the local emulator engine. To archive log records, stream them in real time using a Subscription Filter to Amazon Kinesis.
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowExportNoticeModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#ec7211] text-white font-bold text-[13px] rounded shadow-sm"
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
