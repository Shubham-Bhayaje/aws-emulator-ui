"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DxConnectionItem,
  deleteConnectionAction,
  generateLoaCfaAction,
} from "../dx-actions";

interface Props {
  initialConnections: DxConnectionItem[];
}

export default function ConnectionsClient({ initialConnections }: Props) {
  const router = useRouter();
  const [connections, setConnections] = useState<DxConnectionItem[]>(initialConnections);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  // Modal: Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Modal: Download LOA-CFA
  const [isLoaModalOpen, setIsLoaModalOpen] = useState(false);
  const [loaData, setLoaData] = useState<{ title: string; content: string } | null>(null);
  const [loaLoading, setLoaLoading] = useState(false);

  const selectedConnection = connections.find((c) => c.connectionId === selectedId);

  const filteredConnections = connections.filter((c) => {
    const term = searchTerm.toLowerCase();
    const id = c.connectionId.toLowerCase();
    const name = (c.connectionName || "").toLowerCase();
    const loc = (c.location || "").toLowerCase();
    const bw = (c.bandwidth || "").toLowerCase();
    return id.includes(term) || name.includes(term) || loc.includes(term) || bw.includes(term);
  });

  const handleRefresh = () => {
    router.refresh();
  };

  const handleOpenLoa = async (connId: string) => {
    setLoaLoading(true);
    setMessage(null);
    try {
      const res = await generateLoaCfaAction(connId);
      if (res.success) {
        setLoaData({
          title: res.documentTitle,
          content: res.documentContent,
        });
        setIsLoaModalOpen(true);
      } else {
        setMessage({
          type: "error",
          text: res.error || "Failed to generate LOA-CFA document",
        });
      }
    } finally {
      setLoaLoading(false);
    }
  };

  const handleDownloadLoaFile = () => {
    if (!loaData) return;
    const blob = new Blob([loaData.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = loaData.title;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteConnection = async () => {
    if (!selectedId) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteConnectionAction(selectedId);
      if (res.success) {
        setConnections((prev) =>
          prev.map((c) => (c.connectionId === selectedId ? { ...c, connectionState: "deleting" } : c))
        );
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
        setMessage({
          type: "success",
          text: `Connection ${selectedId} is now deleting.`,
        });
      } else {
        setMessage({
          type: "error",
          text: res.error || "Failed to delete connection",
        });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/direct-connect" className="hover:text-[#0073bb]">
          AWS Direct Connect
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">Connections</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Connections</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Dedicated network ports provisioned at AWS Direct Connect colocation facilities.
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
                    router.push(`/direct-connect/connections/${selectedId}`);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#16191f]"
                >
                  View details
                </button>
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    handleOpenLoa(selectedId);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#16191f]"
                >
                  Download LOA-CFA
                </button>
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    router.push(`/direct-connect/virtual-interfaces/create?connectionId=${selectedId}`);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#16191f]"
                >
                  Create virtual interface
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                >
                  Delete connection
                </button>
              </div>
            )}
          </div>

          <Link
            href="/direct-connect/connections/create"
            className="inline-flex items-center justify-center px-4 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded shadow-sm transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create connection
          </Link>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-3 rounded border text-[13px] flex items-center justify-between ${
            message.type === "success"
              ? "bg-[#f2fcf5] border-[#037f0c] text-[#037f0c]"
              : message.type === "info"
              ? "bg-[#f1faff] border-[#0073bb] text-[#0073bb]"
              : "bg-[#fdf2f2] border-[#d13212] text-[#d13212]"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600 font-bold ml-4">
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
              placeholder="Filter connections by name, ID, location, or speed..."
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
            {filteredConnections.length} {filteredConnections.length === 1 ? "connection" : "connections"}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                <th className="py-2.5 px-4 w-10"></th>
                <th className="py-2.5 px-4 font-semibold">Name</th>
                <th className="py-2.5 px-4 font-semibold">Connection ID</th>
                <th className="py-2.5 px-4 font-semibold">State</th>
                <th className="py-2.5 px-4 font-semibold">Location</th>
                <th className="py-2.5 px-4 font-semibold">Port speed</th>
                <th className="py-2.5 px-4 font-semibold">AWS Device</th>
                <th className="py-2.5 px-4 font-semibold">MACsec capable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredConnections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    <p className="font-semibold text-gray-700">No Direct Connect connections found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Order a dedicated connection to link your on-premises routers to AWS.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredConnections.map((c) => {
                  const isSelected = selectedId === c.connectionId;
                  const isAvailable = c.connectionState === "available";
                  const isRequested = c.connectionState === "requested" || c.connectionState === "ordering" || c.connectionState === "pending";
                  const isDeleting = c.connectionState === "deleting";

                  return (
                    <tr
                      key={c.connectionId}
                      onClick={() => setSelectedId(c.connectionId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-orange-50/50 hover:bg-orange-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <input
                          type="radio"
                          name="selectedConnection"
                          checked={isSelected}
                          onChange={() => setSelectedId(c.connectionId)}
                          className="text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#16191f]">
                        {c.connectionName || "-"}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-[#0073bb]">
                        <Link
                          href={`/direct-connect/connections/${c.connectionId}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.connectionId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isAvailable
                              ? "bg-green-100 text-green-800"
                              : isRequested
                              ? "bg-blue-100 text-blue-800"
                              : isDeleting
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {c.connectionState || "requested"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-700">
                        {c.location || "-"}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-[#16191f]">
                        {c.bandwidth || "1Gbps"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-gray-600">
                        {c.awsDeviceV2 || c.awsDevice || "-"}
                      </td>
                      <td className="py-2.5 px-4 text-gray-600">
                        {c.macSecCapable ? "Yes" : "No"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Connection Preview Card */}
      {selectedConnection && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block">Selected Connection</span>
              <h3 className="text-base font-bold text-[#16191f] font-mono mt-0.5">
                {selectedConnection.connectionId}
                {selectedConnection.connectionName && (
                  <span className="ml-2 font-normal text-gray-600">({selectedConnection.connectionName})</span>
                )}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenLoa(selectedConnection.connectionId)}
                disabled={loaLoading}
                className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {loaLoading ? "Generating..." : "Download LOA-CFA"}
              </button>
              <Link
                href={`/direct-connect/connections/${selectedConnection.connectionId}`}
                className="px-3 text-xs font-semibold text-white bg-[#0073bb] hover:bg-[#005a9e] rounded shadow-sm transition-colors flex items-center justify-center"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                View details
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
            <div>
              <div className="text-xs text-[#545b64] font-medium">Location</div>
              <div className="text-[#16191f] font-medium mt-1">{selectedConnection.location}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64] font-medium">Bandwidth</div>
              <div className="font-mono text-[#16191f] font-semibold mt-1">{selectedConnection.bandwidth}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64] font-medium">AWS Logical Device</div>
              <div className="font-mono text-[12px] text-gray-700 mt-1">{selectedConnection.awsLogicalDeviceId || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64] font-medium">Jumbo Frames</div>
              <div className="text-[#16191f] mt-1">{selectedConnection.jumboFrameCapable ? "Supported (9001 MTU)" : "Standard (1500 MTU)"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Download LOA-CFA */}
      {isLoaModalOpen && loaData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-[#16191f]">Letter of Authorization (LOA-CFA)</h3>
              <button
                onClick={() => setIsLoaModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                x
              </button>
            </div>

            <p className="text-xs text-[#545b64]">
              Provide this official Letter of Authorization and Connecting Facility Assignment (LOA-CFA) document to your colocation facility provider to execute physical cross-connect cabling into AWS Direct Connect.
            </p>

            <div>
              <pre className="p-3 bg-gray-900 text-green-400 font-mono text-[11px] rounded max-h-64 overflow-y-auto whitespace-pre-wrap">
                {loaData.content}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setIsLoaModalOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDownloadLoaFile}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Download document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Connection */}
      {isDeleteModalOpen && selectedConnection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete connection</h3>
            <p className="text-xs text-[#545b64]">
              Are you sure you want to delete connection{" "}
              <strong className="text-black font-mono">{selectedConnection.connectionId}</strong>?
              This will terminate physical port connectivity and remove all associated virtual interfaces.
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
                onClick={handleDeleteConnection}
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
