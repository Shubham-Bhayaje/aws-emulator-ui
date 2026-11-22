"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DhcpOptionsItem,
  VpcItem,
  listDhcpOptionsAction,
  createDhcpOptionsAction,
  associateDhcpOptionsAction,
  deleteDhcpOptionsAction,
} from "../actions";

interface Props {
  initialDhcpOptions: DhcpOptionsItem[];
  vpcs: VpcItem[];
}

export default function DhcpOptionsClient({ initialDhcpOptions, vpcs }: Props) {
  const router = useRouter();

  const [dhcpOptions, setDhcpOptions] = useState<DhcpOptionsItem[]>(initialDhcpOptions);
  const [selectedDhcpId, setSelectedDhcpId] = useState<string | null>(
    initialDhcpOptions.length > 0 ? initialDhcpOptions[0].DhcpOptionsId : null
  );
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create DHCP options modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dhcpName, setDhcpName] = useState("");
  const [domainName, setDomainName] = useState("");
  const [domainNameServers, setDomainNameServers] = useState("AmazonProvidedDNS");
  const [ntpServers, setNtpServers] = useState("");

  // Associate with VPC modal
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
  const [selectedVpcToAssociate, setSelectedVpcToAssociate] = useState(vpcs.length > 0 ? vpcs[0].VpcId : "");

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedDhcp = dhcpOptions.find((d) => d.DhcpOptionsId === selectedDhcpId);

  const refreshDhcpOptions = async () => {
    setLoading(true);
    try {
      const res = await listDhcpOptionsAction();
      if (res.success) {
        setDhcpOptions(res.dhcpOptions);
        if (selectedDhcpId && !res.dhcpOptions.some((d) => d.DhcpOptionsId === selectedDhcpId)) {
          setSelectedDhcpId(res.dhcpOptions.length > 0 ? res.dhcpOptions[0].DhcpOptionsId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDhcp = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    try {
      const dnsServers = domainNameServers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const ntp = ntpServers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await createDhcpOptionsAction({
        name: dhcpName.trim() || undefined,
        domainName: domainName.trim() || undefined,
        domainNameServers: dnsServers.length > 0 ? dnsServers : undefined,
        ntpServers: ntp.length > 0 ? ntp : undefined,
      });

      if (res.success && res.dhcpOptionsId) {
        setIsCreateModalOpen(false);
        setDhcpName("");
        setDomainName("");
        setDomainNameServers("AmazonProvidedDNS");
        setNtpServers("");
        setMessage({
          type: "success",
          text: `Successfully created DHCP option set ${res.dhcpOptionsId}`,
        });
        await refreshDhcpOptions();
        setSelectedDhcpId(res.dhcpOptionsId);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create DHCP option set" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssociateWithVpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDhcp || !selectedVpcToAssociate) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await associateDhcpOptionsAction(selectedDhcp.DhcpOptionsId, selectedVpcToAssociate);
      if (res.success) {
        setIsAssociateModalOpen(false);
        setMessage({
          type: "success",
          text: `Associated DHCP option set ${selectedDhcp.DhcpOptionsId} with VPC ${selectedVpcToAssociate}`,
        });
        await refreshDhcpOptions();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to associate DHCP option set" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDhcp = async () => {
    if (!selectedDhcp) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteDhcpOptionsAction(selectedDhcp.DhcpOptionsId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({
          type: "success",
          text: `Deleted DHCP option set ${selectedDhcp.DhcpOptionsId}`,
        });
        setDhcpOptions(dhcpOptions.filter((d) => d.DhcpOptionsId !== selectedDhcp.DhcpOptionsId));
        setSelectedDhcpId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete DHCP option set" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredDhcp = dhcpOptions.filter((d) => {
    const q = searchQuery.toLowerCase();
    const name = d.Tags?.Name || "";
    return (
      d.DhcpOptionsId.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      (d.DomainName && d.DomainName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">DHCP option sets ({dhcpOptions.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            A DHCP option set defines network configuration parameters for instances launched into your VPC, such as domain name servers and NTP servers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshDhcpOptions}
            disabled={loading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          {/* Associate with VPC button */}
          <button
            onClick={() => setIsAssociateModalOpen(true)}
            disabled={!selectedDhcp}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Associate with VPC
          </button>

          {/* Delete button */}
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedDhcp}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>

          {/* Create primary button */}
          <button
            onClick={() => {
              setDhcpName("");
              setDomainName("");
              setDomainNameServers("AmazonProvidedDNS");
              setNtpServers("");
              setIsCreateModalOpen(true);
            }}
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create DHCP option set
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
              placeholder="Filter DHCP option sets"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
            />
          </div>
          <span className="text-xs text-gray-500">
            Showing {filteredDhcp.length} of {dhcpOptions.length} DHCP option sets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 font-semibold">Name</th>
                <th className="py-2.5 px-3 font-semibold">DHCP option set ID</th>
                <th className="py-2.5 px-3 font-semibold">Domain name</th>
                <th className="py-2.5 px-3 font-semibold">Domain name servers</th>
                <th className="py-2.5 px-3 font-semibold">NTP servers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {filteredDhcp.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No DHCP option sets found.
                  </td>
                </tr>
              ) : (
                filteredDhcp.map((dhcp) => {
                  const isSelected = dhcp.DhcpOptionsId === selectedDhcpId;
                  return (
                    <tr
                      key={dhcp.DhcpOptionsId}
                      onClick={() => setSelectedDhcpId(dhcp.DhcpOptionsId)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-[#F2F8FD]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="radio"
                          name="selected_dhcp"
                          checked={isSelected}
                          onChange={() => setSelectedDhcpId(dhcp.DhcpOptionsId)}
                          className="h-3.5 w-3.5 text-[#EC7211] focus:ring-[#EC7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        {dhcp.Tags?.Name || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073BB]">
                        {dhcp.DhcpOptionsId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">
                        {dhcp.DomainName || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {dhcp.DomainNameServers ? dhcp.DomainNameServers.join(", ") : "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {dhcp.NtpServers ? dhcp.NtpServers.join(", ") : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Tabs for Selected DHCP Option Set */}
      {selectedDhcp && (
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="border-b border-gray-200 px-4">
            <div className="flex space-x-6">
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
                Tags ({Object.keys(selectedDhcp.Tags || {}).length})
              </button>
            </div>
          </div>

          <div className="p-4">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <dt className="text-gray-500 font-medium">DHCP option set ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono font-semibold">{selectedDhcp.DhcpOptionsId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Domain name</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedDhcp.DomainName || "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Domain name servers</dt>
                  <dd className="text-gray-900 mt-1 font-mono">
                    {selectedDhcp.DomainNameServers ? selectedDhcp.DomainNameServers.join(", ") : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">NTP servers</dt>
                  <dd className="text-gray-900 mt-1 font-mono">
                    {selectedDhcp.NtpServers ? selectedDhcp.NtpServers.join(", ") : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Name</dt>
                  <dd className="text-gray-900 mt-1">{selectedDhcp.Tags?.Name || "-"}</dd>
                </div>
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                {!selectedDhcp.Tags || Object.keys(selectedDhcp.Tags).length === 0 ? (
                  <p className="text-xs text-gray-500">No tags assigned to this DHCP option set.</p>
                ) : (
                  <table className="w-full text-left text-xs border border-gray-200">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(selectedDhcp.Tags).map(([key, val]) => (
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

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Create DHCP option set</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateDhcp} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Name tag (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. custom-dhcp-options"
                  value={dhcpName}
                  onChange={(e) => setDhcpName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Domain name (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. us-east-1.compute.internal"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Domain name servers
                </label>
                <input
                  type="text"
                  placeholder="AmazonProvidedDNS or 10.0.0.2, 10.0.0.3"
                  value={domainNameServers}
                  onChange={(e) => setDomainNameServers(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211] font-mono"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Separate multiple IP addresses with commas. Use &apos;AmazonProvidedDNS&apos; for default AWS DNS.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  NTP servers (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 169.254.169.123"
                  value={ntpServers}
                  onChange={(e) => setNtpServers(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211] font-mono"
                />
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
                  disabled={actionLoading}
                  className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Creating..." : "Create DHCP option set"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Associate with VPC Modal */}
      {isAssociateModalOpen && selectedDhcp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Associate with VPC</h2>
              <button
                onClick={() => setIsAssociateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAssociateWithVpc} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-600 mb-3">
                  Associate DHCP option set <span className="font-mono font-semibold">{selectedDhcp.DhcpOptionsId}</span> with a VPC.
                </p>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select VPC <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedVpcToAssociate}
                  onChange={(e) => setSelectedVpcToAssociate(e.target.value)}
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
                  onClick={() => setIsAssociateModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !selectedVpcToAssociate}
                  className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Associating..." : "Associate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedDhcp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Delete DHCP option set</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700">
                Are you sure you want to delete DHCP option set{" "}
                <span className="font-mono font-bold text-gray-900">{selectedDhcp.DhcpOptionsId}</span>?
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
                  onClick={handleDeleteDhcp}
                  disabled={deleteLoading || deleteConfirmText !== "delete"}
                  className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {deleteLoading ? "Deleting..." : "Delete DHCP option set"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
