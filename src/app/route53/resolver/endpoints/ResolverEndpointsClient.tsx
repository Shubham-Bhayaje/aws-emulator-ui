"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ResolverEndpointItem,
  listResolverEndpointsAction,
  deleteResolverEndpointAction,
} from "../resolver-actions";
import { formatDateTime } from "@/lib/dateUtils";

interface Props {
  initialEndpoints: ResolverEndpointItem[];
}

export default function ResolverEndpointsClient({ initialEndpoints }: Props) {
  const router = useRouter();
  const [endpoints, setEndpoints] = useState<ResolverEndpointItem[]>(initialEndpoints);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialEndpoints.length > 0 ? initialEndpoints[0].id : null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("ALL");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const selectedEp = endpoints.find((e) => e.id === selectedId);

  const filteredEndpoints = endpoints.filter((ep) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      ep.id.toLowerCase().includes(q) ||
      (ep.name || "").toLowerCase().includes(q) ||
      (ep.hostVpcId || "").toLowerCase().includes(q) ||
      (ep.status || "").toLowerCase().includes(q);

    const matchesDirection =
      directionFilter === "ALL" || (ep.direction || "").toUpperCase() === directionFilter.toUpperCase();

    return matchesSearch && matchesDirection;
  });

  const handleRefresh = async () => {
    const res = await listResolverEndpointsAction();
    if (res.success) {
      setEndpoints(res.endpoints);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    setMessage(null);
    try {
      const res = await deleteResolverEndpointAction(selectedId);
      if (res.success) {
        setEndpoints((prev) =>
          prev.map((e) => (e.id === selectedId ? { ...e, status: "DELETING" } : e))
        );
        setMessage({
          type: "success",
          text: `Resolver endpoint ${selectedId} is deleting.`,
        });
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
      } else {
        setMessage({
          type: "error",
          text: res.error || "Failed to delete resolver endpoint",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link href="/route53/resolver" className="hover:text-[#0073bb]">
          Resolver
        </Link>
        <span>&gt;</span>
        <span className="text-gray-900 font-medium">Resolver endpoints</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#eaeded] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Resolver endpoints</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            Resolver endpoints allow DNS queries to be forwarded between your VPCs and your on-premises network.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              disabled={!selectedId}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#f2f3f3] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              Actions
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {actionMenuOpen && selectedEp && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-[#eaeded] rounded shadow-lg py-1 z-20 text-[13px]">
                <Link
                  href={`/route53/resolver/endpoints/${selectedEp.id}`}
                  className="block px-4 py-1.5 text-gray-700 hover:bg-gray-100"
                  onClick={() => setActionMenuOpen(false)}
                >
                  View details
                </Link>
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-1.5 text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <Link
            href="/route53/resolver/endpoints/create?direction=inbound"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors shadow-sm"
          >
            Create inbound endpoint
          </Link>
          <Link
            href="/route53/resolver/endpoints/create?direction=outbound"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            Create outbound endpoint
          </Link>
        </div>
      </div>

      {/* Notification banner */}
      {message && (
        <div
          className={`p-3 text-[13px] rounded border flex items-center justify-between ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : message.type === "info"
              ? "bg-blue-50 text-blue-800 border-blue-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600 text-sm ml-2">
            x
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-gray-300 rounded focus:outline-none focus:border-[#ec7211]"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-[13px] bg-white text-gray-700 focus:outline-none focus:border-[#ec7211]"
          >
            <option value="ALL">All directions</option>
            <option value="INBOUND">Inbound</option>
            <option value="OUTBOUND">Outbound</option>
          </select>
        </div>
        <button
          onClick={handleRefresh}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="px-3 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors"
          title="Refresh"
        >
          Refresh
        </button>
      </div>

      {/* Endpoints Table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden text-[13px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f2f3f3] text-[#545b64] text-xs uppercase tracking-wider border-b border-[#eaeded]">
              <th className="py-2.5 px-4 w-10"></th>
              <th className="py-2.5 px-4 font-semibold">Name</th>
              <th className="py-2.5 px-4 font-semibold">Endpoint ID</th>
              <th className="py-2.5 px-4 font-semibold">Direction</th>
              <th className="py-2.5 px-4 font-semibold">Status</th>
              <th className="py-2.5 px-4 font-semibold">VPC</th>
              <th className="py-2.5 px-4 font-semibold">IP count</th>
              <th className="py-2.5 px-4 font-semibold">Protocols</th>
              <th className="py-2.5 px-4 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filteredEndpoints.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-500">
                  <p className="font-semibold text-gray-700">No resolver endpoints found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create an inbound endpoint for on-premises to AWS DNS resolution, or an outbound endpoint to forward queries from AWS.
                  </p>
                </td>
              </tr>
            ) : (
              filteredEndpoints.map((ep) => {
                const isSelected = ep.id === selectedId;
                return (
                  <tr
                    key={ep.id}
                    onClick={() => setSelectedId(ep.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f1faff]" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="radio"
                        name="selectedEndpoint"
                        checked={isSelected}
                        onChange={() => setSelectedId(ep.id)}
                        className="text-[#ec7211] focus:ring-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#16191f]">
                      <Link
                        href={`/route53/resolver/endpoints/${ep.id}`}
                        className="text-[#0073bb] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ep.name || "-"}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-gray-600">
                      {ep.id}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                          ep.direction === "INBOUND"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {ep.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                          ep.status === "OPERATIONAL"
                            ? "bg-green-100 text-green-800"
                            : ep.status === "CREATING"
                            ? "bg-yellow-100 text-yellow-800"
                            : ep.status === "DELETING"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ep.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-gray-600">
                      {ep.hostVpcId ? (
                        <Link
                          href={`/vpc/${ep.hostVpcId}`}
                          className="text-[#0073bb] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ep.hostVpcId}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-gray-700">
                      {ep.ipAddressCount}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-gray-600">
                      {(ep.protocols || ["Do53"]).join(", ")}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500 font-mono text-xs" suppressHydrationWarning>
                      {formatDateTime(ep.creationTime)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Endpoint Bottom Drawer */}
      {selectedEp && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4 text-[13px] space-y-3">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
            <span className="font-bold text-[#16191f]">
              Endpoint: <span className="text-[#0073bb] font-mono">{selectedEp.id}</span>
            </span>
            <Link
              href={`/route53/resolver/endpoints/${selectedEp.id}`}
              className="text-[#0073bb] hover:underline text-xs font-medium"
            >
              View details &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-[#545b64]">Direction</div>
              <div className="font-medium text-[#16191f] mt-0.5">{selectedEp.direction}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Status</div>
              <div className="mt-0.5">{selectedEp.status}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Host VPC</div>
              <div className="font-mono text-[#16191f] mt-0.5">{selectedEp.hostVpcId || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Security groups</div>
              <div className="font-mono text-[#16191f] mt-0.5">
                {(selectedEp.securityGroupIds || []).join(", ") || "-"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedEp && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete resolver endpoint</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete resolver endpoint{" "}
              <strong className="text-black">{selectedEp.name || selectedEp.id}</strong> (
              <span className="font-mono">{selectedEp.id}</span>)? DNS traffic forwarded to or from this endpoint will fail.
            </p>
            <div>
              <label className="block text-xs text-[#545b64] mb-1">
                To confirm deletion, type <strong className="text-[#16191f]">delete</strong> in the field below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText("");
                }}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirmText !== "delete" || isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center"
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
