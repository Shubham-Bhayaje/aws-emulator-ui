"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TransitGatewayItem,
  listTransitGatewaysAction,
  deleteTransitGatewayAction,
} from "../transit-gateway-actions";

interface Props {
  initialTransitGateways: TransitGatewayItem[];
}

export default function TransitGatewaysClient({ initialTransitGateways }: Props) {
  const router = useRouter();

  const [tgws, setTgws] = useState<TransitGatewayItem[]>(initialTransitGateways);
  const [selectedTgwId, setSelectedTgwId] = useState<string | null>(
    initialTransitGateways.length > 0 ? initialTransitGateways[0].TransitGatewayId : null
  );
  const [activeTab, setActiveTab] = useState<"details" | "cidrs" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Actions dropdown
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedTgw = tgws.find((t) => t.TransitGatewayId === selectedTgwId);

  const refreshTgws = async () => {
    setLoading(true);
    try {
      const res = await listTransitGatewaysAction();
      if (res.success) {
        setTgws(res.transitGateways);
        if (selectedTgwId && !res.transitGateways.some((t) => t.TransitGatewayId === selectedTgwId)) {
          setSelectedTgwId(res.transitGateways.length > 0 ? res.transitGateways[0].TransitGatewayId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTgw = async () => {
    if (!selectedTgw) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteTransitGatewayAction(selectedTgw.TransitGatewayId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({ type: "success", text: `Deleted transit gateway ${selectedTgw.TransitGatewayId}` });
        setTgws(tgws.filter((t) => t.TransitGatewayId !== selectedTgw.TransitGatewayId));
        setSelectedTgwId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete transit gateway" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredTgws = tgws.filter((t) => {
    const q = searchQuery.toLowerCase();
    const name = t.Name || "";
    return (
      t.TransitGatewayId.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      t.State.toLowerCase().includes(q) ||
      String(t.AmazonSideAsn).includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transit gateways ({tgws.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            A transit gateway is a network transit hub that you can use to interconnect your virtual private clouds (VPCs) and on-premises networks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshTgws}
            disabled={loading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => {
              if (selectedTgw) {
                router.push(`/vpc/transit-gateways/${selectedTgw.TransitGatewayId}`);
              }
            }}
            disabled={!selectedTgw}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View details
          </button>

          <div className="relative">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              disabled={!selectedTgw}
              className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              <span>Actions</span>
              <span className="text-[10px]">▼</span>
            </button>

            {isActionsOpen && selectedTgw && (
              <div
                className="absolute right-0 mt-1 w-52 bg-white border border-[#d5dbdb] rounded shadow-lg z-20 py-1"
                onClick={() => setIsActionsOpen(false)}
              >
                <button
                  onClick={() => router.push(`/vpc/transit-gateways/${selectedTgw.TransitGatewayId}`)}
                  className="w-full text-left px-4 py-2 text-xs text-gray-900 hover:bg-[#f2f8fd]"
                >
                  View details
                </button>
                <button
                  onClick={() => router.push(`/vpc/transit-gateway-attachments/create?tgwId=${selectedTgw.TransitGatewayId}`)}
                  className="w-full text-left px-4 py-2 text-xs text-gray-900 hover:bg-[#f2f8fd]"
                >
                  Create attachment
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => {
                    setDeleteConfirmText("");
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete transit gateway
                </button>
              </div>
            )}
          </div>

          <Link
            href="/vpc/transit-gateways/create"
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create transit gateway
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

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="p-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Filter transit gateways by Name, ID, or State"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
            />
          </div>
          <span className="text-xs text-gray-500">
            Showing {filteredTgws.length} of {tgws.length} transit gateways
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 font-semibold">Name</th>
                <th className="py-2.5 px-3 font-semibold">Transit gateway ID</th>
                <th className="py-2.5 px-3 font-semibold">State</th>
                <th className="py-2.5 px-3 font-semibold">ASN</th>
                <th className="py-2.5 px-3 font-semibold">Default association</th>
                <th className="py-2.5 px-3 font-semibold">Default propagation</th>
                <th className="py-2.5 px-3 font-semibold">DNS support</th>
                <th className="py-2.5 px-3 font-semibold">VPN ECMP support</th>
                <th className="py-2.5 px-3 font-semibold">Owner ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {filteredTgws.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500">
                    No transit gateways found. Click &quot;Create transit gateway&quot; to provision a new regional hub.
                  </td>
                </tr>
              ) : (
                filteredTgws.map((tgw) => {
                  const isSelected = tgw.TransitGatewayId === selectedTgwId;
                  const isAvailable = tgw.State === "available";
                  return (
                    <tr
                      key={tgw.TransitGatewayId}
                      onClick={() => setSelectedTgwId(tgw.TransitGatewayId)}
                      onDoubleClick={() => router.push(`/vpc/transit-gateways/${tgw.TransitGatewayId}`)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-[#F2F8FD]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="radio"
                          name="selected_tgw"
                          checked={isSelected}
                          onChange={() => setSelectedTgwId(tgw.TransitGatewayId)}
                          className="h-3.5 w-3.5 text-[#EC7211] focus:ring-[#EC7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        <Link
                          href={`/vpc/transit-gateways/${tgw.TransitGatewayId}`}
                          className="hover:underline"
                        >
                          {tgw.Name || "-"}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073BB]">
                        <Link
                          href={`/vpc/transit-gateways/${tgw.TransitGatewayId}`}
                          className="hover:underline"
                        >
                          {tgw.TransitGatewayId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            isAvailable
                              ? "bg-green-100 text-green-800"
                              : tgw.State === "deleted"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {tgw.State}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">
                        {tgw.AmazonSideAsn}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-gray-600">
                        {tgw.DefaultRouteTableAssociation}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-gray-600">
                        {tgw.DefaultRouteTablePropagation}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-gray-600">
                        {tgw.DnsSupport}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-gray-600">
                        {tgw.VpnEcmpSupport}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-500">
                        {tgw.OwnerId}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Tabs for Selected Transit Gateway */}
      {selectedTgw && (
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="border-b border-gray-200 px-4 flex items-center justify-between">
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
                onClick={() => setActiveTab("cidrs")}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "cidrs"
                    ? "border-[#EC7211] text-[#EC7211]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Transit gateway CIDR blocks ({selectedTgw.TransitGatewayCidrBlocks.length})
              </button>
              <button
                onClick={() => setActiveTab("tags")}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "tags"
                    ? "border-[#EC7211] text-[#EC7211]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Tags ({Object.keys(selectedTgw.Tags || {}).length})
              </button>
            </div>
            <Link
              href={`/vpc/transit-gateways/${selectedTgw.TransitGatewayId}`}
              className="text-[12px] font-medium text-[#0073bb] hover:underline flex items-center gap-1"
            >
              <span>Open transit gateway page</span>
              <span>↗</span>
            </Link>
          </div>

          <div className="p-4">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6 text-xs">
                <div>
                  <dt className="text-gray-500 font-medium">Transit gateway ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono font-semibold">{selectedTgw.TransitGatewayId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">State</dt>
                  <dd className="text-gray-900 mt-1 capitalize">{selectedTgw.State}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Owner ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedTgw.OwnerId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Description</dt>
                  <dd className="text-gray-900 mt-1" suppressHydrationWarning>{selectedTgw.Description || "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Amazon side ASN</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedTgw.AmazonSideAsn}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Auto accept shared attachments</dt>
                  <dd className="text-gray-900 mt-1 capitalize">{selectedTgw.AutoAcceptSharedAttachments}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Default route table association</dt>
                  <dd className="text-gray-900 mt-1 capitalize">{selectedTgw.DefaultRouteTableAssociation}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Default route table propagation</dt>
                  <dd className="text-gray-900 mt-1 capitalize">{selectedTgw.DefaultRouteTablePropagation}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">DNS support</dt>
                  <dd className="text-gray-900 mt-1 capitalize">{selectedTgw.DnsSupport}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">VPN ECMP support</dt>
                  <dd className="text-gray-900 mt-1 capitalize">{selectedTgw.VpnEcmpSupport}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Multicast support</dt>
                  <dd className="text-gray-900 mt-1 capitalize">{selectedTgw.MulticastSupport}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Created at</dt>
                  <dd className="text-gray-900 mt-1" suppressHydrationWarning>
                    {selectedTgw.CreationTime ? new Date(selectedTgw.CreationTime).toLocaleString() : "-"}
                  </dd>
                </div>
              </div>
            )}

            {activeTab === "cidrs" && (
              <div>
                {selectedTgw.TransitGatewayCidrBlocks.length === 0 ? (
                  <p className="text-xs text-gray-500">No transit gateway CIDR blocks allocated.</p>
                ) : (
                  <ul className="space-y-1">
                    {selectedTgw.TransitGatewayCidrBlocks.map((cidr) => (
                      <li key={cidr} className="font-mono text-xs text-gray-800">
                        {cidr}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                {!selectedTgw.Tags || Object.keys(selectedTgw.Tags).length === 0 ? (
                  <p className="text-xs text-gray-500">No tags assigned to this transit gateway.</p>
                ) : (
                  <table className="w-full text-left text-xs border border-gray-200">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(selectedTgw.Tags).map(([key, val]) => (
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedTgw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Delete transit gateway</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700">
                Are you sure you want to delete transit gateway{" "}
                <span className="font-mono font-bold text-gray-900">{selectedTgw.TransitGatewayId}</span>?
              </p>
              <p className="text-xs text-gray-500">
                You cannot delete a transit gateway that has active attachments. Ensure all attachments are deleted before deleting this hub.
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
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleteLoading}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTgw}
                  disabled={deleteConfirmText !== "delete" || deleteLoading}
                  className="px-3 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
