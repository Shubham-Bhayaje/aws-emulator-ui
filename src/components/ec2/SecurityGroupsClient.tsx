/**
 * src/components/ec2/SecurityGroupsClient.tsx – AWS Security Groups Console Replica.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";
import {
  SecurityGroup,
  SecurityGroupRule,
  AWS_SECURITY_GROUP_RULE_PRESETS,
} from "@/lib/ec2-data";
import {
  createLiveSecurityGroup,
  deleteLiveSecurityGroup,
  fetchLiveSecurityGroups,
  updateLiveSecurityGroupRules,
  updateLiveSecurityGroupOutboundRules,
} from "@/app/ec2/actions";

interface SecurityGroupsClientProps {
  initialSecurityGroups?: SecurityGroup[];
  isLive?: boolean;
  liveError?: string;
}

export default function SecurityGroupsClient({
  initialSecurityGroups = [],
  isLive = true,
  liveError,
}: SecurityGroupsClientProps) {
  const [secGroups, setSecGroups] = useState<SecurityGroup[]>(initialSecurityGroups || []);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSecurityGroups && initialSecurityGroups.length > 0 ? initialSecurityGroups[0]?.id : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"details" | "inbound" | "outbound" | "tags">("details");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modals & dropdowns
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditInboundModal, setShowEditInboundModal] = useState(false);
  const [showEditOutboundModal, setShowEditOutboundModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create SG form state
  const [newSgName, setNewSgName] = useState("");
  const [newSgDesc, setNewSgDesc] = useState("");
  const [newRules, setNewRules] = useState<SecurityGroupRule[]>([
    { type: "SSH", protocol: "TCP", portRange: "22", source: "0.0.0.0/0", description: "SSH access" },
  ]);

  // Edit SG rules state
  const [editingInboundRules, setEditingInboundRules] = useState<SecurityGroupRule[]>([]);
  const [editingOutboundRules, setEditingOutboundRules] = useState<SecurityGroupRule[]>([]);

  const selectedSg = (secGroups || []).find((s) => s.id === selectedId) || null;

  function refreshGroups() {
    startTransition(async () => {
      const res = await fetchLiveSecurityGroups();
      const list = res.securityGroups || [];
      setSecGroups(list);
      if (list.length > 0 && (!selectedId || !list.some((s) => s.id === selectedId))) {
        setSelectedId(list[0]?.id || null);
      }
    });
  }

  // -------------------------------------------------------------
  // Inbound Rules Editing
  // -------------------------------------------------------------
  function handleOpenEditInbound() {
    if (!selectedSg) return;
    setEditingInboundRules(selectedSg.inboundRules.map((r) => ({ ...r })));
    setShowEditInboundModal(true);
  }

  function handleAddInboundRule() {
    setEditingInboundRules([
      ...editingInboundRules,
      { type: "Custom TCP", protocol: "TCP", portRange: "8080", source: "0.0.0.0/0", description: "" },
    ]);
  }

  function handleRemoveInboundRule(idx: number) {
    setEditingInboundRules(editingInboundRules.filter((_, i) => i !== idx));
  }

  function handleInboundRuleChange(idx: number, field: keyof SecurityGroupRule, val: string) {
    const updated = [...editingInboundRules];
    updated[idx] = { ...updated[idx], [field]: val };

    if (field === "type") {
      const preset = AWS_SECURITY_GROUP_RULE_PRESETS.find((p) => p.name === val);
      if (preset) {
        updated[idx].protocol = preset.protocol;
        updated[idx].portRange = preset.defaultPort;
      }
    }
    setEditingInboundRules(updated);
  }

  function handleSaveInboundRules(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSg) return;

    startTransition(async () => {
      const res = await updateLiveSecurityGroupRules(selectedSg.id, editingInboundRules);
      if (res.success) {
        setShowEditInboundModal(false);
        const fresh = await fetchLiveSecurityGroups();
        setSecGroups(fresh.securityGroups || []);
        setFeedback(`Inbound rules updated for ${selectedSg.id}.`);
      } else {
        setFeedback(`Failed to update inbound rules: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  // -------------------------------------------------------------
  // Outbound Rules Editing
  // -------------------------------------------------------------
  function handleOpenEditOutbound() {
    if (!selectedSg) return;
    setEditingOutboundRules(selectedSg.outboundRules.map((r) => ({ ...r })));
    setShowEditOutboundModal(true);
  }

  function handleAddOutboundRule() {
    setEditingOutboundRules([
      ...editingOutboundRules,
      { type: "All traffic", protocol: "All", portRange: "All", source: "0.0.0.0/0", description: "" },
    ]);
  }

  function handleRemoveOutboundRule(idx: number) {
    setEditingOutboundRules(editingOutboundRules.filter((_, i) => i !== idx));
  }

  function handleOutboundRuleChange(idx: number, field: keyof SecurityGroupRule, val: string) {
    const updated = [...editingOutboundRules];
    updated[idx] = { ...updated[idx], [field]: val };

    if (field === "type") {
      const preset = AWS_SECURITY_GROUP_RULE_PRESETS.find((p) => p.name === val);
      if (preset) {
        updated[idx].protocol = preset.protocol;
        updated[idx].portRange = preset.defaultPort;
      }
    }
    setEditingOutboundRules(updated);
  }

  function handleSaveOutboundRules(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSg) return;

    startTransition(async () => {
      const res = await updateLiveSecurityGroupOutboundRules(selectedSg.id, editingOutboundRules);
      if (res.success) {
        setShowEditOutboundModal(false);
        const fresh = await fetchLiveSecurityGroups();
        setSecGroups(fresh.securityGroups || []);
        setFeedback(`Outbound rules updated for ${selectedSg.id}.`);
      } else {
        setFeedback(`Failed to update outbound rules: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  // -------------------------------------------------------------
  // Creation Form Rule Management
  // -------------------------------------------------------------
  function handleAddRule() {
    setNewRules([
      ...newRules,
      { type: "Custom TCP", protocol: "TCP", portRange: "80", source: "0.0.0.0/0", description: "" },
    ]);
  }

  function handleRemoveRule(idx: number) {
    setNewRules(newRules.filter((_, i) => i !== idx));
  }

  function handleRuleChange(idx: number, field: keyof SecurityGroupRule, val: string) {
    const updated = [...newRules];
    updated[idx] = { ...updated[idx], [field]: val };

    if (field === "type") {
      const preset = AWS_SECURITY_GROUP_RULE_PRESETS.find((p) => p.name === val);
      if (preset) {
        updated[idx].protocol = preset.protocol;
        updated[idx].portRange = preset.defaultPort;
      }
    }
    setNewRules(updated);
  }

  function handleCreateSecurityGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newSgName.trim()) return;

    startTransition(async () => {
      const res = await createLiveSecurityGroup(newSgName.trim(), newSgDesc.trim());
      if (res.success && res.securityGroup) {
        if (newRules.length > 0) {
          await updateLiveSecurityGroupRules(res.securityGroup.id, newRules);
        }
        setShowCreateModal(false);
        setNewSgName("");
        setNewSgDesc("");
        setNewRules([{ type: "SSH", protocol: "TCP", portRange: "22", source: "0.0.0.0/0", description: "SSH access" }]);
        const fresh = await fetchLiveSecurityGroups();
        setSecGroups(fresh.securityGroups || []);
        setSelectedId(res.securityGroup.id);
        setFeedback(`Security group ${res.securityGroup.id} created successfully.`);
      } else {
        setFeedback(`Creation failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDeleteGroup() {
    if (!selectedId) return;
    const targetId = selectedId;
    setShowDeleteModal(false);

    startTransition(async () => {
      const res = await deleteLiveSecurityGroup(targetId);
      if (res.success) {
        const fresh = await fetchLiveSecurityGroups();
        const list = fresh.securityGroups || [];
        setSecGroups(list);
        setSelectedId(list[0]?.id || null);
        setFeedback(`Security group ${targetId} was deleted.`);
      } else {
        setFeedback(`Failed to delete security group: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  const filteredGroups = (secGroups || []).filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
      {!isLive || liveError ? (
        <EmulatorOfflineBanner error={liveError} />
      ) : (
        /* Live Badge */
        <div className="flex items-center justify-between bg-white border border-[#d5dbdb] px-4 py-2.5 rounded-sm awsui-shadow">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1d8102]" />
              <span className="text-[12px] font-semibold text-[#16191f]">
                Security Group Service Connected (AWS Emulator)
              </span>
            </div>
            <span className="text-[#95a5a6] text-[12px]">|</span>
            <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
          </div>
          {feedback && <span className="text-[12px] text-[#0073bb] font-medium">{feedback}</span>}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Total Security Groups
          </div>
          <div className="text-[26px] font-bold text-[#16191f] mt-1">{(secGroups || []).length}</div>
        </div>

        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Inbound Rules Configured
          </div>
          <div className="text-[26px] font-bold text-[#0073bb] mt-1">
            {(secGroups || []).reduce((acc, s) => acc + (s.inboundRules?.length || 0), 0)}
          </div>
        </div>

        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Outbound Rules Configured
          </div>
          <div className="text-[26px] font-bold text-[#1d8102] mt-1">
            {(secGroups || []).reduce((acc, s) => acc + (s.outboundRules?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-[#16191f]">Security Groups</h2>
              <span className="text-[13px] text-[#545b64]">({filteredGroups.length})</span>
            </div>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Manage virtual firewalls that control inbound and outbound traffic for your Amazon EC2 instances.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
            <button
              onClick={refreshGroups}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={handleOpenEditInbound}
              disabled={!selectedSg}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Edit inbound rules
            </button>
            <button
              onClick={handleOpenEditOutbound}
              disabled={!selectedSg}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Edit outbound rules
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={!selectedSg || selectedSg.name === "default"}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#d13212] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#d13212] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Delete security group
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            >
              Create security group
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[#f8f9fa] border-b border-[#eaeded] flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Filter security groups by name, ID, or description..."
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
                <th className="py-2.5 px-3">Security group ID</th>
                <th className="py-2.5 px-3">Security group name</th>
                <th className="py-2.5 px-3">VPC ID</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-3">Inbound rules</th>
                <th className="py-2.5 px-3">Outbound rules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#545b64]">
                    No security groups found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((sg) => {
                  const isSelected = selectedId === sg.id;
                  return (
                    <tr
                      key={sg.id}
                      onClick={() => setSelectedId(sg.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#f9fafb]"
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="radio"
                          name="security-group-select"
                          checked={isSelected}
                          onChange={() => setSelectedId(sg.id)}
                          className="h-4 w-4 text-[#ec7211] border-[#aab7b8] focus:ring-0"
                        />
                      </td>
                      <td className="py-3 px-3 font-medium text-[#16191f]">
                        {sg.name}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#0073bb]">
                        {sg.id}
                      </td>
                      <td className="py-3 px-3 text-[#16191f] font-mono text-[12px]">
                        {sg.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">
                        {sg.vpcId}
                      </td>
                      <td className="py-3 px-3 text-[#545b64] max-w-xs truncate" title={sg.description}>
                        {sg.description}
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">
                        {sg.ownerId || "000000000000"}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#16191f]">
                        {sg.inboundRules?.length || 0}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#16191f]">
                        {sg.outboundRules?.length || 0}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Detail Drawer */}
      {selectedSg && (
        <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
          <div className="border-b border-[#eaeded] px-6 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-[16px] font-bold text-[#16191f] font-mono">
                {selectedSg.id}
              </h3>
              <span className="text-[13px] text-[#545b64]">({selectedSg.name})</span>
            </div>

            <div className="flex gap-6 border-b border-[#eaeded] -mb-[1px]">
              <button
                onClick={() => setActiveBottomTab("details")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeBottomTab === "details"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveBottomTab("inbound")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeBottomTab === "inbound"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Inbound rules ({selectedSg.inboundRules?.length || 0})
              </button>
              <button
                onClick={() => setActiveBottomTab("outbound")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeBottomTab === "outbound"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Outbound rules ({selectedSg.outboundRules?.length || 0})
              </button>
              <button
                onClick={() => setActiveBottomTab("tags")}
                className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${
                  activeBottomTab === "tags"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Tags ({Object.keys(selectedSg.tags || {}).length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeBottomTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Security group ID</span>
                    <span className="font-mono font-bold text-[#16191f]">{selectedSg.id}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Security group name</span>
                    <span className="text-[#16191f] font-semibold">{selectedSg.name}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Description</span>
                    <span className="text-[#16191f]">{selectedSg.description}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">VPC ID</span>
                    <span className="font-mono text-[#0073bb]">{selectedSg.vpcId}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Owner</span>
                    <span className="font-mono text-[#16191f]">{selectedSg.ownerId || "000000000000"}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Amazon Resource Name (ARN)</span>
                    <span className="font-mono text-[12px] text-[#545b64] break-all">{selectedSg.arn}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Inbound rules count</span>
                    <span className="font-mono text-[#16191f]">{selectedSg.inboundRules?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block text-[12px]">Outbound rules count</span>
                    <span className="font-mono text-[#16191f]">{selectedSg.outboundRules?.length || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {activeBottomTab === "inbound" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-[#545b64]">
                    Inbound rules allow specific traffic to reach instances associated with this security group.
                  </p>
                  <button
                    onClick={handleOpenEditInbound}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    Edit inbound rules
                  </button>
                </div>

                <div className="border border-[#eaeded] rounded-sm overflow-hidden">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-3">Protocol</th>
                        <th className="py-2.5 px-3">Port range</th>
                        <th className="py-2.5 px-3">Source</th>
                        <th className="py-2.5 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {(selectedSg.inboundRules || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#545b64]">
                            No inbound rules configured. All inbound traffic is blocked.
                          </td>
                        </tr>
                      ) : (
                        selectedSg.inboundRules.map((r, i) => (
                          <tr key={i}>
                            <td className="py-2.5 px-4 font-medium text-[#16191f]">{r.type}</td>
                            <td className="py-2.5 px-3 font-mono text-[#545b64]">{r.protocol}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#0073bb]">{r.portRange}</td>
                            <td className="py-2.5 px-3 font-mono text-[#16191f]">{r.source}</td>
                            <td className="py-2.5 px-3 text-[#545b64]">{r.description || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeBottomTab === "outbound" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-[#545b64]">
                    Outbound rules specify the protocols, ports, and destination IP ranges that traffic from your instances is allowed to reach.
                  </p>
                  <button
                    onClick={handleOpenEditOutbound}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    Edit outbound rules
                  </button>
                </div>

                <div className="border border-[#eaeded] rounded-sm overflow-hidden">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-3">Protocol</th>
                        <th className="py-2.5 px-3">Port range</th>
                        <th className="py-2.5 px-3">Destination</th>
                        <th className="py-2.5 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {(selectedSg.outboundRules || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#545b64]">
                            No outbound rules configured. All outbound traffic is blocked.
                          </td>
                        </tr>
                      ) : (
                        selectedSg.outboundRules.map((r, i) => (
                          <tr key={i}>
                            <td className="py-2.5 px-4 font-medium text-[#16191f]">{r.type}</td>
                            <td className="py-2.5 px-3 font-mono text-[#545b64]">{r.protocol}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#0073bb]">{r.portRange}</td>
                            <td className="py-2.5 px-3 font-mono text-[#16191f]">{r.source}</td>
                            <td className="py-2.5 px-3 text-[#545b64]">{r.description || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeBottomTab === "tags" && (
              <div className="space-y-4">
                {selectedSg.tags && Object.keys(selectedSg.tags).length > 0 ? (
                  <div className="border border-[#eaeded] rounded-sm overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Key</th>
                          <th className="py-2.5 px-4">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeded]">
                        {Object.entries(selectedSg.tags).map(([k, v]) => (
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
                    No custom tags assigned to this security group.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Create Security Group */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateSecurityGroup}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-4xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="border-b border-[#eaeded] pb-3">
              <h3 className="text-[18px] font-bold text-[#16191f]">Create security group</h3>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                A security group acts as a virtual firewall for your EC2 instances to control incoming and outgoing traffic.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Security group name
                </label>
                <input
                  type="text"
                  placeholder="e.g. web-tier-sg"
                  value={newSgName}
                  onChange={(e) => setNewSgName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  VPC
                </label>
                <input
                  type="text"
                  disabled
                  value="vpc-00000000000000001 (Default VPC)"
                  className="w-full px-3 py-1.5 border border-[#eaeded] bg-[#f8f9fa] rounded-sm text-[13px] text-[#545b64] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Security group for public web servers"
                value={newSgDesc}
                onChange={(e) => setNewSgDesc(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
                required
              />
            </div>

            {/* Inbound Rules Builder */}
            <div className="border-t border-[#eaeded] pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-bold text-[#16191f]">Inbound rules</h4>
                  <p className="text-[11px] text-[#545b64]">Allow network traffic from specified sources to instances.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddRule}
                  style={{ height: "28px", minHeight: "28px", maxHeight: "28px", whiteSpace: "nowrap" }}
                  className="h-[28px] px-3 border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[12px] font-bold rounded-sm inline-flex items-center justify-center cursor-pointer"
                >
                  Add rule
                </button>
              </div>

              <div className="space-y-2">
                {newRules.map((rule, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-[#fafafa] p-2.5 border border-[#eaeded] rounded-sm text-[12px]">
                    <div className="col-span-3">
                      <select
                        value={rule.type}
                        onChange={(e) => handleRuleChange(idx, "type", e.target.value)}
                        className="w-full p-1 border border-[#aab7b8] rounded-sm bg-white text-[#16191f]"
                      >
                        {AWS_SECURITY_GROUP_RULE_PRESETS.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name} ({p.protocol} {p.defaultPort})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 font-mono text-[#545b64] text-center">
                      {rule.protocol}
                    </div>

                    <div className="col-span-2">
                      <input
                        type="text"
                        value={rule.portRange}
                        onChange={(e) => handleRuleChange(idx, "portRange", e.target.value)}
                        placeholder="Port"
                        className="w-full p-1 border border-[#aab7b8] rounded-sm font-mono text-[#16191f]"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="text"
                        value={rule.source}
                        onChange={(e) => handleRuleChange(idx, "source", e.target.value)}
                        placeholder="0.0.0.0/0"
                        className="w-full p-1 border border-[#aab7b8] rounded-sm font-mono text-[#16191f]"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="text"
                        value={rule.description}
                        onChange={(e) => handleRuleChange(idx, "description", e.target.value)}
                        placeholder="Description"
                        className="w-full p-1 border border-[#aab7b8] rounded-sm text-[#16191f]"
                      />
                    </div>

                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-[#d13212] hover:underline font-bold text-[13px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
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
                disabled={isPending || !newSgName.trim()}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create security group"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Edit Inbound Rules */}
      {showEditInboundModal && selectedSg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveInboundRules}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-4xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="border-b border-[#eaeded] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#16191f]">
                  Edit inbound rules: {selectedSg.id} ({selectedSg.name})
                </h3>
                <p className="text-[12px] text-[#545b64] mt-0.5">
                  Update allowed incoming network traffic rules for this security group.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddInboundRule}
                style={{ height: "28px", minHeight: "28px", maxHeight: "28px", whiteSpace: "nowrap" }}
                className="h-[28px] px-3 border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[12px] font-bold rounded-sm inline-flex items-center justify-center cursor-pointer"
              >
                Add rule
              </button>
            </div>

            <div className="space-y-2">
              {editingInboundRules.map((rule, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-[#fafafa] p-2.5 border border-[#eaeded] rounded-sm text-[12px]">
                  <div className="col-span-3">
                    <select
                      value={rule.type}
                      onChange={(e) => handleInboundRuleChange(idx, "type", e.target.value)}
                      className="w-full p-1 border border-[#aab7b8] rounded-sm bg-white text-[#16191f]"
                    >
                      {AWS_SECURITY_GROUP_RULE_PRESETS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({p.protocol} {p.defaultPort})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 font-mono text-[#545b64] text-center">
                    {rule.protocol}
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      value={rule.portRange}
                      onChange={(e) => handleInboundRuleChange(idx, "portRange", e.target.value)}
                      placeholder="Port"
                      className="w-full p-1 border border-[#aab7b8] rounded-sm font-mono text-[#16191f]"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      value={rule.source}
                      onChange={(e) => handleInboundRuleChange(idx, "source", e.target.value)}
                      placeholder="0.0.0.0/0"
                      className="w-full p-1 border border-[#aab7b8] rounded-sm font-mono text-[#16191f]"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      value={rule.description}
                      onChange={(e) => handleInboundRuleChange(idx, "description", e.target.value)}
                      placeholder="Description"
                      className="w-full p-1 border border-[#aab7b8] rounded-sm text-[#16191f]"
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveInboundRule(idx)}
                      className="text-[#d13212] hover:underline font-bold text-[13px]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowEditInboundModal(false)}
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
                {isPending ? "Saving..." : "Save rules"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Edit Outbound Rules */}
      {showEditOutboundModal && selectedSg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveOutboundRules}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-4xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="border-b border-[#eaeded] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#16191f]">
                  Edit outbound rules: {selectedSg.id} ({selectedSg.name})
                </h3>
                <p className="text-[12px] text-[#545b64] mt-0.5">
                  Update outbound rules to control traffic allowed out of instances in this security group.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddOutboundRule}
                style={{ height: "28px", minHeight: "28px", maxHeight: "28px", whiteSpace: "nowrap" }}
                className="h-[28px] px-3 border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[12px] font-bold rounded-sm inline-flex items-center justify-center cursor-pointer"
              >
                Add rule
              </button>
            </div>

            <div className="space-y-2">
              {editingOutboundRules.map((rule, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-[#fafafa] p-2.5 border border-[#eaeded] rounded-sm text-[12px]">
                  <div className="col-span-3">
                    <select
                      value={rule.type}
                      onChange={(e) => handleOutboundRuleChange(idx, "type", e.target.value)}
                      className="w-full p-1 border border-[#aab7b8] rounded-sm bg-white text-[#16191f]"
                    >
                      {AWS_SECURITY_GROUP_RULE_PRESETS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({p.protocol} {p.defaultPort})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 font-mono text-[#545b64] text-center">
                    {rule.protocol}
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      value={rule.portRange}
                      onChange={(e) => handleOutboundRuleChange(idx, "portRange", e.target.value)}
                      placeholder="Port"
                      className="w-full p-1 border border-[#aab7b8] rounded-sm font-mono text-[#16191f]"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      value={rule.source}
                      onChange={(e) => handleOutboundRuleChange(idx, "source", e.target.value)}
                      placeholder="0.0.0.0/0"
                      className="w-full p-1 border border-[#aab7b8] rounded-sm font-mono text-[#16191f]"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      value={rule.description}
                      onChange={(e) => handleOutboundRuleChange(idx, "description", e.target.value)}
                      placeholder="Description"
                      className="w-full p-1 border border-[#aab7b8] rounded-sm text-[#16191f]"
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveOutboundRule(idx)}
                      className="text-[#d13212] hover:underline font-bold text-[13px]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowEditOutboundModal(false)}
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
                {isPending ? "Saving..." : "Save rules"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 4: Delete Security Group */}
      {showDeleteModal && selectedSg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete security group</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to permanently delete security group{" "}
              <strong className="text-[#16191f] font-mono">{selectedSg.id}</strong> ({selectedSg.name})?
            </p>
            <p className="text-[12px] text-[#d13212] mt-3">
              This security group will be detached and permanently removed from this region.
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
                onClick={handleDeleteGroup}
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
