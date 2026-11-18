/**
 * src/components/ec2/AutoScalingGroupsClient.tsx – AWS Auto Scaling Groups Console Replica.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  AutoScalingGroupModel,
  createLiveAutoScalingGroup,
  updateLiveAutoScalingGroup,
  deleteLiveAutoScalingGroup,
  fetchLiveAutoScalingGroups,
} from "@/app/ec2/actions";

interface LaunchTemplateOption {
  id: string;
  name: string;
  defaultVersionNumber?: number;
}

interface Props {
  initialGroups?: AutoScalingGroupModel[];
  launchTemplates?: LaunchTemplateOption[];
  subnets?: string[];
  isLive?: boolean;
  liveError?: string;
}

export default function AutoScalingGroupsClient({
  initialGroups = [],
  launchTemplates = [],
  subnets = ["subnet-00000000000000007", "subnet-00000000000000009", "subnet-0000000000000000b"],
  isLive = true,
  liveError,
}: Props) {
  const [groups, setGroups] = useState<AutoScalingGroupModel[]>(initialGroups || []);
  const [selectedName, setSelectedName] = useState<string | null>(
    initialGroups && initialGroups.length > 0 ? initialGroups[0]?.name : null
  );
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "instances" | "tags">("details");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditCapacityModal, setShowEditCapacityModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Create Form State
  const [createName, setCreateName] = useState("");
  const [createLtId, setCreateLtId] = useState<string>(
    launchTemplates.length > 0 ? launchTemplates[0].id : ""
  );
  const [createDesired, setCreateDesired] = useState<number>(1);
  const [createMin, setCreateMin] = useState<number>(1);
  const [createMax, setCreateMax] = useState<number>(3);
  const [createSubnets, setCreateSubnets] = useState<string[]>(subnets);

  // Edit Capacity Form State
  const [editDesired, setEditDesired] = useState<number>(1);
  const [editMin, setEditMin] = useState<number>(1);
  const [editMax, setEditMax] = useState<number>(3);

  const selectedGroup = (groups || []).find((g) => g.name === selectedName) || null;

  const totalCount = (groups || []).length;
  const totalDesired = (groups || []).reduce((acc, g) => acc + (g.desiredCapacity || 0), 0);
  const totalInstances = (groups || []).reduce((acc, g) => acc + (g.instances?.length || 0), 0);
  const healthyInstances = (groups || []).reduce(
    (acc, g) => acc + (g.instances || []).filter((i) => i.healthStatus === "Healthy").length,
    0
  );

  function refreshGroups() {
    startTransition(async () => {
      const res = await fetchLiveAutoScalingGroups();
      const list = res.autoScalingGroups || [];
      setGroups(list);
      if (list.length > 0 && (!selectedName || !list.some((g) => g.name === selectedName))) {
        setSelectedName(list[0]?.name || null);
      }
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim() || !createLtId) return;

    startTransition(async () => {
      const res = await createLiveAutoScalingGroup({
        name: createName.trim(),
        launchTemplateId: createLtId,
        minSize: createMin,
        maxSize: createMax,
        desiredCapacity: createDesired,
        subnetIds: createSubnets,
      });

      if (res.success) {
        setShowCreateModal(false);
        setCreateName("");
        const fresh = await fetchLiveAutoScalingGroups();
        const list = fresh.autoScalingGroups || [];
        setGroups(list);
        setSelectedName(createName.trim());
        setFeedback(`Created Auto Scaling group "${createName.trim()}" successfully.`);
      } else {
        setFeedback(`Failed to create Auto Scaling group: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleUpdateCapacity(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGroup) return;

    startTransition(async () => {
      const res = await updateLiveAutoScalingGroup({
        name: selectedGroup.name,
        minSize: editMin,
        maxSize: editMax,
        desiredCapacity: editDesired,
      });

      if (res.success) {
        setShowEditCapacityModal(false);
        const fresh = await fetchLiveAutoScalingGroups();
        setGroups(fresh.autoScalingGroups || []);
        setFeedback(`Updated capacity for "${selectedGroup.name}".`);
      } else {
        setFeedback(`Failed to update capacity: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDelete() {
    if (!selectedGroup) return;
    const targetName = selectedGroup.name;

    startTransition(async () => {
      setShowDeleteModal(false);
      const res = await deleteLiveAutoScalingGroup(targetName, true);
      if (res.success) {
        const fresh = await fetchLiveAutoScalingGroups();
        const list = fresh.autoScalingGroups || [];
        setGroups(list);
        setSelectedName(list.length > 0 ? list[0]?.name : null);
        setFeedback(`Deleted Auto Scaling group "${targetName}" successfully.`);
      } else {
        setFeedback(`Failed to delete Auto Scaling group: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  const filtered = (groups || []).filter((g) => {
    const term = search.toLowerCase();
    return (
      (g.name || "").toLowerCase().includes(term) ||
      (g.launchTemplateName || "").toLowerCase().includes(term) ||
      (g.status || "").toLowerCase().includes(term)
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
              {isLive ? "Auto Scaling Connected (AWS Emulator)" : "Mock Data Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        <span className="text-[11px] text-[#545b64]">AWS EC2 Auto Scaling Service</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Total Auto Scaling Groups
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Automated scaling fleets</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Total Desired Capacity
          </div>
          <div className="text-[24px] font-bold text-[#0073bb] mt-1">{totalDesired}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Target instance count</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Active Instances
          </div>
          <div className="text-[24px] font-bold text-[#1d8102] mt-1">{totalInstances}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Fleet member instances</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Healthy Instances
          </div>
          <div className="text-[24px] font-bold text-[#1d8102] mt-1">{healthyInstances}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Passing EC2 health checks</div>
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
              Auto Scaling Groups ({totalCount})
            </h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Amazon EC2 Auto Scaling contains a collection of EC2 instances that are treated as a logical grouping for automatic scaling and management.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshGroups}
              disabled={isPending}
              title="Refresh groups"
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

            {selectedGroup && (
              <button
                onClick={() => {
                  setEditDesired(selectedGroup.desiredCapacity);
                  setEditMin(selectedGroup.minSize);
                  setEditMax(selectedGroup.maxSize);
                  setShowEditCapacityModal(true);
                }}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Edit capacity
              </button>
            )}

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
              Delete group
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
            >
              Create Auto Scaling group
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <div className="relative max-w-[450px]">
            <input
              type="text"
              placeholder="Filter Auto Scaling groups by name or template..."
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
                <th className="py-2.5 px-4">Auto Scaling group name</th>
                <th className="py-2.5 px-3">Launch template / configuration</th>
                <th className="py-2.5 px-3">Instances</th>
                <th className="py-2.5 px-3">Desired capacity</th>
                <th className="py-2.5 px-3">Min</th>
                <th className="py-2.5 px-3">Max</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#545b64]">
                    No Auto Scaling groups found in region us-east-1.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => {
                  const isSelected = selectedName === g.name;
                  return (
                    <tr
                      key={g.name}
                      onClick={() => setSelectedName(g.name)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedAsg"
                          checked={isSelected}
                          onChange={() => setSelectedName(g.name)}
                          className="accent-[#0073bb] cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                        {g.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[#0073bb]">
                          {g.launchTemplateName || g.launchConfigurationName || "—"}
                        </span>
                        {g.launchTemplateVersion && (
                          <span className="text-[#545b64] text-[11px] ml-1">
                            ({g.launchTemplateVersion})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f4ea] text-[#137333]">
                          {g.instances?.length || 0} InService
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[13px] font-bold text-[#16191f]">
                        {g.desiredCapacity}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[13px] text-[#545b64]">
                        {g.minSize}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[13px] text-[#545b64]">
                        {g.maxSize}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f4ea] text-[#137333]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                          {g.status || "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloudscape Bottom Drawer for Details & Instances */}
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
              onClick={() => setActiveTab("instances")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "instances"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Instance management ({selectedGroup.instances?.length || 0})
            </button>
          </div>

          <div className="p-6">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-[13px]">
                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Auto Scaling group name</div>
                  <div className="font-bold text-[#16191f] mt-1">{selectedGroup.name}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Launch template</div>
                  <div className="font-mono text-[#0073bb] mt-1">
                    {selectedGroup.launchTemplateName || selectedGroup.launchConfigurationName || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Capacity (Desired / Min / Max)</div>
                  <div className="font-mono font-bold text-[#16191f] mt-1">
                    {selectedGroup.desiredCapacity} / {selectedGroup.minSize} / {selectedGroup.maxSize}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Default cooldown</div>
                  <div className="text-[#16191f] mt-1">{selectedGroup.defaultCooldown} seconds</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Health check type</div>
                  <div className="text-[#16191f] mt-1">{selectedGroup.healthCheckType} ({selectedGroup.healthCheckGracePeriod}s grace)</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Created time</div>
                  <div className="text-[#545b64] mt-1">{selectedGroup.createdTime}</div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <div className="text-[12px] text-[#545b64] font-medium">Auto Scaling group ARN</div>
                  <div className="font-mono text-[12px] text-[#16191f] mt-1 break-all">
                    {selectedGroup.arn}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "instances" && (
              <div>
                <div className="text-[13px] font-bold text-[#16191f] mb-3">
                  Instances in this group ({selectedGroup.instances?.length || 0})
                </div>
                {!selectedGroup.instances || selectedGroup.instances.length === 0 ? (
                  <div className="text-[13px] text-[#545b64] py-4">No instances currently running in this group.</div>
                ) : (
                  <table className="w-full text-left border border-[#eaeded] text-[13px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3">Instance ID</th>
                        <th className="py-2 px-3">Availability Zone</th>
                        <th className="py-2 px-3">Lifecycle State</th>
                        <th className="py-2 px-3">Health Status</th>
                        <th className="py-2 px-3">Instance Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {selectedGroup.instances.map((i) => (
                        <tr key={i.instanceId} className="hover:bg-[#fafafa]">
                          <td className="py-2.5 px-3">
                            <Link
                              href={`/ec2/instances/${i.instanceId}`}
                              className="font-mono font-bold text-[#0073bb] hover:underline"
                            >
                              {i.instanceId}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">{i.availabilityZone}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f4ea] text-[#137333]">
                              {i.lifecycleState}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#137333] font-medium">{i.healthStatus}</td>
                          <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">{i.instanceType || "t3.micro"}</td>
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
              <h3 className="text-[17px] font-bold text-[#16191f]">Create Auto Scaling group</h3>
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
                Auto Scaling group name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. web-app-asg"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Launch template <span className="text-[#d13212]">*</span>
              </label>
              <select
                required
                value={createLtId}
                onChange={(e) => setCreateLtId(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
              >
                {launchTemplates.length === 0 ? (
                  <option value="">No launch templates available</option>
                ) : (
                  launchTemplates.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.id})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">Desired capacity</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={createDesired}
                  onChange={(e) => setCreateDesired(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">Min size</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={createMin}
                  onChange={(e) => setCreateMin(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">Max size</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={createMax}
                  onChange={(e) => setCreateMax(parseInt(e.target.value, 10) || 3)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                />
              </div>
            </div>

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
                disabled={isPending || !createLtId}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create Auto Scaling group"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Capacity Modal */}
      {showEditCapacityModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleUpdateCapacity}
            className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <h3 className="text-[17px] font-bold text-[#16191f]">
              Edit group capacity ({selectedGroup.name})
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">Desired</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={editDesired}
                  onChange={(e) => setEditDesired(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">Min</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={editMin}
                  onChange={(e) => setEditMin(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">Max</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={editMax}
                  onChange={(e) => setEditMax(parseInt(e.target.value, 10) || 3)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowEditCapacityModal(false)}
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
                {isPending ? "Updating..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete Auto Scaling group</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete Auto Scaling group <strong className="text-[#16191f]">{selectedGroup.name}</strong>?
              All instances attached to this group will be terminated.
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
