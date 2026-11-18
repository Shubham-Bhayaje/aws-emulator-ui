/**
 * src/components/ec2/VolumesClient.tsx – EBS Volumes Console Replica.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  EBSVolume,
  EC2Instance,
  EBSSnapshot,
  fetchLiveVolumes,
  createLiveVolume,
  deleteLiveVolume,
  attachLiveVolume,
  detachLiveVolume,
  createLiveSnapshot,
} from "@/app/ec2/actions";

interface Props {
  initialVolumes?: EBSVolume[];
  instances?: EC2Instance[];
  snapshots?: EBSSnapshot[];
  isLive?: boolean;
}

export default function VolumesClient({
  initialVolumes = [],
  instances = [],
  snapshots = [],
  isLive = false,
}: Props) {
  const [volumes, setVolumes] = useState<EBSVolume[]>(initialVolumes || []);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(
    initialVolumes && initialVolumes.length > 0 ? initialVolumes[0]?.id : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "attachments" | "tags">("details");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showDetachModal, setShowDetachModal] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Create Volume Form
  const [newVolumeType, setNewVolumeType] = useState("gp3");
  const [newSizeGb, setNewSizeGb] = useState(20);
  const [newIops, setNewIops] = useState(3000);
  const [newThroughput, setNewThroughput] = useState(125);
  const [newAz, setNewAz] = useState("us-east-1a");
  const [newSnapshotId, setNewSnapshotId] = useState("");
  const [newName, setNewName] = useState("");
  const [newEncrypted, setNewEncrypted] = useState(false);

  // Attach Volume Form
  const [targetInstanceId, setTargetInstanceId] = useState(
    instances && instances.length > 0 ? instances[0]?.id : ""
  );
  const [targetDevice, setTargetDevice] = useState("/dev/xvdf");

  // Detach Volume Form
  const [forceDetach, setForceDetach] = useState(false);

  // Create Snapshot Form
  const [snapshotDesc, setSnapshotDesc] = useState("");
  const [snapshotName, setSnapshotName] = useState("");

  const selectedVolume = volumes.find((v) => v.id === selectedVolumeId) || null;

  const totalStorageGb = volumes.reduce((acc, v) => acc + (v.sizeGb || 0), 0);
  const inUseCount = volumes.filter((v) => v.state === "in-use").length;
  const availableCount = volumes.filter((v) => v.state === "available").length;

  function refreshVolumes() {
    startTransition(async () => {
      const res = await fetchLiveVolumes();
      setVolumes(res.volumes);
      if (res.volumes.length > 0 && (!selectedVolumeId || !res.volumes.some((v) => v.id === selectedVolumeId))) {
        setSelectedVolumeId(res.volumes[0].id);
      }
    });
  }

  function handleCreateVolume(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createLiveVolume({
        sizeGb: newSizeGb,
        availabilityZone: newAz,
        volumeType: newVolumeType,
        iops: newVolumeType === "gp3" || newVolumeType === "io1" ? newIops : undefined,
        throughput: newVolumeType === "gp3" ? newThroughput : undefined,
        snapshotId: newSnapshotId.trim() || undefined,
        name: newName.trim() || undefined,
        encrypted: newEncrypted,
      });

      if (res.success && res.volume) {
        setShowCreateModal(false);
        const fresh = await fetchLiveVolumes();
        setVolumes(fresh.volumes);
        setSelectedVolumeId(res.volume.id);
        setFeedback(`Volume ${res.volume.id} created successfully.`);
      } else {
        setFeedback(`Failed to create volume: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleAttachVolume(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVolumeId || !targetInstanceId) return;

    startTransition(async () => {
      const res = await attachLiveVolume({
        volumeId: selectedVolumeId,
        instanceId: targetInstanceId,
        device: targetDevice,
      });

      if (res.success) {
        setShowAttachModal(false);
        const fresh = await fetchLiveVolumes();
        setVolumes(fresh.volumes);
        setFeedback(`Attached ${selectedVolumeId} to ${targetInstanceId} at ${targetDevice}.`);
      } else {
        setFeedback(`Attach failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDetachVolume(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVolumeId) return;

    startTransition(async () => {
      const res = await detachLiveVolume({
        volumeId: selectedVolumeId,
        force: forceDetach,
      });

      if (res.success) {
        setShowDetachModal(false);
        const fresh = await fetchLiveVolumes();
        setVolumes(fresh.volumes);
        setFeedback(`Volume ${selectedVolumeId} detached successfully.`);
      } else {
        setFeedback(`Detach failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleCreateSnapshot(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVolumeId) return;

    startTransition(async () => {
      const res = await createLiveSnapshot(
        selectedVolumeId,
        snapshotDesc || `Snapshot of ${selectedVolumeId}`,
        snapshotName || undefined
      );

      if (res.success && res.snapshotId) {
        setShowSnapshotModal(false);
        setSnapshotDesc("");
        setSnapshotName("");
        setFeedback(`Snapshot ${res.snapshotId} created from ${selectedVolumeId}.`);
      } else {
        setFeedback(`Snapshot creation failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDeleteVolume() {
    if (!selectedVolumeId) return;
    const targetId = selectedVolumeId;

    startTransition(async () => {
      const res = await deleteLiveVolume(targetId);
      if (res.success) {
        setShowDeleteModal(false);
        const fresh = await fetchLiveVolumes();
        setVolumes(fresh.volumes);
        setSelectedVolumeId(fresh.volumes[0]?.id || null);
        setFeedback(`Volume ${targetId} was deleted.`);
      } else {
        setFeedback(`Failed to delete volume: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  const filteredVolumes = volumes.filter(
    (v) =>
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.name && v.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.attachmentInstanceId && v.attachmentInstanceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.volumeType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.availabilityZone.toLowerCase().includes(searchQuery.toLowerCase())
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
              {isLive ? "EBS Volume Service Connected (AWS Emulator)" : "Mock Data Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        {feedback && <span className="text-[12px] text-[#0073bb] font-medium">{feedback}</span>}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Total Volumes
          </div>
          <div className="text-[26px] font-bold text-[#16191f] mt-1">{volumes.length}</div>
        </div>

        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Provisioned Storage
          </div>
          <div className="text-[26px] font-bold text-[#16191f] mt-1">{totalStorageGb} GiB</div>
        </div>

        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            In-use Volumes
          </div>
          <div className="text-[26px] font-bold text-[#1d8102] mt-1">{inUseCount}</div>
        </div>

        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Available Volumes
          </div>
          <div className="text-[26px] font-bold text-[#0073bb] mt-1">{availableCount}</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-[#16191f]">Volumes</h2>
              <span className="text-[13px] text-[#545b64]">({filteredVolumes.length})</span>
            </div>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Amazon Elastic Block Store (EBS) volumes provide persistent block storage for EC2 instances in the AWS Cloud.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
            <button
              onClick={refreshVolumes}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowAttachModal(true)}
              disabled={!selectedVolume || selectedVolume.state === "in-use"}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Attach volume
            </button>
            <button
              onClick={() => setShowDetachModal(true)}
              disabled={!selectedVolume || selectedVolume.state !== "in-use"}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Detach volume
            </button>
            <button
              onClick={() => setShowSnapshotModal(true)}
              disabled={!selectedVolume}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Create snapshot
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={!selectedVolume || selectedVolume.state === "in-use"}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#d13212] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#d13212] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Delete volume
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            >
              Create volume
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[#f8f9fa] border-b border-[#eaeded] flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Filter volumes by ID, name, instance, or AZ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm focus:outline-none focus:border-[#ec7211] bg-white text-[#16191f]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-10 text-center"></th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Volume ID</th>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Volume state</th>
                <th className="py-2.5 px-3">Volume type</th>
                <th className="py-2.5 px-3">IOPS</th>
                <th className="py-2.5 px-3">Throughput (MiB/s)</th>
                <th className="py-2.5 px-3">Snapshot ID</th>
                <th className="py-2.5 px-3">Availability Zone</th>
                <th className="py-2.5 px-3">Attached instances</th>
                <th className="py-2.5 px-3">Encryption</th>
                <th className="py-2.5 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filteredVolumes.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-[#545b64]">
                    No EBS volumes found.
                  </td>
                </tr>
              ) : (
                filteredVolumes.map((vol) => {
                  const isSelected = selectedVolumeId === vol.id;
                  return (
                    <tr
                      key={vol.id}
                      onClick={() => setSelectedVolumeId(vol.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#f9fafb]"
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="radio"
                          name="volume-select"
                          checked={isSelected}
                          onChange={() => setSelectedVolumeId(vol.id)}
                          className="h-4 w-4 text-[#ec7211] border-[#aab7b8] focus:ring-0"
                        />
                      </td>
                      <td className="py-3 px-3 text-[#16191f] font-medium">
                        {vol.name || "—"}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#0073bb]">
                        {vol.id}
                      </td>
                      <td className="py-3 px-3 font-mono">{vol.sizeGb} GiB</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                            vol.state === "in-use"
                              ? "bg-[#e6f4ea] text-[#137333]"
                              : vol.state === "available"
                              ? "bg-[#e8f0fe] text-[#1a73e8]"
                              : "bg-[#fff3e0] text-[#e65100]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              vol.state === "in-use"
                                ? "bg-[#137333]"
                                : vol.state === "available"
                                ? "bg-[#1a73e8]"
                                : "bg-[#e65100]"
                            }`}
                          />
                          {vol.state}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">{vol.volumeType}</td>
                      <td className="py-3 px-3 font-mono">{vol.iops || "—"}</td>
                      <td className="py-3 px-3 font-mono">{vol.throughput || "—"}</td>
                      <td className="py-3 px-3 font-mono text-[#545b64]">
                        {vol.snapshotId && vol.snapshotId !== "—" ? (
                          <Link
                            href={`/ec2/snapshots?id=${vol.snapshotId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#0073bb] hover:underline"
                          >
                            {vol.snapshotId}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#545b64]">{vol.availabilityZone}</td>
                      <td className="py-3 px-3">
                        {vol.attachmentInstanceId ? (
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/ec2/instances/${vol.attachmentInstanceId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono text-[#0073bb] hover:underline font-medium"
                            >
                              {vol.attachmentInstanceId}
                            </Link>
                            <span className="text-[11px] text-[#545b64]">
                              ({vol.attachmentDevice || "/dev/xvda"})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#545b64]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#545b64]">
                        {vol.encrypted ? "Encrypted" : "Not encrypted"}
                      </td>
                      <td className="py-3 px-3 text-[#545b64] text-[12px]">{vol.createTime}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Detail Drawer */}
      {selectedVolume && (
        <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
          <div className="border-b border-[#eaeded] px-6 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-[16px] font-bold text-[#16191f] font-mono">
                {selectedVolume.id}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                  selectedVolume.state === "in-use"
                    ? "bg-[#e6f4ea] text-[#137333]"
                    : "bg-[#e8f0fe] text-[#1a73e8]"
                }`}
              >
                {selectedVolume.state}
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
                onClick={() => setActiveTab("attachments")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeTab === "attachments"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Attachment information
              </button>
              <button
                onClick={() => setActiveTab("tags")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeTab === "tags"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Tags ({Object.keys(selectedVolume.tags || {}).length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Volume ID</span>
                    <span className="font-mono font-bold text-[#16191f]">{selectedVolume.id}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Volume state</span>
                    <span className="text-[#16191f] capitalize">{selectedVolume.state}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Size</span>
                    <span className="font-mono text-[#16191f]">{selectedVolume.sizeGb} GiB</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Volume type</span>
                    <span className="font-mono text-[#16191f]">{selectedVolume.volumeType}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">IOPS</span>
                    <span className="font-mono text-[#16191f]">{selectedVolume.iops || "—"}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Throughput (MiB/s)</span>
                    <span className="font-mono text-[#16191f]">{selectedVolume.throughput || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Snapshot ID</span>
                    <span className="font-mono text-[#16191f]">{selectedVolume.snapshotId || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Availability Zone</span>
                    <span className="text-[#16191f]">{selectedVolume.availabilityZone}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Created</span>
                    <span className="text-[#16191f]">{selectedVolume.createTime}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Encryption</span>
                    <span className="text-[#16191f]">
                      {selectedVolume.encrypted ? "Encrypted (AWS managed-key)" : "Not encrypted"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Multi-Attach enabled</span>
                    <span className="text-[#16191f]">
                      {selectedVolume.multiAttachEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Fast snapshot restore</span>
                    <span className="text-[#16191f]">
                      {selectedVolume.fastSnapshotRestore ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Amazon Resource Name (ARN)</span>
                    <span className="font-mono text-[12px] text-[#545b64] break-all">
                      {selectedVolume.arn || `arn:aws:ec2:us-east-1:000000000000:volume/${selectedVolume.id}`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "attachments" && (
              <div className="space-y-4">
                {selectedVolume.attachmentInstanceId ? (
                  <div className="border border-[#eaeded] rounded-sm overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Instance ID</th>
                          <th className="py-2.5 px-3">Device</th>
                          <th className="py-2.5 px-3">Attachment status</th>
                          <th className="py-2.5 px-3">Attach time</th>
                          <th className="py-2.5 px-3">Delete on termination</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-3 px-4">
                            <Link
                              href={`/ec2/instances/${selectedVolume.attachmentInstanceId}`}
                              className="font-mono font-bold text-[#0073bb] hover:underline"
                            >
                              {selectedVolume.attachmentInstanceId}
                            </Link>
                          </td>
                          <td className="py-3 px-3 font-mono text-[#16191f]">
                            {selectedVolume.attachmentDevice || "/dev/xvda"}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f4ea] text-[#137333]">
                              {selectedVolume.attachmentState || "attached"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#545b64]">
                            {selectedVolume.attachmentTime || selectedVolume.createTime}
                          </td>
                          <td className="py-3 px-3 text-[#16191f]">Yes</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-[#545b64] text-[13px]">
                    This volume is not attached to any EC2 instance.
                  </div>
                )}
              </div>
            )}

            {activeTab === "tags" && (
              <div className="space-y-4">
                {selectedVolume.tags && Object.keys(selectedVolume.tags).length > 0 ? (
                  <div className="border border-[#eaeded] rounded-sm overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Key</th>
                          <th className="py-2.5 px-4">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeded]">
                        {Object.entries(selectedVolume.tags).map(([k, v]) => (
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
                    No tags associated with this volume.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Create Volume */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateVolume}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-lg p-6 space-y-4"
          >
            <div className="border-b border-[#eaeded] pb-3">
              <h3 className="text-[18px] font-bold text-[#16191f]">Create volume</h3>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Specify storage size, volume type, and availability zone for your new EBS block storage.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Volume type
              </label>
              <select
                value={newVolumeType}
                onChange={(e) => setNewVolumeType(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
              >
                <option value="gp3">General Purpose SSD (gp3) - Recommended</option>
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
                  min="1"
                  max="16384"
                  value={newSizeGb}
                  onChange={(e) => setNewSizeGb(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Availability Zone
                </label>
                <select
                  value={newAz}
                  onChange={(e) => setNewAz(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
                >
                  <option value="us-east-1a">us-east-1a</option>
                  <option value="us-east-1b">us-east-1b</option>
                  <option value="us-east-1c">us-east-1c</option>
                </select>
              </div>
            </div>

            {newVolumeType === "gp3" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                    IOPS
                  </label>
                  <input
                    type="number"
                    min="3000"
                    max="16000"
                    value={newIops}
                    onChange={(e) => setNewIops(parseInt(e.target.value, 10) || 3000)}
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                  />
                  <span className="text-[11px] text-[#545b64]">Baseline: 3,000 IOPS</span>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                    Throughput (MiB/s)
                  </label>
                  <input
                    type="number"
                    min="125"
                    max="1000"
                    value={newThroughput}
                    onChange={(e) => setNewThroughput(parseInt(e.target.value, 10) || 125)}
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                  />
                  <span className="text-[11px] text-[#545b64]">Baseline: 125 MiB/s</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Snapshot ID (Optional)
              </label>
              <select
                value={newSnapshotId}
                onChange={(e) => setNewSnapshotId(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
              >
                <option value="">Don&apos;t create from snapshot (empty volume)</option>
                {snapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} ({s.sizeGb} GiB, {s.description})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Volume Name Tag (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. data-volume-production"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="newEncrypted"
                checked={newEncrypted}
                onChange={(e) => setNewEncrypted(e.target.checked)}
                className="h-4 w-4 text-[#ec7211] border-[#aab7b8] rounded-sm"
              />
              <label htmlFor="newEncrypted" className="text-[13px] text-[#16191f]">
                Encrypt this volume (Default KMS key)
              </label>
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

      {/* Modal 2: Attach Volume */}
      {showAttachModal && selectedVolume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAttachVolume}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <div className="border-b border-[#eaeded] pb-3">
              <h3 className="text-[18px] font-bold text-[#16191f]">Attach volume</h3>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Attach EBS volume <strong className="font-mono text-[#16191f]">{selectedVolume.id}</strong> to a running or stopped EC2 instance.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Instance
              </label>
              {instances.length > 0 ? (
                <select
                  value={targetInstanceId}
                  onChange={(e) => setTargetInstanceId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
                  required
                >
                  {instances.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.id} ({inst.name || "unnamed"}) - {inst.state}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. i-00000000000000001"
                  value={targetInstanceId}
                  onChange={(e) => setTargetInstanceId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Device name
              </label>
              <input
                type="text"
                value={targetDevice}
                onChange={(e) => setTargetDevice(e.target.value)}
                placeholder="/dev/xvdf"
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] font-mono"
                required
              />
              <span className="text-[11px] text-[#545b64]">
                Standard secondary block devices: /dev/xvdf through /dev/xvdp.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAttachModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3.5 border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !targetInstanceId}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Attaching..." : "Attach volume"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Detach Volume */}
      {showDetachModal && selectedVolume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleDetachVolume}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <div className="border-b border-[#eaeded] pb-3">
              <h3 className="text-[18px] font-bold text-[#16191f]">Detach volume</h3>
              <p className="text-[13px] text-[#545b64] mt-2">
                Are you sure you want to detach volume{" "}
                <strong className="text-[#16191f] font-mono">{selectedVolume.id}</strong> from instance{" "}
                <strong className="text-[#16191f] font-mono">{selectedVolume.attachmentInstanceId}</strong>?
              </p>
            </div>

            <div className="bg-[#f2f8fd] border border-[#0073bb] p-3 rounded-sm text-[12px] text-[#16191f]">
              Before detaching, unmount the volume in the guest OS to prevent file system corruption.
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="forceDetach"
                checked={forceDetach}
                onChange={(e) => setForceDetach(e.target.checked)}
                className="h-4 w-4 text-[#ec7211] border-[#aab7b8] rounded-sm"
              />
              <label htmlFor="forceDetach" className="text-[13px] text-[#16191f]">
                Force detach (use only if previous detach attempt stalled)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDetachModal(false)}
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
                {isPending ? "Detaching..." : "Detach volume"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 4: Create Snapshot */}
      {showSnapshotModal && selectedVolume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateSnapshot}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <div className="border-b border-[#eaeded] pb-3">
              <h3 className="text-[18px] font-bold text-[#16191f]">Create snapshot</h3>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Take a point-in-time snapshot backup of volume{" "}
                <strong className="font-mono text-[#16191f]">{selectedVolume.id}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Volume ID
              </label>
              <input
                type="text"
                disabled
                value={selectedVolume.id}
                className="w-full px-3 py-1.5 border border-[#eaeded] bg-[#f8f9fa] rounded-sm text-[13px] text-[#545b64] font-mono"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Snapshot Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. backup-pre-upgrade"
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
                placeholder="e.g. Automated daily backup of production database volume"
                value={snapshotDesc}
                onChange={(e) => setSnapshotDesc(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowSnapshotModal(false)}
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
                {isPending ? "Creating..." : "Create snapshot"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 5: Delete Volume */}
      {showDeleteModal && selectedVolume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete volume</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to permanently delete EBS volume{" "}
              <strong className="text-[#16191f] font-mono">{selectedVolume.id}</strong> (
              {selectedVolume.sizeGb} GiB, {selectedVolume.volumeType})?
            </p>
            <p className="text-[12px] text-[#d13212] mt-3">
              This action cannot be undone. All data residing on this volume will be permanently removed.
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
                onClick={handleDeleteVolume}
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
