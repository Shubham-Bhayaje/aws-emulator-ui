/**
 * SecurityGroupsClient.tsx – Authentic AWS Management Console Security Groups manager.
 * Complete with Details, Inbound rules, Outbound rules, and Tags tabs, Actions dropdown,
 * and comprehensive rule builder supporting all 25 AWS standard protocols/ports.
 * Connected to live AWS Emulator via Server Actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DEFAULT_SECURITY_GROUPS,
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
  initialSecurityGroups = DEFAULT_SECURITY_GROUPS,
  isLive = true,
  liveError,
}: SecurityGroupsClientProps) {
  const [secGroups, setSecGroups] = useState<SecurityGroup[]>(initialSecurityGroups);
  const [selectedId, setSelectedId] = useState<string | null>(initialSecurityGroups[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"details" | "inbound" | "outbound" | "tags">("details");

  // Modals & dropdowns
  const [showActionsMenu, setShowActionsMenu] = useState(false);
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

  const selectedSg = secGroups.find((s) => s.id === selectedId) || null;

  // -------------------------------------------------------------
  // Inbound Rules Editing
  // -------------------------------------------------------------
  function handleOpenEditInbound() {
    if (!selectedSg) return;
    setEditingInboundRules(selectedSg.inboundRules.map((r) => ({ ...r })));
    setShowActionsMenu(false);
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
      if (!res.success && res.error) {
        alert("Failed to update inbound rules: " + res.error);
        return;
      }
      const fresh = await fetchLiveSecurityGroups();
      if (fresh.isLive) setSecGroups(fresh.securityGroups);
      setShowEditInboundModal(false);
    });
  }

  // -------------------------------------------------------------
  // Outbound Rules Editing
  // -------------------------------------------------------------
  function handleOpenEditOutbound() {
    if (!selectedSg) return;
    setEditingOutboundRules(selectedSg.outboundRules.map((r) => ({ ...r })));
    setShowActionsMenu(false);
    setShowEditOutboundModal(true);
  }

  function handleAddOutboundRule() {
    setEditingOutboundRules([
      ...editingOutboundRules,
      { type: "All traffic", protocol: "All", portRange: "All", source: "0.0.0.0/0", description: "Allow all outbound" },
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
      if (!res.success && res.error) {
        alert("Failed to update outbound rules: " + res.error);
        return;
      }
      const fresh = await fetchLiveSecurityGroups();
      if (fresh.isLive) setSecGroups(fresh.securityGroups);
      setShowEditOutboundModal(false);
    });
  }

  // -------------------------------------------------------------
  // Create / Delete SG
  // -------------------------------------------------------------
  function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newSgName.trim()) return;

    startTransition(async () => {
      const res = await createLiveSecurityGroup(newSgName.trim(), newSgDesc.trim());
      if (res.success && res.securityGroup) {
        setSecGroups([res.securityGroup, ...secGroups]);
      } else {
        const fresh = await fetchLiveSecurityGroups();
        if (fresh.isLive) setSecGroups(fresh.securityGroups);
      }
      setNewSgName("");
      setNewSgDesc("");
      setShowCreateModal(false);
    });
  }

  function handleDeleteGroup() {
    if (!selectedSg) return;
    const targetId = selectedSg.id;
    setSecGroups(secGroups.filter((s) => s.id !== targetId));
    setSelectedId(null);
    setShowDeleteModal(false);

    startTransition(async () => {
      await deleteLiveSecurityGroup(targetId);
      const fresh = await fetchLiveSecurityGroups();
      if (fresh.isLive) setSecGroups(fresh.securityGroups);
    });
  }

  const filteredGroups = secGroups.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-[1500px]">
      {/* Live Badge */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#f2f8f0] border border-[#b8dfaf] rounded-sm text-[12px] text-[#1d8102]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1d8102] animate-pulse" />
          <span className="font-semibold">Live Security Groups</span>
          <span className="text-[#545b64]">|</span>
          <span>Configured on Docker AWS Emulator (127.0.0.1:9297)</span>
        </div>
      </div>

      {/* Header with Title and Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">
            Security Groups <span className="text-[#545b64] font-normal">({filteredGroups.length})</span>
          </h1>
          <p className="text-[13px] text-[#545b64]">
            Manage stateful virtual firewalls that control inbound and outbound traffic for your EC2 instances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              disabled={!selectedSg}
              className="px-3 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3] font-normal disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              Actions
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showActionsMenu && selectedSg && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white border border-[#d5dbdb] rounded-sm shadow-lg z-30 py-1 text-[13px]"
                onMouseLeave={() => setShowActionsMenu(false)}
              >
                <button
                  onClick={handleOpenEditInbound}
                  className="w-full text-left px-4 py-2 hover:bg-[#f2f3f3] text-[#16191f]"
                >
                  Edit inbound rules
                </button>
                <button
                  onClick={handleOpenEditOutbound}
                  className="w-full text-left px-4 py-2 hover:bg-[#f2f3f3] text-[#16191f]"
                >
                  Edit outbound rules
                </button>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  onClick={() => {
                    setShowActionsMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-[#d13212] hover:bg-[#fdf3f1]"
                >
                  Delete security group
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenEditInbound}
            disabled={!selectedSg}
            className="px-3 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3] font-medium disabled:opacity-40 transition-colors"
          >
            Edit inbound rules
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={!selectedSg}
            className={`px-3 py-1.5 text-[13px] rounded-sm font-medium border transition-colors ${
              selectedSg
                ? "border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1]"
                : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed bg-white"
            }`}
          >
            Delete
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] font-medium transition-colors"
          >
            Create security group
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-3">
        <input
          type="text"
          placeholder="Filter security groups by name, ID, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:border-[#0073bb] outline-hidden"
        />
      </div>

      {/* Security Groups Table */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm awsui-shadow overflow-x-auto">
        <table className="w-full text-[13px] text-left border-collapse">
          <thead className="bg-[#f2f3f3] text-[#545b64] font-semibold border-b border-[#eaeded]">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedId !== null && filteredGroups.some((g) => g.id === selectedId)}
                  onChange={(e) => {
                    if (e.target.checked && filteredGroups.length > 0) {
                      setSelectedId(filteredGroups[0].id);
                    } else {
                      setSelectedId(null);
                    }
                  }}
                  className="rounded border-[#aab7b8]"
                  aria-label="Select all security groups"
                />
              </th>
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Security Group ID</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3">VPC ID</th>
              <th className="py-2.5 px-3">Inbound Rules</th>
              <th className="py-2.5 px-3">Outbound Rules</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filteredGroups.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-[#545b64]">
                  No security groups found.
                </td>
              </tr>
            ) : (
              filteredGroups.map((sg) => {
                const isSelected = selectedId === sg.id;
                return (
                  <tr
                    key={sg.id}
                    onClick={() => setSelectedId(isSelected ? null : sg.id)}
                    className={`cursor-pointer transition-colors ${isSelected ? "bg-[#f2f8f8]" : "hover:bg-[#fafafa]"}`}
                  >
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setSelectedId(isSelected ? null : sg.id)}
                        className="rounded border-[#aab7b8]"
                        aria-label={`Select ${sg.name}`}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#0073bb]">{sg.name}</td>
                    <td className="py-2.5 px-3 font-mono text-[12px] text-[#0073bb]">{sg.id}</td>
                    <td className="py-2.5 px-3 text-[#545b64]">{sg.description}</td>
                    <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">{sg.vpcId}</td>
                    <td className="py-2.5 px-3 text-[#16191f] font-mono">
                      {sg.inboundRules.length} {sg.inboundRules.length === 1 ? "rule" : "rules"}
                    </td>
                    <td className="py-2.5 px-3 text-[#16191f] font-mono">
                      {sg.outboundRules.length} {sg.outboundRules.length === 1 ? "rule" : "rules"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Group Bottom Details Drawer with Full AWS Tabs */}
      {selectedSg && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm awsui-shadow">
          {/* Drawer Header */}
          <div className="px-5 py-3 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[14px] text-[#16191f]">{selectedSg.name}</span>
              <span className="font-mono text-[12px] text-[#545b64]">({selectedSg.id})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenEditInbound}
                className="px-3 py-1 bg-[#ec7211] text-white rounded text-[12px] font-medium hover:bg-[#eb5f07]"
              >
                Edit inbound rules
              </button>
              <button onClick={() => setSelectedId(null)} className="text-[#879596] hover:text-[#16191f] p-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Drawer Tabs (Details | Inbound rules | Outbound rules | Tags) */}
          <div className="flex items-center gap-1 border-b border-[#eaeded] px-5 text-[13px] bg-white">
            {(["details", "inbound", "outbound", "tags"] as const).map((tb) => (
              <button
                key={tb}
                onClick={() => setActiveBottomTab(tb)}
                className={`px-4 py-2.5 border-b-2 font-medium capitalize transition-colors ${
                  activeBottomTab === tb
                    ? "border-[#0073bb] text-[#0073bb]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                {tb === "inbound"
                  ? `Inbound rules (${selectedSg.inboundRules.length})`
                  : tb === "outbound"
                  ? `Outbound rules (${selectedSg.outboundRules.length})`
                  : tb}
              </button>
            ))}
          </div>

          {/* Drawer Tab Content */}
          <div className="p-5 text-[13px]">
            {/* Tab 1: Details */}
            {activeBottomTab === "details" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Security group name</div>
                  <div className="text-[#16191f] mt-1 font-semibold">{selectedSg.name}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Security group ID</div>
                  <div className="font-mono text-[#0073bb] mt-1">{selectedSg.id}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">VPC ID</div>
                  <div className="font-mono text-[#0073bb] mt-1">{selectedSg.vpcId}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Owner</div>
                  <div className="font-mono text-[#16191f] mt-1">{selectedSg.ownerId || "000000000000"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">ARN</div>
                  <div className="font-mono text-[#545b64] mt-1 text-[12px] truncate">
                    {selectedSg.arn || `arn:aws:ec2:us-east-1:000000000000:security-group/${selectedSg.id}`}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] text-[#545b64] uppercase font-bold">Description</div>
                  <div className="text-[#16191f] mt-1">{selectedSg.description}</div>
                </div>
              </div>
            )}

            {/* Tab 2: Inbound rules */}
            {activeBottomTab === "inbound" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-[#545b64]">
                    Inbound rules specify the protocols, ports, and source IP ranges that are allowed to reach your instances.
                  </p>
                  <button
                    onClick={handleOpenEditInbound}
                    className="px-3 py-1 bg-[#0073bb] text-white rounded text-[12px] font-medium hover:bg-[#005a9e]"
                  >
                    Edit inbound rules
                  </button>
                </div>

                <div className="border border-[#eaeded] rounded overflow-hidden">
                  <table className="w-full text-[12px] text-left">
                    <thead className="bg-[#f2f3f3] text-[#545b64] font-semibold">
                      <tr>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Protocol</th>
                        <th className="py-2 px-3">Port range</th>
                        <th className="py-2 px-3">Source</th>
                        <th className="py-2 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {selectedSg.inboundRules.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#545b64]">
                            No inbound rules configured. All inbound traffic is blocked.
                          </td>
                        </tr>
                      ) : (
                        selectedSg.inboundRules.map((r, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-medium text-[#16191f]">{r.type}</td>
                            <td className="py-2 px-3 text-[#545b64]">{r.protocol}</td>
                            <td className="py-2 px-3 font-mono font-bold text-[#0073bb]">{r.portRange}</td>
                            <td className="py-2 px-3 font-mono">{r.source}</td>
                            <td className="py-2 px-3 text-[#545b64]">{r.description || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Outbound rules */}
            {activeBottomTab === "outbound" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-[#545b64]">
                    Outbound rules specify the protocols, ports, and destination IP ranges that traffic from your instances is allowed to reach.
                  </p>
                  <button
                    onClick={handleOpenEditOutbound}
                    className="px-3 py-1 bg-[#0073bb] text-white rounded text-[12px] font-medium hover:bg-[#005a9e]"
                  >
                    Edit outbound rules
                  </button>
                </div>

                <div className="border border-[#eaeded] rounded overflow-hidden">
                  <table className="w-full text-[12px] text-left">
                    <thead className="bg-[#f2f3f3] text-[#545b64] font-semibold">
                      <tr>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Protocol</th>
                        <th className="py-2 px-3">Port range</th>
                        <th className="py-2 px-3">Destination</th>
                        <th className="py-2 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {selectedSg.outboundRules.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#545b64]">
                            No outbound rules configured. All outbound traffic is blocked.
                          </td>
                        </tr>
                      ) : (
                        selectedSg.outboundRules.map((r, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-medium text-[#16191f]">{r.type}</td>
                            <td className="py-2 px-3 text-[#545b64]">{r.protocol}</td>
                            <td className="py-2 px-3 font-mono font-bold text-[#0073bb]">{r.portRange}</td>
                            <td className="py-2 px-3 font-mono">{r.source}</td>
                            <td className="py-2 px-3 text-[#545b64]">{r.description || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Tags */}
            {activeBottomTab === "tags" && (
              <div className="space-y-3">
                <p className="text-[12px] text-[#545b64]">
                  A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
                </p>
                <div className="border border-[#eaeded] rounded overflow-hidden">
                  <table className="w-full text-[12px] text-left">
                    <thead className="bg-[#f2f3f3] text-[#545b64] font-semibold">
                      <tr>
                        <th className="py-2 px-3">Key</th>
                        <th className="py-2 px-3">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      <tr>
                        <td className="py-2 px-3 font-medium text-[#16191f]">Name</td>
                        <td className="py-2 px-3 text-[#545b64]">{selectedSg.name}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Inbound Rules Modal (With All 25 AWS Protocol Presets) */}
      {showEditInboundModal && selectedSg && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveInboundRules}
            className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-5xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3 shrink-0">
              <div>
                <h3 className="text-[17px] font-bold text-[#16191f]">
                  Edit inbound rules: {selectedSg.name} ({selectedSg.id})
                </h3>
                <p className="text-[12px] text-[#545b64]">
                  Configure inbound network rules allowing traffic into instances associated with this group.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditInboundModal(false)}
                className="text-[#879596] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 text-[13px] pr-1">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <tr>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2">Protocol</th>
                    <th className="py-2 px-2">Port range</th>
                    <th className="py-2 px-2">Source</th>
                    <th className="py-2 px-2">Description</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {editingInboundRules.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#545b64]">
                        No inbound rules. Click &quot;+ Add rule&quot; below to add one, or click &quot;Save rules&quot; to remove all inbound traffic rules.
                      </td>
                    </tr>
                  )}
                  {editingInboundRules.map((rule, idx) => {
                    const preset = AWS_SECURITY_GROUP_RULE_PRESETS.find((p) => p.name === rule.type);
                    const canEditPort = preset ? preset.canEditPort : true;

                    return (
                      <tr key={idx}>
                        <td className="py-2 px-1">
                          <select
                            value={rule.type}
                            onChange={(e) => handleInboundRuleChange(idx, "type", e.target.value)}
                            className="w-full px-2 py-1 border border-[#aab7b8] rounded text-[#16191f]"
                          >
                            {AWS_SECURITY_GROUP_RULE_PRESETS.map((p) => (
                              <option key={p.name} value={p.name}>
                                {p.name} {p.defaultPort !== "All" && p.defaultPort !== "0 - 65535" ? `(${p.defaultPort})` : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-1 font-mono text-[#545b64]">
                          {rule.protocol}
                        </td>
                        <td className="py-2 px-1">
                          <input
                            type="text"
                            value={rule.portRange}
                            disabled={!canEditPort}
                            onChange={(e) => handleInboundRuleChange(idx, "portRange", e.target.value)}
                            placeholder="e.g. 8080"
                            className="w-24 px-2 py-1 border border-[#aab7b8] rounded font-mono disabled:bg-[#f2f3f3]"
                          />
                        </td>
                        <td className="py-2 px-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={rule.source}
                              onChange={(e) => handleInboundRuleChange(idx, "source", e.target.value)}
                              placeholder="0.0.0.0/0"
                              className="w-32 px-2 py-1 border border-[#aab7b8] rounded font-mono"
                            />
                            <select
                              onChange={(e) => {
                                if (e.target.value) handleInboundRuleChange(idx, "source", e.target.value);
                              }}
                              className="text-[11px] px-1 py-1 border border-[#aab7b8] rounded"
                            >
                              <option value="">Presets...</option>
                              <option value="0.0.0.0/0">Anywhere-IPv4</option>
                              <option value="::/0">Anywhere-IPv6</option>
                              <option value="172.31.0.0/16">VPC Subnet</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-2 px-1">
                          <input
                            type="text"
                            value={rule.description}
                            onChange={(e) => handleInboundRuleChange(idx, "description", e.target.value)}
                            placeholder="Optional note"
                            className="w-full px-2 py-1 border border-[#aab7b8] rounded text-[#16191f]"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveInboundRule(idx)}
                            className="text-[#d13212] hover:text-[#a02008] p-1 font-bold"
                            title="Delete rule"
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <button
                type="button"
                onClick={handleAddInboundRule}
                className="px-3 py-1.5 border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] text-[12px] font-medium rounded"
              >
                + Add rule
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#eaeded] pt-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowEditInboundModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isPending ? "Saving to Emulator..." : "Save rules"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Outbound Rules Modal */}
      {showEditOutboundModal && selectedSg && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveOutboundRules}
            className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-5xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3 shrink-0">
              <div>
                <h3 className="text-[17px] font-bold text-[#16191f]">
                  Edit outbound rules: {selectedSg.name} ({selectedSg.id})
                </h3>
                <p className="text-[12px] text-[#545b64]">
                  Configure outbound network rules allowing traffic out of instances associated with this group.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditOutboundModal(false)}
                className="text-[#879596] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 text-[13px] pr-1">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <tr>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2">Protocol</th>
                    <th className="py-2 px-2">Port range</th>
                    <th className="py-2 px-2">Destination</th>
                    <th className="py-2 px-2">Description</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {editingOutboundRules.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#545b64]">
                        No outbound rules. Click &quot;+ Add rule&quot; below to add one, or click &quot;Save rules&quot; to remove all outbound traffic rules.
                      </td>
                    </tr>
                  )}
                  {editingOutboundRules.map((rule, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-1">
                        <select
                          value={rule.type}
                          onChange={(e) => handleOutboundRuleChange(idx, "type", e.target.value)}
                          className="w-full px-2 py-1 border border-[#aab7b8] rounded text-[#16191f]"
                        >
                          {AWS_SECURITY_GROUP_RULE_PRESETS.map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.name} {p.defaultPort !== "All" && p.defaultPort !== "0 - 65535" ? `(${p.defaultPort})` : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-1 font-mono text-[#545b64]">
                        {rule.protocol}
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="text"
                          value={rule.portRange}
                          disabled={rule.type === "All traffic"}
                          onChange={(e) => handleOutboundRuleChange(idx, "portRange", e.target.value)}
                          placeholder="e.g. 80"
                          className="w-24 px-2 py-1 border border-[#aab7b8] rounded font-mono disabled:bg-[#f2f3f3]"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="text"
                          value={rule.source}
                          onChange={(e) => handleOutboundRuleChange(idx, "source", e.target.value)}
                          placeholder="0.0.0.0/0"
                          className="w-32 px-2 py-1 border border-[#aab7b8] rounded font-mono"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="text"
                          value={rule.description}
                          onChange={(e) => handleOutboundRuleChange(idx, "description", e.target.value)}
                          placeholder="Optional note"
                          className="w-full px-2 py-1 border border-[#aab7b8] rounded text-[#16191f]"
                        />
                      </td>
                      <td className="py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveOutboundRule(idx)}
                          className="text-[#d13212] hover:text-[#a02008] p-1 font-bold"
                          title="Delete rule"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                type="button"
                onClick={handleAddOutboundRule}
                className="px-3 py-1.5 border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] text-[12px] font-medium rounded"
              >
                + Add rule
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#eaeded] pt-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowEditOutboundModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isPending ? "Saving to Emulator..." : "Save rules"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Security Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateGroup}
            className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[700px] w-full p-6 space-y-4 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3 shrink-0">
              <h3 className="text-[17px] font-bold text-[#16191f]">Create security group</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 text-[13px] pr-1">
              <div>
                <label className="block font-medium text-[#16191f] mb-1">Security group name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. database-sg"
                  value={newSgName}
                  onChange={(e) => setNewSgName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[#16191f] outline-hidden focus:border-[#0073bb]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#16191f] mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Inbound access rules for database cluster"
                  value={newSgDesc}
                  onChange={(e) => setNewSgDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[#16191f] outline-hidden focus:border-[#0073bb]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-[#16191f]">Inbound rules</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRules([
                        ...newRules,
                        { type: "Custom TCP", protocol: "TCP", portRange: "80", source: "0.0.0.0/0", description: "" },
                      ]);
                    }}
                    className="text-[#0073bb] hover:underline text-[12px] font-medium"
                  >
                    + Add rule
                  </button>
                </div>

                <div className="space-y-2">
                  {newRules.map((rule, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 p-2.5 bg-[#fafafa] border border-[#eaeded] rounded">
                      <select
                        value={rule.type}
                        onChange={(e) => {
                          const updated = [...newRules];
                          updated[idx].type = e.target.value;
                          const preset = AWS_SECURITY_GROUP_RULE_PRESETS.find((p) => p.name === e.target.value);
                          if (preset) {
                            updated[idx].protocol = preset.protocol;
                            updated[idx].portRange = preset.defaultPort;
                          }
                          setNewRules(updated);
                        }}
                        className="px-2 py-1 border border-[#aab7b8] rounded text-[#16191f] bg-white text-[12px]"
                      >
                        {AWS_SECURITY_GROUP_RULE_PRESETS.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Port"
                        value={rule.portRange}
                        onChange={(e) => {
                          const updated = [...newRules];
                          updated[idx].portRange = e.target.value;
                          setNewRules(updated);
                        }}
                        className="w-16 px-2 py-1 border border-[#aab7b8] rounded text-[#16191f] bg-white text-[12px] font-mono"
                      />

                      <input
                        type="text"
                        placeholder="Source CIDR"
                        value={rule.source}
                        onChange={(e) => {
                          const updated = [...newRules];
                          updated[idx].source = e.target.value;
                          setNewRules(updated);
                        }}
                        className="w-28 px-2 py-1 border border-[#aab7b8] rounded text-[#16191f] bg-white text-[12px] font-mono"
                      />

                      <input
                        type="text"
                        placeholder="Description"
                        value={rule.description}
                        onChange={(e) => {
                          const updated = [...newRules];
                          updated[idx].description = e.target.value;
                          setNewRules(updated);
                        }}
                        className="flex-1 min-w-[120px] px-2 py-1 border border-[#aab7b8] rounded text-[#16191f] bg-white text-[12px]"
                      />

                      {newRules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewRules(newRules.filter((_, i) => i !== idx))}
                          className="text-[#d13212] hover:bg-[#fdf3f1] p-1 rounded"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#eaeded] pt-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] disabled:opacity-50"
              >
                Create security group
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSg && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[450px] w-full p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#d13212]">Delete security group?</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete <strong className="text-[#16191f]">{selectedSg.name}</strong> ({selectedSg.id})? Instances associated with this group will no longer be protected by its rules.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="px-4 py-1.5 bg-[#d13212] text-white rounded-sm text-[13px] font-medium hover:bg-[#b0280e]"
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
