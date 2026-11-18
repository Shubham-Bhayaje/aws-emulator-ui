/**
 * src/components/ec2/LifecycleManagerClient.tsx – Amazon Data Lifecycle Manager (DLM) Console Replica.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import {
  LifecyclePolicyModel,
  fetchLiveLifecyclePolicies,
  createLiveLifecyclePolicy,
  deleteLiveLifecyclePolicy,
  toggleLiveLifecyclePolicyState,
} from "@/app/ec2/actions";

interface Props {
  initialPolicies?: LifecyclePolicyModel[];
  isLive?: boolean;
}

export default function LifecycleManagerClient({
  initialPolicies = [],
  isLive = false,
}: Props) {
  const [policies, setPolicies] = useState<LifecyclePolicyModel[]>(initialPolicies || []);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(
    initialPolicies && initialPolicies.length > 0 ? initialPolicies[0]?.policyId : null
  );
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "schedule" | "targets">("details");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Create Form State
  const [policyType, setPolicyType] = useState<"EBS_SNAPSHOT_MANAGEMENT" | "IMAGE_MANAGEMENT">(
    "EBS_SNAPSHOT_MANAGEMENT"
  );
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<"VOLUME" | "INSTANCE">("VOLUME");
  const [targetTagKey, setTargetTagKey] = useState("Environment");
  const [targetTagValue, setTargetTagValue] = useState("production");
  const [scheduleName, setScheduleName] = useState("DailySchedule");
  const [frequencyHours, setFrequencyHours] = useState(24);
  const [startingAt, setStartingAt] = useState("09:00 UTC");
  const [retainCount, setRetainCount] = useState(7);
  const [policyState, setPolicyState] = useState<"ENABLED" | "DISABLED">("ENABLED");

  const selectedPolicy = policies.find((p) => p.policyId === selectedPolicyId) || null;

  function refreshPolicies() {
    startTransition(async () => {
      const res = await fetchLiveLifecyclePolicies();
      setPolicies(res.policies);
      if (res.policies.length > 0 && (!selectedPolicyId || !res.policies.some((p) => p.policyId === selectedPolicyId))) {
        setSelectedPolicyId(res.policies[0].policyId);
      }
    });
  }

  function handleCreatePolicy(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    startTransition(async () => {
      const res = await createLiveLifecyclePolicy({
        description: description.trim(),
        policyType,
        resourceTypes: [resourceType],
        targetTags: [{ key: targetTagKey.trim(), value: targetTagValue.trim() }],
        scheduleName: scheduleName.trim() || "DailySchedule",
        frequencyHours,
        startingAt,
        retainCount,
        state: policyState,
      });

      if (res.success && res.policy) {
        setShowCreateModal(false);
        setDescription("");
        const fresh = await fetchLiveLifecyclePolicies();
        setPolicies(fresh.policies);
        setSelectedPolicyId(res.policy.policyId);
        setFeedback(`Lifecycle policy ${res.policy.policyId} created successfully.`);
      } else {
        setFeedback(`Failed to create policy: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleToggleState() {
    if (!selectedPolicyId) return;
    const targetId = selectedPolicyId;

    startTransition(async () => {
      const res = await toggleLiveLifecyclePolicyState(targetId);
      if (res.success) {
        const fresh = await fetchLiveLifecyclePolicies();
        setPolicies(fresh.policies);
        setFeedback(`Policy ${targetId} is now ${res.newState}.`);
      } else {
        setFeedback(`Toggle failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDeletePolicy() {
    if (!selectedPolicyId) return;
    const targetId = selectedPolicyId;

    startTransition(async () => {
      const res = await deleteLiveLifecyclePolicy(targetId);
      if (res.success) {
        setShowDeleteModal(false);
        const fresh = await fetchLiveLifecyclePolicies();
        setPolicies(fresh.policies);
        setSelectedPolicyId(fresh.policies[0]?.policyId || null);
        setFeedback(`Policy ${targetId} was deleted.`);
      } else {
        setFeedback(`Delete failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  const filtered = policies.filter(
    (p) =>
      p.policyId.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.targetTags.some(
        (t) =>
          t.key.toLowerCase().includes(search.toLowerCase()) ||
          t.value.toLowerCase().includes(search.toLowerCase())
      )
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
              {isLive ? "Data Lifecycle Manager Connected (AWS Emulator)" : "Mock Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        {feedback && <span className="text-[12px] text-[#0073bb] font-medium">{feedback}</span>}
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-[#16191f]">Lifecycle policies</h2>
              <span className="text-[13px] text-[#545b64]">({filtered.length})</span>
            </div>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Amazon Data Lifecycle Manager (Amazon DLM) automates the creation, retention, and deletion of EBS snapshots and EBS-backed AMIs.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
            <button
              onClick={refreshPolicies}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={handleToggleState}
              disabled={!selectedPolicy || isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              {selectedPolicy?.state === "ENABLED" ? "Disable policy" : "Enable policy"}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={!selectedPolicy}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#d13212] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#d13212] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Delete policy
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            >
              Create lifecycle policy
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[#f8f9fa] border-b border-[#eaeded] flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Filter by policy ID, description, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                <th className="py-2.5 px-3">Policy ID</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Policy type</th>
                <th className="py-2.5 px-3">Resource types</th>
                <th className="py-2.5 px-3">Target tags</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Schedule</th>
                <th className="py-2.5 px-3">Date created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="text-[16px] font-bold text-[#16191f]">
                        No lifecycle policies found
                      </div>
                      <p className="text-[13px] text-[#545b64]">
                        Create an EBS-backed snapshot policy to automate scheduled backups for your EC2 instances and volumes.
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                        className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                      >
                        Create lifecycle policy
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isSelected = selectedPolicyId === p.policyId;
                  return (
                    <tr
                      key={p.policyId}
                      onClick={() => setSelectedPolicyId(p.policyId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#f9fafb]"
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="radio"
                          name="policy-select"
                          checked={isSelected}
                          onChange={() => setSelectedPolicyId(p.policyId)}
                          className="h-4 w-4 text-[#ec7211] border-[#aab7b8] focus:ring-0"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#0073bb]">
                        {p.policyId}
                      </td>
                      <td className="py-3 px-3 text-[#16191f] font-medium">
                        {p.description}
                      </td>
                      <td className="py-3 px-3 text-[#545b64]">
                        {p.policyType === "EBS_SNAPSHOT_MANAGEMENT" ? "EBS snapshot policy" : "EBS-backed AMI policy"}
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">
                        {p.resourceTypes.join(", ")}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {p.targetTags.map((t, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-0.5 rounded text-[11px] bg-[#f2f3f3] text-[#16191f] font-mono border border-[#eaeded]"
                            >
                              {t.key}={t.value}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                            p.state === "ENABLED"
                              ? "bg-[#e6f4ea] text-[#137333]"
                              : "bg-[#f2f3f3] text-[#545b64]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.state === "ENABLED" ? "bg-[#137333]" : "bg-[#545b64]"
                            }`}
                          />
                          {p.state}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#545b64] text-[12px]">
                        Every {p.frequencyHours}h, retain {p.retainCount}
                      </td>
                      <td className="py-3 px-3 text-[#545b64] text-[12px]">{p.dateCreated}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Detail Drawer */}
      {selectedPolicy && (
        <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
          <div className="border-b border-[#eaeded] px-6 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-[16px] font-bold text-[#16191f] font-mono">
                {selectedPolicy.policyId}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                  selectedPolicy.state === "ENABLED"
                    ? "bg-[#e6f4ea] text-[#137333]"
                    : "bg-[#f2f3f3] text-[#545b64]"
                }`}
              >
                {selectedPolicy.state}
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
                Policy details
              </button>
              <button
                onClick={() => setActiveTab("schedule")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeTab === "schedule"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Schedules &amp; Retention
              </button>
              <button
                onClick={() => setActiveTab("targets")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeTab === "targets"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Target resources
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Policy ID</span>
                    <span className="font-mono font-bold text-[#16191f]">{selectedPolicy.policyId}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Description</span>
                    <span className="text-[#16191f]">{selectedPolicy.description}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Policy type</span>
                    <span className="text-[#16191f]">
                      {selectedPolicy.policyType === "EBS_SNAPSHOT_MANAGEMENT"
                        ? "EBS snapshot policy"
                        : "EBS-backed AMI policy"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Policy status</span>
                    <span className="text-[#16191f] font-semibold">{selectedPolicy.state}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Execution role ARN</span>
                    <span className="font-mono text-[12px] text-[#545b64] break-all">
                      {selectedPolicy.executionRoleArn}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Date created</span>
                    <span className="text-[#16191f]">{selectedPolicy.dateCreated}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Date modified</span>
                    <span className="text-[#16191f]">{selectedPolicy.dateModified}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Tags</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(selectedPolicy.tags || {}).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 text-[11px] bg-[#f2f3f3] border border-[#eaeded] font-mono">
                          {k}={v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="space-y-4 text-[13px]">
                <div className="border border-[#eaeded] rounded-sm overflow-hidden">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-4">Schedule name</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Starting at</th>
                        <th className="py-2.5 px-3">Retention rule</th>
                        <th className="py-2.5 px-3">Fast snapshot restore</th>
                        <th className="py-2.5 px-3">Cross-Region copy</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-[#16191f]">
                          {selectedPolicy.scheduleName}
                        </td>
                        <td className="py-3 px-3 text-[#16191f]">
                          Every {selectedPolicy.frequencyHours} hours
                        </td>
                        <td className="py-3 px-3 text-[#545b64]">{selectedPolicy.startingAt}</td>
                        <td className="py-3 px-3 text-[#16191f]">
                          Retain most recent {selectedPolicy.retainCount} snapshots
                        </td>
                        <td className="py-3 px-3 text-[#545b64]">Disabled</td>
                        <td className="py-3 px-3 text-[#545b64]">Disabled</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "targets" && (
              <div className="space-y-4 text-[13px]">
                <div>
                  <span className="text-[#545b64] block text-[12px]">Target resource types</span>
                  <span className="text-[#16191f] font-mono font-semibold">
                    {selectedPolicy.resourceTypes.join(", ")}
                  </span>
                </div>
                <div>
                  <span className="text-[#545b64] block text-[12px] mb-2">Target tags</span>
                  <div className="border border-[#eaeded] rounded-sm overflow-hidden max-w-md">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Tag Key</th>
                          <th className="py-2.5 px-4">Tag Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeded]">
                        {selectedPolicy.targetTags.map((t, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-4 font-mono font-semibold text-[#16191f]">{t.key}</td>
                            <td className="py-2 px-4 text-[#545b64]">{t.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreatePolicy}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="border-b border-[#eaeded] pb-3">
              <h3 className="text-[18px] font-bold text-[#16191f]">Create lifecycle policy</h3>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Automate point-in-time snapshot creation and retention for EBS volumes and EC2 instances.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Policy type
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] text-[#16191f] cursor-pointer">
                  <input
                    type="radio"
                    name="policyType"
                    checked={policyType === "EBS_SNAPSHOT_MANAGEMENT"}
                    onChange={() => setPolicyType("EBS_SNAPSHOT_MANAGEMENT")}
                    className="h-4 w-4 text-[#ec7211]"
                  />
                  <span>EBS snapshot policy (Backup individual EBS volumes)</span>
                </label>
                <label className="flex items-center gap-2 text-[13px] text-[#16191f] cursor-pointer">
                  <input
                    type="radio"
                    name="policyType"
                    checked={policyType === "IMAGE_MANAGEMENT"}
                    onChange={() => setPolicyType("IMAGE_MANAGEMENT")}
                    className="h-4 w-4 text-[#ec7211]"
                  />
                  <span>EBS-backed AMI policy (Backup whole EC2 instances as AMIs)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g. Daily production snapshot policy"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Target resource type
                </label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
                >
                  <option value="VOLUME">VOLUME</option>
                  <option value="INSTANCE">INSTANCE</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Initial state
                </label>
                <select
                  value={policyState}
                  onChange={(e) => setPolicyState(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
                >
                  <option value="ENABLED">ENABLED</option>
                  <option value="DISABLED">DISABLED</option>
                </select>
              </div>
            </div>

            <div className="border-t border-[#eaeded] pt-3">
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Target tag
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Key (e.g. Environment)"
                  value={targetTagKey}
                  onChange={(e) => setTargetTagKey(e.target.value)}
                  className="px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                  required
                />
                <input
                  type="text"
                  placeholder="Value (e.g. production)"
                  value={targetTagValue}
                  onChange={(e) => setTargetTagValue(e.target.value)}
                  className="px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                  required
                />
              </div>
              <span className="text-[11px] text-[#545b64]">
                Only volumes or instances matching this tag will be targeted.
              </span>
            </div>

            <div className="border-t border-[#eaeded] pt-3 space-y-3">
              <div className="text-[13px] font-bold text-[#16191f]">Schedule &amp; Retention</div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#545b64] mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequencyHours}
                    onChange={(e) => setFrequencyHours(parseInt(e.target.value, 10))}
                    className="w-full px-2 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
                  >
                    <option value={1}>Every 1 hour</option>
                    <option value={2}>Every 2 hours</option>
                    <option value={4}>Every 4 hours</option>
                    <option value={8}>Every 8 hours</option>
                    <option value={12}>Every 12 hours</option>
                    <option value={24}>Every 24 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#545b64] mb-1">
                    Starting at
                  </label>
                  <input
                    type="text"
                    value={startingAt}
                    onChange={(e) => setStartingAt(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#545b64] mb-1">
                    Retain count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={retainCount}
                    onChange={(e) => setRetainCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                  />
                </div>
              </div>
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
                disabled={isPending || !description.trim()}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create policy"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete lifecycle policy</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to delete lifecycle policy{" "}
              <strong className="text-[#16191f] font-mono">{selectedPolicy.policyId}</strong> (
              {selectedPolicy.description})?
            </p>
            <p className="text-[12px] text-[#545b64] mt-3">
              Existing snapshots managed by this policy will not be deleted.
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
                onClick={handleDeletePolicy}
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
