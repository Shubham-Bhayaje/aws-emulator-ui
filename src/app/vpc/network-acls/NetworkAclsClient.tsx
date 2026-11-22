"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  NetworkAclItem,
  VpcItem,
  listNetworkAclsAction,
  createNetworkAclAction,
  deleteNetworkAclAction,
  createNetworkAclEntryAction,
  deleteNetworkAclEntryAction,
} from "../actions";

interface Props {
  initialNetworkAcls: NetworkAclItem[];
  vpcs: VpcItem[];
}

export default function NetworkAclsClient({ initialNetworkAcls, vpcs }: Props) {
  const router = useRouter();

  const [networkAcls, setNetworkAcls] = useState<NetworkAclItem[]>(initialNetworkAcls);
  const [selectedAclId, setSelectedAclId] = useState<string | null>(
    initialNetworkAcls.length > 0 ? initialNetworkAcls[0].NetworkAclId : null
  );
  const [activeTab, setActiveTab] = useState<"inbound" | "outbound" | "details" | "tags">("inbound");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create NACL modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAclName, setNewAclName] = useState("");
  const [newVpcId, setNewVpcId] = useState(vpcs.length > 0 ? vpcs[0].VpcId : "");

  // Add rule modal
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [ruleDirection, setRuleDirection] = useState<"inbound" | "outbound">("inbound");
  const [ruleNumber, setRuleNumber] = useState<number>(100);
  const [ruleProtocol, setRuleProtocol] = useState<string>("-1");
  const [rulePortFrom, setRulePortFrom] = useState<number>(0);
  const [rulePortTo, setRulePortTo] = useState<number>(0);
  const [ruleCidr, setRuleCidr] = useState<string>("0.0.0.0/0");
  const [ruleAction, setRuleAction] = useState<"allow" | "deny">("allow");

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedAcl = networkAcls.find((a) => a.NetworkAclId === selectedAclId);

  const refreshAcls = async () => {
    setLoading(true);
    try {
      const res = await listNetworkAclsAction();
      if (res.success) {
        setNetworkAcls(res.networkAcls);
        if (selectedAclId && !res.networkAcls.some((a) => a.NetworkAclId === selectedAclId)) {
          setSelectedAclId(res.networkAcls.length > 0 ? res.networkAcls[0].NetworkAclId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAcl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVpcId) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await createNetworkAclAction({
        vpcId: newVpcId,
        name: newAclName.trim() || undefined,
      });
      if (res.success && res.networkAclId) {
        setIsCreateModalOpen(false);
        setNewAclName("");
        setMessage({ type: "success", text: `Successfully created network ACL ${res.networkAclId}` });
        await refreshAcls();
        setSelectedAclId(res.networkAclId);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create network ACL" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcl) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await createNetworkAclEntryAction({
        networkAclId: selectedAcl.NetworkAclId,
        ruleNumber: Number(ruleNumber),
        protocol: ruleProtocol,
        ruleAction,
        egress: ruleDirection === "outbound",
        cidrBlock: ruleCidr,
        portRange:
          ruleProtocol === "6" || ruleProtocol === "17"
            ? { from: Number(rulePortFrom), to: Number(rulePortTo) }
            : undefined,
      });

      if (res.success) {
        setIsAddRuleModalOpen(false);
        setMessage({
          type: "success",
          text: `Added rule #${ruleNumber} to network ACL ${selectedAcl.NetworkAclId}`,
        });
        await refreshAcls();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to add rule" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRule = async (ruleNum: number, egress: boolean) => {
    if (!selectedAcl) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await deleteNetworkAclEntryAction(selectedAcl.NetworkAclId, ruleNum, egress);
      if (res.success) {
        setMessage({ type: "success", text: `Deleted rule #${ruleNum}` });
        await refreshAcls();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete rule" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAcl = async () => {
    if (!selectedAcl) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteNetworkAclAction(selectedAcl.NetworkAclId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({ type: "success", text: `Deleted network ACL ${selectedAcl.NetworkAclId}` });
        setNetworkAcls(networkAcls.filter((a) => a.NetworkAclId !== selectedAcl.NetworkAclId));
        setSelectedAclId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete network ACL" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredAcls = networkAcls.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.NetworkAclId.toLowerCase().includes(q) ||
      (a.Name && a.Name.toLowerCase().includes(q)) ||
      (a.VpcId && a.VpcId.toLowerCase().includes(q))
    );
  });

  const inboundEntries = (selectedAcl?.Entries || []).filter((e) => !e.Egress);
  const outboundEntries = (selectedAcl?.Entries || []).filter((e) => e.Egress);

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Network ACLs ({networkAcls.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            A network access control list (ACL) is an optional layer of security for your VPC that acts as a firewall for controlling traffic in and out of one or more subnets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAcls}
            disabled={loading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => {
              if (selectedAcl) {
                router.push(`/vpc/network-acls/${selectedAcl.NetworkAclId}`);
              }
            }}
            disabled={!selectedAcl}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View details
          </button>

          {/* Add rule button */}
          <button
            onClick={() => {
              setRuleDirection(activeTab === "outbound" ? "outbound" : "inbound");
              setIsAddRuleModalOpen(true);
            }}
            disabled={!selectedAcl}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Add rule
          </button>

          {/* Delete button */}
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedAcl || selectedAcl.IsDefault}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            title={selectedAcl?.IsDefault ? "Cannot delete default network ACL" : undefined}
          >
            Delete
          </button>

          {/* Create primary button */}
          <button
            onClick={() => {
              setNewAclName("");
              setIsCreateModalOpen(true);
            }}
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create network ACL
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {message && (
        <div
          className={`p-3 text-xs rounded border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="p-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Filter network ACLs by name or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
            />
          </div>
          <span className="text-xs text-gray-500">
            Showing {filteredAcls.length} of {networkAcls.length} network ACLs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 font-semibold">Name</th>
                <th className="py-2.5 px-3 font-semibold">Network ACL ID</th>
                <th className="py-2.5 px-3 font-semibold">Default</th>
                <th className="py-2.5 px-3 font-semibold">VPC ID</th>
                <th className="py-2.5 px-3 font-semibold">Inbound rules</th>
                <th className="py-2.5 px-3 font-semibold">Outbound rules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {filteredAcls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No network ACLs found.
                  </td>
                </tr>
              ) : (
                filteredAcls.map((acl) => {
                  const isSelected = acl.NetworkAclId === selectedAclId;
                  const inCount = acl.Entries.filter((e) => !e.Egress).length;
                  const outCount = acl.Entries.filter((e) => e.Egress).length;
                  return (
                    <tr
                      key={acl.NetworkAclId}
                      onClick={() => setSelectedAclId(acl.NetworkAclId)}
                      onDoubleClick={() => router.push(`/vpc/network-acls/${acl.NetworkAclId}`)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-[#F2F8FD]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="radio"
                          name="selected_acl"
                          checked={isSelected}
                          onChange={() => setSelectedAclId(acl.NetworkAclId)}
                          className="h-3.5 w-3.5 text-[#EC7211] focus:ring-[#EC7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        <Link
                          href={`/vpc/network-acls/${acl.NetworkAclId}`}
                          className="hover:underline"
                        >
                          {acl.Name || "-"}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073BB]">
                        <Link
                          href={`/vpc/network-acls/${acl.NetworkAclId}`}
                          className="hover:underline"
                        >
                          {acl.NetworkAclId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        {acl.IsDefault ? "Yes" : "No"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {acl.VpcId}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-700">
                        {inCount}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-700">
                        {outCount}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Tabs for Selected NACL */}
      {selectedAcl && (
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="border-b border-gray-200 px-4 flex items-center justify-between">
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab("inbound")}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "inbound"
                    ? "border-[#EC7211] text-[#EC7211]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Inbound rules ({inboundEntries.length})
              </button>
              <button
                onClick={() => setActiveTab("outbound")}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "outbound"
                    ? "border-[#EC7211] text-[#EC7211]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Outbound rules ({outboundEntries.length})
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-[#EC7211] text-[#EC7211]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("tags")}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "tags"
                    ? "border-[#EC7211] text-[#EC7211]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Tags ({Object.keys(selectedAcl.Tags || {}).length})
              </button>
            </div>
            <Link
              href={`/vpc/network-acls/${selectedAcl.NetworkAclId}`}
              className="text-[12px] font-medium text-[#0073bb] hover:underline flex items-center gap-1"
            >
              <span>Open network ACL page</span>
              <span>↗</span>
            </Link>
          </div>

          <div className="p-4">
            {/* Inbound rules tab */}
            {activeTab === "inbound" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Rules are evaluated in order, starting with the lowest numbered rule.
                  </p>
                  <button
                    onClick={() => {
                      setRuleDirection("inbound");
                      setIsAddRuleModalOpen(true);
                    }}
                    className="px-3 text-xs font-medium text-[#EC7211] border border-[#EC7211] rounded hover:bg-orange-50 transition-colors"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Add inbound rule
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Rule #</th>
                        <th className="py-2 px-3 font-semibold">Type / Protocol</th>
                        <th className="py-2 px-3 font-semibold">Port range</th>
                        <th className="py-2 px-3 font-semibold">Source</th>
                        <th className="py-2 px-3 font-semibold">Allow / Deny</th>
                        <th className="py-2 px-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {inboundEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-gray-500">
                            No inbound rules found.
                          </td>
                        </tr>
                      ) : (
                        inboundEntries.map((entry) => {
                          const isDefaultAsterisk = entry.RuleNumber === 32767;
                          const ruleDisplay = isDefaultAsterisk ? "*" : entry.RuleNumber;
                          const proto =
                            entry.Protocol === "-1"
                              ? "ALL Traffic"
                              : entry.Protocol === "6"
                              ? "TCP"
                              : entry.Protocol === "17"
                              ? "UDP"
                              : entry.Protocol;
                          const portRange =
                            entry.PortRange && entry.PortRange.From !== undefined
                              ? entry.PortRange.From === entry.PortRange.To
                                ? entry.PortRange.From
                                : `${entry.PortRange.From}-${entry.PortRange.To}`
                              : "ALL";

                          return (
                            <tr key={entry.RuleNumber} className="hover:bg-gray-50">
                              <td className="py-2 px-3 font-mono font-medium">{ruleDisplay}</td>
                              <td className="py-2 px-3">{proto}</td>
                              <td className="py-2 px-3 font-mono">{portRange}</td>
                              <td className="py-2 px-3 font-mono text-gray-700">{entry.CidrBlock || "0.0.0.0/0"}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                                    entry.RuleAction === "allow"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {entry.RuleAction.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                {!isDefaultAsterisk && (
                                  <button
                                    onClick={() => handleDeleteRule(entry.RuleNumber, false)}
                                    disabled={actionLoading}
                                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Outbound rules tab */}
            {activeTab === "outbound" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Rules are evaluated in order, starting with the lowest numbered rule.
                  </p>
                  <button
                    onClick={() => {
                      setRuleDirection("outbound");
                      setIsAddRuleModalOpen(true);
                    }}
                    className="px-3 text-xs font-medium text-[#EC7211] border border-[#EC7211] rounded hover:bg-orange-50 transition-colors"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Add outbound rule
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Rule #</th>
                        <th className="py-2 px-3 font-semibold">Type / Protocol</th>
                        <th className="py-2 px-3 font-semibold">Port range</th>
                        <th className="py-2 px-3 font-semibold">Destination</th>
                        <th className="py-2 px-3 font-semibold">Allow / Deny</th>
                        <th className="py-2 px-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {outboundEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-gray-500">
                            No outbound rules found.
                          </td>
                        </tr>
                      ) : (
                        outboundEntries.map((entry) => {
                          const isDefaultAsterisk = entry.RuleNumber === 32767;
                          const ruleDisplay = isDefaultAsterisk ? "*" : entry.RuleNumber;
                          const proto =
                            entry.Protocol === "-1"
                              ? "ALL Traffic"
                              : entry.Protocol === "6"
                              ? "TCP"
                              : entry.Protocol === "17"
                              ? "UDP"
                              : entry.Protocol;
                          const portRange =
                            entry.PortRange && entry.PortRange.From !== undefined
                              ? entry.PortRange.From === entry.PortRange.To
                                ? entry.PortRange.From
                                : `${entry.PortRange.From}-${entry.PortRange.To}`
                              : "ALL";

                          return (
                            <tr key={entry.RuleNumber} className="hover:bg-gray-50">
                              <td className="py-2 px-3 font-mono font-medium">{ruleDisplay}</td>
                              <td className="py-2 px-3">{proto}</td>
                              <td className="py-2 px-3 font-mono">{portRange}</td>
                              <td className="py-2 px-3 font-mono text-gray-700">{entry.CidrBlock || "0.0.0.0/0"}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                                    entry.RuleAction === "allow"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {entry.RuleAction.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                {!isDefaultAsterisk && (
                                  <button
                                    onClick={() => handleDeleteRule(entry.RuleNumber, true)}
                                    disabled={actionLoading}
                                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Details tab */}
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <dt className="text-gray-500 font-medium">Network ACL ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono font-semibold">{selectedAcl.NetworkAclId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">VPC ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedAcl.VpcId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Default ACL</dt>
                  <dd className="text-gray-900 mt-1">{selectedAcl.IsDefault ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Name</dt>
                  <dd className="text-gray-900 mt-1">{selectedAcl.Name || "-"}</dd>
                </div>
              </div>
            )}

            {/* Tags tab */}
            {activeTab === "tags" && (
              <div>
                {!selectedAcl.Tags || Object.keys(selectedAcl.Tags).length === 0 ? (
                  <p className="text-xs text-gray-500">No tags assigned to this network ACL.</p>
                ) : (
                  <table className="w-full text-left text-xs border border-gray-200">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(selectedAcl.Tags).map(([key, val]) => (
                        <tr key={key}>
                          <td className="py-2 px-3 font-medium text-gray-700">{key}</td>
                          <td className="py-2 px-3 text-gray-900">{val}</td>
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

      {/* Create NACL Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Create network ACL</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateAcl} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Name tag (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. my-network-acl"
                  value={newAclName}
                  onChange={(e) => setNewAclName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  VPC <span className="text-red-500">*</span>
                </label>
                <select
                  value={newVpcId}
                  onChange={(e) => setNewVpcId(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                  required
                >
                  <option value="">Select a VPC</option>
                  {vpcs.map((vpc) => (
                    <option key={vpc.VpcId} value={vpc.VpcId}>
                      {vpc.VpcId} {vpc.Name ? `(${vpc.Name})` : ""} - {vpc.CidrBlock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !newVpcId}
                  className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Creating..." : "Create network ACL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {isAddRuleModalOpen && selectedAcl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">
                Add {ruleDirection === "inbound" ? "inbound" : "outbound"} rule
              </h2>
              <button
                onClick={() => setIsAddRuleModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddRule} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Rule number (1 - 32766) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={32766}
                  value={ruleNumber}
                  onChange={(e) => setRuleNumber(Number(e.target.value))}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Protocol
                </label>
                <select
                  value={ruleProtocol}
                  onChange={(e) => setRuleProtocol(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                >
                  <option value="-1">All traffic (-1)</option>
                  <option value="6">TCP (6)</option>
                  <option value="17">UDP (17)</option>
                  <option value="1">ICMP (1)</option>
                </select>
              </div>

              {(ruleProtocol === "6" || ruleProtocol === "17") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      From port
                    </label>
                    <input
                      type="number"
                      value={rulePortFrom}
                      onChange={(e) => setRulePortFrom(Number(e.target.value))}
                      className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      To port
                    </label>
                    <input
                      type="number"
                      value={rulePortTo}
                      onChange={(e) => setRulePortTo(Number(e.target.value))}
                      className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  CIDR block
                </label>
                <input
                  type="text"
                  placeholder="0.0.0.0/0"
                  value={ruleCidr}
                  onChange={(e) => setRuleCidr(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Rule action
                </label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="rule_action"
                      checked={ruleAction === "allow"}
                      onChange={() => setRuleAction("allow")}
                      className="text-[#EC7211] focus:ring-[#EC7211]"
                    />
                    <span className="font-semibold text-green-700">ALLOW</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="rule_action"
                      checked={ruleAction === "deny"}
                      onChange={() => setRuleAction("deny")}
                      className="text-[#EC7211] focus:ring-[#EC7211]"
                    />
                    <span className="font-semibold text-red-700">DENY</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddRuleModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Saving..." : "Save rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedAcl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Delete network ACL</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700">
                Are you sure you want to delete network ACL{" "}
                <span className="font-mono font-bold text-gray-900">{selectedAcl.NetworkAclId}</span>?
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  To confirm deletion, type <span className="font-mono text-red-600">delete</span> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="delete"
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAcl}
                  disabled={deleteLoading || deleteConfirmText !== "delete"}
                  className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {deleteLoading ? "Deleting..." : "Delete network ACL"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
