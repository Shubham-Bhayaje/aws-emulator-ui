"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  VirtualPrivateGatewayItem,
  listVirtualPrivateGatewaysAction,
  attachVirtualPrivateGatewayAction,
  detachVirtualPrivateGatewayAction,
  deleteVirtualPrivateGatewayAction,
} from "../vpn-actions";
import { VpcItem } from "../actions";

interface Props {
  initialVirtualPrivateGateways: VirtualPrivateGatewayItem[];
  vpcs: VpcItem[];
}

export default function VirtualPrivateGatewaysClient({
  initialVirtualPrivateGateways,
  vpcs,
}: Props) {
  const router = useRouter();

  const [gateways, setGateways] = useState<VirtualPrivateGatewayItem[]>(initialVirtualPrivateGateways);
  const [selectedVgwId, setSelectedVgwId] = useState<string | null>(
    initialVirtualPrivateGateways.length > 0 ? initialVirtualPrivateGateways[0].VpnGatewayId : null
  );
  const [activeTab, setActiveTab] = useState<"details" | "attachments" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Actions dropdown
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Attach modal
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachVpcId, setAttachVpcId] = useState(vpcs.length > 0 ? vpcs[0].VpcId : "");
  const [attachLoading, setAttachLoading] = useState(false);

  // Detach modal
  const [isDetachModalOpen, setIsDetachModalOpen] = useState(false);
  const [detachLoading, setDetachLoading] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedVgw = gateways.find((g) => g.VpnGatewayId === selectedVgwId);

  const refreshGateways = async () => {
    setLoading(true);
    try {
      const res = await listVirtualPrivateGatewaysAction();
      if (res.success) {
        setGateways(res.virtualPrivateGateways);
        if (selectedVgwId && !res.virtualPrivateGateways.some((g) => g.VpnGatewayId === selectedVgwId)) {
          setSelectedVgwId(res.virtualPrivateGateways.length > 0 ? res.virtualPrivateGateways[0].VpnGatewayId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAttachVpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVgw || !attachVpcId) return;
    setAttachLoading(true);
    setMessage(null);
    try {
      const res = await attachVirtualPrivateGatewayAction(selectedVgw.VpnGatewayId, attachVpcId);
      if (res.success) {
        setIsAttachModalOpen(false);
        setMessage({ type: "success", text: `Attached ${selectedVgw.VpnGatewayId} to VPC ${attachVpcId}` });
        await refreshGateways();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to attach virtual private gateway to VPC" });
      }
    } finally {
      setAttachLoading(false);
    }
  };

  const handleDetachVpc = async () => {
    if (!selectedVgw || !selectedVgw.AttachedVpcId) return;
    setDetachLoading(true);
    setMessage(null);
    try {
      const res = await detachVirtualPrivateGatewayAction(selectedVgw.VpnGatewayId, selectedVgw.AttachedVpcId);
      if (res.success) {
        setIsDetachModalOpen(false);
        setMessage({ type: "success", text: `Detached ${selectedVgw.VpnGatewayId} from VPC ${selectedVgw.AttachedVpcId}` });
        await refreshGateways();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to detach virtual private gateway" });
      }
    } finally {
      setDetachLoading(false);
    }
  };

  const handleDeleteGateway = async () => {
    if (!selectedVgw) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteVirtualPrivateGatewayAction(selectedVgw.VpnGatewayId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({ type: "success", text: `Deleted virtual private gateway ${selectedVgw.VpnGatewayId}` });
        setGateways(gateways.filter((g) => g.VpnGatewayId !== selectedVgw.VpnGatewayId));
        setSelectedVgwId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete virtual private gateway" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredGateways = gateways.filter((g) => {
    const q = searchQuery.toLowerCase();
    const name = g.Name || "";
    return (
      g.VpnGatewayId.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      String(g.AmazonSideAsn).includes(q) ||
      (g.AttachedVpcId && g.AttachedVpcId.toLowerCase().includes(q)) ||
      g.State.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Virtual private gateways ({gateways.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            A virtual private gateway is the VPN concentrator on the Amazon side of the VPN connection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshGateways}
            disabled={loading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              disabled={!selectedVgw}
              className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              <span>Actions</span>
              <span className="text-[10px]">&blacktriangledown;</span>
            </button>

            {isActionsOpen && selectedVgw && (
              <div
                className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded shadow-lg py-1 z-20 text-xs"
                onClick={() => setIsActionsOpen(false)}
              >
                <button
                  onClick={() => setIsAttachModalOpen(true)}
                  disabled={Boolean(selectedVgw.AttachedVpcId)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  Attach to VPC
                </button>
                <button
                  onClick={() => setIsDetachModalOpen(true)}
                  disabled={!selectedVgw.AttachedVpcId}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  Detach from VPC
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => {
                    setDeleteConfirmText("");
                    setIsDeleteModalOpen(true);
                  }}
                  disabled={Boolean(selectedVgw.AttachedVpcId)}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete virtual private gateway
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (selectedVgw) {
                router.push(`/vpc/virtual-private-gateways/${selectedVgw.VpnGatewayId}`);
              }
            }}
            disabled={!selectedVgw}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View details
          </button>

          <Link
            href="/vpc/virtual-private-gateways/create"
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create virtual private gateway
          </Link>
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

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Filter by gateway ID, name, ASN, or attached VPC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-xs w-full max-w-md focus:outline-none focus:border-[#ec7211]"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto text-xs">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <th className="py-2.5 px-3 w-8"></th>
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Virtual private gateway ID</th>
              <th className="py-2.5 px-3">State</th>
              <th className="py-2.5 px-3">ASN</th>
              <th className="py-2.5 px-3">Attached VPC ID</th>
              <th className="py-2.5 px-3">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredGateways.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  {gateways.length === 0
                    ? "No virtual private gateways found. Create one to get started."
                    : "No matching virtual private gateways."}
                </td>
              </tr>
            ) : (
              filteredGateways.map((vgw) => {
                const isSelected = selectedVgwId === vgw.VpnGatewayId;
                return (
                  <tr
                    key={vgw.VpnGatewayId}
                    onClick={() => setSelectedVgwId(vgw.VpnGatewayId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50/70" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedVgwId(vgw.VpnGatewayId)}
                        className="text-[#ec7211] focus:ring-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-gray-900">{vgw.Name || "-"}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#0073bb]">
                      <Link
                        href={`/vpc/virtual-private-gateways/${vgw.VpnGatewayId}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {vgw.VpnGatewayId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          vgw.State === "available"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {vgw.State}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gray-700">{vgw.AmazonSideAsn}</td>
                    <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                      {vgw.AttachedVpcId ? (
                        <Link href="/vpc/vpcs" className="hover:underline" onClick={(e) => e.stopPropagation()}>
                          {vgw.AttachedVpcId}
                        </Link>
                      ) : (
                        <span className="text-gray-400 font-normal">detached</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">{vgw.Type}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected VGW Drawer */}
      {selectedVgw && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="border-b border-gray-200 bg-gray-50 px-4 pt-3">
            <div className="flex items-center justify-between pb-2">
              <span className="font-bold text-gray-800">
                Virtual private gateway: <span className="font-mono text-[#0073bb]">{selectedVgw.VpnGatewayId}</span>
              </span>
              <Link
                href={`/vpc/virtual-private-gateways/${selectedVgw.VpnGatewayId}`}
                className="text-[#0073bb] hover:underline font-medium"
              >
                Go to full page &rarr;
              </Link>
            </div>
            <nav className="flex space-x-6 text-xs font-medium">
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-[#ec7211] text-[#ec7211] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("attachments")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "attachments"
                    ? "border-[#ec7211] text-[#ec7211] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                VPC attachments ({selectedVgw.VpcAttachments.length})
              </button>
              <button
                onClick={() => setActiveTab("tags")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "tags"
                    ? "border-[#ec7211] text-[#ec7211] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Tags ({selectedVgw.Tags ? Object.keys(selectedVgw.Tags).length : 0})
              </button>
            </nav>
          </div>

          <div className="p-4">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-gray-500">Virtual private gateway ID</dt>
                  <dd className="font-mono text-gray-900 font-medium">{selectedVgw.VpnGatewayId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Autonomous System Number (ASN)</dt>
                  <dd className="font-mono text-gray-900">{selectedVgw.AmazonSideAsn}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Attached VPC</dt>
                  <dd className="font-mono text-[#0073bb]">
                    {selectedVgw.AttachedVpcId ? (
                      <Link href="/vpc/vpcs" className="hover:underline">
                        {selectedVgw.AttachedVpcId}
                      </Link>
                    ) : (
                      <span className="text-gray-400">detached</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">State</dt>
                  <dd className="text-gray-900 capitalize font-medium">{selectedVgw.State}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Type</dt>
                  <dd className="text-gray-900">{selectedVgw.Type}</dd>
                </div>
              </div>
            )}

            {activeTab === "attachments" && (
              <div>
                {selectedVgw.VpcAttachments.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">No VPC attached.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                        <th className="py-2 px-3">VPC ID</th>
                        <th className="py-2 px-3">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedVgw.VpcAttachments.map((att) => (
                        <tr key={att.VpcId}>
                          <td className="py-2 px-3 font-mono text-[#0073bb]">
                            <Link href="/vpc/vpcs" className="hover:underline">
                              {att.VpcId}
                            </Link>
                          </td>
                          <td className="py-2 px-3 capitalize text-gray-700">{att.State}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                {!selectedVgw.Tags || Object.keys(selectedVgw.Tags).length === 0 ? (
                  <div className="py-4 text-center text-gray-500">No tags assigned.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                        <th className="py-2 px-3 font-semibold">Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(selectedVgw.Tags).map(([k, v]) => (
                        <tr key={k}>
                          <td className="py-2 px-3 font-mono text-gray-800">{k}</td>
                          <td className="py-2 px-3 text-gray-600">{v}</td>
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

      {/* Attach to VPC Modal */}
      {isAttachModalOpen && selectedVgw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Attach to VPC</h3>
            <p className="text-xs text-gray-600">
              Attach virtual private gateway <span className="font-mono font-medium">{selectedVgw.VpnGatewayId}</span> to a VPC.
            </p>

            <form onSubmit={handleAttachVpc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  VPC <span className="text-red-500">*</span>
                </label>
                {vpcs.length === 0 ? (
                  <div className="p-3 border border-dashed rounded text-xs text-gray-600 bg-gray-50">
                    No VPCs available.
                  </div>
                ) : (
                  <select
                    value={attachVpcId}
                    onChange={(e) => setAttachVpcId(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#ec7211] bg-white"
                  >
                    {vpcs.map((v) => (
                      <option key={v.VpcId} value={v.VpcId}>
                        {v.Name ? `${v.Name} (${v.VpcId})` : v.VpcId} - {v.CidrBlock}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAttachModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={attachLoading || !attachVpcId}
                  className="px-4 text-xs font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {attachLoading ? "Attaching..." : "Attach to VPC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detach from VPC Modal */}
      {isDetachModalOpen && selectedVgw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Detach from VPC</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to detach virtual private gateway{" "}
              <span className="font-mono font-medium">{selectedVgw.VpnGatewayId}</span> from VPC{" "}
              <span className="font-mono font-bold text-red-600">{selectedVgw.AttachedVpcId}</span>? Traffic between the on-premises network and this VPC will stop.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDetachModalOpen(false)}
                className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDetachVpc}
                disabled={detachLoading}
                className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {detachLoading ? "Detaching..." : "Detach"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedVgw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete virtual private gateway</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete virtual private gateway{" "}
              <span className="font-mono font-bold text-red-600">
                {selectedVgw.VpnGatewayId}
              </span>
              ? Ensure that any VPN connections using this gateway are deleted first.
            </p>

            <div className="space-y-1">
              <label className="text-xs text-gray-700 block">
                To confirm deletion, type <span className="font-bold font-mono">delete</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
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
                onClick={handleDeleteGateway}
                disabled={deleteConfirmText.toLowerCase() !== "delete" || deleteLoading}
                className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
