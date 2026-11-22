"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SecurityGroupItem,
  SecurityGroupRuleItem,
  VpcItem,
  listSecurityGroupsAction,
  createSecurityGroupAction,
  deleteSecurityGroupAction,
  authorizeSecurityGroupIngressAction,
  revokeSecurityGroupIngressAction,
} from "../actions";

interface Props {
  initialSecurityGroups: SecurityGroupItem[];
  vpcs: VpcItem[];
}

export default function SecurityGroupsClient({ initialSecurityGroups, vpcs }: Props) {
  const router = useRouter();

  const [securityGroups, setSecurityGroups] = useState<SecurityGroupItem[]>(initialSecurityGroups);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    initialSecurityGroups.length > 0 ? initialSecurityGroups[0].GroupId : null
  );
  const [activeTab, setActiveTab] = useState<"details" | "inbound" | "outbound" | "tags">("inbound");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create SG modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newVpcId, setNewVpcId] = useState(vpcs.length > 0 ? vpcs[0].VpcId : "");

  // Add Inbound Rule modal
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [ruleType, setRuleType] = useState<"all" | "ssh" | "http" | "https" | "custom">("http");
  const [ruleProtocol, setRuleProtocol] = useState("tcp");
  const [ruleFromPort, setRuleFromPort] = useState(80);
  const [ruleToPort, setRuleToPort] = useState(80);
  const [ruleCidr, setRuleCidr] = useState("0.0.0.0/0");
  const [ruleDesc, setRuleDesc] = useState("");

  // Delete SG modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedSg = securityGroups.find((g) => g.GroupId === selectedGroupId);

  const refreshSecurityGroups = async () => {
    setLoading(true);
    try {
      const res = await listSecurityGroupsAction();
      if (res.success) {
        setSecurityGroups(res.securityGroups);
        if (selectedGroupId && !res.securityGroups.some((g) => g.GroupId === selectedGroupId)) {
          setSelectedGroupId(res.securityGroups.length > 0 ? res.securityGroups[0].GroupId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRuleTypeChange = (type: "all" | "ssh" | "http" | "https" | "custom") => {
    setRuleType(type);
    if (type === "all") {
      setRuleProtocol("-1");
      setRuleFromPort(0);
      setRuleToPort(0);
    } else if (type === "ssh") {
      setRuleProtocol("tcp");
      setRuleFromPort(22);
      setRuleToPort(22);
    } else if (type === "http") {
      setRuleProtocol("tcp");
      setRuleFromPort(80);
      setRuleToPort(80);
    } else if (type === "https") {
      setRuleProtocol("tcp");
      setRuleFromPort(443);
      setRuleToPort(443);
    } else {
      setRuleProtocol("tcp");
      setRuleFromPort(8080);
      setRuleToPort(8080);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newDescription.trim() || !newVpcId) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await createSecurityGroupAction({
        groupName: newGroupName.trim(),
        description: newDescription.trim(),
        vpcId: newVpcId,
      });
      if (res.success && res.groupId) {
        setIsCreateModalOpen(false);
        setNewGroupName("");
        setNewDescription("");
        setMessage({ type: "success", text: `Successfully created security group ${res.groupId}` });
        await refreshSecurityGroups();
        setSelectedGroupId(res.groupId);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create security group" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddInboundRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSg) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const rule: SecurityGroupRuleItem = {
        IpProtocol: ruleProtocol,
        FromPort: ruleProtocol === "-1" ? undefined : Number(ruleFromPort),
        ToPort: ruleProtocol === "-1" ? undefined : Number(ruleToPort),
        CidrIpv4: ruleCidr,
        Description: ruleDesc.trim() || undefined,
      };

      const res = await authorizeSecurityGroupIngressAction(selectedSg.GroupId, rule);
      if (res.success) {
        setIsAddRuleModalOpen(false);
        setMessage({ type: "success", text: `Added inbound rule to security group ${selectedSg.GroupId}` });
        await refreshSecurityGroups();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to add inbound rule" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeInboundRule = async (rule: any) => {
    if (!selectedSg) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const ruleItem: SecurityGroupRuleItem = {
        IpProtocol: rule.IpProtocol,
        FromPort: rule.FromPort,
        ToPort: rule.ToPort,
        CidrIpv4: rule.IpRanges?.[0]?.CidrIp || "0.0.0.0/0",
      };
      const res = await revokeSecurityGroupIngressAction(selectedSg.GroupId, ruleItem);
      if (res.success) {
        setMessage({ type: "success", text: "Inbound rule removed successfully" });
        await refreshSecurityGroups();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to remove inbound rule" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedSg) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteSecurityGroupAction(selectedSg.GroupId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({ type: "success", text: `Deleted security group ${selectedSg.GroupId}` });
        setSecurityGroups(securityGroups.filter((g) => g.GroupId !== selectedSg.GroupId));
        setSelectedGroupId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete security group" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredGroups = securityGroups.filter((g) => {
    const q = searchQuery.toLowerCase();
    return (
      g.GroupId.toLowerCase().includes(q) ||
      g.GroupName.toLowerCase().includes(q) ||
      g.Description.toLowerCase().includes(q) ||
      (g.VpcId && g.VpcId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Security groups ({securityGroups.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            A security group acts as a virtual firewall for your EC2 instances to control incoming and outgoing traffic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshSecurityGroups}
            disabled={loading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          {/* Add inbound rule button */}
          <button
            onClick={() => setIsAddRuleModalOpen(true)}
            disabled={!selectedSg}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Add inbound rule
          </button>

          {/* Delete button */}
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedSg || selectedSg.GroupName === "default"}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            title={selectedSg?.GroupName === "default" ? "Cannot delete default security group" : undefined}
          >
            Delete
          </button>

          {/* Create primary button */}
          <button
            onClick={() => {
              setNewGroupName("");
              setNewDescription("");
              setIsCreateModalOpen(true);
            }}
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create security group
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
              placeholder="Filter security groups by name or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
            />
          </div>
          <span className="text-xs text-gray-500">
            Showing {filteredGroups.length} of {securityGroups.length} security groups
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 font-semibold">Name</th>
                <th className="py-2.5 px-3 font-semibold">Security group ID</th>
                <th className="py-2.5 px-3 font-semibold">Description</th>
                <th className="py-2.5 px-3 font-semibold">VPC ID</th>
                <th className="py-2.5 px-3 font-semibold">Inbound rules</th>
                <th className="py-2.5 px-3 font-semibold">Outbound rules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No security groups found.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((sg) => {
                  const isSelected = sg.GroupId === selectedGroupId;
                  return (
                    <tr
                      key={sg.GroupId}
                      onClick={() => setSelectedGroupId(sg.GroupId)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-[#F2F8FD]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="radio"
                          name="selected_sg"
                          checked={isSelected}
                          onChange={() => setSelectedGroupId(sg.GroupId)}
                          className="h-3.5 w-3.5 text-[#EC7211] focus:ring-[#EC7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        {sg.GroupName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073BB]">
                        {sg.GroupId}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">
                        {sg.Description}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {sg.VpcId || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-700">
                        {sg.InboundRulesCount}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-700">
                        {sg.OutboundRulesCount}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Tabs for Selected SG */}
      {selectedSg && (
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="border-b border-gray-200 px-4">
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab("inbound")}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "inbound"
                    ? "border-[#EC7211] text-[#EC7211]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Inbound rules ({selectedSg.InboundRulesCount})
              </button>
              <button
                onClick={() => setActiveTab("outbound")}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "outbound"
                    ? "border-[#EC7211] text-[#EC7211]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Outbound rules ({selectedSg.OutboundRulesCount})
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
                Tags ({Object.keys(selectedSg.Tags || {}).length})
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Inbound rules tab */}
            {activeTab === "inbound" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Inbound rules specify the incoming traffic that is allowed to reach the instance.
                  </p>
                  <button
                    onClick={() => setIsAddRuleModalOpen(true)}
                    className="px-3 text-xs font-medium text-[#EC7211] border border-[#EC7211] rounded hover:bg-orange-50 transition-colors"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Add rule
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">IP version</th>
                        <th className="py-2 px-3 font-semibold">Type / Protocol</th>
                        <th className="py-2 px-3 font-semibold">Port range</th>
                        <th className="py-2 px-3 font-semibold">Source</th>
                        <th className="py-2 px-3 font-semibold">Description</th>
                        <th className="py-2 px-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {!selectedSg.IpPermissions || selectedSg.IpPermissions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-gray-500">
                            No inbound rules defined. Traffic is not allowed.
                          </td>
                        </tr>
                      ) : (
                        selectedSg.IpPermissions.map((perm, idx) => {
                          const protocol = perm.IpProtocol === "-1" ? "All traffic" : perm.IpProtocol;
                          const portRange =
                            perm.IpProtocol === "-1"
                              ? "All"
                              : perm.FromPort === perm.ToPort
                              ? perm.FromPort
                              : `${perm.FromPort}-${perm.ToPort}`;
                          const source = perm.IpRanges?.[0]?.CidrIp || "0.0.0.0/0";
                          const desc = perm.IpRanges?.[0]?.Description || "-";

                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-2 px-3">IPv4</td>
                              <td className="py-2 px-3 font-medium uppercase">{protocol}</td>
                              <td className="py-2 px-3 font-mono">{portRange}</td>
                              <td className="py-2 px-3 font-mono text-gray-700">{source}</td>
                              <td className="py-2 px-3 text-gray-600">{desc}</td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() => handleRevokeInboundRule(perm)}
                                  disabled={actionLoading}
                                  className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                                >
                                  Delete
                                </button>
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
                <p className="text-xs text-gray-500">
                  Outbound rules specify the outgoing traffic that is allowed to leave the instance.
                </p>
                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">IP version</th>
                        <th className="py-2 px-3 font-semibold">Type / Protocol</th>
                        <th className="py-2 px-3 font-semibold">Port range</th>
                        <th className="py-2 px-3 font-semibold">Destination</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {!selectedSg.IpPermissionsEgress || selectedSg.IpPermissionsEgress.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-gray-500">
                            No outbound rules defined.
                          </td>
                        </tr>
                      ) : (
                        selectedSg.IpPermissionsEgress.map((perm, idx) => {
                          const protocol = perm.IpProtocol === "-1" ? "All traffic" : perm.IpProtocol;
                          const portRange =
                            perm.IpProtocol === "-1"
                              ? "All"
                              : perm.FromPort === perm.ToPort
                              ? perm.FromPort
                              : `${perm.FromPort}-${perm.ToPort}`;
                          const dest = perm.IpRanges?.[0]?.CidrIp || "0.0.0.0/0";

                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-2 px-3">IPv4</td>
                              <td className="py-2 px-3 font-medium uppercase">{protocol}</td>
                              <td className="py-2 px-3 font-mono">{portRange}</td>
                              <td className="py-2 px-3 font-mono text-gray-700">{dest}</td>
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
                  <dt className="text-gray-500 font-medium">Security group ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono font-semibold">{selectedSg.GroupId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Security group name</dt>
                  <dd className="text-gray-900 mt-1 font-medium">{selectedSg.GroupName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">VPC ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedSg.VpcId || "-"}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-gray-500 font-medium">Description</dt>
                  <dd className="text-gray-900 mt-1">{selectedSg.Description}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Owner ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedSg.OwnerId || "-"}</dd>
                </div>
              </div>
            )}

            {/* Tags tab */}
            {activeTab === "tags" && (
              <div>
                {!selectedSg.Tags || Object.keys(selectedSg.Tags).length === 0 ? (
                  <p className="text-xs text-gray-500">No tags assigned to this security group.</p>
                ) : (
                  <table className="w-full text-left text-xs border border-gray-200">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(selectedSg.Tags).map(([key, val]) => (
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

      {/* Create SG Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Create security group</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Security group name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. web-sg"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Security group for web tier"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                  required
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
                  disabled={actionLoading || !newGroupName.trim() || !newDescription.trim() || !newVpcId}
                  className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Creating..." : "Create security group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Inbound Rule Modal */}
      {isAddRuleModalOpen && selectedSg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Add inbound rule</h2>
              <button
                onClick={() => setIsAddRuleModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddInboundRule} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={ruleType}
                  onChange={(e) => handleRuleTypeChange(e.target.value as any)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                >
                  <option value="http">HTTP (Port 80)</option>
                  <option value="https">HTTPS (Port 443)</option>
                  <option value="ssh">SSH (Port 22)</option>
                  <option value="all">All traffic</option>
                  <option value="custom">Custom TCP</option>
                </select>
              </div>

              {ruleType === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      From port
                    </label>
                    <input
                      type="number"
                      value={ruleFromPort}
                      onChange={(e) => setRuleFromPort(Number(e.target.value))}
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
                      value={ruleToPort}
                      onChange={(e) => setRuleToPort(Number(e.target.value))}
                      className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Source CIDR
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
                  Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Allow web traffic"
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                />
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
      {isDeleteModalOpen && selectedSg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Delete security group</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700">
                Are you sure you want to delete security group{" "}
                <span className="font-mono font-bold text-gray-900">{selectedSg.GroupId}</span> ({selectedSg.GroupName})?
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
                  onClick={handleDeleteGroup}
                  disabled={deleteLoading || deleteConfirmText !== "delete"}
                  className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {deleteLoading ? "Deleting..." : "Delete security group"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
