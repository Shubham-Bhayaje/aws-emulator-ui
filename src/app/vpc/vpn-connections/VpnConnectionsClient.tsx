"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  VpnConnectionItem,
  listVpnConnectionsAction,
  deleteVpnConnectionAction,
  downloadVpnConfigurationAction,
} from "../vpn-actions";

interface Props {
  initialVpnConnections: VpnConnectionItem[];
}

export default function VpnConnectionsClient({ initialVpnConnections }: Props) {
  const router = useRouter();

  const [connections, setConnections] = useState<VpnConnectionItem[]>(initialVpnConnections);
  const [selectedVpnId, setSelectedVpnId] = useState<string | null>(
    initialVpnConnections.length > 0 ? initialVpnConnections[0].VpnConnectionId : null
  );
  const [activeTab, setActiveTab] = useState<"details" | "tunnels" | "routes" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Download Config Modal
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadVendor, setDownloadVendor] = useState("Cisco Systems, Inc.");
  const [downloadPlatform, setDownloadPlatform] = useState("ISR Series Cisco IOS 15.2");
  const [downloadIkeVersion, setDownloadIkeVersion] = useState("ikev2");
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedVpn = connections.find((v) => v.VpnConnectionId === selectedVpnId);

  const refreshConnections = async () => {
    setLoading(true);
    try {
      const res = await listVpnConnectionsAction();
      if (res.success) {
        setConnections(res.vpnConnections);
        if (selectedVpnId && !res.vpnConnections.some((v) => v.VpnConnectionId === selectedVpnId)) {
          setSelectedVpnId(res.vpnConnections.length > 0 ? res.vpnConnections[0].VpnConnectionId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVpn) return;
    setDownloadLoading(true);
    try {
      const res = await downloadVpnConfigurationAction({
        vpnConnectionId: selectedVpn.VpnConnectionId,
        vendor: downloadVendor,
        platform: downloadPlatform,
        ikeVersion: downloadIkeVersion,
      });

      if (res.success && res.configurationText && res.filename) {
        const blob = new Blob([res.configurationText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsDownloadModalOpen(false);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to download configuration" });
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDeleteConnection = async () => {
    if (!selectedVpn) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteVpnConnectionAction(selectedVpn.VpnConnectionId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({ type: "success", text: `Deleted VPN connection ${selectedVpn.VpnConnectionId}` });
        setConnections(connections.filter((v) => v.VpnConnectionId !== selectedVpn.VpnConnectionId));
        setSelectedVpnId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete VPN connection" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredConnections = connections.filter((v) => {
    const q = searchQuery.toLowerCase();
    const name = v.Name || "";
    return (
      v.VpnConnectionId.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      v.CustomerGatewayId.toLowerCase().includes(q) ||
      (v.VpnGatewayId && v.VpnGatewayId.toLowerCase().includes(q)) ||
      (v.TransitGatewayId && v.TransitGatewayId.toLowerCase().includes(q)) ||
      v.State.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Site-to-Site VPN connections ({connections.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            An AWS Site-to-Site VPN connection connects your on-premises network or branch office to your Amazon VPC or Transit Gateway.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshConnections}
            disabled={loading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => setIsDownloadModalOpen(true)}
            disabled={!selectedVpn}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Download configuration
          </button>

          <button
            onClick={() => {
              if (selectedVpn) {
                router.push(`/vpc/vpn-connections/${selectedVpn.VpnConnectionId}`);
              }
            }}
            disabled={!selectedVpn}
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
            disabled={!selectedVpn || selectedVpn.State === "deleted"}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete VPN connection
          </button>

          <Link
            href="/vpc/vpn-connections/create"
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create VPN connection
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
          placeholder="Filter by VPN ID, name, customer gateway, or target gateway..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-xs w-full max-w-md focus:outline-none focus:border-[#ec7211]"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto text-xs">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <th className="py-2.5 px-3 w-8"></th>
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">VPN ID</th>
              <th className="py-2.5 px-3">State</th>
              <th className="py-2.5 px-3">Customer gateway ID</th>
              <th className="py-2.5 px-3">Target gateway</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredConnections.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  {connections.length === 0
                    ? "No VPN connections found. Create one to connect your on-premises network."
                    : "No matching VPN connections."}
                </td>
              </tr>
            ) : (
              filteredConnections.map((vpn) => {
                const isSelected = selectedVpnId === vpn.VpnConnectionId;
                const targetGateway = vpn.VpnGatewayId || vpn.TransitGatewayId || "-";
                const isTgw = Boolean(vpn.TransitGatewayId);

                return (
                  <tr
                    key={vpn.VpnConnectionId}
                    onClick={() => setSelectedVpnId(vpn.VpnConnectionId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50/70" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedVpnId(vpn.VpnConnectionId)}
                        className="text-[#ec7211] focus:ring-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-gray-900">{vpn.Name || "-"}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#0073bb]">
                      <Link
                        href={`/vpc/vpn-connections/${vpn.VpnConnectionId}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {vpn.VpnConnectionId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          vpn.State === "available"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {vpn.State}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                      <Link
                        href={`/vpc/customer-gateways/${vpn.CustomerGatewayId}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {vpn.CustomerGatewayId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                      {isTgw ? (
                        <Link
                          href={`/vpc/transit-gateways/${vpn.TransitGatewayId}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {targetGateway} (TGW)
                        </Link>
                      ) : vpn.VpnGatewayId ? (
                        <Link
                          href={`/vpc/virtual-private-gateways/${vpn.VpnGatewayId}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {targetGateway} (VGW)
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">{vpn.Type}</td>
                    <td className="py-2.5 px-3 text-gray-700">{vpn.Category}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected VPN Drawer */}
      {selectedVpn && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="border-b border-gray-200 bg-gray-50 px-4 pt-3">
            <div className="flex items-center justify-between pb-2">
              <span className="font-bold text-gray-800">
                VPN connection: <span className="font-mono text-[#0073bb]">{selectedVpn.VpnConnectionId}</span>
              </span>
              <Link
                href={`/vpc/vpn-connections/${selectedVpn.VpnConnectionId}`}
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
                onClick={() => setActiveTab("tunnels")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "tunnels"
                    ? "border-[#ec7211] text-[#ec7211] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Tunnel details (2)
              </button>
              <button
                onClick={() => setActiveTab("routes")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "routes"
                    ? "border-[#ec7211] text-[#ec7211] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Static routes ({selectedVpn.Routes.length})
              </button>
              <button
                onClick={() => setActiveTab("tags")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "tags"
                    ? "border-[#ec7211] text-[#ec7211] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Tags ({selectedVpn.Tags ? Object.keys(selectedVpn.Tags).length : 0})
              </button>
            </nav>
          </div>

          <div className="p-4">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-gray-500">VPN ID</dt>
                  <dd className="font-mono text-gray-900 font-medium">{selectedVpn.VpnConnectionId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Customer gateway ID</dt>
                  <dd>
                    <Link
                      href={`/vpc/customer-gateways/${selectedVpn.CustomerGatewayId}`}
                      className="text-[#0073bb] hover:underline font-mono"
                    >
                      {selectedVpn.CustomerGatewayId}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Target gateway</dt>
                  <dd className="font-mono text-[#0073bb]">
                    {selectedVpn.TransitGatewayId ? (
                      <Link href={`/vpc/transit-gateways/${selectedVpn.TransitGatewayId}`} className="hover:underline">
                        {selectedVpn.TransitGatewayId} (TGW)
                      </Link>
                    ) : selectedVpn.VpnGatewayId ? (
                      <Link href={`/vpc/virtual-private-gateways/${selectedVpn.VpnGatewayId}`} className="hover:underline">
                        {selectedVpn.VpnGatewayId} (VGW)
                      </Link>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">State</dt>
                  <dd className="text-gray-900 capitalize font-medium">{selectedVpn.State}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Type</dt>
                  <dd className="text-gray-900">{selectedVpn.Type}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Routing type</dt>
                  <dd className="text-gray-900">{selectedVpn.StaticRoutesOnly ? "Static" : "Dynamic (BGP)"}</dd>
                </div>
              </div>
            )}

            {activeTab === "tunnels" && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                    <th className="py-2 px-3">Tunnel</th>
                    <th className="py-2 px-3">Outside IP address</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-semibold text-gray-800">Tunnel 1</td>
                    <td className="py-2 px-3 font-mono text-gray-700">
                      {selectedVpn.VgwTelemetry?.[0]?.OutsideIpAddress || "52.200.10.1"}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                        {selectedVpn.VgwTelemetry?.[0]?.Status || "UP"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-500">
                      {selectedVpn.VgwTelemetry?.[0]?.StatusMessage || "1 BGP route accepted"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-semibold text-gray-800">Tunnel 2</td>
                    <td className="py-2 px-3 font-mono text-gray-700">
                      {selectedVpn.VgwTelemetry?.[1]?.OutsideIpAddress || "52.200.10.2"}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                        {selectedVpn.VgwTelemetry?.[1]?.Status || "UP"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-500">
                      {selectedVpn.VgwTelemetry?.[1]?.StatusMessage || "1 BGP route accepted"}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {activeTab === "routes" && (
              <div>
                {selectedVpn.Routes.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">
                    {selectedVpn.StaticRoutesOnly
                      ? "No static routes configured."
                      : "Dynamic routing (BGP) enabled. Routes are advertised dynamically across IPSec tunnels."}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                        <th className="py-2 px-3">Destination CIDR</th>
                        <th className="py-2 px-3">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedVpn.Routes.map((r) => (
                        <tr key={r.DestinationCidrBlock}>
                          <td className="py-2 px-3 font-mono text-gray-800">{r.DestinationCidrBlock}</td>
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                              {r.State || "available"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                {!selectedVpn.Tags || Object.keys(selectedVpn.Tags).length === 0 ? (
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
                      {Object.entries(selectedVpn.Tags).map(([k, v]) => (
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

      {/* Download Configuration Modal */}
      {isDownloadModalOpen && selectedVpn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Download configuration</h3>
            <p className="text-xs text-gray-600">
              Download a template configuration file to configure your customer gateway router.
            </p>

            <form onSubmit={handleDownloadConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  value={downloadVendor}
                  onChange={(e) => setDownloadVendor(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#ec7211] bg-white"
                >
                  <option value="Cisco Systems, Inc.">Cisco Systems, Inc.</option>
                  <option value="Juniper Networks, Inc.">Juniper Networks, Inc.</option>
                  <option value="Fortinet">Fortinet</option>
                  <option value="pfSense">pfSense</option>
                  <option value="Generic">Generic / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Platform / Software
                </label>
                <input
                  type="text"
                  value={downloadPlatform}
                  onChange={(e) => setDownloadPlatform(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#ec7211]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  IKE version
                </label>
                <select
                  value={downloadIkeVersion}
                  onChange={(e) => setDownloadIkeVersion(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#ec7211] bg-white"
                >
                  <option value="ikev2">ikev2 (Recommended)</option>
                  <option value="ikev1">ikev1</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDownloadModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={downloadLoading}
                  className="px-4 text-xs font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {downloadLoading ? "Downloading..." : "Download"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedVpn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete VPN connection</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete VPN connection{" "}
              <span className="font-mono font-bold text-red-600">
                {selectedVpn.VpnConnectionId}
              </span>
              ? Traffic across IPSec tunnels will be terminated immediately.
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
                onClick={handleDeleteConnection}
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
