/**
 * src/components/ec2/SnapshotsClient.tsx – EBS Snapshots Management.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import { createLiveSnapshot, deleteLiveSnapshot, fetchLiveSnapshots } from "@/app/ec2/actions";

interface SnapshotItem {
  id: string;
  volumeId: string;
  sizeGb: number;
  state: string;
  progress: string;
  startTime: string;
  description: string;
}

interface Props {
  initialSnapshots: SnapshotItem[];
  availableVolumeIds: string[];
  isLive: boolean;
}

export default function SnapshotsClient({
  initialSnapshots,
  availableVolumeIds,
  isLive,
}: Props) {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>(initialSnapshots);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  // Form
  const [targetVolume, setTargetVolume] = useState<string>(availableVolumeIds[0] || "vol-0000000000000008e");
  const [desc, setDesc] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createLiveSnapshot(targetVolume, desc.trim());
      if (res.success) {
        const fresh = await fetchLiveSnapshots();
        setSnapshots(fresh.snapshots);
        setShowCreateModal(false);
        setDesc("");
      } else {
        alert("Failed to create snapshot: " + res.error);
      }
    });
  }

  function handleDelete() {
    if (!selectedSnapshotId) return;
    const targetId = selectedSnapshotId;
    setShowDeleteModal(false);
    setSelectedSnapshotId(null);

    setSnapshots(snapshots.filter((s) => s.id !== targetId));

    startTransition(async () => {
      await deleteLiveSnapshot(targetId);
      const fresh = await fetchLiveSnapshots();
      setSnapshots(fresh.snapshots);
    });
  }

  const filtered = snapshots.filter(
    (s) =>
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.volumeId.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
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
              {isLive ? "EBS Snapshot Service Connected (AWS Emulator)" : "Mock Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
      </div>

      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-[#16191f]">Snapshots</h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Point-in-time backups of your EBS volumes created directly on the AWS emulator.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07]"
          >
            Create snapshot
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <input
            type="text"
            placeholder="Filter snapshots by ID, volume, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Snapshot ID</th>
                <th className="py-2.5 px-3">Volume ID</th>
                <th className="py-2.5 px-3">Size (GiB)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3">Started</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#545b64]">
                    No snapshots found in this region on the emulator.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#f2f8fd]">
                    <td className="py-3 px-4 font-mono font-bold text-[#0073bb]">{s.id}</td>
                    <td className="py-3 px-3 font-mono text-[#0073bb]">{s.volumeId}</td>
                    <td className="py-3 px-3 font-mono">{s.sizeGb} GiB</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f4ea] text-[#137333]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                        {s.state}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[12px]">{s.progress}</td>
                    <td className="py-3 px-3 text-[#545b64] text-[12px]">{s.startTime}</td>
                    <td className="py-3 px-3 text-[#545b64]">{s.description || "—"}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedSnapshotId(s.id);
                          setShowDeleteModal(true);
                        }}
                        className="text-[#d13212] hover:underline text-[12px]"
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <h3 className="text-[17px] font-bold text-[#16191f]">Create snapshot</h3>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Volume ID <span className="text-[#d13212]">*</span>
              </label>
              {availableVolumeIds.length > 0 ? (
                <select
                  value={targetVolume}
                  onChange={(e) => setTargetVolume(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white font-mono"
                >
                  {availableVolumeIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. vol-0000000000000008e"
                  value={targetVolume}
                  onChange={(e) => setTargetVolume(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] font-mono"
                />
              )}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="Optional backup description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded text-[13px] font-medium hover:bg-[#eb5f07]"
              >
                {isPending ? "Creating on emulator..." : "Create snapshot"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete snapshot</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to delete snapshot{" "}
              <strong className="text-[#16191f] font-mono">{selectedSnapshotId}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 bg-[#d13212] text-white rounded text-[13px] font-medium hover:bg-[#b02008]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
