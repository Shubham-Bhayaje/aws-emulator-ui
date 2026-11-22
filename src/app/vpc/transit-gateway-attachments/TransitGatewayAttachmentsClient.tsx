"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TransitGatewayAttachmentItem,
  listTransitGatewayAttachmentsAction,
  deleteTransitGatewayAttachmentAction,
} from "../transit-gateway-actions";
import { formatDateTime } from "@/lib/dateUtils";

interface Props {
  initialAttachments: TransitGatewayAttachmentItem[];
}

export default function TransitGatewayAttachmentsClient({ initialAttachments }: Props) {
  const router = useRouter();

  const [attachments, setAttachments] = useState<TransitGatewayAttachmentItem[]>(initialAttachments);
  const [selectedAttId, setSelectedAttId] = useState<string | null>(
    initialAttachments.length > 0 ? initialAttachments[0].TransitGatewayAttachmentId : null
  );
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedAtt = attachments.find((a) => a.TransitGatewayAttachmentId === selectedAttId);

  const refreshAttachments = async () => {
    setLoading(true);
    try {
      const res = await listTransitGatewayAttachmentsAction();
      if (res.success) {
        setAttachments(res.attachments);
        if (selectedAttId && !res.attachments.some((a) => a.TransitGatewayAttachmentId === selectedAttId)) {
          setSelectedAttId(res.attachments.length > 0 ? res.attachments[0].TransitGatewayAttachmentId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttachment = async () => {
    if (!selectedAtt) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteTransitGatewayAttachmentAction(selectedAtt.TransitGatewayAttachmentId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({ type: "success", text: `Deleted attachment ${selectedAtt.TransitGatewayAttachmentId}` });
        setAttachments(attachments.filter((a) => a.TransitGatewayAttachmentId !== selectedAtt.TransitGatewayAttachmentId));
        setSelectedAttId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete transit gateway attachment" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredAttachments = attachments.filter((a) => {
    const q = searchQuery.toLowerCase();
    const name = a.Name || "";
    return (
      a.TransitGatewayAttachmentId.toLowerCase().includes(q) ||
      a.TransitGatewayId.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      (a.ResourceId && a.ResourceId.toLowerCase().includes(q)) ||
      a.ResourceType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transit gateway attachments ({attachments.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Attach VPCs, VPNs, or Direct Connect gateways to your transit gateway.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAttachments}
            disabled={loading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => {
              if (selectedAtt) {
                router.push(`/vpc/transit-gateway-attachments/${selectedAtt.TransitGatewayAttachmentId}`);
              }
            }}
            disabled={!selectedAtt}
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
            disabled={!selectedAtt || selectedAtt.State === "deleted"}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete attachment
          </button>

          <Link
            href="/vpc/transit-gateway-attachments/create"
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create transit gateway attachment
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
              placeholder="Filter attachments by name, ID, or resource"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
            />
          </div>
          <span className="text-xs text-gray-500">
            Showing {filteredAttachments.length} of {attachments.length} attachments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 font-semibold">Name</th>
                <th className="py-2.5 px-3 font-semibold">Attachment ID</th>
                <th className="py-2.5 px-3 font-semibold">Transit gateway ID</th>
                <th className="py-2.5 px-3 font-semibold">Resource type</th>
                <th className="py-2.5 px-3 font-semibold">Resource ID</th>
                <th className="py-2.5 px-3 font-semibold">State</th>
                <th className="py-2.5 px-3 font-semibold">Association route table</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {filteredAttachments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No transit gateway attachments found. Click &quot;Create transit gateway attachment&quot; to connect a VPC.
                  </td>
                </tr>
              ) : (
                filteredAttachments.map((att) => {
                  const isSelected = att.TransitGatewayAttachmentId === selectedAttId;
                  const isAvailable = att.State === "available";
                  return (
                    <tr
                      key={att.TransitGatewayAttachmentId}
                      onClick={() => setSelectedAttId(att.TransitGatewayAttachmentId)}
                      onDoubleClick={() => router.push(`/vpc/transit-gateway-attachments/${att.TransitGatewayAttachmentId}`)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-[#F2F8FD]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="radio"
                          name="selected_att"
                          checked={isSelected}
                          onChange={() => setSelectedAttId(att.TransitGatewayAttachmentId)}
                          className="h-3.5 w-3.5 text-[#EC7211] focus:ring-[#EC7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        <Link
                          href={`/vpc/transit-gateway-attachments/${att.TransitGatewayAttachmentId}`}
                          className="hover:underline"
                        >
                          {att.Name || "-"}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073BB]">
                        <Link
                          href={`/vpc/transit-gateway-attachments/${att.TransitGatewayAttachmentId}`}
                          className="hover:underline"
                        >
                          {att.TransitGatewayAttachmentId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073BB]">
                        <Link
                          href={`/vpc/transit-gateways/${att.TransitGatewayId}`}
                          className="hover:underline"
                        >
                          {att.TransitGatewayId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 uppercase text-gray-700">
                        {att.ResourceType}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073BB]">
                        {att.ResourceType === "vpc" && att.ResourceId ? (
                          <Link href={`/vpc/vpcs/${att.ResourceId}`} className="hover:underline">
                            {att.ResourceId}
                          </Link>
                        ) : (
                          att.ResourceId || "-"
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            isAvailable
                              ? "bg-green-100 text-green-800"
                              : att.State === "deleted"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {att.State}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#545b64]">
                        {att.AssociationRouteTableId ? (
                          <Link
                            href={`/vpc/transit-gateway-route-tables/${att.AssociationRouteTableId}`}
                            className="text-[#0073bb] hover:underline"
                          >
                            {att.AssociationRouteTableId}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Tabs for Selected Attachment */}
      {selectedAtt && (
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
                Tags ({Object.keys(selectedAtt.Tags || {}).length})
              </button>
            </div>
            <Link
              href={`/vpc/transit-gateway-attachments/${selectedAtt.TransitGatewayAttachmentId}`}
              className="text-[12px] font-medium text-[#0073bb] hover:underline flex items-center gap-1"
            >
              <span>Open attachment page</span>
              <span>↗</span>
            </Link>
          </div>

          <div className="p-4">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <dt className="text-gray-500 font-medium">Attachment ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono font-semibold">{selectedAtt.TransitGatewayAttachmentId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Transit gateway ID</dt>
                  <dd className="text-gray-900 mt-1" suppressHydrationWarning>
                    <Link
                      href={`/vpc/transit-gateways/${selectedAtt.TransitGatewayId}`}
                      className="text-[#0073bb] hover:underline font-mono"
                    >
                      {selectedAtt.TransitGatewayId}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">State</dt>
                  <dd className="text-gray-900 mt-1 capitalize">{selectedAtt.State}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Resource type</dt>
                  <dd className="text-gray-900 mt-1 uppercase">{selectedAtt.ResourceType}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Resource ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">
                    {selectedAtt.ResourceType === "vpc" && selectedAtt.ResourceId ? (
                      <Link href={`/vpc/vpcs/${selectedAtt.ResourceId}`} className="text-[#0073bb] hover:underline">
                        {selectedAtt.ResourceId}
                      </Link>
                    ) : (
                      selectedAtt.ResourceId || "-"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Association route table ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">
                    {selectedAtt.AssociationRouteTableId ? (
                      <Link
                        href={`/vpc/transit-gateway-route-tables/${selectedAtt.AssociationRouteTableId}`}
                        className="text-[#0073bb] hover:underline"
                      >
                        {selectedAtt.AssociationRouteTableId}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Created at</dt>
                  <dd className="text-gray-900 mt-1" suppressHydrationWarning>
                    {formatDateTime(selectedAtt.CreationTime)}
                  </dd>
                </div>
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                {!selectedAtt.Tags || Object.keys(selectedAtt.Tags).length === 0 ? (
                  <p className="text-xs text-gray-500">No tags assigned to this attachment.</p>
                ) : (
                  <table className="w-full text-left text-xs border border-gray-200">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(selectedAtt.Tags).map(([key, val]) => (
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
      {isDeleteModalOpen && selectedAtt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Delete transit gateway attachment</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700">
                Are you sure you want to delete attachment{" "}
                <span className="font-mono font-bold text-gray-900">{selectedAtt.TransitGatewayAttachmentId}</span>?
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
                  onClick={handleDeleteAttachment}
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
