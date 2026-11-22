"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CustomerGatewayItem,
  VpnConnectionItem,
  deleteCustomerGatewayAction,
} from "../../vpn-actions";

interface Props {
  customerGateway: CustomerGatewayItem;
  vpnConnections: VpnConnectionItem[];
}

export default function CustomerGatewayDetailClient({
  customerGateway,
  vpnConnections,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"details" | "connections" | "tags">("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleteLoading(true);
    setErrorMessage(null);
    try {
      const res = await deleteCustomerGatewayAction(customerGateway.CustomerGatewayId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        router.push("/vpc/customer-gateways");
      } else {
        setErrorMessage(res.error || "Failed to delete customer gateway");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
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
        <Link href="/vpc/customer-gateways" className="hover:text-[#0073bb]">
          Customer gateways
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">{customerGateway.CustomerGatewayId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 border border-[#eaeded] rounded shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {customerGateway.Name || customerGateway.CustomerGatewayId}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                customerGateway.State === "available"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              {customerGateway.State}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            {customerGateway.CustomerGatewayId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={customerGateway.State === "deleted"}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete customer gateway
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs rounded border bg-red-50 text-red-800 border-red-200">
          {errorMessage}
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
            onClick={() => setActiveTab("connections")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "connections"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            VPN connections ({vpnConnections.length})
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Tags ({customerGateway.Tags ? Object.keys(customerGateway.Tags).length : 0})
          </button>
        </nav>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-gray-200 rounded p-6 shadow-sm space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">
              Customer gateway details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
              <div>
                <dt className="text-gray-500">Customer gateway ID</dt>
                <dd className="font-mono text-gray-900 font-medium select-all">
                  {customerGateway.CustomerGatewayId}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">IP address</dt>
                <dd className="font-mono text-gray-900 font-medium">{customerGateway.IpAddress}</dd>
              </div>

              <div>
                <dt className="text-gray-500">BGP ASN</dt>
                <dd className="font-mono text-gray-900 font-medium">{customerGateway.BgpAsn}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Type</dt>
                <dd className="text-gray-900">{customerGateway.Type}</dd>
              </div>

              <div>
                <dt className="text-gray-500">State</dt>
                <dd className="text-gray-900 capitalize font-medium">{customerGateway.State}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Device</dt>
                <dd className="text-gray-900">{customerGateway.DeviceName || "-"}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Certificate ARN</dt>
                <dd className="font-mono text-gray-900 truncate">
                  {customerGateway.CertificateArn || "-"}
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: VPN Connections */}
      {activeTab === "connections" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Connected VPN Connections ({vpnConnections.length})</h3>
            <Link
              href={`/vpc/vpn-connections/create?cgwId=${customerGateway.CustomerGatewayId}`}
              className="text-[#0073bb] hover:underline font-medium"
            >
              Create VPN connection &rarr;
            </Link>
          </div>
          {vpnConnections.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No VPN connections associated with this customer gateway.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <th className="py-2.5 px-3 font-semibold">VPN Connection ID</th>
                  <th className="py-2.5 px-3 font-semibold">Name</th>
                  <th className="py-2.5 px-3 font-semibold">Target Gateway</th>
                  <th className="py-2.5 px-3 font-semibold">State</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vpnConnections.map((v) => (
                  <tr key={v.VpnConnectionId} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                      <Link href={`/vpc/vpn-connections/${v.VpnConnectionId}`} className="hover:underline">
                        {v.VpnConnectionId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-gray-900">{v.Name || "-"}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-700">
                      {v.VpnGatewayId || v.TransitGatewayId || "-"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
                        {v.State}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">{v.Type}</td>
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
          {!customerGateway.Tags || Object.keys(customerGateway.Tags).length === 0 ? (
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
                {Object.entries(customerGateway.Tags).map(([k, v]) => (
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete customer gateway</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete customer gateway{" "}
              <span className="font-mono font-bold text-red-600">
                {customerGateway.CustomerGatewayId}
              </span>
              ? Ensure that no VPN connections depend on this customer gateway.
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
                onClick={handleDelete}
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
