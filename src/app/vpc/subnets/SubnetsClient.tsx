"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubnetItem, listSubnetsAction, deleteSubnetAction, modifySubnetAttributeAction } from "../actions";

interface Props {
  initialSubnets: SubnetItem[];
  initialSearch?: string;
}

export default function SubnetsClient({ initialSubnets, initialSearch = "" }: Props) {
  const router = useRouter();

  const [subnets, setSubnets] = useState<SubnetItem[]>(initialSubnets);
  const [selectedSubnetId, setSelectedSubnetId] = useState<string | null>(() => {
    if (initialSearch) {
      const match = initialSubnets.find(
        (s) =>
          s.SubnetId.toLowerCase().includes(initialSearch.toLowerCase()) ||
          (s.Name && s.Name.toLowerCase().includes(initialSearch.toLowerCase()))
      );
      if (match) return match.SubnetId;
    }
    return initialSubnets.length > 0 ? initialSubnets[0].SubnetId : null;
  });
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedSubnet = subnets.find((s) => s.SubnetId === selectedSubnetId);

  const refreshSubnets = async () => {
    setLoading(true);
    try {
      const res = await listSubnetsAction();
      if (res.success) {
        setSubnets(res.subnets);
        if (selectedSubnetId && !res.subnets.some((s) => s.SubnetId === selectedSubnetId)) {
          setSelectedSubnetId(res.subnets.length > 0 ? res.subnets[0].SubnetId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoAssignPublicIp = async () => {
    if (!selectedSubnet) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const newVal = !selectedSubnet.MapPublicIpOnLaunch;
      const res = await modifySubnetAttributeAction(selectedSubnet.SubnetId, newVal);
      if (res.success) {
        setSubnets(
          subnets.map((s) =>
            s.SubnetId === selectedSubnet.SubnetId ? { ...s, MapPublicIpOnLaunch: newVal } : s
          )
        );
        setMessage({
          type: "success",
          text: `Updated auto-assign public IPv4 address to ${newVal ? "enabled" : "disabled"}`,
        });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update subnet settings" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubnet = async () => {
    if (!selectedSubnet) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteSubnetAction(selectedSubnet.SubnetId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setSubnets(subnets.filter((s) => s.SubnetId !== selectedSubnet.SubnetId));
        setSelectedSubnetId(null);
        setMessage({ type: "success", text: `Deleted subnet ${selectedSubnet.SubnetId}` });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete subnet" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredSubnets = subnets.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.SubnetId.toLowerCase().includes(q) ||
      (s.Name && s.Name.toLowerCase().includes(q)) ||
      s.VpcId.toLowerCase().includes(q) ||
      s.CidrBlock.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Subnets</h1>
          <p className="text-[14px] text-[#545b64] mt-1">
            Subnets partition your VPC&apos;s IP address range across Availability Zones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshSubnets}
            disabled={loading}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/vpc/subnets/create"
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create subnet
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
            placeholder="Filter by Subnet ID, Name, or VPC ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAutoAssignPublicIp}
            disabled={!selectedSubnet || actionLoading}
            className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${
              selectedSubnet
                ? "text-[#16191f] border-[#d5dbdb] hover:bg-[#fafafa]"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Edit subnet settings
          </button>
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedSubnet || actionLoading}
            className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${
              selectedSubnet
                ? "text-red-600 border-[#d5dbdb] hover:bg-red-50"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete subnet
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
                <th className="py-2.5 px-4">Subnet ID</th>
                <th className="py-2.5 px-4">State</th>
                <th className="py-2.5 px-4">VPC</th>
                <th className="py-2.5 px-4">IPv4 CIDR</th>
                <th className="py-2.5 px-4">Available IPs</th>
                <th className="py-2.5 px-4">Availability Zone</th>
                <th className="py-2.5 px-4">Default Subnet</th>
                <th className="py-2.5 px-4">Auto-assign Public IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredSubnets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#545b64]">
                    No subnets found matching your search.
                  </td>
                </tr>
              ) : (
                filteredSubnets.map((sub) => {
                  const isSelected = sub.SubnetId === selectedSubnetId;
                  return (
                    <tr
                      key={sub.SubnetId}
                      onClick={() => setSelectedSubnetId(sub.SubnetId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-purple-50/50" : "hover:bg-[#f8f9fa]"
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <input
                          type="radio"
                          name="selectedSubnet"
                          checked={isSelected}
                          onChange={() => setSelectedSubnetId(sub.SubnetId)}
                          className="h-4 w-4 text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#16191f]">
                        {sub.Name || "-"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#0073bb]">
                        <Link
                          href={`/vpc/subnets/${sub.SubnetId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline font-semibold"
                        >
                          {sub.SubnetId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {sub.State}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#0073bb]">
                        {sub.VpcId}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px]">
                        {sub.CidrBlock}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                        {sub.AvailableIpAddressCount ?? 251}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {sub.AvailabilityZone || "us-east-1a"}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {sub.DefaultForAz ? "Yes" : "No"}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {sub.MapPublicIpOnLaunch ? "Yes" : "No"}
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
      {selectedSubnet && (
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
                <span className="text-[#545b64] block text-xs">Subnet ID</span>
                <span className="font-mono font-medium text-[#16191f]">{selectedSubnet.SubnetId}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Name</span>
                <span className="font-medium text-[#16191f]">{selectedSubnet.Name || "-"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">VPC</span>
                <span className="font-mono font-medium text-[#0073bb]">{selectedSubnet.VpcId}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">IPv4 CIDR</span>
                <span className="font-mono font-medium text-[#16191f]">{selectedSubnet.CidrBlock}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Availability Zone</span>
                <span className="font-medium text-[#16191f]">{selectedSubnet.AvailabilityZone || "us-east-1a"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Available IPv4 addresses</span>
                <span className="font-medium text-[#16191f]">{selectedSubnet.AvailableIpAddressCount ?? 251}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Default subnet</span>
                <span className="font-medium text-[#16191f]">{selectedSubnet.DefaultForAz ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Auto-assign public IPv4 address</span>
                <span className="font-medium text-[#16191f]">
                  {selectedSubnet.MapPublicIpOnLaunch ? "Yes" : "No"}
                </span>
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
                  {Object.entries(selectedSubnet.Tags || {}).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-[#545b64]">
                        No tags assigned to this subnet.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(selectedSubnet.Tags || {}).map(([k, v]) => (
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

      {/* Delete Subnet Modal */}
      {isDeleteModalOpen && selectedSubnet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Delete subnet</h2>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete subnet <strong className="text-[#16191f]">{selectedSubnet.SubnetId}</strong>?
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
                onClick={handleDeleteSubnet}
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
