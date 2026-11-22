"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  VpnConnectionItem,
  CustomerGatewayItem,
  VirtualPrivateGatewayItem,
  deleteVpnConnectionAction,
  createVpnConnectionRouteAction,
  deleteVpnConnectionRouteAction,
  downloadVpnConfigurationAction,
  getVpnConnectionDetailAction,
} from "../../vpn-actions";

interface Props {
  vpnConnection: VpnConnectionItem;
  customerGateway?: CustomerGatewayItem;
  virtualPrivateGateway?: VirtualPrivateGatewayItem;
}

export default function VpnConnectionDetailClient({
  vpnConnection: initialVpn,
  customerGateway,
  virtualPrivateGateway,
}: Props) {
  const router = useRouter();

  const [vpn, setVpn] = useState<VpnConnectionItem>(initialVpn);
  const [activeTab, setActiveTab] = useState<"details" | "tunnels" | "routes" | "tags">("details");

  // Download Config Modal
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadVendor, setDownloadVendor] = useState("Cisco Systems, Inc.");
  const [downloadPlatform, setDownloadPlatform] = useState("ISR Series Cisco IOS 15.2");
  const [downloadIkeVersion, setDownloadIkeVersion] = useState("ikev2");
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Add Route Modal
  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);
  const [newCidr, setNewCidr] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);

  // Delete VPN Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const refreshDetails = async () => {
    const res = await getVpnConnectionDetailAction(vpn.VpnConnectionId);
    if (res.success && res.vpnConnection) {
      setVpn(res.vpnConnection);
    }
  };

  const handleDownloadConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setDownloadLoading(true);
    try {
      const res = await downloadVpnConfigurationAction({
        vpnConnectionId: vpn.VpnConnectionId,
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

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCidr.trim()) return;
    setRouteLoading(true);
    setMessage(null);
    try {
      const res = await createVpnConnectionRouteAction(vpn.VpnConnectionId, newCidr.trim());
      if (res.success) {
        setIsAddRouteOpen(false);
        setNewCidr("");
        setMessage({ type: "success", text: `Added static route ${newCidr}` });
        await refreshDetails();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to add route" });
      }
    } finally {
      setRouteLoading(false);
    }
  };

  const handleDeleteRoute = async (destCidr: string) => {
    setMessage(null);
    try {
      const res = await deleteVpnConnectionRouteAction(vpn.VpnConnectionId, destCidr);
      if (res.success) {
        setMessage({ type: "success", text: `Deleted static route ${destCidr}` });
        await refreshDetails();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete route" });
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleDeleteConnection = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteVpnConnectionAction(vpn.VpnConnectionId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        router.push("/vpc/vpn-connections");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete VPN connection" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Virtual Private Cloud
        </Link>
        <span>&gt;</span>
        <Link href="/vpc/vpn-connections" className="hover:text-[#0073bb]">
          Site-to-Site VPN connections
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">{vpn.VpnConnectionId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 border border-[#eaeded] rounded shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {vpn.Name || vpn.VpnConnectionId}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                vpn.State === "available"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              {vpn.State}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            {vpn.VpnConnectionId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Download configuration
          </button>

          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={vpn.State === "deleted"}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete VPN connection
          </button>
        </div>
      </div>

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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("tunnels")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "tunnels"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Tunnel details (2)
          </button>
          <button
            onClick={() => setActiveTab("routes")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "routes"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Static routes ({vpn.Routes.length})
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Tags ({vpn.Tags ? Object.keys(vpn.Tags).length : 0})
          </button>
        </nav>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-gray-200 rounded p-6 shadow-sm space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">
              VPN connection details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
              <div>
                <dt className="text-gray-500">VPN connection ID</dt>
                <dd className="font-mono text-gray-900 font-medium select-all">
                  {vpn.VpnConnectionId}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Customer gateway ID</dt>
                <dd>
                  <Link
                    href={`/vpc/customer-gateways/${vpn.CustomerGatewayId}`}
                    className="text-[#0073bb] hover:underline font-mono"
                  >
                    {vpn.CustomerGatewayId}
                    {customerGateway?.Name ? ` (${customerGateway.Name})` : ""}
                  </Link>
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Customer gateway IP</dt>
                <dd className="font-mono text-gray-900">
                  {customerGateway?.IpAddress || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Target gateway</dt>
                <dd className="font-mono text-[#0073bb]">
                  {vpn.TransitGatewayId ? (
                    <Link href={`/vpc/transit-gateways/${vpn.TransitGatewayId}`} className="hover:underline">
                      {vpn.TransitGatewayId} (TGW)
                    </Link>
                  ) : vpn.VpnGatewayId ? (
                    <Link href={`/vpc/virtual-private-gateways/${vpn.VpnGatewayId}`} className="hover:underline">
                      {vpn.VpnGatewayId} (VGW)
                      {virtualPrivateGateway?.Name ? ` (${virtualPrivateGateway.Name})` : ""}
                    </Link>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">State</dt>
                <dd className="text-gray-900 capitalize font-medium">{vpn.State}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Type</dt>
                <dd className="text-gray-900">{vpn.Type}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Routing type</dt>
                <dd className="text-gray-900">{vpn.StaticRoutesOnly ? "Static" : "Dynamic (BGP)"}</dd>
              </div>

              {vpn.TransitGatewayAttachmentId && (
                <div>
                  <dt className="text-gray-500">Transit gateway attachment ID</dt>
                  <dd>
                    <Link
                      href={`/vpc/transit-gateway-attachments/${vpn.TransitGatewayAttachmentId}`}
                      className="text-[#0073bb] hover:underline font-mono"
                    >
                      {vpn.TransitGatewayAttachmentId}
                    </Link>
                  </dd>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tunnel Details */}
      {activeTab === "tunnels" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-900">IPSec Tunnels</h3>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Each AWS Site-to-Site VPN connection includes two active-active or active-standby IPSec tunnels for high availability.
            </p>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                <th className="py-2.5 px-3 font-semibold">Tunnel</th>
                <th className="py-2.5 px-3 font-semibold">Outside IP address</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Status details</th>
                <th className="py-2.5 px-3 font-semibold">Accepted route count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-3 font-semibold text-gray-800">Tunnel 1</td>
                <td className="py-3 px-3 font-mono text-gray-700">
                  {vpn.VgwTelemetry?.[0]?.OutsideIpAddress || "52.200.10.1"}
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-800 border border-green-200">
                    {vpn.VgwTelemetry?.[0]?.Status || "UP"}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-600">
                  {vpn.VgwTelemetry?.[0]?.StatusMessage || "1 BGP route accepted"}
                </td>
                <td className="py-3 px-3 font-mono text-gray-700">
                  {vpn.VgwTelemetry?.[0]?.AcceptedRouteCount ?? 1}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-3 font-semibold text-gray-800">Tunnel 2</td>
                <td className="py-3 px-3 font-mono text-gray-700">
                  {vpn.VgwTelemetry?.[1]?.OutsideIpAddress || "52.200.10.2"}
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-800 border border-green-200">
                    {vpn.VgwTelemetry?.[1]?.Status || "UP"}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-600">
                  {vpn.VgwTelemetry?.[1]?.StatusMessage || "1 BGP route accepted"}
                </td>
                <td className="py-3 px-3 font-mono text-gray-700">
                  {vpn.VgwTelemetry?.[1]?.AcceptedRouteCount ?? 1}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Static Routes */}
      {activeTab === "routes" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Static routes ({vpn.Routes.length})</h3>
              <p className="text-gray-500 text-[11px] mt-0.5">
                Static IP prefixes routed across this VPN connection.
              </p>
            </div>
            {vpn.StaticRoutesOnly && (
              <button
                onClick={() => setIsAddRouteOpen(true)}
                className="px-3 text-xs font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Add static route
              </button>
            )}
          </div>

          {!vpn.StaticRoutesOnly ? (
            <div className="p-6 text-center text-gray-500 border border-dashed rounded bg-gray-50">
              This VPN connection uses dynamic routing (BGP). Static route table entries are not required because routes are exchanged dynamically.
            </div>
          ) : vpn.Routes.length === 0 ? (
            <div className="p-6 text-center text-gray-500 border border-dashed rounded bg-gray-50">
              No static routes configured. Click &apos;Add static route&apos; to route traffic.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <th className="py-2.5 px-3 font-semibold">Destination CIDR</th>
                  <th className="py-2.5 px-3 font-semibold">State</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vpn.Routes.map((r) => (
                  <tr key={r.DestinationCidrBlock} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono font-medium text-gray-900">{r.DestinationCidrBlock}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                        {r.State || "available"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteRoute(r.DestinationCidrBlock)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-900">Tags</h3>
          </div>
          {!vpn.Tags || Object.keys(vpn.Tags).length === 0 ? (
            <div className="p-6 text-center text-gray-500">No tags assigned.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <th className="py-2 px-3 font-semibold">Key</th>
                  <th className="py-2 px-3 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(vpn.Tags).map(([k, v]) => (
                  <tr key={k} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono text-gray-800">{k}</td>
                    <td className="py-2 px-3 text-gray-600">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Download Configuration Modal */}
      {isDownloadModalOpen && (
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

      {/* Add Route Modal */}
      {isAddRouteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Add static route</h3>
            <p className="text-xs text-gray-600">
              Add a static CIDR block to VPN connection{" "}
              <span className="font-mono font-medium">{vpn.VpnConnectionId}</span>.
            </p>

            <form onSubmit={handleAddRoute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Destination CIDR block <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.10.0/24"
                  value={newCidr}
                  onChange={(e) => setNewCidr(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#ec7211]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRouteOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={routeLoading || !newCidr.trim()}
                  className="px-4 text-xs font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {routeLoading ? "Adding..." : "Add route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete VPN connection</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete VPN connection{" "}
              <span className="font-mono font-bold text-red-600">
                {vpn.VpnConnectionId}
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
