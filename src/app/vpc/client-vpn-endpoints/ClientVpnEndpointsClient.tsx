"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClientVpnEndpointItem,
  deleteClientVpnEndpointAction,
  generateClientVpnConfigurationAction,
} from "../client-vpn-actions";

interface Props {
  initialEndpoints: ClientVpnEndpointItem[];
}

export default function ClientVpnEndpointsClient({ initialEndpoints }: Props) {
  const router = useRouter();
  const [endpoints, setEndpoints] = useState<ClientVpnEndpointItem[]>(initialEndpoints);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Download Config Modal
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadConfigData, setDownloadConfigData] = useState<{ filename: string; content: string } | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const selectedEndpoint = endpoints.find((e) => e.ClientVpnEndpointId === selectedId);

  const filteredEndpoints = endpoints.filter((e) => {
    const term = searchTerm.toLowerCase();
    const id = e.ClientVpnEndpointId.toLowerCase();
    const name = (e.Name || "").toLowerCase();
    const cidr = (e.ClientCidrBlock || "").toLowerCase();
    return id.includes(term) || name.includes(term) || cidr.includes(term);
  });

  const handleRefresh = () => {
    router.refresh();
  };

  const handleOpenDownloadConfig = async (endpointId: string) => {
    setDownloadLoading(true);
    setActionMessage(null);
    try {
      const res = await generateClientVpnConfigurationAction(endpointId);
      if (res.success) {
        setDownloadConfigData({
          filename: res.filename,
          content: res.configContent,
        });
        setIsDownloadModalOpen(true);
      } else {
        setActionMessage({
          type: "error",
          text: res.error || "Failed to generate configuration file.",
        });
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadFile = () => {
    if (!downloadConfigData) return;
    const blob = new Blob([downloadConfigData.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadConfigData.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteEndpoint = async () => {
    if (!selectedId) return;
    setDeleteLoading(true);
    setActionMessage(null);
    try {
      const res = await deleteClientVpnEndpointAction(selectedId);
      if (res.success) {
        setEndpoints((prev) => prev.filter((e) => e.ClientVpnEndpointId !== selectedId));
        setSelectedId(null);
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
        setActionMessage({
          type: "success",
          text: `Client VPN endpoint ${selectedId} deleted successfully.`,
        });
      } else {
        // If emulator returned NotImplemented
        if (res.error?.includes("NotImplemented")) {
          setActionMessage({
            type: "info",
            text: `Notice: DeleteClientVpnEndpoint is scaffolded in the AWS emulator. In production AWS, this endpoint would transition to deleting and delete. (${res.error})`,
          });
          setIsDeleteModalOpen(false);
        } else {
          setActionMessage({
            type: "error",
            text: res.error || "Failed to delete client VPN endpoint.",
          });
        }
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
        <span className="text-[#16191f] font-medium">Client VPN endpoints</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Client VPN endpoints</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Client VPN endpoints allow end-users to securely connect to Amazon VPCs and on-premises networks using OpenVPN-based clients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="px-3 text-xs font-semibold text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-gray-50 transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Refresh
          </button>

          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              disabled={!selectedId}
              className={`px-3 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5 shadow-sm ${
                selectedId
                  ? "bg-white border-[#d5dbdb] text-[#16191f] hover:bg-gray-50"
                  : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              <span>Actions</span>
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {actionMenuOpen && selectedId && (
              <div
                className="absolute right-0 mt-1 w-64 bg-white border border-[#d5dbdb] rounded shadow-lg py-1 z-20 text-[13px]"
                onMouseLeave={() => setActionMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    handleOpenDownloadConfig(selectedId);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#16191f]"
                >
                  Download client configuration
                </button>
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    router.push(`/vpc/client-vpn-endpoints/${selectedId}?tab=associations`);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#16191f]"
                >
                  Associate target network
                </button>
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    router.push(`/vpc/client-vpn-endpoints/${selectedId}?tab=routes`);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#16191f]"
                >
                  Manage routes
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                >
                  Delete client VPN endpoint
                </button>
              </div>
            )}
          </div>

          <Link
            href="/vpc/client-vpn-endpoints/create"
            className="inline-flex items-center justify-center px-4 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded shadow-sm transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create client VPN endpoint
          </Link>
        </div>
      </div>

      {/* Action Banner Message */}
      {actionMessage && (
        <div
          className={`p-3 rounded border text-[13px] flex items-center justify-between ${
            actionMessage.type === "success"
              ? "bg-[#f2fcf5] border-[#037f0c] text-[#037f0c]"
              : actionMessage.type === "info"
              ? "bg-[#f1faff] border-[#0073bb] text-[#0073bb]"
              : "bg-[#fdf2f2] border-[#d13212] text-[#d13212]"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-gray-600 font-bold ml-4">
            x
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden shadow-sm">
        {/* Table Toolbar */}
        <div className="px-4 py-3 border-b border-[#eaeded] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Filter by Endpoint ID, Name, or CIDR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 text-xs border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px" }}
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="text-xs text-[#545b64]">
            {filteredEndpoints.length} {filteredEndpoints.length === 1 ? "endpoint" : "endpoints"}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                <th className="py-2.5 px-4 w-10"></th>
                <th className="py-2.5 px-4 font-semibold">Name</th>
                <th className="py-2.5 px-4 font-semibold">Endpoint ID</th>
                <th className="py-2.5 px-4 font-semibold">State</th>
                <th className="py-2.5 px-4 font-semibold">Client IPv4 CIDR</th>
                <th className="py-2.5 px-4 font-semibold">DNS name</th>
                <th className="py-2.5 px-4 font-semibold">Split tunnel</th>
                <th className="py-2.5 px-4 font-semibold">Protocol / Port</th>
                <th className="py-2.5 px-4 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredEndpoints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    <p className="font-semibold text-gray-700">No client VPN endpoints found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Create an endpoint to enable remote user VPN access.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEndpoints.map((ep) => {
                  const isSelected = selectedId === ep.ClientVpnEndpointId;
                  const isAvailable = ep.Status?.Code === "available";
                  const isPending = ep.Status?.Code === "pending-associate";

                  return (
                    <tr
                      key={ep.ClientVpnEndpointId}
                      onClick={() => setSelectedId(ep.ClientVpnEndpointId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-orange-50/50 hover:bg-orange-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <input
                          type="radio"
                          name="selectedEndpoint"
                          checked={isSelected}
                          onChange={() => setSelectedId(ep.ClientVpnEndpointId)}
                          className="text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#16191f]">
                        {ep.Name && ep.Name !== ep.ClientVpnEndpointId ? ep.Name : "-"}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-[#0073bb]">
                        <Link
                          href={`/vpc/client-vpn-endpoints/${ep.ClientVpnEndpointId}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ep.ClientVpnEndpointId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isAvailable
                              ? "bg-green-100 text-green-800"
                              : isPending
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {ep.Status?.Code || "unknown"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#16191f]">
                        {ep.ClientCidrBlock || "-"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-gray-600 max-w-xs truncate" title={ep.DnsName}>
                        {ep.DnsName || "-"}
                      </td>
                      <td className="py-2.5 px-4 text-gray-700">
                        {ep.SplitTunnel ? "Enabled" : "Disabled"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-gray-700 uppercase">
                        {ep.TransportProtocol || "udp"}:{ep.VpnPort || 443}
                      </td>
                      <td className="py-2.5 px-4 text-gray-500 font-mono text-[12px]" suppressHydrationWarning>
                        {ep.CreationTime ? new Date(ep.CreationTime).toLocaleString() : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Endpoint Preview Card */}
      {selectedEndpoint && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block">Selected Endpoint</span>
              <h3 className="text-base font-bold text-[#16191f] font-mono mt-0.5">
                {selectedEndpoint.ClientVpnEndpointId}
                {selectedEndpoint.Name && selectedEndpoint.Name !== selectedEndpoint.ClientVpnEndpointId && (
                  <span className="ml-2 font-normal text-gray-600">({selectedEndpoint.Name})</span>
                )}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenDownloadConfig(selectedEndpoint.ClientVpnEndpointId)}
                disabled={downloadLoading}
                className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {downloadLoading ? "Generating..." : "Download configuration"}
              </button>
              <Link
                href={`/vpc/client-vpn-endpoints/${selectedEndpoint.ClientVpnEndpointId}`}
                className="px-3 text-xs font-semibold text-white bg-[#0073bb] hover:bg-[#005a9e] rounded shadow-sm transition-colors flex items-center justify-center"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                View details
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
            <div>
              <div className="text-xs text-[#545b64] font-medium">DNS Name</div>
              <div className="font-mono text-[12px] text-[#16191f] mt-1 break-all">
                {selectedEndpoint.DnsName || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#545b64] font-medium">Server Certificate ARN</div>
              <div className="font-mono text-[11px] text-[#16191f] mt-1 truncate" title={selectedEndpoint.ServerCertificateArn}>
                {selectedEndpoint.ServerCertificateArn || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#545b64] font-medium">Session Timeout</div>
              <div className="text-[#16191f] mt-1">{selectedEndpoint.SessionTimeoutHours || 24} hours</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64] font-medium">Connection Logging</div>
              <div className="text-[#16191f] mt-1">
                {selectedEndpoint.ConnectionLogOptions?.Enabled ? (
                  <span className="text-green-700 font-medium">Enabled ({selectedEndpoint.ConnectionLogOptions.CloudWatchLogGroup})</span>
                ) : (
                  <span className="text-gray-500">Disabled</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Config Modal */}
      {isDownloadModalOpen && downloadConfigData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-[#16191f]">Download client configuration</h3>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                x
              </button>
            </div>

            <p className="text-xs text-[#545b64]">
              This OpenVPN configuration profile (.ovpn) contains connection directives and certificates to connect to this endpoint using the AWS Client VPN Desktop Application or standard OpenVPN clients.
            </p>

            <div>
              <label className="text-xs font-semibold text-[#16191f] block mb-1">
                Configuration file preview ({downloadConfigData.filename})
              </label>
              <pre className="p-3 bg-gray-900 text-green-400 font-mono text-[11px] rounded max-h-64 overflow-y-auto whitespace-pre-wrap">
                {downloadConfigData.content}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setIsDownloadModalOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDownloadFile}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Download .ovpn file
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedEndpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete client VPN endpoint</h3>
            <p className="text-xs text-[#545b64]">
              Are you sure you want to delete client VPN endpoint{" "}
              <strong className="text-black font-mono">{selectedEndpoint.ClientVpnEndpointId}</strong>?
              This will disassociate all subnets and terminate client tunnels.
            </p>
            <div>
              <label className="text-xs font-semibold text-[#16191f] block mb-1">
                Type <strong>delete</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full text-xs border border-[#aab7b8] rounded p-2"
                style={{ height: "32px" }}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText("");
                }}
                className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== "delete" || deleteLoading}
                onClick={handleDeleteEndpoint}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded transition-colors shadow-sm ${
                  deleteConfirmText === "delete" && !deleteLoading
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-gray-300 cursor-not-allowed"
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
