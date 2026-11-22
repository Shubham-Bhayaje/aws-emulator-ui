"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VpcItem, listVpcsAction, deleteVpcAction, modifyVpcAttributeAction } from "../actions";

interface Props {
  initialVpcs: VpcItem[];
}

export default function VpcsClient({ initialVpcs }: Props) {
  const router = useRouter();

  const [vpcs, setVpcs] = useState<VpcItem[]>(initialVpcs);
  const [selectedVpcId, setSelectedVpcId] = useState<string | null>(
    initialVpcs.length > 0 ? initialVpcs[0].VpcId : null
  );
  const [activeTab, setActiveTab] = useState<"details" | "cidrs" | "resourcemap" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedVpc = vpcs.find((v) => v.VpcId === selectedVpcId);

  const refreshVpcs = async () => {
    setLoading(true);
    try {
      const res = await listVpcsAction();
      if (res.success) {
        setVpcs(res.vpcs);
        if (selectedVpcId && !res.vpcs.some((v) => v.VpcId === selectedVpcId)) {
          setSelectedVpcId(res.vpcs.length > 0 ? res.vpcs[0].VpcId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDnsHostnames = async () => {
    if (!selectedVpc) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const newVal = !selectedVpc.EnableDnsHostnames;
      const res = await modifyVpcAttributeAction(selectedVpc.VpcId, "enableDnsHostnames", newVal);
      if (res.success) {
        setVpcs(vpcs.map((v) => (v.VpcId === selectedVpc.VpcId ? { ...v, EnableDnsHostnames: newVal } : v)));
        setMessage({ type: "success", text: `Updated DNS hostnames to ${newVal ? "enabled" : "disabled"}` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update DNS hostnames attribute" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDnsResolution = async () => {
    if (!selectedVpc) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const newVal = !selectedVpc.EnableDnsSupport;
      const res = await modifyVpcAttributeAction(selectedVpc.VpcId, "enableDnsSupport", newVal);
      if (res.success) {
        setVpcs(vpcs.map((v) => (v.VpcId === selectedVpc.VpcId ? { ...v, EnableDnsSupport: newVal } : v)));
        setMessage({ type: "success", text: `Updated DNS resolution to ${newVal ? "enabled" : "disabled"}` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update DNS resolution attribute" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVpc = async () => {
    if (!selectedVpc) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteVpcAction(selectedVpc.VpcId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setVpcs(vpcs.filter((v) => v.VpcId !== selectedVpc.VpcId));
        setSelectedVpcId(null);
        setMessage({ type: "success", text: `Deleted VPC ${selectedVpc.VpcId}` });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete VPC" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredVpcs = vpcs.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.VpcId.toLowerCase().includes(q) ||
      (v.Name && v.Name.toLowerCase().includes(q)) ||
      v.CidrBlock.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Your VPCs</h1>
          <p className="text-[14px] text-[#545b64] mt-1">
            Virtual Private Clouds in this AWS Region.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshVpcs}
            disabled={loading}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/vpc/vpcs/create"
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create VPC
          </Link>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-[13px] border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-[#d5dbdb] rounded">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Filter by VPC ID, Name, or CIDR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleDnsHostnames}
            disabled={!selectedVpc || actionLoading}
            className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${
              selectedVpc
                ? "text-[#16191f] border-[#d5dbdb] hover:bg-[#fafafa]"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Edit DNS hostnames
          </button>
          <button
            onClick={handleToggleDnsResolution}
            disabled={!selectedVpc || actionLoading}
            className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${
              selectedVpc
                ? "text-[#16191f] border-[#d5dbdb] hover:bg-[#fafafa]"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Edit DNS resolution
          </button>
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedVpc || actionLoading}
            className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${
              selectedVpc
                ? "text-red-600 border-[#d5dbdb] hover:bg-red-50"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete VPC
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#d5dbdb] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                <th className="py-2.5 px-4 w-10"></th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">VPC ID</th>
                <th className="py-2.5 px-4">State</th>
                <th className="py-2.5 px-4">IPv4 CIDR</th>
                <th className="py-2.5 px-4">DHCP options set</th>
                <th className="py-2.5 px-4">Default VPC</th>
                <th className="py-2.5 px-4">DNS Hostnames</th>
                <th className="py-2.5 px-4">DNS Resolution</th>
                <th className="py-2.5 px-4">Owner ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredVpcs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#545b64]">
                    No VPCs found matching your search.
                  </td>
                </tr>
              ) : (
                filteredVpcs.map((vpc) => {
                  const isSelected = vpc.VpcId === selectedVpcId;
                  return (
                    <tr
                      key={vpc.VpcId}
                      onClick={() => setSelectedVpcId(vpc.VpcId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-purple-50/50" : "hover:bg-[#f8f9fa]"
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <input
                          type="radio"
                          name="selectedVpc"
                          checked={isSelected}
                          onChange={() => setSelectedVpcId(vpc.VpcId)}
                          className="h-4 w-4 text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#16191f]">
                        {vpc.Name || "-"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#0073bb]">
                        {vpc.VpcId}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {vpc.State}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px]">
                        {vpc.CidrBlock}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                        {vpc.DhcpOptionsId || "-"}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {vpc.IsDefault ? "Yes" : "No"}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {vpc.EnableDnsHostnames ? "Enabled" : "Disabled"}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {vpc.EnableDnsSupport ? "Enabled" : "Disabled"}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64] font-mono text-xs">
                        {vpc.OwnerId || "000000000000"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer Tabs */}
      {selectedVpc && (
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-2 text-[14px] font-semibold transition-colors border-b-2 -mb-[10px] ${
                  activeTab === "details"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("cidrs")}
                className={`pb-2 text-[14px] font-semibold transition-colors border-b-2 -mb-[10px] ${
                  activeTab === "cidrs"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                CIDRs
              </button>
              <button
                onClick={() => setActiveTab("resourcemap")}
                className={`pb-2 text-[14px] font-semibold transition-colors border-b-2 -mb-[10px] ${
                  activeTab === "resourcemap"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Resource map
              </button>
              <button
                onClick={() => setActiveTab("tags")}
                className={`pb-2 text-[14px] font-semibold transition-colors border-b-2 -mb-[10px] ${
                  activeTab === "tags"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Tags
              </button>
            </div>
          </div>

          {activeTab === "details" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2 text-[13px]">
              <div>
                <span className="text-[#545b64] block text-xs">VPC ID</span>
                <span className="font-mono font-medium text-[#16191f]">{selectedVpc.VpcId}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Name</span>
                <span className="font-medium text-[#16191f]">{selectedVpc.Name || "-"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">State</span>
                <span className="font-medium text-[#16191f]">{selectedVpc.State}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">IPv4 CIDR</span>
                <span className="font-mono font-medium text-[#16191f]">{selectedVpc.CidrBlock}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Default VPC</span>
                <span className="font-medium text-[#16191f]">{selectedVpc.IsDefault ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Tenancy</span>
                <span className="font-medium text-[#16191f] capitalize">{selectedVpc.InstanceTenancy || "Default"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">DHCP options set</span>
                <span className="font-mono font-medium text-[#0073bb]">{selectedVpc.DhcpOptionsId || "-"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">DNS hostnames</span>
                <span className="font-medium text-[#16191f]">
                  {selectedVpc.EnableDnsHostnames ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">DNS resolution</span>
                <span className="font-medium text-[#16191f]">
                  {selectedVpc.EnableDnsSupport ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Owner</span>
                <span className="font-mono font-medium text-[#16191f]">{selectedVpc.OwnerId || "000000000000"}</span>
              </div>
            </div>
          )}

          {activeTab === "cidrs" && (
            <div className="pt-2">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                    <th className="py-2 px-3">IPv4 CIDR</th>
                    <th className="py-2 px-3">Association ID</th>
                    <th className="py-2 px-3">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {(selectedVpc.CidrBlockAssociationSet || []).map((c, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-mono font-medium text-[#16191f]">{c.CidrBlock}</td>
                      <td className="py-2 px-3 font-mono text-xs text-[#545b64]">{c.AssociationId || "-"}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          {c.State || "associated"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "resourcemap" && (
            <div className="pt-2 p-6 bg-[#f8f9fa] border border-[#eaeded] rounded flex flex-col items-center justify-center space-y-4">
              <div className="text-[14px] font-bold text-[#16191f]">Resource Map Overview</div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                <div className="p-3 bg-white border border-[#d5dbdb] rounded shadow-xs text-center w-40">
                  <span className="text-purple-700 font-bold block">VPC</span>
                  <span className="font-mono text-xs text-[#545b64] truncate block">{selectedVpc.VpcId}</span>
                  <span className="text-[11px] text-[#879596]">{selectedVpc.CidrBlock}</span>
                </div>
                <span className="text-[#aab7b8] font-bold">➔</span>
                <div className="p-3 bg-white border border-[#d5dbdb] rounded shadow-xs text-center w-40">
                  <span className="text-blue-700 font-bold block">Subnets</span>
                  <Link href={`/vpc/subnets?vpc=${selectedVpc.VpcId}`} className="text-[#0073bb] hover:underline block">
                    View subnets
                  </Link>
                </div>
                <span className="text-[#aab7b8] font-bold">➔</span>
                <div className="p-3 bg-white border border-[#d5dbdb] rounded shadow-xs text-center w-40">
                  <span className="text-emerald-700 font-bold block">Route Tables</span>
                  <Link href={`/vpc/route-tables?vpc=${selectedVpc.VpcId}`} className="text-[#0073bb] hover:underline block">
                    View routes
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tags" && (
            <div className="pt-2">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                    <th className="py-2 px-3">Key</th>
                    <th className="py-2 px-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {Object.entries(selectedVpc.Tags || {}).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-[#545b64]">
                        No tags assigned to this VPC.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(selectedVpc.Tags || {}).map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-2 px-3 font-semibold text-[#16191f]">{k}</td>
                        <td className="py-2 px-3 font-mono text-xs text-[#545b64]">{v}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete VPC Modal */}
      {isDeleteModalOpen && selectedVpc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Delete VPC</h2>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete VPC <strong className="text-[#16191f]">{selectedVpc.VpcId}</strong>?
            </p>
            <p className="text-[12px] text-[#545b64]">
              Before deleting a VPC, ensure all associated instances, endpoints, and NAT gateways have been terminated or deleted.
            </p>
            <p className="text-[13px] text-[#545b64]">
              To confirm deletion, type <strong className="text-[#16191f]">delete</strong> below:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-red-500"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteVpc}
                disabled={deleteLoading || deleteConfirmText.toLowerCase() !== "delete"}
                className={`px-4 py-1.5 text-[13px] font-bold text-white rounded transition-colors ${
                  deleteConfirmText.toLowerCase() === "delete" && !deleteLoading
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-300 cursor-not-allowed"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
