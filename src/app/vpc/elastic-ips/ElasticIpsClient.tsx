"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ElasticIpItem,
  listElasticIpsAction,
  allocateElasticIpAction,
  releaseElasticIpAction,
} from "../actions";

interface Props {
  initialElasticIps: ElasticIpItem[];
}

export default function ElasticIpsClient({ initialElasticIps }: Props) {
  const router = useRouter();

  const [elasticIps, setElasticIps] = useState<ElasticIpItem[]>(initialElasticIps);
  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(
    initialElasticIps.length > 0 ? initialElasticIps[0].AllocationId : null
  );
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Allocate modal
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [tagValue, setTagValue] = useState("");

  // Release modal
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);

  const selectedEip = elasticIps.find((e) => e.AllocationId === selectedAllocationId);

  const refreshElasticIps = async () => {
    setLoading(true);
    try {
      const res = await listElasticIpsAction();
      if (res.success) {
        setElasticIps(res.elasticIps);
        if (selectedAllocationId && !res.elasticIps.some((e) => e.AllocationId === selectedAllocationId)) {
          setSelectedAllocationId(res.elasticIps.length > 0 ? res.elasticIps[0].AllocationId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await allocateElasticIpAction({
        tags: tagValue.trim() ? { Name: tagValue.trim() } : undefined,
      });
      if (res.success && res.allocationId) {
        setIsAllocateModalOpen(false);
        setTagValue("");
        setMessage({
          type: "success",
          text: `Successfully allocated Elastic IP address ${res.publicIp} (${res.allocationId})`,
        });
        await refreshElasticIps();
        setSelectedAllocationId(res.allocationId);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to allocate Elastic IP address" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!selectedEip) return;
    setReleaseLoading(true);
    setMessage(null);
    try {
      const res = await releaseElasticIpAction(selectedEip.AllocationId);
      if (res.success) {
        setIsReleaseModalOpen(false);
        setMessage({
          type: "success",
          text: `Released Elastic IP address ${selectedEip.PublicIp} (${selectedEip.AllocationId})`,
        });
        setElasticIps(elasticIps.filter((e) => e.AllocationId !== selectedEip.AllocationId));
        setSelectedAllocationId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to release Elastic IP address" });
      }
    } finally {
      setReleaseLoading(false);
    }
  };

  const filteredEips = elasticIps.filter((e) => {
    const q = searchQuery.toLowerCase();
    const name = e.Tags?.Name || "";
    return (
      e.AllocationId.toLowerCase().includes(q) ||
      e.PublicIp.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      (e.InstanceId && e.InstanceId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Elastic IP addresses ({elasticIps.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            An Elastic IP address is a static, public IPv4 address designed for dynamic cloud computing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshElasticIps}
            disabled={loading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => {
              if (selectedEip) {
                router.push(`/vpc/elastic-ips/${selectedEip.AllocationId}`);
              }
            }}
            disabled={!selectedEip}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View details
          </button>

          {/* Release button */}
          <button
            onClick={() => setIsReleaseModalOpen(true)}
            disabled={!selectedEip}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Release Elastic IP addresses
          </button>

          {/* Allocate primary button */}
          <button
            onClick={() => {
              setTagValue("");
              setIsAllocateModalOpen(true);
            }}
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Allocate Elastic IP address
          </button>
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
              placeholder="Filter Elastic IP addresses"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
            />
          </div>
          <span className="text-xs text-gray-500">
            Showing {filteredEips.length} of {elasticIps.length} Elastic IP addresses
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 font-semibold">Allocated IPv4 address</th>
                <th className="py-2.5 px-3 font-semibold">Allocation ID</th>
                <th className="py-2.5 px-3 font-semibold">Instance ID</th>
                <th className="py-2.5 px-3 font-semibold">Private IP address</th>
                <th className="py-2.5 px-3 font-semibold">Association ID</th>
                <th className="py-2.5 px-3 font-semibold">Network border group</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {filteredEips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No Elastic IP addresses found.
                  </td>
                </tr>
              ) : (
                filteredEips.map((eip) => {
                  const isSelected = eip.AllocationId === selectedAllocationId;
                  return (
                    <tr
                      key={eip.AllocationId}
                      onClick={() => setSelectedAllocationId(eip.AllocationId)}
                      onDoubleClick={() => router.push(`/vpc/elastic-ips/${eip.AllocationId}`)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-[#F2F8FD]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="radio"
                          name="selected_eip"
                          checked={isSelected}
                          onChange={() => setSelectedAllocationId(eip.AllocationId)}
                          className="h-3.5 w-3.5 text-[#EC7211] focus:ring-[#EC7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[#0073BB]">
                        <Link
                          href={`/vpc/elastic-ips/${eip.AllocationId}`}
                          className="hover:underline"
                        >
                          {eip.PublicIp}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">
                        <Link
                          href={`/vpc/elastic-ips/${eip.AllocationId}`}
                          className="hover:underline"
                        >
                          {eip.AllocationId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {eip.InstanceId || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {eip.PrivateIpAddress || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {eip.AssociationId || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        {eip.NetworkBorderGroup || "us-east-1"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Tabs for Selected Elastic IP */}
      {selectedEip && (
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
                onClick={() => setActiveTab("tags")}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "tags"
                    ? "border-[#EC7211] text-[#EC7211]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Tags ({Object.keys(selectedEip.Tags || {}).length})
              </button>
            </div>
            <Link
              href={`/vpc/elastic-ips/${selectedEip.AllocationId}`}
              className="text-[12px] font-medium text-[#0073bb] hover:underline flex items-center gap-1"
            >
              <span>Open Elastic IP page</span>
              <span>↗</span>
            </Link>
          </div>

          <div className="p-4">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <dt className="text-gray-500 font-medium">Allocated IPv4 address</dt>
                  <dd className="text-gray-900 mt-1 font-mono font-semibold">{selectedEip.PublicIp}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Allocation ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedEip.AllocationId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Associated instance ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedEip.InstanceId || "Not associated"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Association ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedEip.AssociationId || "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Private IP address</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedEip.PrivateIpAddress || "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Network border group</dt>
                  <dd className="text-gray-900 mt-1">{selectedEip.NetworkBorderGroup || "us-east-1"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Scope</dt>
                  <dd className="text-gray-900 mt-1">{selectedEip.Domain || "vpc"}</dd>
                </div>
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                {!selectedEip.Tags || Object.keys(selectedEip.Tags).length === 0 ? (
                  <p className="text-xs text-gray-500">No tags assigned to this Elastic IP address.</p>
                ) : (
                  <table className="w-full text-left text-xs border border-gray-200">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(selectedEip.Tags).map(([key, val]) => (
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

      {/* Allocate Modal */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Allocate Elastic IP address</h2>
              <button
                onClick={() => setIsAllocateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAllocate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Network border group
                </label>
                <input
                  type="text"
                  value="us-east-1"
                  disabled
                  className="w-full text-xs border border-gray-300 rounded p-2 bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Name tag (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MyElasticIp"
                  value={tagValue}
                  onChange={(e) => setTagValue(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Allocating..." : "Allocate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Release Confirmation Modal */}
      {isReleaseModalOpen && selectedEip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Release Elastic IP address</h2>
              <button
                onClick={() => setIsReleaseModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700">
                Are you sure you want to release the Elastic IP address{" "}
                <span className="font-mono font-bold text-gray-900">{selectedEip.PublicIp}</span> ({selectedEip.AllocationId})?
              </p>
              {selectedEip.InstanceId && (
                <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  Warning: This Elastic IP is currently associated with instance {selectedEip.InstanceId}. Releasing it will disassociate it immediately.
                </div>
              )}
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsReleaseModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRelease}
                  disabled={releaseLoading}
                  className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {releaseLoading ? "Releasing..." : "Release"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
