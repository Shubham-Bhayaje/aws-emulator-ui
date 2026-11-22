"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RouteTableItem,
  VpcItem,
  SubnetItem,
  InternetGatewayItem,
  NatGatewayItem,
  listRouteTablesAction,
  createRouteTableAction,
  deleteRouteTableAction,
  associateRouteTableAction,
  disassociateRouteTableAction,
  createRouteAction,
  deleteRouteAction,
} from "../actions";

interface Props {
  initialRouteTables: RouteTableItem[];
  vpcs: VpcItem[];
  subnets: SubnetItem[];
  internetGateways: InternetGatewayItem[];
  natGateways: NatGatewayItem[];
  initialSearch?: string;
}

export default function RouteTablesClient({
  initialRouteTables,
  vpcs,
  subnets,
  internetGateways,
  natGateways,
  initialSearch = "",
}: Props) {
  const router = useRouter();

  const [routeTables, setRouteTables] = useState<RouteTableItem[]>(initialRouteTables);
  const [selectedRtbId, setSelectedRtbId] = useState<string | null>(() => {
    if (initialSearch) {
      const match = initialRouteTables.find(
        (r) =>
          r.RouteTableId.toLowerCase().includes(initialSearch.toLowerCase()) ||
          (r.Name && r.Name.toLowerCase().includes(initialSearch.toLowerCase()))
      );
      if (match) return match.RouteTableId;
    }
    return initialRouteTables.length > 0 ? initialRouteTables[0].RouteTableId : null;
  });
  const [activeTab, setActiveTab] = useState<"details" | "routes" | "associations" | "tags">("routes");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create route table modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRtbName, setNewRtbName] = useState("");
  const [newRtbVpcId, setNewRtbVpcId] = useState<string>(vpcs.length > 0 ? vpcs[0].VpcId : "");

  // Add route modal
  const [isAddRouteModalOpen, setIsAddRouteModalOpen] = useState(false);
  const [destinationCidr, setDestinationCidr] = useState("0.0.0.0/0");
  const [targetType, setTargetType] = useState<"igw" | "nat" | "local">("igw");
  const [targetId, setTargetId] = useState("");

  // Subnet association modal
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
  const [selectedSubnetToAssociate, setSelectedSubnetToAssociate] = useState("");

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedRtb = routeTables.find((r) => r.RouteTableId === selectedRtbId);

  const refreshRouteTables = async () => {
    setLoading(true);
    try {
      const res = await listRouteTablesAction();
      if (res.success) {
        setRouteTables(res.routeTables);
        if (selectedRtbId && !res.routeTables.some((r) => r.RouteTableId === selectedRtbId)) {
          setSelectedRtbId(res.routeTables.length > 0 ? res.routeTables[0].RouteTableId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRouteTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await createRouteTableAction({
        vpcId: newRtbVpcId,
        name: newRtbName.trim() || undefined,
      });
      if (res.success && res.routeTableId) {
        setIsCreateModalOpen(false);
        setNewRtbName("");
        setMessage({ type: "success", text: `Created route table ${res.routeTableId}` });
        refreshRouteTables();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create route table" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRtb) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await createRouteAction({
        routeTableId: selectedRtb.RouteTableId,
        destinationCidrBlock: destinationCidr.trim(),
        gatewayId: targetType === "igw" ? targetId : undefined,
        natGatewayId: targetType === "nat" ? targetId : undefined,
      });
      if (res.success) {
        setIsAddRouteModalOpen(false);
        setMessage({ type: "success", text: `Added route to ${destinationCidr}` });
        refreshRouteTables();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to add route" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoute = async (destCidr: string) => {
    if (!selectedRtb) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await deleteRouteAction(selectedRtb.RouteTableId, destCidr);
      if (res.success) {
        setMessage({ type: "success", text: `Deleted route to ${destCidr}` });
        refreshRouteTables();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete route" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssociateSubnet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRtb || !selectedSubnetToAssociate) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await associateRouteTableAction(selectedRtb.RouteTableId, selectedSubnetToAssociate);
      if (res.success) {
        setIsAssociateModalOpen(false);
        setMessage({ type: "success", text: `Associated subnet ${selectedSubnetToAssociate}` });
        refreshRouteTables();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to associate subnet" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisassociateSubnet = async (assocId: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await disassociateRouteTableAction(assocId);
      if (res.success) {
        setMessage({ type: "success", text: "Disassociated subnet" });
        refreshRouteTables();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to disassociate subnet" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRouteTable = async () => {
    if (!selectedRtb) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteRouteTableAction(selectedRtb.RouteTableId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setRouteTables(routeTables.filter((r) => r.RouteTableId !== selectedRtb.RouteTableId));
        setSelectedRtbId(null);
        setMessage({ type: "success", text: `Deleted route table ${selectedRtb.RouteTableId}` });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete route table" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredRouteTables = routeTables.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.RouteTableId.toLowerCase().includes(q) ||
      (r.Name && r.Name.toLowerCase().includes(q)) ||
      r.VpcId.toLowerCase().includes(q)
    );
  });

  // Filter subnets in the selected route table's VPC that are not explicitly associated
  const availableSubnetsForAssociation = subnets.filter(
    (s) =>
      selectedRtb &&
      s.VpcId === selectedRtb.VpcId &&
      !selectedRtb.Associations.some((a) => a.SubnetId === s.SubnetId)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Route tables</h1>
          <p className="text-[14px] text-[#545b64] mt-1">
            Route tables contain rules that determine where network traffic from your subnet or gateway is directed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshRouteTables}
            disabled={loading}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create route table
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-[13px] border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-[#d5dbdb] rounded">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Filter by Route table ID, Name, or VPC ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedRtb && (
            <Link
              href={`/vpc/route-tables/${selectedRtb.RouteTableId}`}
              className="px-3 py-1.5 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              View details
            </Link>
          )}
          <button
            onClick={() => {
              setDestinationCidr("0.0.0.0/0");
              setTargetType("igw");
              setTargetId(internetGateways[0]?.InternetGatewayId || "");
              setIsAddRouteModalOpen(true);
            }}
            disabled={!selectedRtb || actionLoading}
            className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${
              selectedRtb
                ? "text-[#16191f] border-[#d5dbdb] hover:bg-[#fafafa]"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Edit routes
          </button>
          <button
            onClick={() => {
              setSelectedSubnetToAssociate(availableSubnetsForAssociation[0]?.SubnetId || "");
              setIsAssociateModalOpen(true);
            }}
            disabled={!selectedRtb || actionLoading}
            className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${
              selectedRtb
                ? "text-[#16191f] border-[#d5dbdb] hover:bg-[#fafafa]"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Edit subnet associations
          </button>
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedRtb || selectedRtb.IsMain || actionLoading}
            className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${
              selectedRtb && !selectedRtb.IsMain
                ? "text-red-600 border-[#d5dbdb] hover:bg-red-50"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            title={selectedRtb?.IsMain ? "Cannot delete the main route table of a VPC" : undefined}
          >
            Delete route table
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#d5dbdb] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                <th className="py-2.5 px-4 w-10"></th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Route table ID</th>
                <th className="py-2.5 px-4">VPC</th>
                <th className="py-2.5 px-4">Main</th>
                <th className="py-2.5 px-4">Routes count</th>
                <th className="py-2.5 px-4">Subnet associations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredRouteTables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#545b64]">
                    No route tables found matching your search.
                  </td>
                </tr>
              ) : (
                filteredRouteTables.map((rtb) => {
                  const isSelected = rtb.RouteTableId === selectedRtbId;
                  return (
                    <tr
                      key={rtb.RouteTableId}
                      onClick={() => setSelectedRtbId(rtb.RouteTableId)}
                      onDoubleClick={() => router.push(`/vpc/route-tables/${rtb.RouteTableId}`)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-purple-50/50" : "hover:bg-[#f8f9fa]"
                      }`}
                      title="Click to select, double click to open route table details"
                    >
                      <td className="py-2.5 px-4">
                        <input
                          type="radio"
                          name="selectedRtb"
                          checked={isSelected}
                          onChange={() => setSelectedRtbId(rtb.RouteTableId)}
                          className="h-4 w-4 text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#16191f]">
                        <Link
                          href={`/vpc/route-tables/${rtb.RouteTableId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#0073bb] hover:underline font-semibold"
                        >
                          {rtb.Name || "-"}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#0073bb]">
                        <Link
                          href={`/vpc/route-tables/${rtb.RouteTableId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline font-semibold"
                        >
                          {rtb.RouteTableId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#0073bb]">
                        {rtb.VpcId}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {rtb.IsMain ? (
                          <span className="font-semibold text-emerald-700">Yes</span>
                        ) : (
                          "No"
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {rtb.Routes.length}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {rtb.Associations.filter((a) => !a.Main).length} explicit
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer Tabs */}
      {selectedRtb && (
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab("routes")}
                className={`pb-2 text-[14px] font-semibold transition-colors border-b-2 -mb-[10px] ${
                  activeTab === "routes"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Routes ({selectedRtb.Routes.length})
              </button>
              <button
                onClick={() => setActiveTab("associations")}
                className={`pb-2 text-[14px] font-semibold transition-colors border-b-2 -mb-[10px] ${
                  activeTab === "associations"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Subnet associations ({selectedRtb.Associations.length})
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-2 text-[14px] font-semibold transition-colors border-b-2 -mb-[10px] ${
                  activeTab === "details"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("tags")}
                className={`pb-2 text-[14px] font-semibold transition-colors border-b-2 -mb-[10px] ${
                  activeTab === "tags"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Tags
              </button>
            </div>

            <Link
              href={`/vpc/route-tables/${selectedRtb.RouteTableId}`}
              className="px-3 py-1 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 flex items-center gap-1.5 transition-colors"
              style={{ height: "28px", minHeight: "28px", maxHeight: "28px", whiteSpace: "nowrap" }}
            >
              <span>Open route table page</span>
              <span>↗</span>
            </Link>
          </div>

          {activeTab === "routes" && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#545b64]">Active routes in this route table:</span>
                <button
                  onClick={() => {
                    setDestinationCidr("0.0.0.0/0");
                    setTargetType("igw");
                    setTargetId(internetGateways[0]?.InternetGatewayId || "");
                    setIsAddRouteModalOpen(true);
                  }}
                  className="px-3 py-1 text-[12px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Add route
                </button>
              </div>

              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                    <th className="py-2 px-3">Destination</th>
                    <th className="py-2 px-3">Target</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Propagated</th>
                    <th className="py-2 px-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {selectedRtb.Routes.map((route, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-mono font-medium text-[#16191f]">
                        {route.DestinationCidrBlock || "0.0.0.0/0"}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs text-[#0073bb]">
                        {route.GatewayId || route.NatGatewayId || route.TransitGatewayId || "local"}
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          {route.State || "active"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#545b64]">No</td>
                      <td className="py-2 px-3 text-right">
                        {route.GatewayId !== "local" && route.DestinationCidrBlock && (
                          <button
                            onClick={() => handleDeleteRoute(route.DestinationCidrBlock!)}
                            className="text-[12px] text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "associations" && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#545b64]">Subnets associated with this route table:</span>
                <button
                  onClick={() => {
                    setSelectedSubnetToAssociate(availableSubnetsForAssociation[0]?.SubnetId || "");
                    setIsAssociateModalOpen(true);
                  }}
                  disabled={availableSubnetsForAssociation.length === 0}
                  className="px-3 py-1 text-[12px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Associate subnet
                </button>
              </div>

              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                    <th className="py-2 px-3">Subnet ID</th>
                    <th className="py-2 px-3">IPv4 CIDR</th>
                    <th className="py-2 px-3">Association type</th>
                    <th className="py-2 px-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {selectedRtb.Associations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-[#545b64]">
                        No subnets are associated with this route table.
                      </td>
                    </tr>
                  ) : (
                    selectedRtb.Associations.map((assoc) => {
                      const matchedSubnet = subnets.find((s) => s.SubnetId === assoc.SubnetId);
                      return (
                        <tr key={assoc.RouteTableAssociationId}>
                          <td className="py-2 px-3 font-mono font-medium text-[#0073bb]">
                            {assoc.SubnetId || "-"}
                          </td>
                          <td className="py-2 px-3 font-mono text-xs">
                            {matchedSubnet?.CidrBlock || "-"}
                          </td>
                          <td className="py-2 px-3 text-[#545b64]">
                            {assoc.Main ? "Main route table association" : "Explicit subnet association"}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {!assoc.Main && (
                              <button
                                onClick={() => handleDisassociateSubnet(assoc.RouteTableAssociationId)}
                                className="text-[12px] text-red-600 hover:underline"
                              >
                                Disassociate
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "details" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 text-[13px]">
              <div>
                <span className="text-[#545b64] block text-xs">Route table ID</span>
                <span className="font-mono font-medium text-[#16191f]">{selectedRtb.RouteTableId}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Name</span>
                <span className="font-medium text-[#16191f]">{selectedRtb.Name || "-"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">VPC</span>
                <span className="font-mono font-medium text-[#0073bb]">{selectedRtb.VpcId}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Main route table</span>
                <span className="font-medium text-[#16191f]">{selectedRtb.IsMain ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Routes count</span>
                <span className="font-medium text-[#16191f]">{selectedRtb.Routes.length}</span>
              </div>
            </div>
          )}

          {activeTab === "tags" && (
            <div className="pt-2">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                    <th className="py-2 px-3">Key</th>
                    <th className="py-2 px-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {Object.entries(selectedRtb.Tags || {}).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-[#545b64]">
                        No tags assigned to this route table.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(selectedRtb.Tags || {}).map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-2 px-3 font-semibold text-[#16191f]">{k}</td>
                        <td className="py-2 px-3 font-mono text-xs text-[#545b64]">{v}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Route Table Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Create route table</h2>
            <form onSubmit={handleCreateRouteTable} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-bold text-[#16191f] mb-1">Name tag</label>
                <input
                  type="text"
                  placeholder="e.g. public-route-table"
                  value={newRtbName}
                  onChange={(e) => setNewRtbName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                />
              </div>

              <div>
                <label className="block font-bold text-[#16191f] mb-1">VPC <span className="text-red-500">*</span></label>
                <select
                  value={newRtbVpcId}
                  onChange={(e) => setNewRtbVpcId(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 border border-[#d5dbdb] rounded bg-white focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                >
                  {vpcs.map((v) => (
                    <option key={v.VpcId} value={v.VpcId}>
                      {v.VpcId} {v.Name ? `(${v.Name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !newRtbVpcId}
                  className="px-4 py-1.5 font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-60"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Creating..." : "Create route table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Route Modal */}
      {isAddRouteModalOpen && selectedRtb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Add route</h2>
            <form onSubmit={handleAddRoute} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-bold text-[#16191f] mb-1">Destination CIDR <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={destinationCidr}
                  onChange={(e) => setDestinationCidr(e.target.value)}
                  placeholder="0.0.0.0/0"
                  className="w-full px-3 py-1.5 font-mono border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                />
              </div>

              <div>
                <label className="block font-bold text-[#16191f] mb-1">Target type <span className="text-red-500">*</span></label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    const t = e.target.value as "igw" | "nat" | "local";
                    setTargetType(t);
                    if (t === "igw") setTargetId(internetGateways[0]?.InternetGatewayId || "");
                    else if (t === "nat") setTargetId(natGateways[0]?.NatGatewayId || "");
                    else setTargetId("local");
                  }}
                  className="w-full px-3 py-1.5 border border-[#d5dbdb] rounded bg-white"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                >
                  <option value="igw">Internet Gateway</option>
                  <option value="nat">NAT Gateway</option>
                  <option value="local">Local</option>
                </select>
              </div>

              {targetType === "igw" && (
                <div>
                  <label className="block font-bold text-[#16191f] mb-1">Internet Gateway Target</label>
                  {internetGateways.length === 0 ? (
                    <p className="text-xs text-red-600">No internet gateways available.</p>
                  ) : (
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full px-3 py-1.5 font-mono border border-[#d5dbdb] rounded bg-white"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    >
                      {internetGateways.map((g) => (
                        <option key={g.InternetGatewayId} value={g.InternetGatewayId}>
                          {g.InternetGatewayId} {g.Name ? `(${g.Name})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {targetType === "nat" && (
                <div>
                  <label className="block font-bold text-[#16191f] mb-1">NAT Gateway Target</label>
                  {natGateways.length === 0 ? (
                    <p className="text-xs text-red-600">No NAT gateways available.</p>
                  ) : (
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full px-3 py-1.5 font-mono border border-[#d5dbdb] rounded bg-white"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    >
                      {natGateways.map((g) => (
                        <option key={g.NatGatewayId} value={g.NatGatewayId}>
                          {g.NatGatewayId} {g.Name ? `(${g.Name})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsAddRouteModalOpen(false)}
                  className="px-3 py-1.5 font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-60"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Associate Subnet Modal */}
      {isAssociateModalOpen && selectedRtb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Associate subnet</h2>
            <form onSubmit={handleAssociateSubnet} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-bold text-[#16191f] mb-1">Select subnet in this VPC</label>
                <select
                  value={selectedSubnetToAssociate}
                  onChange={(e) => setSelectedSubnetToAssociate(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 border border-[#d5dbdb] rounded bg-white font-mono"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                >
                  {availableSubnetsForAssociation.map((s) => (
                    <option key={s.SubnetId} value={s.SubnetId}>
                      {s.SubnetId} {s.Name ? `(${s.Name})` : ""} - {s.CidrBlock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsAssociateModalOpen(false)}
                  className="px-3 py-1.5 font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !selectedSubnetToAssociate}
                  className="px-4 py-1.5 font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-60"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Associating..." : "Save association"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Route Table Modal */}
      {isDeleteModalOpen && selectedRtb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Delete route table</h2>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete route table <strong className="text-[#16191f]">{selectedRtb.RouteTableId}</strong>?
            </p>
            <p className="text-[13px] text-[#545b64]">
              To confirm deletion, type <strong className="text-[#16191f]">delete</strong> below:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-red-500"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRouteTable}
                disabled={deleteLoading || deleteConfirmText.toLowerCase() !== "delete"}
                className={`px-4 py-1.5 text-[13px] font-bold text-white rounded transition-colors ${
                  deleteConfirmText.toLowerCase() === "delete" && !deleteLoading
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-300 cursor-not-allowed"
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
