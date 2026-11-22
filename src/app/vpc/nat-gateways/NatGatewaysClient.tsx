"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  NatGatewayItem,
  SubnetItem,
  ElasticIpItem,
  listNatGatewaysAction,
  createNatGatewayAction,
  deleteNatGatewayAction,
  listElasticIpsAction,
  allocateElasticIpAction,
} from "../actions";
import { formatDateTime } from "@/lib/dateUtils";

interface Props {
  initialGateways: NatGatewayItem[];
  subnets: SubnetItem[];
  elasticIps: ElasticIpItem[];
  initialSearch?: string;
}

export default function NatGatewaysClient({
  initialGateways,
  subnets,
  elasticIps,
  initialSearch = "",
}: Props) {
  const router = useRouter();

  const [gateways, setGateways] = useState<NatGatewayItem[]>(initialGateways);
  const [eips, setEips] = useState<ElasticIpItem[]>(elasticIps);
  const [selectedNatId, setSelectedNatId] = useState<string | null>(() => {
    if (initialSearch) {
      const match = initialGateways.find(
        (n) =>
          n.NatGatewayId.toLowerCase().includes(initialSearch.toLowerCase()) ||
          (n.Name && n.Name.toLowerCase().includes(initialSearch.toLowerCase()))
      );
      if (match) return match.NatGatewayId;
    }
    return initialGateways.length > 0 ? initialGateways[0].NatGatewayId : null;
  });
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create NAT modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [natName, setNatName] = useState("");
  const [selectedSubnetId, setSelectedSubnetId] = useState(subnets.length > 0 ? subnets[0].SubnetId : "");
  const [connectivityType, setConnectivityType] = useState<"public" | "private">("public");
  const [selectedAllocationId, setSelectedAllocationId] = useState(eips.length > 0 ? eips[0].AllocationId : "");
  const [allocatingEip, setAllocatingEip] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedNat = gateways.find((g) => g.NatGatewayId === selectedNatId);

  const refreshGateways = async () => {
    setLoading(true);
    try {
      const [res, eipsRes] = await Promise.all([listNatGatewaysAction(), listElasticIpsAction()]);
      if (res.success) {
        setGateways(res.natGateways);
        if (selectedNatId && !res.natGateways.some((g) => g.NatGatewayId === selectedNatId)) {
          setSelectedNatId(res.natGateways.length > 0 ? res.natGateways[0].NatGatewayId : null);
        }
      }
      if (eipsRes.success) {
        setEips(eipsRes.elasticIps);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateEipQuick = async () => {
    setAllocatingEip(true);
    setMessage(null);
    try {
      const res = await allocateElasticIpAction({ tags: { Name: "NAT Gateway EIP" } });
      if (res.success && res.allocationId) {
        const eipsRes = await listElasticIpsAction();
        if (eipsRes.success) {
          setEips(eipsRes.elasticIps);
        }
        setSelectedAllocationId(res.allocationId);
        setMessage({
          type: "success",
          text: `Allocated new Elastic IP: ${res.publicIp} (${res.allocationId})`,
        });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to allocate Elastic IP" });
      }
    } finally {
      setAllocatingEip(false);
    }
  };

  const handleCreateNat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubnetId) return;
    if (connectivityType === "public" && !selectedAllocationId) {
      setMessage({ type: "error", text: "Public NAT gateways require an Elastic IP allocation ID." });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await createNatGatewayAction({
        subnetId: selectedSubnetId,
        allocationId: connectivityType === "public" ? selectedAllocationId : undefined,
        connectivityType,
        name: natName.trim() || undefined,
      });
      if (res.success && res.natGatewayId) {
        setIsCreateModalOpen(false);
        setNatName("");
        setMessage({ type: "success", text: `Successfully created NAT gateway ${res.natGatewayId}` });
        await refreshGateways();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create NAT gateway" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNat = async () => {
    if (!selectedNat) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteNatGatewayAction(selectedNat.NatGatewayId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({ type: "success", text: `Deleted NAT gateway ${selectedNat.NatGatewayId}` });
        await refreshGateways();
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete NAT gateway" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredGateways = gateways.filter((g) => {
    const q = searchQuery.toLowerCase();
    return (
      g.NatGatewayId.toLowerCase().includes(q) ||
      (g.Name && g.Name.toLowerCase().includes(q)) ||
      (g.VpcId && g.VpcId.toLowerCase().includes(q)) ||
      g.SubnetId.toLowerCase().includes(q) ||
      (g.PublicIp && g.PublicIp.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">NAT gateways ({gateways.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            NAT gateways enable instances in private subnets to connect to services outside your VPC, but prevent external services from initiating a connection.
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
              if (selectedNat) {
                router.push(`/vpc/nat-gateways/${selectedNat.NatGatewayId}`);
              }
            }}
            disabled={!selectedNat}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View details
          </button>

          {/* Delete button */}
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedNat || selectedNat.State === "deleted"}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete NAT gateway
          </button>

          {/* Create primary button */}
          <button
            onClick={() => {
              setNatName("");
              if (subnets.length > 0 && !selectedSubnetId) setSelectedSubnetId(subnets[0].SubnetId);
              if (eips.length > 0 && !selectedAllocationId) setSelectedAllocationId(eips[0].AllocationId);
              setIsCreateModalOpen(true);
            }}
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create NAT gateway
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
              placeholder="Filter NAT gateways by name or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
            />
          </div>
          <span className="text-xs text-gray-500">
            Showing {filteredGateways.length} of {gateways.length} NAT gateways
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 font-semibold">Name</th>
                <th className="py-2.5 px-3 font-semibold">NAT gateway ID</th>
                <th className="py-2.5 px-3 font-semibold">State</th>
                <th className="py-2.5 px-3 font-semibold">Connectivity type</th>
                <th className="py-2.5 px-3 font-semibold">Primary public IP</th>
                <th className="py-2.5 px-3 font-semibold">Primary private IP</th>
                <th className="py-2.5 px-3 font-semibold">Subnet ID</th>
                <th className="py-2.5 px-3 font-semibold">VPC ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {filteredGateways.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    No NAT gateways found.
                  </td>
                </tr>
              ) : (
                filteredGateways.map((nat) => {
                  const isSelected = nat.NatGatewayId === selectedNatId;
                  const isAvailable = nat.State === "available";
                  return (
                    <tr
                      key={nat.NatGatewayId}
                      onClick={() => setSelectedNatId(nat.NatGatewayId)}
                      onDoubleClick={() => router.push(`/vpc/nat-gateways/${nat.NatGatewayId}`)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-[#F2F8FD]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="radio"
                          name="selected_nat"
                          checked={isSelected}
                          onChange={() => setSelectedNatId(nat.NatGatewayId)}
                          className="h-3.5 w-3.5 text-[#EC7211] focus:ring-[#EC7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        <Link
                          href={`/vpc/nat-gateways/${nat.NatGatewayId}`}
                          className="hover:underline"
                        >
                          {nat.Name || "-"}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073BB]">
                        <Link
                          href={`/vpc/nat-gateways/${nat.NatGatewayId}`}
                          className="hover:underline"
                        >
                          {nat.NatGatewayId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            isAvailable
                              ? "bg-green-100 text-green-800"
                              : nat.State === "deleted"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {nat.State}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 capitalize">
                        {nat.PublicIp ? "Public" : "Private"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">
                        {nat.PublicIp || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {nat.PrivateIp || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {nat.SubnetId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {nat.VpcId || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Tabs for Selected NAT Gateway */}
      {selectedNat && (
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
                Tags ({Object.keys(selectedNat.Tags || {}).length})
              </button>
            </div>
            <Link
              href={`/vpc/nat-gateways/${selectedNat.NatGatewayId}`}
              className="text-[12px] font-medium text-[#0073bb] hover:underline flex items-center gap-1"
            >
              <span>Open NAT gateway page</span>
              <span>↗</span>
            </Link>
          </div>

          <div className="p-4">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <dt className="text-gray-500 font-medium">NAT gateway ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono font-semibold">{selectedNat.NatGatewayId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">State</dt>
                  <dd className="text-gray-900 mt-1 capitalize">{selectedNat.State}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Subnet ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedNat.SubnetId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">VPC ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedNat.VpcId || "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Primary public IPv4 address</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedNat.PublicIp || "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Elastic IP allocation ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedNat.AllocationId || "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Primary private IPv4 address</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedNat.PrivateIp || "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Created at</dt>
                  <dd className="text-gray-900 mt-1" suppressHydrationWarning>{formatDateTime(selectedNat.CreateTime)}</dd>
                </div>
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                {!selectedNat.Tags || Object.keys(selectedNat.Tags).length === 0 ? (
                  <p className="text-xs text-gray-500">No tags assigned to this NAT gateway.</p>
                ) : (
                  <table className="w-full text-left text-xs border border-gray-200">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(selectedNat.Tags).map(([key, val]) => (
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
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Create NAT gateway</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateNat} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. my-nat-gateway"
                  value={natName}
                  onChange={(e) => setNatName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subnet <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-500 mb-1.5">
                  Choose the subnet in which to create the NAT gateway.
                </p>
                <select
                  value={selectedSubnetId}
                  onChange={(e) => setSelectedSubnetId(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                  required
                >
                  <option value="">Select a subnet</option>
                  {subnets.map((s) => (
                    <option key={s.SubnetId} value={s.SubnetId}>
                      {s.SubnetId} {s.Name ? `(${s.Name})` : ""} | VPC: {s.VpcId} | CIDR: {s.CidrBlock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Connectivity type
                </label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="conn_type"
                      checked={connectivityType === "public"}
                      onChange={() => setConnectivityType("public")}
                      className="text-[#EC7211] focus:ring-[#EC7211]"
                    />
                    <span className="font-medium text-gray-800">Public (default)</span>
                    <span className="text-gray-500 text-[11px]">- Can connect to the internet</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="conn_type"
                      checked={connectivityType === "private"}
                      onChange={() => setConnectivityType("private")}
                      className="text-[#EC7211] focus:ring-[#EC7211]"
                    />
                    <span className="font-medium text-gray-800">Private</span>
                    <span className="text-gray-500 text-[11px]">- Connect to other VPCs or your on-premises network</span>
                  </label>
                </div>
              </div>

              {connectivityType === "public" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">
                      Elastic IP allocation ID <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAllocateEipQuick}
                      disabled={allocatingEip}
                      className="text-xs text-[#0073BB] hover:underline font-medium"
                    >
                      {allocatingEip ? "Allocating..." : "Allocate Elastic IP"}
                    </button>
                  </div>
                  <select
                    value={selectedAllocationId}
                    onChange={(e) => setSelectedAllocationId(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                    required
                  >
                    <option value="">Select an Elastic IP</option>
                    {eips.map((eip) => (
                      <option key={eip.AllocationId} value={eip.AllocationId}>
                        {eip.AllocationId} ({eip.PublicIp})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  disabled={actionLoading || !selectedSubnetId || (connectivityType === "public" && !selectedAllocationId)}
                  className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Creating..." : "Create NAT gateway"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedNat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Delete NAT gateway</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700">
                Are you sure you want to delete NAT gateway{" "}
                <span className="font-mono font-bold text-gray-900">{selectedNat.NatGatewayId}</span>?
              </p>
              <p className="text-xs text-gray-500">
                Deleting a NAT gateway disassociates its Elastic IP address, but does not release the address from your account.
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
                  onClick={handleDeleteNat}
                  disabled={deleteLoading || deleteConfirmText !== "delete"}
                  className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {deleteLoading ? "Deleting..." : "Delete NAT gateway"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
