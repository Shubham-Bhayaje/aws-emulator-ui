/**
 * src/components/ec2/PlacementGroupsClient.tsx – Placement Groups Management.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import {
  createLivePlacementGroup,
  deleteLivePlacementGroup,
  fetchLivePlacementGroups,
} from "@/app/ec2/actions";

interface PlacementGroupItem {
  groupName: string;
  strategy: string;
  state: string;
  groupId: string;
}

interface Props {
  initialGroups: PlacementGroupItem[];
  isLive: boolean;
}

export default function PlacementGroupsClient({ initialGroups, isLive }: Props) {
  const [groups, setGroups] = useState<PlacementGroupItem[]>(initialGroups);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);

  // Form
  const [groupName, setGroupName] = useState("");
  const [strategy, setStrategy] = useState("cluster");
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) return;

    startTransition(async () => {
      const res = await createLivePlacementGroup(groupName.trim(), strategy);
      if (res.success) {
        const fresh = await fetchLivePlacementGroups();
        setGroups(fresh.placementGroups);
        setShowCreateModal(false);
        setGroupName("");
      } else {
        alert("Failed to create placement group: " + res.error);
      }
    });
  }

  function handleDelete() {
    if (!selectedGroupName) return;
    const targetName = selectedGroupName;
    setShowDeleteModal(false);
    setSelectedGroupName(null);

    setGroups(groups.filter((g) => g.groupName !== targetName));

    startTransition(async () => {
      await deleteLivePlacementGroup(targetName);
      const fresh = await fetchLivePlacementGroups();
      setGroups(fresh.placementGroups);
    });
  }

  const filtered = groups.filter(
    (g) =>
      g.groupName.toLowerCase().includes(search.toLowerCase()) ||
      g.strategy.toLowerCase().includes(search.toLowerCase())
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
              {isLive ? "Placement Groups Connected (AWS Emulator)" : "Mock Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
      </div>

      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-[#16191f]">Placement Groups</h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Determine how instances are placed on underlying hardware to reduce latency or isolate failures.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07]"
          >
            Create placement group
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <input
            type="text"
            placeholder="Filter placement groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Group name</th>
                <th className="py-2.5 px-3">Placement strategy</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Group ID</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#545b64]">
                    No placement groups found in region us-east-1 on the emulator.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.groupName} className="hover:bg-[#f2f8fd]">
                    <td className="py-3 px-4 font-semibold text-[#0073bb]">{g.groupName}</td>
                    <td className="py-3 px-3 capitalize">{g.strategy}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f4ea] text-[#137333]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                        {g.state}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">{g.groupId}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedGroupName(g.groupName);
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
            <h3 className="text-[17px] font-bold text-[#16191f]">Create placement group</h3>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. high-throughput-cluster"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Placement strategy
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white capitalize"
              >
                <option value="cluster">Cluster (Low network latency)</option>
                <option value="spread">Spread (Strict hardware isolation)</option>
                <option value="partition">Partition (Distributed partitions)</option>
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
                {isPending ? "Creating..." : "Create placement group"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete placement group</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to delete placement group{" "}
              <strong className="text-[#16191f] font-mono">{selectedGroupName}</strong>?
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
