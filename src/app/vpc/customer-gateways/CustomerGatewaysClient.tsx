"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CustomerGatewayItem,
  listCustomerGatewaysAction,
  deleteCustomerGatewayAction,
} from "../vpn-actions";

interface Props {
  initialCustomerGateways: CustomerGatewayItem[];
}

export default function CustomerGatewaysClient({ initialCustomerGateways }: Props) {
  const router = useRouter();

  const [gateways, setGateways] = useState<CustomerGatewayItem[]>(initialCustomerGateways);
  const [selectedCgwId, setSelectedCgwId] = useState<string | null>(
    initialCustomerGateways.length > 0 ? initialCustomerGateways[0].CustomerGatewayId : null
  );
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedCgw = gateways.find((g) => g.CustomerGatewayId === selectedCgwId);

  const refreshGateways = async () => {
    setLoading(true);
    try {
      const res = await listCustomerGatewaysAction();
      if (res.success) {
        setGateways(res.customerGateways);
        if (selectedCgwId && !res.customerGateways.some((g) => g.CustomerGatewayId === selectedCgwId)) {
          setSelectedCgwId(res.customerGateways.length > 0 ? res.customerGateways[0].CustomerGatewayId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGateway = async () => {
    if (!selectedCgw) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteCustomerGatewayAction(selectedCgw.CustomerGatewayId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({ type: "success", text: `Deleted customer gateway ${selectedCgw.CustomerGatewayId}` });
        setGateways(gateways.filter((g) => g.CustomerGatewayId !== selectedCgw.CustomerGatewayId));
        setSelectedCgwId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete customer gateway" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredGateways = gateways.filter((g) => {
    const q = searchQuery.toLowerCase();
    const name = g.Name || "";
    return (
      g.CustomerGatewayId.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      g.IpAddress.toLowerCase().includes(q) ||
      String(g.BgpAsn).includes(q) ||
      g.State.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customer gateways ({gateways.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            A customer gateway provides information to AWS about your customer gateway device or software application.
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

          <button
            onClick={() => {
              if (selectedCgw) {
                router.push(`/vpc/customer-gateways/${selectedCgw.CustomerGatewayId}`);
              }
            }}
            disabled={!selectedCgw}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View details
          </button>

          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedCgw || selectedCgw.State === "deleted"}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete customer gateway
          </button>

          <Link
            href="/vpc/customer-gateways/create"
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create customer gateway
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
          placeholder="Filter by customer gateway ID, name, IP address, or ASN..."
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
              <th className="py-2.5 px-3">Customer gateway ID</th>
              <th className="py-2.5 px-3">State</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">IP address</th>
              <th className="py-2.5 px-3">BGP ASN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredGateways.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  {gateways.length === 0
                    ? "No customer gateways found. Create one to get started."
                    : "No matching customer gateways."}
                </td>
              </tr>
            ) : (
              filteredGateways.map((cgw) => {
                const isSelected = selectedCgwId === cgw.CustomerGatewayId;
                return (
                  <tr
                    key={cgw.CustomerGatewayId}
                    onClick={() => setSelectedCgwId(cgw.CustomerGatewayId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50/70" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedCgwId(cgw.CustomerGatewayId)}
                        className="text-[#ec7211] focus:ring-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-gray-900">{cgw.Name || "-"}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#0073bb]">
                      <Link
                        href={`/vpc/customer-gateways/${cgw.CustomerGatewayId}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {cgw.CustomerGatewayId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          cgw.State === "available"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {cgw.State}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">{cgw.Type}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-700">{cgw.IpAddress}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-700">{cgw.BgpAsn}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Customer Gateway Drawer */}
      {selectedCgw && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="border-b border-gray-200 bg-gray-50 px-4 pt-3">
            <div className="flex items-center justify-between pb-2">
              <span className="font-bold text-gray-800">
                Customer gateway: <span className="font-mono text-[#0073bb]">{selectedCgw.CustomerGatewayId}</span>
              </span>
              <Link
                href={`/vpc/customer-gateways/${selectedCgw.CustomerGatewayId}`}
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
                onClick={() => setActiveTab("tags")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "tags"
                    ? "border-[#ec7211] text-[#ec7211] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Tags ({selectedCgw.Tags ? Object.keys(selectedCgw.Tags).length : 0})
              </button>
            </nav>
          </div>

          <div className="p-4">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-gray-500">Customer gateway ID</dt>
                  <dd className="font-mono text-gray-900 font-medium">{selectedCgw.CustomerGatewayId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">IP address</dt>
                  <dd className="font-mono text-gray-900">{selectedCgw.IpAddress}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">BGP ASN</dt>
                  <dd className="font-mono text-gray-900">{selectedCgw.BgpAsn}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Type</dt>
                  <dd className="text-gray-900">{selectedCgw.Type}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">State</dt>
                  <dd className="text-gray-900 capitalize">{selectedCgw.State}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Device name</dt>
                  <dd className="text-gray-900">{selectedCgw.DeviceName || "-"}</dd>
                </div>
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                {!selectedCgw.Tags || Object.keys(selectedCgw.Tags).length === 0 ? (
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
                      {Object.entries(selectedCgw.Tags).map(([k, v]) => (
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCgw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete customer gateway</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete customer gateway{" "}
              <span className="font-mono font-bold text-red-600">
                {selectedCgw.CustomerGatewayId}
              </span>
              ? Any VPN connections associated with this gateway must be deleted first.
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
