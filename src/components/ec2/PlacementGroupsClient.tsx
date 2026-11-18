/**
 * src/components/ec2/PlacementGroupsClient.tsx – AWS Placement Groups Console Replica.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import {
  PlacementGroupModel,
  createLivePlacementGroup,
  deleteLivePlacementGroup,
  fetchLivePlacementGroups,
} from "@/app/ec2/actions";

interface Props {
  initialGroups?: PlacementGroupModel[];
  isLive?: boolean;
}

export default function PlacementGroupsClient({
  initialGroups = [],
  isLive = true,
}: Props) {
  const [groups, setGroups] = useState<PlacementGroupModel[]>(initialGroups || []);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(
    initialGroups && initialGroups.length > 0 ? initialGroups[0]?.groupName : null
  );
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form State
  const [groupName, setGroupName] = useState("");
  const [strategy, setStrategy] = useState<"cluster" | "spread" | "partition">("cluster");
  const [partitionCount, setPartitionCount] = useState<number>(3);
  const [spreadLevel, setSpreadLevel] = useState<"rack" | "host">("rack");

  const selectedGroup = (groups || []).find((g) => g.groupName === selectedGroupName) || null;

  const totalCount = (groups || []).length;
  const clusterCount = (groups || []).filter((g) => (g.strategy || "").toLowerCase() === "cluster").length;
  const spreadCount = (groups || []).filter((g) => (g.strategy || "").toLowerCase() === "spread").length;
  const partitionCountTotal = (groups || []).filter((g) => (g.strategy || "").toLowerCase() === "partition").length;

  function refreshGroups() {
    startTransition(async () => {
      const res = await fetchLivePlacementGroups();
      const list = res.placementGroups || [];
      setGroups(list);
      if (list.length > 0 && (!selectedGroupName || !list.some((g) => g.groupName === selectedGroupName))) {
        setSelectedGroupName(list[0]?.groupName || null);
      }
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) return;

    startTransition(async () => {
      const res = await createLivePlacementGroup(
        groupName.trim(),
        strategy,
        strategy === "partition" ? partitionCount : undefined,
        strategy === "spread" ? spreadLevel : undefined
      );

      if (res.success) {
        setShowCreateModal(false);
        setGroupName("");
        const fresh = await fetchLivePlacementGroups();
        const list = fresh.placementGroups || [];
        setGroups(list);
        setSelectedGroupName(groupName.trim());
        setFeedback(`Created placement group "${groupName.trim()}" successfully.`);
      } else {
        setFeedback(`Failed to create placement group: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDelete() {
    if (!selectedGroupName) return;
    const targetName = selectedGroupName;

    startTransition(async () => {
      setShowDeleteModal(false);
      const res = await deleteLivePlacementGroup(targetName);
      if (res.success) {
        const fresh = await fetchLivePlacementGroups();
        const list = fresh.placementGroups || [];
        setGroups(list);
        setSelectedGroupName(list.length > 0 ? list[0]?.groupName : null);
        setFeedback(`Deleted placement group "${targetName}" successfully.`);
      } else {
        setFeedback(`Failed to delete placement group: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  const filtered = (groups || []).filter((g) => {
    const term = search.toLowerCase();
    return (
      (g.groupName || "").toLowerCase().includes(term) ||
      (g.strategy || "").toLowerCase().includes(term) ||
      (g.groupId || "").toLowerCase().includes(term) ||
      (g.state || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Live Badge Banner */}
      <div className="flex items-center justify-between bg-white border border-[#d5dbdb] px-4 py-2.5 rounded-sm shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isLive ? "bg-[#1d8102]" : "bg-[#ec7211]"
              }`}
            />
            <span className="text-[12px] font-semibold text-[#16191f]">
              {isLive ? "Placement Groups Connected (AWS Emulator)" : "Mock Data Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        <span className="text-[11px] text-[#545b64]">AWS EC2 Placement Group Service</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Total Placement Groups
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Underlying host groupings</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Cluster Strategy
          </div>
          <div className="text-[24px] font-bold text-[#0073bb] mt-1">{clusterCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Low-latency AZ clustering</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Spread Strategy
          </div>
          <div className="text-[24px] font-bold text-[#1d8102] mt-1">{spreadCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Hardware failure isolation</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Partition Strategy
          </div>
          <div className="text-[24px] font-bold text-[#545b64] mt-1">{partitionCountTotal}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Distributed partitions (HDFS/Cassandra)</div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-sm border text-[13px] flex items-center justify-between ${
            feedback.includes("Failed") || feedback.includes("failed")
              ? "bg-[#fdf3f1] border-[#d13212] text-[#d13212]"
              : "bg-[#f2f8fd] border-[#0073bb] text-[#0073bb]"
          }`}
        >
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-[12px] font-bold hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs">
        {/* Header & Actions Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-[#16191f]">
              Placement Groups ({totalCount})
            </h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Determine how instances are placed on underlying hardware to reduce latency or isolate failures.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshGroups}
              disabled={isPending}
              title="Refresh placement groups"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`mr-1.5 ${isPending ? "animate-spin" : ""}`}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              Refresh
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={!selectedGroup || isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`h-[32px] px-3 border rounded-sm text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                selectedGroup
                  ? "border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1] bg-white"
                  : "border-[#eaeded] text-[#aab7b8] cursor-not-allowed bg-white"
              }`}
            >
              Delete placement group
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
            >
              Create placement group
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <div className="relative max-w-[450px]">
            <input
              type="text"
              placeholder="Filter placement groups by name, strategy, or group ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
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
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-4">Group name</th>
                <th className="py-2.5 px-3">Placement strategy</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Group ID</th>
                <th className="py-2.5 px-3">Partition count</th>
                <th className="py-2.5 px-3">Spread level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#545b64]">
                    No placement groups found in region us-east-1.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => {
                  const isSelected = selectedGroupName === g.groupName;
                  return (
                    <tr
                      key={g.groupName}
                      onClick={() => setSelectedGroupName(g.groupName)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedPg"
                          checked={isSelected}
                          onChange={() => setSelectedGroupName(g.groupName)}
                          className="accent-[#0073bb] cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                        {g.groupName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#16191f] uppercase tracking-wider">
                          {g.strategy}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f4ea] text-[#137333]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                          {g.state}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">
                        {g.groupId}
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64]">
                        {g.partitionCount ?? "—"}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-[#545b64]">
                        {g.spreadLevel || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloudscape Bottom Drawer for Details & Tags */}
      {selectedGroup && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs mt-4">
          <div className="border-b border-[#eaeded] flex items-center px-4">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "details"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("tags")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "tags"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Tags
            </button>
          </div>

          <div className="p-6">
            {activeTab === "details" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-[13px]">
                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Placement group name</div>
                  <div className="font-bold text-[#16191f] mt-1">{selectedGroup.groupName}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Placement group ID</div>
                  <div className="font-mono text-[#16191f] mt-1">{selectedGroup.groupId}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Placement strategy</div>
                  <div className="text-[#16191f] mt-1 capitalize font-medium">
                    {selectedGroup.strategy}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">State</div>
                  <div className="text-[#137333] font-medium mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                    {selectedGroup.state}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Partition count</div>
                  <div className="text-[#16191f] mt-1">
                    {selectedGroup.partitionCount ?? "Not applicable"}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Spread level</div>
                  <div className="text-[#16191f] mt-1 capitalize">
                    {selectedGroup.spreadLevel || "rack"}
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <div className="text-[12px] text-[#545b64] font-medium">ARN</div>
                  <div className="font-mono text-[12px] text-[#16191f] mt-1 break-all">
                    {selectedGroup.arn}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-[13px] font-bold text-[#16191f] mb-3">
                  Tags ({Object.keys(selectedGroup.tags || {}).length})
                </div>
                {Object.keys(selectedGroup.tags || {}).length === 0 ? (
                  <div className="text-[13px] text-[#545b64] py-4">No tags associated with this placement group.</div>
                ) : (
                  <table className="w-full max-w-lg text-[13px] border border-[#eaeded]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3 text-left">Key</th>
                        <th className="py-2 px-3 text-left">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {Object.entries(selectedGroup.tags || {}).map(([k, v]) => (
                        <tr key={k}>
                          <td className="py-2 px-3 font-medium text-[#16191f]">{k}</td>
                          <td className="py-2 px-3 text-[#545b64]">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Create placement group</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. cluster-prod-us-east-1"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">
                The name must be unique within your account for the Region.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Placement strategy
              </label>
              <div className="space-y-2 mt-1">
                <label className="flex items-start gap-2.5 p-2.5 border rounded-sm cursor-pointer hover:bg-[#fafafa]">
                  <input
                    type="radio"
                    name="strategyRadio"
                    checked={strategy === "cluster"}
                    onChange={() => setStrategy("cluster")}
                    className="accent-[#0073bb] mt-0.5"
                  />
                  <div>
                    <div className="text-[13px] font-bold text-[#16191f]">Cluster</div>
                    <div className="text-[11px] text-[#545b64]">
                      Packs instances close together inside an Availability Zone. Best for low-latency network performance.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 border rounded-sm cursor-pointer hover:bg-[#fafafa]">
                  <input
                    type="radio"
                    name="strategyRadio"
                    checked={strategy === "spread"}
                    onChange={() => setStrategy("spread")}
                    className="accent-[#0073bb] mt-0.5"
                  />
                  <div>
                    <div className="text-[13px] font-bold text-[#16191f]">Spread</div>
                    <div className="text-[11px] text-[#545b64]">
                      Strictly places instances across distinct underlying hardware racks to reduce correlated failures.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 border rounded-sm cursor-pointer hover:bg-[#fafafa]">
                  <input
                    type="radio"
                    name="strategyRadio"
                    checked={strategy === "partition"}
                    onChange={() => setStrategy("partition")}
                    className="accent-[#0073bb] mt-0.5"
                  />
                  <div>
                    <div className="text-[13px] font-bold text-[#16191f]">Partition</div>
                    <div className="text-[11px] text-[#545b64]">
                      Spreads instances across logical partitions so instances in one partition do not share hardware with another.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {strategy === "partition" && (
              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Partition count (1 - 7)
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={partitionCount}
                  onChange={(e) => setPartitionCount(parseInt(e.target.value, 10) || 3)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
                />
              </div>
            )}

            {strategy === "spread" && (
              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Spread level
                </label>
                <select
                  value={spreadLevel}
                  onChange={(e) => setSpreadLevel(e.target.value as "rack" | "host")}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white capitalize"
                >
                  <option value="rack">Rack</option>
                  <option value="host">Host</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create placement group"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete placement group</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete placement group{" "}
              <strong className="text-[#16191f] font-mono">{selectedGroup.groupName}</strong> ({selectedGroup.groupId})?
              Instances launched into this placement group will continue running, but the placement group cannot be recovered.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#d13212] text-white rounded-sm text-[13px] font-bold hover:bg-[#b02008] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
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
