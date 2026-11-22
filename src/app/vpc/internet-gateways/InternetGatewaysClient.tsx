"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  InternetGatewayItem,
  VpcItem,
  listInternetGatewaysAction,
  createInternetGatewayAction,
  attachInternetGatewayAction,
  detachInternetGatewayAction,
  deleteInternetGatewayAction,
} from "../actions";

interface Props {
  initialGateways: InternetGatewayItem[];
  vpcs: VpcItem[];
  initialSearch?: string;
}

export default function InternetGatewaysClient({ initialGateways, vpcs, initialSearch = "" }: Props) {
  const router = useRouter();

  const [gateways, setGateways] = useState<InternetGatewayItem[]>(initialGateways);
  const [selectedIgwId, setSelectedIgwId] = useState<string | null>(() => {
    if (initialSearch) {
      const match = initialGateways.find(
        (g) =>
          g.InternetGatewayId.toLowerCase().includes(initialSearch.toLowerCase()) ||
          (g.Name && g.Name.toLowerCase().includes(initialSearch.toLowerCase()))
      );
      if (match) return match.InternetGatewayId;
    }
    return initialGateways.length > 0 ? initialGateways[0].InternetGatewayId : null;
  });
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create IGW modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newIgwName, setNewIgwName] = useState("");

  // Attach modal
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [selectedVpcToAttach, setSelectedVpcToAttach] = useState<string>(vpcs.length > 0 ? vpcs[0].VpcId : "");

  // Detach modal
  const [isDetachModalOpen, setIsDetachModalOpen] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedIgw = gateways.find((g) => g.InternetGatewayId === selectedIgwId);

  const refreshGateways = async () => {
    setLoading(true);
    try {
      const res = await listInternetGatewaysAction();
      if (res.success) {
        setGateways(res.internetGateways);
        if (selectedIgwId && !res.internetGateways.some((g) => g.InternetGatewayId === selectedIgwId)) {
          setSelectedIgwId(res.internetGateways.length > 0 ? res.internetGateways[0].InternetGatewayId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIgw = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await createInternetGatewayAction({
        name: newIgwName.trim() || undefined,
      });
      if (res.success && res.internetGatewayId) {
        setIsCreateModalOpen(false);
        setNewIgwName("");
        setMessage({ type: "success", text: `Successfully created internet gateway ${res.internetGatewayId}` });
        await refreshGateways();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create internet gateway" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAttachIgw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIgw || !selectedVpcToAttach) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await attachInternetGatewayAction(selectedIgw.InternetGatewayId, selectedVpcToAttach);
      if (res.success) {
        setIsAttachModalOpen(false);
        setMessage({
          type: "success",
          text: `Attached ${selectedIgw.InternetGatewayId} to VPC ${selectedVpcToAttach}`,
        });
        await refreshGateways();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to attach internet gateway" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDetachIgw = async () => {
    if (!selectedIgw || !selectedIgw.VpcId) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await detachInternetGatewayAction(selectedIgw.InternetGatewayId, selectedIgw.VpcId);
      if (res.success) {
        setIsDetachModalOpen(false);
        setMessage({
          type: "success",
          text: `Detached ${selectedIgw.InternetGatewayId} from VPC ${selectedIgw.VpcId}`,
        });
        await refreshGateways();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to detach internet gateway" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteIgw = async () => {
    if (!selectedIgw) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteInternetGatewayAction(selectedIgw.InternetGatewayId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({ type: "success", text: `Deleted internet gateway ${selectedIgw.InternetGatewayId}` });
        setGateways(gateways.filter((g) => g.InternetGatewayId !== selectedIgw.InternetGatewayId));
        setSelectedIgwId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete internet gateway" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredGateways = gateways.filter((g) => {
    const q = searchQuery.toLowerCase();
    return (
      g.InternetGatewayId.toLowerCase().includes(q) ||
      (g.Name && g.Name.toLowerCase().includes(q)) ||
      (g.VpcId && g.VpcId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Internet gateways ({gateways.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            An internet gateway is a VPC component that allows communication between your VPC and the internet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshGateways}
            disabled={loading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => {
              if (selectedIgw) {
                router.push(`/vpc/internet-gateways/${selectedIgw.InternetGatewayId}`);
              }
            }}
            disabled={!selectedIgw}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View details
          </button>

          {/* Attach button */}
          <button
            onClick={() => setIsAttachModalOpen(true)}
            disabled={!selectedIgw || selectedIgw.State === "attached"}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            title={selectedIgw?.State === "attached" ? "Gateway is already attached to a VPC" : undefined}
          >
            Attach to VPC
          </button>

          {/* Detach button */}
          <button
            onClick={() => setIsDetachModalOpen(true)}
            disabled={!selectedIgw || selectedIgw.State !== "attached"}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Detach from VPC
          </button>

          {/* Delete button */}
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedIgw}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>

          {/* Create primary button */}
          <button
            onClick={() => {
              setNewIgwName("");
              setIsCreateModalOpen(true);
            }}
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create internet gateway
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
              placeholder="Filter internet gateways by name or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
            />
          </div>
          <span className="text-xs text-gray-500">
            Showing {filteredGateways.length} of {gateways.length} gateways
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 font-semibold">Name</th>
                <th className="py-2.5 px-3 font-semibold">Internet gateway ID</th>
                <th className="py-2.5 px-3 font-semibold">State</th>
                <th className="py-2.5 px-3 font-semibold">VPC ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {filteredGateways.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No internet gateways found.
                  </td>
                </tr>
              ) : (
                filteredGateways.map((igw) => {
                  const isSelected = igw.InternetGatewayId === selectedIgwId;
                  return (
                    <tr
                      key={igw.InternetGatewayId}
                      onClick={() => setSelectedIgwId(igw.InternetGatewayId)}
                      onDoubleClick={() => router.push(`/vpc/internet-gateways/${igw.InternetGatewayId}`)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-[#F2F8FD]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="radio"
                          name="selected_igw"
                          checked={isSelected}
                          onChange={() => setSelectedIgwId(igw.InternetGatewayId)}
                          className="h-3.5 w-3.5 text-[#EC7211] focus:ring-[#EC7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        <Link
                          href={`/vpc/internet-gateways/${igw.InternetGatewayId}`}
                          className="hover:underline"
                        >
                          {igw.Name || "-"}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073BB]">
                        <Link
                          href={`/vpc/internet-gateways/${igw.InternetGatewayId}`}
                          className="hover:underline"
                        >
                          {igw.InternetGatewayId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            igw.State === "attached"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {igw.State}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {igw.VpcId || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Tabs for Selected Gateway */}
      {selectedIgw && (
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
                Tags ({Object.keys(selectedIgw.Tags || {}).length})
              </button>
            </div>
            <Link
              href={`/vpc/internet-gateways/${selectedIgw.InternetGatewayId}`}
              className="text-[12px] font-medium text-[#0073bb] hover:underline flex items-center gap-1"
            >
              <span>Open internet gateway page</span>
              <span>↗</span>
            </Link>
          </div>

          <div className="p-4">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <dt className="text-gray-500 font-medium">Internet gateway ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono font-semibold">{selectedIgw.InternetGatewayId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">State</dt>
                  <dd className="text-gray-900 mt-1 capitalize">{selectedIgw.State}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Attached VPC</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedIgw.VpcId || "None (detached)"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Name</dt>
                  <dd className="text-gray-900 mt-1">{selectedIgw.Name || "-"}</dd>
                </div>
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                {!selectedIgw.Tags || Object.keys(selectedIgw.Tags).length === 0 ? (
                  <p className="text-xs text-gray-500">No tags assigned to this internet gateway.</p>
                ) : (
                  <table className="w-full text-left text-xs border border-gray-200">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(selectedIgw.Tags).map(([key, val]) => (
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
              <h2 className="text-sm font-bold text-gray-900">Create internet gateway</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateIgw} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Name tag (optional)
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                  Creates a tag with a key of &apos;Name&apos; and a value that you specify.
                </p>
                <input
                  type="text"
                  placeholder="e.g. my-igw"
                  value={newIgwName}
                  onChange={(e) => setNewIgwName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                />
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
                  disabled={actionLoading}
                  className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Creating..." : "Create internet gateway"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach Modal */}
      {isAttachModalOpen && selectedIgw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Attach to VPC</h2>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAttachIgw} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-600 mb-3">
                  Attach internet gateway <span className="font-mono font-semibold">{selectedIgw.InternetGatewayId}</span> to a VPC.
                </p>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Available VPCs
                </label>
                <select
                  value={selectedVpcToAttach}
                  onChange={(e) => setSelectedVpcToAttach(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                  required
                >
                  <option value="">Select a VPC</option>
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
                  onClick={() => setIsAttachModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !selectedVpcToAttach}
                  className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Attaching..." : "Attach internet gateway"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detach Modal */}
      {isDetachModalOpen && selectedIgw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Detach from VPC</h2>
              <button
                onClick={() => setIsDetachModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700">
                Are you sure you want to detach internet gateway <span className="font-mono font-bold">{selectedIgw.InternetGatewayId}</span> from VPC <span className="font-mono font-bold">{selectedIgw.VpcId}</span>?
              </p>
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsDetachModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDetachIgw}
                  disabled={actionLoading}
                  className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Detaching..." : "Detach internet gateway"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedIgw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Delete internet gateway</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700">
                Are you sure you want to delete internet gateway{" "}
                <span className="font-mono font-bold text-gray-900">{selectedIgw.InternetGatewayId}</span>?
              </p>
              {selectedIgw.State === "attached" && (
                <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  Note: The internet gateway is currently attached to VPC {selectedIgw.VpcId}. Please detach it first before deleting.
                </div>
              )}
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
                  onClick={handleDeleteIgw}
                  disabled={deleteLoading || deleteConfirmText !== "delete"}
                  className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {deleteLoading ? "Deleting..." : "Delete internet gateway"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
