/**
 * src/components/ec2/SnapshotsClient.tsx – EBS Snapshots Console Replica.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  EBSSnapshot,
  EBSVolume,
  createLiveSnapshot,
  deleteLiveSnapshot,
  fetchLiveSnapshots,
  createLiveVolume,
} from "@/app/ec2/actions";

interface Props {
  initialSnapshots?: EBSSnapshot[];
  volumes?: EBSVolume[];
  availableVolumeIds?: string[];
  isLive?: boolean;
}

export default function SnapshotsClient({
  initialSnapshots = [],
  volumes = [],
  availableVolumeIds = [],
  isLive = false,
}: Props) {
  const [snapshots, setSnapshots] = useState<EBSSnapshot[]>(initialSnapshots || []);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(
    initialSnapshots && initialSnapshots.length > 0 ? initialSnapshots[0]?.id : null
  );
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"self" | "all" | "public">("self");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "permissions" | "tags">("details");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateVolumeModal, setShowCreateVolumeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Determine initial volume ID safely
  const defaultVolumeId =
    (volumes && volumes.length > 0 ? volumes[0]?.id : null) ||
    (availableVolumeIds && availableVolumeIds.length > 0 ? availableVolumeIds[0] : "") ||
    "";

  // Create Snapshot Form
  const [targetVolumeId, setTargetVolumeId] = useState<string>(defaultVolumeId);
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotDesc, setSnapshotDesc] = useState("");

  // Create Volume from Snapshot Form
  const [volumeType, setVolumeType] = useState("gp3");
  const [volumeSizeGb, setVolumeSizeGb] = useState(20);
  const [volumeAz, setVolumeAz] = useState("us-east-1a");
  const [volumeIops, setVolumeIops] = useState(3000);

  const selectedSnapshot = (snapshots || []).find((s) => s.id === selectedSnapshotId) || null;

  const totalSizeGb = (snapshots || []).reduce((acc, s) => acc + (s.sizeGb || 0), 0);
  const completedCount = (snapshots || []).filter((s) => s.state === "completed").length;

  function refreshSnapshots(currentScope = scope) {
    startTransition(async () => {
      const res = await fetchLiveSnapshots(currentScope);
      const list = res.snapshots || [];
      setSnapshots(list);
      if (list.length > 0 && (!selectedSnapshotId || !list.some((s) => s.id === selectedSnapshotId))) {
        setSelectedSnapshotId(list[0]?.id || null);
      }
    });
  }

  function handleScopeChange(newScope: "self" | "all" | "public") {
    setScope(newScope);
    refreshSnapshots(newScope);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!targetVolumeId) return;

    startTransition(async () => {
      const res = await createLiveSnapshot(
        targetVolumeId,
        snapshotDesc || `Snapshot of ${targetVolumeId}`,
        snapshotName || undefined
      );

      if (res.success && res.snapshotId) {
        setShowCreateModal(false);
        setSnapshotName("");
        setSnapshotDesc("");
        const fresh = await fetchLiveSnapshots(scope);
        const list = fresh.snapshots || [];
        setSnapshots(list);
        setSelectedSnapshotId(res.snapshotId);
        setFeedback(`Snapshot ${res.snapshotId} created successfully.`);
      } else {
        setFeedback(`Creation failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleCreateVolumeFromSnapshot(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSnapshotId) return;

    startTransition(async () => {
      const res = await createLiveVolume({
        snapshotId: selectedSnapshotId,
        volumeType,
        sizeGb: volumeSizeGb,
        availabilityZone: volumeAz,
        iops: volumeType === "gp3" ? volumeIops : undefined,
      });

      if (res.success && res.volume) {
        setShowCreateVolumeModal(false);
        setFeedback(`Volume ${res.volume.id} created from snapshot ${selectedSnapshotId}.`);
      } else {
        setFeedback(`Volume creation failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDelete() {
    if (!selectedSnapshotId) return;
    const targetId = selectedSnapshotId;

    startTransition(async () => {
      const res = await deleteLiveSnapshot(targetId);
      if (res.success) {
        setShowDeleteModal(false);
        const fresh = await fetchLiveSnapshots(scope);
        const list = fresh.snapshots || [];
        setSnapshots(list);
        setSelectedSnapshotId(list[0]?.id || null);
        setFeedback(`Snapshot ${targetId} was deleted.`);
      } else {
        setFeedback(`Delete failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  const filtered = (snapshots || []).filter(
    (s) =>
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
      (s.volumeId && s.volumeId.toLowerCase().includes(search.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Live Badge */}
      <div className="flex items-center justify-between bg-white border border-[#d5dbdb] px-4 py-2.5 rounded-sm awsui-shadow">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isLive ? "bg-[#1d8102]" : "bg-[#ec7211]"
              }`}
            />
            <span className="text-[12px] font-semibold text-[#16191f]">
              {isLive ? "EBS Snapshot Service Connected (AWS Emulator)" : "Disconnected from AWS Emulator (127.0.0.1:9297)"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        {feedback && <span className="text-[12px] text-[#0073bb] font-medium">{feedback}</span>}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Total Snapshots
          </div>
          <div className="text-[26px] font-bold text-[#16191f] mt-1">{(snapshots || []).length}</div>
        </div>

        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Total Snapshot Storage
          </div>
          <div className="text-[26px] font-bold text-[#16191f] mt-1">{totalSizeGb} GiB</div>
        </div>

        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Completed Snapshots
          </div>
          <div className="text-[26px] font-bold text-[#1d8102] mt-1">{completedCount}</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-[#16191f]">Snapshots</h2>
              <span className="text-[13px] text-[#545b64]">({filtered.length})</span>
            </div>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Amazon EBS snapshots are incremental backups that retain changes made since the most recent snapshot.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
            <button
              onClick={() => refreshSnapshots()}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                if (selectedSnapshot) {
                  setVolumeSizeGb(selectedSnapshot.sizeGb || 20);
                  setShowCreateVolumeModal(true);
                }
              }}
              disabled={!selectedSnapshot}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Create volume from snapshot
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={!selectedSnapshot}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#d13212] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#d13212] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Delete snapshot
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            >
              Create snapshot
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-[#f8f9fa] border-b border-[#eaeded] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <select
              value={scope}
              onChange={(e) => handleScopeChange(e.target.value as any)}
              className="px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm bg-white text-[#16191f] focus:outline-none focus:border-[#ec7211]"
            >
              <option value="self">Owned by me</option>
              <option value="public">Public snapshots</option>
              <option value="all">All snapshots</option>
            </select>

            <input
              type="text"
              placeholder="Filter by ID, name, volume, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm focus:outline-none focus:border-[#ec7211] bg-white text-[#16191f]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-10 text-center"></th>
                <th className="py-2.5 px-3">Snapshot ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Volume ID</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3">Started</th>
                <th className="py-2.5 px-3">Encryption</th>
                <th className="py-2.5 px-3">Storage tier</th>
                <th className="py-2.5 px-3">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-[#545b64]">
                    No snapshots found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isSelected = selectedSnapshotId === s.id;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSnapshotId(s.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#f9fafb]"
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="radio"
                          name="snapshot-select"
                          checked={isSelected}
                          onChange={() => setSelectedSnapshotId(s.id)}
                          className="h-4 w-4 text-[#ec7211] border-[#aab7b8] focus:ring-0"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#0073bb]">
                        {s.id}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#16191f]">
                        {s.name || "—"}
                      </td>
                      <td className="py-3 px-3 font-mono">{s.sizeGb} GiB</td>
                      <td className="py-3 px-3 text-[#545b64] max-w-xs truncate" title={s.description}>
                        {s.description}
                      </td>
                      <td className="py-3 px-3">
                        {s.volumeId && s.volumeId !== "—" ? (
                          <Link
                            href={`/ec2/volumes`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-[#0073bb] hover:underline"
                          >
                            {s.volumeId}
                          </Link>
                        ) : (
                          <span className="text-[#545b64]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                            s.state === "completed"
                              ? "bg-[#e6f4ea] text-[#137333]"
                              : "bg-[#fff3e0] text-[#e65100]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              s.state === "completed" ? "bg-[#137333]" : "bg-[#e65100]"
                            }`}
                          />
                          {s.state}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">{s.progress}</td>
                      <td className="py-3 px-3 text-[#545b64] text-[12px]">{s.startTime}</td>
                      <td className="py-3 px-3 text-[#545b64]">
                        {s.encrypted ? "Encrypted" : "Not encrypted"}
                      </td>
                      <td className="py-3 px-3 capitalize text-[#545b64]">{s.storageTier}</td>
                      <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">{s.ownerId}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Detail Drawer */}
      {selectedSnapshot && (
        <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
          <div className="border-b border-[#eaeded] px-6 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-[16px] font-bold text-[#16191f] font-mono">
                {selectedSnapshot.id}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f4ea] text-[#137333]">
                {selectedSnapshot.state}
              </span>
            </div>

            <div className="flex gap-6 border-b border-[#eaeded] -mb-[1px]">
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("permissions")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeTab === "permissions"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Permissions
              </button>
              <button
                onClick={() => setActiveTab("tags")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeTab === "tags"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Tags ({Object.keys(selectedSnapshot.tags || {}).length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Snapshot ID</span>
                    <span className="font-mono font-bold text-[#16191f]">{selectedSnapshot.id}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Description</span>
                    <span className="text-[#16191f]">{selectedSnapshot.description}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Volume ID</span>
                    <span className="font-mono text-[#0073bb]">{selectedSnapshot.volumeId}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Size</span>
                    <span className="font-mono text-[#16191f]">{selectedSnapshot.sizeGb} GiB</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Status</span>
                    <span className="text-[#16191f] capitalize">{selectedSnapshot.state}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Progress</span>
                    <span className="font-mono text-[#16191f]">{selectedSnapshot.progress}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Started</span>
                    <span className="text-[#16191f]">{selectedSnapshot.startTime}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Storage tier</span>
                    <span className="text-[#16191f] capitalize">{selectedSnapshot.storageTier}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Encryption</span>
                    <span className="text-[#16191f]">
                      {selectedSnapshot.encrypted ? "Encrypted (AWS managed-key)" : "Not encrypted"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">KMS key ID</span>
                    <span className="font-mono text-[#545b64]">{selectedSnapshot.kmsKeyId || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Owner ID</span>
                    <span className="font-mono text-[#16191f]">{selectedSnapshot.ownerId}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Amazon Resource Name (ARN)</span>
                    <span className="font-mono text-[12px] text-[#545b64] break-all">{selectedSnapshot.arn}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "permissions" && (
              <div className="space-y-4 text-[13px]">
                <div>
                  <span className="text-[#545b64] block text-[12px]">Access permissions</span>
                  <span className="text-[#16191f] font-semibold">Private</span>
                  <p className="text-[12px] text-[#545b64] mt-1">
                    Only your AWS account has access to this snapshot.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#eaeded]">
                  <span className="text-[#545b64] block text-[12px]">Shared accounts</span>
                  <span className="text-[#545b64]">No other accounts have permissions to restore from this snapshot.</span>
                </div>
              </div>
            )}

            {activeTab === "tags" && (
              <div className="space-y-4">
                {selectedSnapshot.tags && Object.keys(selectedSnapshot.tags).length > 0 ? (
                  <div className="border border-[#eaeded] rounded-sm overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Key</th>
                          <th className="py-2.5 px-4">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeded]">
                        {Object.entries(selectedSnapshot.tags).map(([k, v]) => (
                          <tr key={k}>
                            <td className="py-2.5 px-4 font-mono font-semibold text-[#16191f]">{k}</td>
                            <td className="py-2.5 px-4 text-[#545b64]">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-[#545b64] text-[13px]">
                    No tags associated with this snapshot.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Create Snapshot */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <div className="border-b border-[#eaeded] pb-3">
              <h3 className="text-[18px] font-bold text-[#16191f]">Create snapshot</h3>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Create a point-in-time snapshot backup of an EBS volume in this region.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Volume
              </label>
              {(volumes || []).length > 0 ? (
                <select
                  value={targetVolumeId}
                  onChange={(e) => setTargetVolumeId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
                  required
                >
                  {(volumes || []).map((vol) => (
                    <option key={vol.id} value={vol.id}>
                      {vol.id} ({vol.sizeGb} GiB, {vol.name ? vol.name : vol.volumeType})
                    </option>
                  ))}
                </select>
              ) : (availableVolumeIds || []).length > 0 ? (
                <select
                  value={targetVolumeId}
                  onChange={(e) => setTargetVolumeId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
                  required
                >
                  {(availableVolumeIds || []).map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. vol-0000000000000008e"
                  value={targetVolumeId}
                  onChange={(e) => setTargetVolumeId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Snapshot Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. daily-db-snapshot"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Scheduled snapshot before database schema migration"
                value={snapshotDesc}
                onChange={(e) => setSnapshotDesc(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3.5 border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !targetVolumeId}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create snapshot"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Create Volume from Snapshot */}
      {showCreateVolumeModal && selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateVolumeFromSnapshot}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <div className="border-b border-[#eaeded] pb-3">
              <h3 className="text-[18px] font-bold text-[#16191f]">Create volume from snapshot</h3>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Restore snapshot <strong className="font-mono text-[#16191f]">{selectedSnapshot.id}</strong> into a new EBS volume.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Volume type
              </label>
              <select
                value={volumeType}
                onChange={(e) => setVolumeType(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
              >
                <option value="gp3">General Purpose SSD (gp3)</option>
                <option value="gp2">General Purpose SSD (gp2)</option>
                <option value="io1">Provisioned IOPS SSD (io1)</option>
                <option value="standard">Magnetic (standard)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Size (GiB)
                </label>
                <input
                  type="number"
                  min={selectedSnapshot.sizeGb || 1}
                  max="16384"
                  value={volumeSizeGb}
                  onChange={(e) => setVolumeSizeGb(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                  required
                />
                <span className="text-[11px] text-[#545b64]">Min: {selectedSnapshot.sizeGb} GiB</span>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Availability Zone
                </label>
                <select
                  value={volumeAz}
                  onChange={(e) => setVolumeAz(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
                >
                  <option value="us-east-1a">us-east-1a</option>
                  <option value="us-east-1b">us-east-1b</option>
                  <option value="us-east-1c">us-east-1c</option>
                </select>
              </div>
            </div>

            {volumeType === "gp3" && (
              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  IOPS
                </label>
                <input
                  type="number"
                  min="3000"
                  max="16000"
                  value={volumeIops}
                  onChange={(e) => setVolumeIops(parseInt(e.target.value, 10) || 3000)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCreateVolumeModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3.5 border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create volume"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Delete Snapshot */}
      {showDeleteModal && selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete snapshot</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to delete snapshot{" "}
              <strong className="text-[#16191f] font-mono">{selectedSnapshot.id}</strong> (
              {selectedSnapshot.sizeGb} GiB)?
            </p>
            <p className="text-[12px] text-[#d13212] mt-3">
              This action cannot be undone. You will not be able to restore volumes from this snapshot.
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3.5 border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#d13212] hover:bg-[#b02008] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
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
