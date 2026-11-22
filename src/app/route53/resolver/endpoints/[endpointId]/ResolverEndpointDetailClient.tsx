"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/dateUtils";
import {
  ResolverEndpointItem,
  ResolverEndpointIpAddressItem,
  deleteResolverEndpointAction,
  getResolverEndpointDetailAction,
} from "../../resolver-actions";

interface Props {
  endpoint: ResolverEndpointItem;
  initialIpAddresses: ResolverEndpointIpAddressItem[];
}

export default function ResolverEndpointDetailClient({ endpoint: initialEndpoint, initialIpAddresses }: Props) {
  const router = useRouter();
  const [endpoint, setEndpoint] = useState<ResolverEndpointItem>(initialEndpoint);
  const [ipAddresses, setIpAddresses] = useState<ResolverEndpointIpAddressItem[]>(initialIpAddresses);
  const [activeTab, setActiveTab] = useState<"overview" | "ip-addresses" | "tags">("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refreshData = async () => {
    setRefreshing(true);
    const res = await getResolverEndpointDetailAction(endpoint.id);
    if (res.success && res.endpoint) {
      setEndpoint(res.endpoint);
      setIpAddresses(res.ipAddresses);
    }
    setRefreshing(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmInput !== "delete") return;
    setIsDeleting(true);
    setDeleteError(null);
    const res = await deleteResolverEndpointAction(endpoint.id);
    if (res.success) {
      setShowDeleteModal(false);
      router.push("/route53/resolver/endpoints");
      router.refresh();
    } else {
      setDeleteError(res.error || "Failed to delete endpoint");
      setIsDeleting(false);
    }
  };

  const statusColor = (status?: string) => {
    switch (status) {
      case "OPERATIONAL":
      case "RESOLVING":
        return "bg-green-50 text-green-700 border-green-200";
      case "CREATING":
      case "UPDATING":
      case "IMPORTING":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ACTION_NEEDED":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "DELETING":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-xs text-gray-500 space-x-2">
        <Link href="/route53/resolver" className="hover:text-blue-600">
          Route 53 Resolver
        </Link>
        <span>&rsaquo;</span>
        <Link href="/route53/resolver/endpoints" className="hover:text-blue-600">
          Inbound and outbound endpoints
        </Link>
        <span>&rsaquo;</span>
        <span className="text-gray-900 font-medium font-mono">{endpoint.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{endpoint.name || endpoint.id}</h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(
                endpoint.status
              )}`}
            >
              {endpoint.status || "UNKNOWN"}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              {endpoint.direction}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-mono">{endpoint.id}</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={refreshData}
            disabled={refreshing}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 border border-red-300 bg-white hover:bg-red-50 text-red-700 text-xs font-semibold rounded shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 font-semibold border-b-2 ${
              activeTab === "overview"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("ip-addresses")}
            className={`pb-3 font-semibold border-b-2 flex items-center space-x-1.5 ${
              activeTab === "ip-addresses"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>IP addresses</span>
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {ipAddresses.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-3 font-semibold border-b-2 ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Tags
          </button>
        </nav>
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Endpoint details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              <div>
                <dt className="text-gray-500 font-medium">Endpoint ID</dt>
                <dd className="font-mono text-gray-900 mt-1 select-all">{endpoint.id}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Endpoint name</dt>
                <dd className="text-gray-900 mt-1">{endpoint.name || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Endpoint direction</dt>
                <dd className="text-gray-900 mt-1 font-semibold">{endpoint.direction}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(
                      endpoint.status
                    )}`}
                  >
                    {endpoint.status || "UNKNOWN"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Status message</dt>
                <dd className="text-gray-900 mt-1">{endpoint.statusMessage || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">VPC ID</dt>
                <dd className="text-gray-900 mt-1">
                  {endpoint.hostVpcId ? (
                    <Link
                      href={`/vpc/vpcs/${endpoint.hostVpcId}`}
                      className="text-[#0073bb] hover:underline font-mono"
                    >
                      {endpoint.hostVpcId}
                    </Link>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Security group IDs</dt>
                <dd className="text-gray-900 mt-1 space-x-1 font-mono">
                  {endpoint.securityGroupIds && endpoint.securityGroupIds.length > 0 ? (
                    endpoint.securityGroupIds.map((sg) => (
                      <Link
                        key={sg}
                        href={`/vpc/security-groups/${sg}`}
                        className="text-[#0073bb] hover:underline inline-block mr-1"
                      >
                        {sg}
                      </Link>
                    ))
                  ) : (
                    <span>-</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Protocols</dt>
                <dd className="text-gray-900 mt-1">
                  {endpoint.protocols && endpoint.protocols.length > 0
                    ? endpoint.protocols.join(", ")
                    : "Do53"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">IP address count</dt>
                <dd className="text-gray-900 mt-1">{endpoint.ipAddressCount ?? ipAddresses.length}</dd>
              </div>
              <div className="col-span-full">
                <dt className="text-gray-500 font-medium">Amazon Resource Name (ARN)</dt>
                <dd className="font-mono text-gray-800 text-[11px] mt-1 break-all select-all">
                  {endpoint.arn || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Creation time</dt>
                <dd className="text-gray-900 mt-1 font-mono" suppressHydrationWarning>
                  {formatDateTime(endpoint.creationTime)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Last modified time</dt>
                <dd className="text-gray-900 mt-1 font-mono" suppressHydrationWarning>
                  {formatDateTime(endpoint.modificationTime)}
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: IP Addresses */}
      {activeTab === "ip-addresses" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {endpoint.direction === "INBOUND" ? "Inbound IP addresses" : "Outbound IP addresses"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Each IP address is associated with an Elastic Network Interface in the selected subnet.
              </p>
            </div>
            <span className="text-xs text-gray-500">{ipAddresses.length} IP address(es)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafafa] text-gray-600 border-b border-gray-200 font-medium">
                <tr>
                  <th className="py-2.5 px-4">IP ID</th>
                  <th className="py-2.5 px-4">Subnet ID</th>
                  <th className="py-2.5 px-4">IPv4 address</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Status message</th>
                  <th className="py-2.5 px-4">Creation time</th>
                  <th className="py-2.5 px-4">Modification time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ipAddresses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">
                      No IP addresses found for this endpoint.
                    </td>
                  </tr>
                ) : (
                  ipAddresses.map((ip) => (
                    <tr key={ip.ipId || ip.ip} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-mono text-gray-900">{ip.ipId || "-"}</td>
                      <td className="py-2.5 px-4 font-mono text-[#0073bb]">
                        <Link href={`/vpc/subnets/${ip.subnetId}`} className="hover:underline">
                          {ip.subnetId || "-"}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-900">{ip.ip || "-"}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border ${statusColor(
                            ip.status
                          )}`}
                        >
                          {ip.status || "ATTACHED"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-500">{ip.statusMessage || "-"}</td>
                      <td className="py-2.5 px-4 text-gray-500 font-mono" suppressHydrationWarning>
                        {formatDateTime(ip.creationTime)}
                      </td>
                      <td className="py-2.5 px-4 text-gray-500 font-mono" suppressHydrationWarning>
                        {formatDateTime(ip.modificationTime)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Tags</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tags are key-value pairs that let you categorize your Route 53 Resolver endpoints.
              </p>
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fafafa] text-gray-600 border-b border-gray-200 font-medium">
              <tr>
                <th className="py-2 px-3">Key</th>
                <th className="py-2 px-3">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-3 font-mono text-gray-700">Name</td>
                <td className="py-2 px-3 font-mono text-gray-900">{endpoint.name || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-300 p-6 space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Delete endpoint</h3>
            </div>

            <p className="text-xs text-gray-600">
              Are you sure you want to delete the resolver endpoint{" "}
              <strong className="text-gray-900 font-mono">{endpoint.name || endpoint.id}</strong>?
            </p>

            <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-800 space-y-1">
              <p className="font-bold">Warning:</p>
              <p>
                Deleting this endpoint will release all associated Elastic Network Interfaces and IP
                addresses. DNS queries relying on this endpoint will fail.
              </p>
            </div>

            {deleteError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-700 mb-1 font-medium">
                To confirm deletion, type <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600 font-bold">delete</code> below:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="delete"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmInput("");
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmInput !== "delete" || isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete endpoint"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
