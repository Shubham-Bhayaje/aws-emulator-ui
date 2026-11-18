/**
 * src/components/ec2/VolumesClient.tsx – EBS Volumes Management.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { EBSVolume, createLiveVolume, deleteLiveVolume, fetchLiveVolumes } from "@/app/ec2/actions";

interface Props {
  initialVolumes: EBSVolume[];
  isLive: boolean;
}

export default function VolumesClient({ initialVolumes, isLive }: Props) {
  const [volumes, setVolumes] = useState<EBSVolume[]>(initialVolumes);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create modal state
  const [newSize, setNewSize] = useState<number>(20);
  const [newAz, setNewAz] = useState<string>("us-east-1a");
  const [newType, setNewType] = useState<string>("gp3");

  const totalStorageGb = volumes.reduce((acc, v) => acc + (v.sizeGb || 0), 0);
  const inUseCount = volumes.filter((v) => v.state === "in-use").length;

  function handleCreateVolume(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createLiveVolume({
        sizeGb: newSize,
        availabilityZone: newAz,
        volumeType: newType,
      });

      if (res.success && res.volume) {
        setVolumes([res.volume, ...volumes]);
        setShowCreateModal(false);
      } else {
        const fresh = await fetchLiveVolumes();
        setVolumes(fresh.volumes);
        setShowCreateModal(false);
      }
    });
  }

  function handleDeleteVolume() {
    if (!selectedVolumeId) return;
    const targetId = selectedVolumeId;
    setShowDeleteModal(false);
    setSelectedVolumeId(null);

    // Optimistic removal
    setVolumes(volumes.filter((v) => v.id !== targetId));

    startTransition(async () => {
      await deleteLiveVolume(targetId);
      const fresh = await fetchLiveVolumes();
      setVolumes(fresh.volumes);
    });
  }

  const filteredVolumes = volumes.filter(
    (v) =>
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.attachmentInstanceId && v.attachmentInstanceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.volumeType.toLowerCase().includes(searchQuery.toLowerCase())
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
              {isLive ? "EBS Service Connected (AWS Emulator)" : "Mock Data Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Volumes</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Amazon Elastic Block Store (EBS) volumes provide persistent block storage for EC2 instances.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07]"
            >
              Create volume
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <input
            type="text"
            placeholder="Filter volumes by volume ID or attached instance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Volume ID</th>
                <th className="py-2.5 px-3">Size (GiB)</th>
                <th className="py-2.5 px-3">Volume state</th>
                <th className="py-2.5 px-3">Volume type</th>
                <th className="py-2.5 px-3">IOPS</th>
                <th className="py-2.5 px-3">Attached instance</th>
                <th className="py-2.5 px-3">Device</th>
                <th className="py-2.5 px-3">Availability Zone</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filteredVolumes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#545b64]">
                    No EBS volumes found in this region.
                  </td>
                </tr>
              ) : (
                filteredVolumes.map((vol) => (
                  <tr key={vol.id} className="hover:bg-[#f2f8fd]">
                    <td className="py-3 px-4 font-mono font-bold text-[#0073bb]">
                      {vol.id}
                    </td>
                    <td className="py-3 px-3 font-mono">{vol.sizeGb} GiB</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                          vol.state === "in-use"
                            ? "bg-[#e6f4ea] text-[#137333]"
                            : "bg-[#e8f0fe] text-[#1a73e8]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            vol.state === "in-use" ? "bg-[#137333]" : "bg-[#1a73e8]"
                          }`}
                        />
                        {vol.state}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">{vol.volumeType}</td>
                    <td className="py-3 px-3 font-mono">{vol.iops || 3000}</td>
                    <td className="py-3 px-3">
                      {vol.attachmentInstanceId ? (
                        <Link
                          href={`/ec2/instances/${vol.attachmentInstanceId}`}
                          className="font-mono text-[#0073bb] hover:underline"
                        >
                          {vol.attachmentInstanceId}
                        </Link>
                      ) : (
                        <span className="text-[#545b64]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">
                      {vol.attachmentDevice || "—"}
                    </td>
                    <td className="py-3 px-3 text-[#545b64]">{vol.availabilityZone}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedVolumeId(vol.id);
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

      {/* Create Volume Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateVolume}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <h3 className="text-[17px] font-bold text-[#16191f]">Create volume</h3>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Volume type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white"
              >
                <option value="gp3">General Purpose SSD (gp3)</option>
                <option value="gp2">General Purpose SSD (gp2)</option>
                <option value="io1">Provisioned IOPS SSD (io1)</option>
                <option value="standard">Magnetic (standard)</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Size (GiB)
              </label>
              <input
                type="number"
                min="1"
                max="16384"
                value={newSize}
                onChange={(e) => setNewSize(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Availability Zone
              </label>
              <select
                value={newAz}
                onChange={(e) => setNewAz(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white"
              >
                <option value="us-east-1a">us-east-1a</option>
                <option value="us-east-1b">us-east-1b</option>
                <option value="us-east-1c">us-east-1c</option>
              </select>
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
                {isPending ? "Creating..." : "Create volume"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Volume Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete volume</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to delete EBS volume{" "}
              <strong className="text-[#16191f] font-mono">{selectedVolumeId}</strong>?
              All data stored on this volume will be permanently erased.
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVolume}
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
