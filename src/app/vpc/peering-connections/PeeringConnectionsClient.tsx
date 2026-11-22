"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PeeringConnectionItem,
  VpcItem,
  listPeeringConnectionsAction,
  createPeeringConnectionAction,
  acceptPeeringConnectionAction,
  rejectPeeringConnectionAction,
  deletePeeringConnectionAction,
} from "../actions";

interface Props {
  initialConnections: PeeringConnectionItem[];
  vpcs: VpcItem[];
}

export default function PeeringConnectionsClient({ initialConnections, vpcs }: Props) {
  const router = useRouter();

  const [connections, setConnections] = useState<PeeringConnectionItem[]>(initialConnections);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(
    initialConnections.length > 0 ? initialConnections[0].VpcPeeringConnectionId : null
  );
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create peering modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [connectionName, setConnectionName] = useState("");
  const [requesterVpcId, setRequesterVpcId] = useState(vpcs.length > 0 ? vpcs[0].VpcId : "");
  const [accepterVpcId, setAccepterVpcId] = useState(vpcs.length > 1 ? vpcs[1].VpcId : vpcs[0]?.VpcId || "");

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedConn = connections.find((c) => c.VpcPeeringConnectionId === selectedConnectionId);

  const refreshConnections = async () => {
    setLoading(true);
    try {
      const res = await listPeeringConnectionsAction();
      if (res.success) {
        setConnections(res.peeringConnections);
        if (selectedConnectionId && !res.peeringConnections.some((c) => c.VpcPeeringConnectionId === selectedConnectionId)) {
          setSelectedConnectionId(res.peeringConnections.length > 0 ? res.peeringConnections[0].VpcPeeringConnectionId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesterVpcId || !accepterVpcId) return;

    if (requesterVpcId === accepterVpcId) {
      setMessage({ type: "error", text: "Requester VPC and Accepter VPC must be different." });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await createPeeringConnectionAction({
        vpcId: requesterVpcId,
        peerVpcId: accepterVpcId,
        name: connectionName.trim() || undefined,
      });

      if (res.success && res.connectionId) {
        setIsCreateModalOpen(false);
        setConnectionName("");
        setMessage({
          type: "success",
          text: `Successfully requested VPC peering connection ${res.connectionId}`,
        });
        await refreshConnections();
        setSelectedConnectionId(res.connectionId);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create peering connection" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!selectedConn) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await acceptPeeringConnectionAction(selectedConn.VpcPeeringConnectionId);
      if (res.success) {
        setMessage({
          type: "success",
          text: `Accepted peering connection request ${selectedConn.VpcPeeringConnectionId}`,
        });
        await refreshConnections();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to accept peering connection" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConnection = async () => {
    if (!selectedConn) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await rejectPeeringConnectionAction(selectedConn.VpcPeeringConnectionId);
      if (res.success) {
        setMessage({
          type: "success",
          text: `Rejected peering connection request ${selectedConn.VpcPeeringConnectionId}`,
        });
        await refreshConnections();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to reject peering connection" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConnection = async () => {
    if (!selectedConn) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deletePeeringConnectionAction(selectedConn.VpcPeeringConnectionId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({
          type: "success",
          text: `Deleted peering connection ${selectedConn.VpcPeeringConnectionId}`,
        });
        setConnections(connections.filter((c) => c.VpcPeeringConnectionId !== selectedConn.VpcPeeringConnectionId));
        setSelectedConnectionId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete peering connection" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredConnections = connections.filter((c) => {
    const q = searchQuery.toLowerCase();
    const name = c.Tags?.Name || "";
    return (
      c.VpcPeeringConnectionId.toLowerCase().includes(q) ||
      c.RequesterVpcId.toLowerCase().includes(q) ||
      c.AccepterVpcId.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Peering connections ({connections.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            A VPC peering connection is a networking connection between two VPCs that enables you to route traffic between them using private IPv4 addresses.
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

          {/* Accept request */}
          <button
            onClick={handleAcceptConnection}
            disabled={!selectedConn || selectedConn.Status !== "pending-acceptance" || actionLoading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Accept request
          </button>

          {/* Reject request */}
          <button
            onClick={handleRejectConnection}
            disabled={!selectedConn || selectedConn.Status !== "pending-acceptance" || actionLoading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Reject request
          </button>

          {/* Delete button */}
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedConn || selectedConn.Status === "deleted"}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>

          {/* Create primary button */}
          <button
            onClick={() => {
              setConnectionName("");
              if (vpcs.length > 0 && !requesterVpcId) setRequesterVpcId(vpcs[0].VpcId);
              if (vpcs.length > 1 && !accepterVpcId) setAccepterVpcId(vpcs[1].VpcId);
              setIsCreateModalOpen(true);
            }}
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create peering connection
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
              placeholder="Filter peering connections"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
            />
          </div>
          <span className="text-xs text-gray-500">
            Showing {filteredConnections.length} of {connections.length} peering connections
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 font-semibold">Name</th>
                <th className="py-2.5 px-3 font-semibold">Peering connection ID</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Requester VPC</th>
                <th className="py-2.5 px-3 font-semibold">Requester CIDRs</th>
                <th className="py-2.5 px-3 font-semibold">Accepter VPC</th>
                <th className="py-2.5 px-3 font-semibold">Accepter CIDRs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {filteredConnections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No peering connections found.
                  </td>
                </tr>
              ) : (
                filteredConnections.map((conn) => {
                  const isSelected = conn.VpcPeeringConnectionId === selectedConnectionId;
                  const isActive = conn.Status === "active";
                  const isPending = conn.Status === "pending-acceptance";
                  return (
                    <tr
                      key={conn.VpcPeeringConnectionId}
                      onClick={() => setSelectedConnectionId(conn.VpcPeeringConnectionId)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-[#F2F8FD]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="radio"
                          name="selected_conn"
                          checked={isSelected}
                          onChange={() => setSelectedConnectionId(conn.VpcPeeringConnectionId)}
                          className="h-3.5 w-3.5 text-[#EC7211] focus:ring-[#EC7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        {conn.Tags?.Name || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073BB]">
                        {conn.VpcPeeringConnectionId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            isActive
                              ? "bg-green-100 text-green-800"
                              : isPending
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {conn.Status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">
                        {conn.RequesterVpcId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {conn.RequesterCidr || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">
                        {conn.AccepterVpcId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {conn.AccepterCidr || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Tabs for Selected Peering Connection */}
      {selectedConn && (
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="border-b border-gray-200 px-4">
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
                Tags ({Object.keys(selectedConn.Tags || {}).length})
              </button>
            </div>
          </div>

          <div className="p-4">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <dt className="text-gray-500 font-medium">Peering connection ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono font-semibold">{selectedConn.VpcPeeringConnectionId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Status</dt>
                  <dd className="text-gray-900 mt-1 capitalize">{selectedConn.Status}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Requester VPC</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedConn.RequesterVpcId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Requester CIDR</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedConn.RequesterCidr || "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Accepter VPC</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedConn.AccepterVpcId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Accepter CIDR</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedConn.AccepterCidr || "-"}</dd>
                </div>
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                {!selectedConn.Tags || Object.keys(selectedConn.Tags).length === 0 ? (
                  <p className="text-xs text-gray-500">No tags assigned to this peering connection.</p>
                ) : (
                  <table className="w-full text-left text-xs border border-gray-200">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(selectedConn.Tags).map(([key, val]) => (
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

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Create peering connection</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateConnection} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Name tag (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. vpc-peering-prod-dev"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  VPC (Requester) <span className="text-red-500">*</span>
                </label>
                <select
                  value={requesterVpcId}
                  onChange={(e) => setRequesterVpcId(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                  required
                >
                  <option value="">Select Requester VPC</option>
                  {vpcs.map((vpc) => (
                    <option key={vpc.VpcId} value={vpc.VpcId}>
                      {vpc.VpcId} {vpc.Name ? `(${vpc.Name})` : ""} - {vpc.CidrBlock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  VPC (Accepter) <span className="text-red-500">*</span>
                </label>
                <select
                  value={accepterVpcId}
                  onChange={(e) => setAccepterVpcId(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                  required
                >
                  <option value="">Select Accepter VPC</option>
                  {vpcs.map((vpc) => (
                    <option key={vpc.VpcId} value={vpc.VpcId}>
                      {vpc.VpcId} {vpc.Name ? `(${vpc.Name})` : ""} - {vpc.CidrBlock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !requesterVpcId || !accepterVpcId}
                  className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Creating..." : "Create peering connection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedConn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Delete peering connection</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700">
                Are you sure you want to delete peering connection{" "}
                <span className="font-mono font-bold text-gray-900">{selectedConn.VpcPeeringConnectionId}</span>?
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
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
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
                  disabled={deleteLoading || deleteConfirmText !== "delete"}
                  className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {deleteLoading ? "Deleting..." : "Delete peering connection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
