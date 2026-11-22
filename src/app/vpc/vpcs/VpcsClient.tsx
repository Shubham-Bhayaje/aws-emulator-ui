"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  VpcItem,
  SubnetItem,
  RouteTableItem,
  InternetGatewayItem,
  NatGatewayItem,
  VpcEndpointItem,
  listVpcsAction,
  deleteVpcAction,
  modifyVpcAttributeAction,
  listSubnetsAction,
  listRouteTablesAction,
  listInternetGatewaysAction,
  listNatGatewaysAction,
  listVpcEndpointsAction,
} from "../actions";

interface Props {
  initialVpcs: VpcItem[];
  initialSubnets?: SubnetItem[];
  initialRouteTables?: RouteTableItem[];
  initialInternetGateways?: InternetGatewayItem[];
  initialNatGateways?: NatGatewayItem[];
  initialEndpoints?: VpcEndpointItem[];
}

export default function VpcsClient({
  initialVpcs,
  initialSubnets = [],
  initialRouteTables = [],
  initialInternetGateways = [],
  initialNatGateways = [],
  initialEndpoints = [],
}: Props) {
  const router = useRouter();

  const [vpcs, setVpcs] = useState<VpcItem[]>(initialVpcs);
  const [subnets, setSubnets] = useState<SubnetItem[]>(initialSubnets);
  const [routeTables, setRouteTables] = useState<RouteTableItem[]>(initialRouteTables);
  const [internetGateways, setInternetGateways] = useState<InternetGatewayItem[]>(initialInternetGateways);
  const [natGateways, setNatGateways] = useState<NatGatewayItem[]>(initialNatGateways);
  const [endpoints, setEndpoints] = useState<VpcEndpointItem[]>(initialEndpoints);

  const [selectedVpcId, setSelectedVpcId] = useState<string | null>(
    initialVpcs.length > 0 ? initialVpcs[0].VpcId : null
  );
  const [activeTab, setActiveTab] = useState<"details" | "cidrs" | "resourcemap" | "tags">("resourcemap");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Resource map interactive highlight state
  const [selectedMapSubnetId, setSelectedMapSubnetId] = useState<string | null>(null);
  const [hoveredMapSubnetId, setHoveredMapSubnetId] = useState<string | null>(null);

  const [selectedMapRtbId, setSelectedMapRtbId] = useState<string | null>(null);
  const [hoveredMapRtbId, setHoveredMapRtbId] = useState<string | null>(null);

  const [selectedMapGatewayId, setSelectedMapGatewayId] = useState<string | null>(null);
  const [hoveredMapGatewayId, setHoveredMapGatewayId] = useState<string | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedVpc = vpcs.find((v) => v.VpcId === selectedVpcId);

  const refreshVpcs = async () => {
    setLoading(true);
    try {
      const [vpcsRes, subnetsRes, rtbsRes, igwsRes, natsRes, vpcesRes] = await Promise.all([
        listVpcsAction(),
        listSubnetsAction(),
        listRouteTablesAction(),
        listInternetGatewaysAction(),
        listNatGatewaysAction(),
        listVpcEndpointsAction(),
      ]);

      if (vpcsRes.success) {
        setVpcs(vpcsRes.vpcs);
        if (selectedVpcId && !vpcsRes.vpcs.some((v) => v.VpcId === selectedVpcId)) {
          setSelectedVpcId(vpcsRes.vpcs.length > 0 ? vpcsRes.vpcs[0].VpcId : null);
        }
      }
      if (subnetsRes.success) setSubnets(subnetsRes.subnets);
      if (rtbsRes.success) setRouteTables(rtbsRes.routeTables);
      if (igwsRes.success) setInternetGateways(igwsRes.internetGateways);
      if (natsRes.success) setNatGateways(natsRes.natGateways);
      if (vpcesRes.success) setEndpoints(vpcesRes.endpoints);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDnsHostnames = async () => {
    if (!selectedVpc) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const newVal = !selectedVpc.EnableDnsHostnames;
      const res = await modifyVpcAttributeAction(selectedVpc.VpcId, "enableDnsHostnames", newVal);
      if (res.success) {
        setVpcs(vpcs.map((v) => (v.VpcId === selectedVpc.VpcId ? { ...v, EnableDnsHostnames: newVal } : v)));
        setMessage({ type: "success", text: `Updated DNS hostnames to ${newVal ? "enabled" : "disabled"}` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update DNS hostnames attribute" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDnsResolution = async () => {
    if (!selectedVpc) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const newVal = !selectedVpc.EnableDnsSupport;
      const res = await modifyVpcAttributeAction(selectedVpc.VpcId, "enableDnsSupport", newVal);
      if (res.success) {
        setVpcs(vpcs.map((v) => (v.VpcId === selectedVpc.VpcId ? { ...v, EnableDnsSupport: newVal } : v)));
        setMessage({ type: "success", text: `Updated DNS resolution to ${newVal ? "enabled" : "disabled"}` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update DNS resolution attribute" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVpc = async () => {
    if (!selectedVpc) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteVpcAction(selectedVpc.VpcId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setVpcs(vpcs.filter((v) => v.VpcId !== selectedVpc.VpcId));
        setSelectedVpcId(null);
        setMessage({ type: "success", text: `Deleted VPC ${selectedVpc.VpcId}` });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete VPC" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredVpcs = vpcs.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.VpcId.toLowerCase().includes(q) ||
      (v.Name && v.Name.toLowerCase().includes(q)) ||
      v.CidrBlock.toLowerCase().includes(q)
    );
  });

  // -------------------------------------------------------------
  // Resource Map Topology Calculations for selected VPC
  // -------------------------------------------------------------
  const vpcSubnets = subnets.filter((s) => s.VpcId === selectedVpc?.VpcId);
  const vpcRouteTables = routeTables.filter((r) => r.VpcId === selectedVpc?.VpcId);
  const vpcIgws = internetGateways.filter((igw) => igw.VpcId === selectedVpc?.VpcId);
  const vpcNats = natGateways.filter(
    (n) => n.VpcId === selectedVpc?.VpcId || vpcSubnets.some((s) => s.SubnetId === n.SubnetId)
  );
  const vpcEndpoints = endpoints.filter((ep) => ep.VpcId === selectedVpc?.VpcId);
  const mainRtb = vpcRouteTables.find((r) => r.IsMain) || vpcRouteTables[0];

  interface SubnetTopology {
    subnet: SubnetItem;
    routeTable?: RouteTableItem;
    isPublic: boolean;
    connectedGateways: { id: string; name: string; type: string }[];
  }

  const subnetsTopology: SubnetTopology[] = vpcSubnets.map((sub) => {
    const explicitRtb = vpcRouteTables.find((r) =>
      r.Associations?.some((a) => a.SubnetId === sub.SubnetId)
    );
    const rtb = explicitRtb || mainRtb;

    const connectedGws: { id: string; name: string; type: string }[] = [];
    let hasIgw = false;

    if (rtb?.Routes) {
      for (const route of rtb.Routes) {
        if (route.GatewayId?.startsWith("igw-")) {
          hasIgw = true;
          const igwObj = vpcIgws.find((i) => i.InternetGatewayId === route.GatewayId);
          connectedGws.push({
            id: route.GatewayId,
            name: igwObj?.Name || route.GatewayId,
            type: "Internet Gateway",
          });
        } else if (route.NatGatewayId || route.GatewayId?.startsWith("nat-")) {
          const natId = route.NatGatewayId || route.GatewayId!;
          const natObj = vpcNats.find((n) => n.NatGatewayId === natId);
          connectedGws.push({
            id: natId,
            name: natObj?.Name || natId,
            type: "NAT Gateway",
          });
        } else if (route.GatewayId === "local") {
          connectedGws.push({
            id: "local",
            name: "Local",
            type: "Local VPC Router",
          });
        }
      }
    }

    if (rtb) {
      for (const ep of vpcEndpoints) {
        if (
          ep.RouteTableIds?.includes(rtb.RouteTableId) ||
          rtb.Routes?.some((r) => r.GatewayId === ep.VpcEndpointId)
        ) {
          connectedGws.push({
            id: ep.VpcEndpointId,
            name: ep.ServiceName.replace("com.amazonaws.us-east-1.", ""),
            type: `VPC Endpoint (${ep.VpcEndpointType})`,
          });
        }
      }
    }

    return {
      subnet: sub,
      routeTable: rtb,
      isPublic: hasIgw,
      connectedGateways: connectedGws,
    };
  });

  interface GatewayTarget {
    id: string;
    name: string;
    type: string;
    destination: string;
    status: string;
    associatedRtbIds: string[];
  }

  const gatewayTargets: GatewayTarget[] = [];

  // Internet Gateways
  for (const igw of vpcIgws) {
    const matchingRtbs = vpcRouteTables.filter((r) =>
      r.Routes?.some((rt) => rt.GatewayId === igw.InternetGatewayId)
    );
    gatewayTargets.push({
      id: igw.InternetGatewayId,
      name: igw.Name ? `${igw.Name} (${igw.InternetGatewayId})` : igw.InternetGatewayId,
      type: "Internet Gateway",
      destination: "0.0.0.0/0",
      status: igw.State === "attached" ? "Attached" : "Detached",
      associatedRtbIds: matchingRtbs.map((r) => r.RouteTableId),
    });
  }

  // NAT Gateways
  for (const nat of vpcNats) {
    const matchingRtbs = vpcRouteTables.filter((r) =>
      r.Routes?.some((rt) => rt.NatGatewayId === nat.NatGatewayId || rt.GatewayId === nat.NatGatewayId)
    );
    gatewayTargets.push({
      id: nat.NatGatewayId,
      name: nat.Name ? `${nat.Name} (${nat.NatGatewayId})` : nat.NatGatewayId,
      type: "NAT Gateway",
      destination: "0.0.0.0/0",
      status: nat.State,
      associatedRtbIds: matchingRtbs.map((r) => r.RouteTableId),
    });
  }

  // VPC Endpoints
  for (const ep of vpcEndpoints) {
    const matchingRtbs = vpcRouteTables.filter(
      (r) => ep.RouteTableIds?.includes(r.RouteTableId) || r.Routes?.some((rt) => rt.GatewayId === ep.VpcEndpointId)
    );
    gatewayTargets.push({
      id: ep.VpcEndpointId,
      name: ep.ServiceName.replace("com.amazonaws.us-east-1.", ""),
      type: `Gateway Endpoint (${ep.VpcEndpointType})`,
      destination: ep.ServiceName,
      status: ep.State,
      associatedRtbIds: matchingRtbs.map((r) => r.RouteTableId),
    });
  }

  // Local VPC Route
  const localMatchingRtbs = vpcRouteTables.filter((r) =>
    r.Routes?.some((rt) => rt.GatewayId === "local" || rt.DestinationCidrBlock === selectedVpc?.CidrBlock)
  );
  gatewayTargets.push({
    id: "local",
    name: "Local Router",
    type: "Local VPC Router",
    destination: selectedVpc?.CidrBlock || "10.0.0.0/16",
    status: "Active",
    associatedRtbIds: localMatchingRtbs.map((r) => r.RouteTableId),
  });

  // Active highlighted items calculation
  const activeSubnetId = hoveredMapSubnetId || selectedMapSubnetId;
  const activeRtbId = hoveredMapRtbId || selectedMapRtbId;
  const activeGatewayId = hoveredMapGatewayId || selectedMapGatewayId;
  const isAnyActive = Boolean(activeSubnetId || activeRtbId || activeGatewayId);

  const isCardHighlighted = (type: "subnet" | "rtb" | "gw", id: string) => {
    if (!isAnyActive) return true;

    if (activeSubnetId) {
      const topo = subnetsTopology.find((t) => t.subnet.SubnetId === activeSubnetId);
      if (!topo) return false;
      if (type === "subnet") return id === activeSubnetId;
      if (type === "rtb") return id === topo.routeTable?.RouteTableId;
      if (type === "gw") return topo.connectedGateways.some((g) => g.id === id);
    }

    if (activeRtbId) {
      if (type === "rtb") return id === activeRtbId;
      if (type === "subnet") {
        const topo = subnetsTopology.find((t) => t.subnet.SubnetId === id);
        return topo?.routeTable?.RouteTableId === activeRtbId;
      }
      if (type === "gw") {
        const target = gatewayTargets.find((g) => g.id === id);
        return target?.associatedRtbIds.includes(activeRtbId);
      }
    }

    if (activeGatewayId) {
      const target = gatewayTargets.find((g) => g.id === activeGatewayId);
      if (!target) return false;
      if (type === "gw") return id === activeGatewayId;
      if (type === "rtb") return target.associatedRtbIds.includes(id);
      if (type === "subnet") {
        const topo = subnetsTopology.find((t) => t.subnet.SubnetId === id);
        return topo?.routeTable ? target.associatedRtbIds.includes(topo.routeTable.RouteTableId) : false;
      }
    }

    return false;
  };

  const clearMapSelection = () => {
    setSelectedMapSubnetId(null);
    setHoveredMapSubnetId(null);
    setSelectedMapRtbId(null);
    setHoveredMapRtbId(null);
    setSelectedMapGatewayId(null);
    setHoveredMapGatewayId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Your VPCs</h1>
          <p className="text-[14px] text-[#545b64] mt-1">
            Virtual Private Clouds in this AWS Region.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshVpcs}
            disabled={loading}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/vpc/vpcs/create"
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create VPC
          </Link>
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
            placeholder="Filter by VPC ID, Name, or CIDR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleDnsHostnames}
            disabled={!selectedVpc || actionLoading}
            className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${
              selectedVpc
                ? "text-[#16191f] border-[#d5dbdb] hover:bg-[#fafafa]"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Edit DNS hostnames
          </button>
          <button
            onClick={handleToggleDnsResolution}
            disabled={!selectedVpc || actionLoading}
            className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${
              selectedVpc
                ? "text-[#16191f] border-[#d5dbdb] hover:bg-[#fafafa]"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Edit DNS resolution
          </button>
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedVpc || actionLoading}
            className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${
              selectedVpc
                ? "text-red-600 border-[#d5dbdb] hover:bg-red-50"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete VPC
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
                <th className="py-2.5 px-4">VPC ID</th>
                <th className="py-2.5 px-4">State</th>
                <th className="py-2.5 px-4">IPv4 CIDR</th>
                <th className="py-2.5 px-4">DHCP options set</th>
                <th className="py-2.5 px-4">Default VPC</th>
                <th className="py-2.5 px-4">DNS Hostnames</th>
                <th className="py-2.5 px-4">DNS Resolution</th>
                <th className="py-2.5 px-4">Owner ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredVpcs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#545b64]">
                    No VPCs found matching your search.
                  </td>
                </tr>
              ) : (
                filteredVpcs.map((vpc) => {
                  const isSelected = vpc.VpcId === selectedVpcId;
                  return (
                    <tr
                      key={vpc.VpcId}
                      onClick={() => {
                        setSelectedVpcId(vpc.VpcId);
                        clearMapSelection();
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-purple-50/50" : "hover:bg-[#f8f9fa]"
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <input
                          type="radio"
                          name="selectedVpc"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedVpcId(vpc.VpcId);
                            clearMapSelection();
                          }}
                          className="text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#16191f]">{vpc.Name || "-"}</td>
                      <td className="py-2.5 px-4 font-mono font-medium text-[#0073bb]">{vpc.VpcId}</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          {vpc.State}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#545b64]">{vpc.CidrBlock}</td>
                      <td className="py-2.5 px-4 font-mono text-xs text-[#545b64]">{vpc.DhcpOptionsId || "-"}</td>
                      <td className="py-2.5 px-4 text-[#545b64]">{vpc.IsDefault ? "Yes" : "No"}</td>
                      <td className="py-2.5 px-4 text-[#545b64]">{vpc.EnableDnsHostnames ? "Enabled" : "Disabled"}</td>
                      <td className="py-2.5 px-4 text-[#545b64]">{vpc.EnableDnsSupport ? "Enabled" : "Disabled"}</td>
                      <td className="py-2.5 px-4 font-mono text-xs text-[#545b64]">{vpc.OwnerId || "000000000000"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected VPC Details & Resource Map Tabs */}
      {selectedVpc && (
        <div className="bg-white border border-[#d5dbdb] rounded p-4 space-y-4 shadow-xs">
          <div className="border-b border-[#eaeded] pb-2">
            <div className="flex space-x-6">
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
                onClick={() => setActiveTab("cidrs")}
                className={`pb-2 text-[14px] font-semibold transition-colors border-b-2 -mb-[10px] ${
                  activeTab === "cidrs"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                CIDRs
              </button>
              <button
                onClick={() => setActiveTab("resourcemap")}
                className={`pb-2 text-[14px] font-semibold transition-colors border-b-2 -mb-[10px] ${
                  activeTab === "resourcemap"
                    ? "border-[#ec7211] text-[#ec7211]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Resource map
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
          </div>

          {activeTab === "details" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2 text-[13px]">
              <div>
                <span className="text-[#545b64] block text-xs">VPC ID</span>
                <span className="font-mono font-medium text-[#16191f]">{selectedVpc.VpcId}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Name</span>
                <span className="font-medium text-[#16191f]">{selectedVpc.Name || "-"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">State</span>
                <span className="font-medium text-[#16191f]">{selectedVpc.State}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">IPv4 CIDR</span>
                <span className="font-mono font-medium text-[#16191f]">{selectedVpc.CidrBlock}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Default VPC</span>
                <span className="font-medium text-[#16191f]">{selectedVpc.IsDefault ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Tenancy</span>
                <span className="font-medium text-[#16191f] capitalize">{selectedVpc.InstanceTenancy || "Default"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">DHCP options set</span>
                <span className="font-mono font-medium text-[#0073bb]">{selectedVpc.DhcpOptionsId || "-"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">DNS hostnames</span>
                <span className="font-medium text-[#16191f]">
                  {selectedVpc.EnableDnsHostnames ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">DNS resolution</span>
                <span className="font-medium text-[#16191f]">
                  {selectedVpc.EnableDnsSupport ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div>
                <span className="text-[#545b64] block text-xs">Owner</span>
                <span className="font-mono font-medium text-[#16191f]">{selectedVpc.OwnerId || "000000000000"}</span>
              </div>
            </div>
          )}

          {activeTab === "cidrs" && (
            <div className="pt-2">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                    <th className="py-2 px-3">IPv4 CIDR</th>
                    <th className="py-2 px-3">Association ID</th>
                    <th className="py-2 px-3">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {(selectedVpc.CidrBlockAssociationSet || []).map((c, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-mono font-medium text-[#16191f]">{c.CidrBlock}</td>
                      <td className="py-2 px-3 font-mono text-xs text-[#545b64]">{c.AssociationId || "-"}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          {c.State || "associated"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Authentic AWS VPC Resource Map */}
          {activeTab === "resourcemap" && (
            <div className="space-y-4 pt-2">
              {/* Toolbar & Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#f8f9fa] border border-[#eaeded] rounded text-xs">
                <div>
                  <div className="font-bold text-[#16191f] text-sm flex items-center gap-2">
                    <span>Resource map for VPC:</span>
                    <span className="font-mono text-[#0073bb]">{selectedVpc.VpcId}</span>
                    {selectedVpc.Name && <span className="text-gray-500 font-normal">({selectedVpc.Name})</span>}
                  </div>
                  <p className="text-[#545b64] text-[11px] mt-0.5">
                    Visual topology mapping subnets, their associated route tables, and outbound network gateways. Hover or click any resource to highlight its route path.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isAnyActive && (
                    <button
                      onClick={clearMapSelection}
                      className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    >
                      Clear path highlight
                    </button>
                  )}
                  <Link
                    href="/vpc/subnets/create"
                    className="px-3 py-1 text-xs font-medium text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded transition-colors flex items-center justify-center"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Add subnet
                  </Link>
                </div>
              </div>

              {/* Active Path Tracing Breadcrumb */}
              {isAnyActive && (
                <div className="p-2.5 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900 flex flex-wrap items-center gap-2">
                  <span className="font-bold">Active Route Trace:</span>
                  {activeSubnetId && (
                    <span className="bg-white px-2 py-0.5 rounded border border-orange-200 font-mono">
                      Subnet: {activeSubnetId}
                    </span>
                  )}
                  {activeRtbId && (
                    <>
                      <span>➔</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-orange-200 font-mono">
                        Route Table: {activeRtbId}
                      </span>
                    </>
                  )}
                  {activeGatewayId && (
                    <>
                      <span>➔</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-orange-200 font-mono">
                        Gateway: {activeGatewayId}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Empty state if VPC has no subnets */}
              {subnetsTopology.length === 0 ? (
                <div className="py-12 px-4 text-center border-2 border-dashed border-[#d5dbdb] rounded bg-[#fafafa]">
                  <p className="text-sm font-medium text-gray-700">No subnets found in this VPC.</p>
                  <p className="text-xs text-gray-500 mt-1 mb-4">
                    Create subnets to build your network topology and visualize routing relationships.
                  </p>
                  <Link
                    href="/vpc/subnets/create"
                    className="px-4 py-2 text-xs font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] inline-flex items-center"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Create subnet
                  </Link>
                </div>
              ) : (
                /* Three Column Topology Grid */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {/* Column 1: Subnets */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Subnets ({subnetsTopology.length})
                      </span>
                      <span className="text-[11px] text-gray-400">Step 1</span>
                    </div>

                    <div className="space-y-3">
                      {subnetsTopology.map((item) => {
                        const isSubnetActive = activeSubnetId === item.subnet.SubnetId;
                        const isHighlighted = isCardHighlighted("subnet", item.subnet.SubnetId);
                        const isLocked = selectedMapSubnetId === item.subnet.SubnetId;

                        return (
                          <div
                            key={item.subnet.SubnetId}
                            onMouseEnter={() => setHoveredMapSubnetId(item.subnet.SubnetId)}
                            onMouseLeave={() => setHoveredMapSubnetId(null)}
                            onClick={() =>
                              setSelectedMapSubnetId(isLocked ? null : item.subnet.SubnetId)
                            }
                            className={`p-3.5 rounded border transition-all cursor-pointer relative shadow-xs ${
                              isSubnetActive || isLocked
                                ? "bg-orange-50/60 border-[#ec7211] ring-2 ring-orange-200"
                                : isHighlighted
                                ? "bg-white border-[#d5dbdb] hover:border-gray-400"
                                : "bg-white border-[#eaeded] opacity-35"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div>
                                <span className="font-semibold text-xs text-gray-900 block">
                                  {item.subnet.Name || "Subnet"}
                                </span>
                                <Link
                                  href={`/vpc/subnets`}
                                  className="font-mono text-xs text-[#0073bb] hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {item.subnet.SubnetId}
                                </Link>
                              </div>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.isPublic
                                    ? "bg-green-100 text-green-800 border border-green-200"
                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                }`}
                              >
                                {item.isPublic ? "Public" : "Private"}
                              </span>
                            </div>

                            <div className="text-[11px] text-gray-600 flex items-center justify-between font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100 mt-2">
                              <span>{item.subnet.CidrBlock}</span>
                              <span className="text-gray-500 font-sans">{item.subnet.AvailabilityZone}</span>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
                              <span>Routes to:</span>
                              <span
                                className={`font-mono font-medium ${
                                  isSubnetActive || isLocked ? "text-orange-700" : "text-[#0073bb]"
                                }`}
                              >
                                {item.routeTable?.Name || item.routeTable?.RouteTableId || "Main table"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 2: Route tables */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Route tables ({vpcRouteTables.length})
                      </span>
                      <span className="text-[11px] text-gray-400">Step 2</span>
                    </div>

                    <div className="space-y-3">
                      {vpcRouteTables.map((rtb) => {
                        const isRtbActive = activeRtbId === rtb.RouteTableId;
                        const isHighlighted = isCardHighlighted("rtb", rtb.RouteTableId);
                        const isLocked = selectedMapRtbId === rtb.RouteTableId;

                        const associatedSubnets = subnetsTopology.filter(
                          (t) => t.routeTable?.RouteTableId === rtb.RouteTableId
                        );

                        return (
                          <div
                            key={rtb.RouteTableId}
                            onMouseEnter={() => setHoveredMapRtbId(rtb.RouteTableId)}
                            onMouseLeave={() => setHoveredMapRtbId(null)}
                            onClick={() =>
                              setSelectedMapRtbId(isLocked ? null : rtb.RouteTableId)
                            }
                            className={`p-3.5 rounded border transition-all cursor-pointer relative shadow-xs ${
                              isRtbActive || isLocked
                                ? "bg-orange-50/60 border-[#ec7211] ring-2 ring-orange-200"
                                : isHighlighted
                                ? "bg-white border-[#d5dbdb] hover:border-gray-400"
                                : "bg-white border-[#eaeded] opacity-35"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div>
                                <span className="font-semibold text-xs text-gray-900 block">
                                  {rtb.Name || "Route table"}
                                </span>
                                <Link
                                  href={`/vpc/route-tables`}
                                  className="font-mono text-xs text-[#0073bb] hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {rtb.RouteTableId}
                                </Link>
                              </div>
                              {rtb.IsMain && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  Main
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 mt-2 flex items-center justify-between">
                              <span>
                                {associatedSubnets.length} associated subnet
                                {associatedSubnets.length === 1 ? "" : "s"}
                              </span>
                              <span className="font-mono text-gray-500">
                                {rtb.Routes?.length || 0} routes
                              </span>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
                              <span>Target Gateways:</span>
                              <span className="font-medium text-gray-700">
                                {rtb.Routes?.some((r) => r.GatewayId?.startsWith("igw-"))
                                  ? "Internet Gateway, Local"
                                  : rtb.Routes?.some((r) => r.NatGatewayId)
                                  ? "NAT Gateway, Local"
                                  : "Local only"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 3: Network connections / Gateways */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Network connections ({gatewayTargets.length})
                      </span>
                      <span className="text-[11px] text-gray-400">Step 3</span>
                    </div>

                    <div className="space-y-3">
                      {gatewayTargets.map((target) => {
                        const isGwActive = activeGatewayId === target.id;
                        const isHighlighted = isCardHighlighted("gw", target.id);
                        const isLocked = selectedMapGatewayId === target.id;

                        return (
                          <div
                            key={target.id}
                            onMouseEnter={() => setHoveredMapGatewayId(target.id)}
                            onMouseLeave={() => setHoveredMapGatewayId(null)}
                            onClick={() =>
                              setSelectedMapGatewayId(isLocked ? null : target.id)
                            }
                            className={`p-3.5 rounded border transition-all cursor-pointer relative shadow-xs ${
                              isGwActive || isLocked
                                ? "bg-orange-50/60 border-[#ec7211] ring-2 ring-orange-200"
                                : isHighlighted
                                ? "bg-white border-[#d5dbdb] hover:border-gray-400"
                                : "bg-white border-[#eaeded] opacity-35"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div>
                                <span className="font-semibold text-xs text-gray-900 block">
                                  {target.type}
                                </span>
                                <span className="font-mono text-xs text-[#0073bb]">
                                  {target.id}
                                </span>
                              </div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800">
                                {target.status}
                              </span>
                            </div>

                            <div className="text-[11px] text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 mt-2 flex items-center justify-between">
                              <span className="text-gray-500">Destination:</span>
                              <span className="font-mono font-medium text-gray-700 truncate max-w-[150px]">
                                {target.destination}
                              </span>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
                              <span>Connected route tables:</span>
                              <span className="font-medium text-gray-700">
                                {target.associatedRtbIds.length} route table
                                {target.associatedRtbIds.length === 1 ? "" : "s"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
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
                  {Object.entries(selectedVpc.Tags || {}).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-[#545b64]">
                        No tags assigned to this VPC.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(selectedVpc.Tags || {}).map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-2 px-3 font-medium text-[#16191f]">{k}</td>
                        <td className="py-2 px-3 text-[#545b64]">{v}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedVpc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-[#d5dbdb]">
            <div className="px-5 py-4 border-b border-[#eaeded] flex justify-between items-center">
              <h2 className="text-[16px] font-bold text-[#16191f]">Delete VPC</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[13px] text-[#16191f]">
                Are you sure you want to delete VPC{" "}
                <span className="font-mono font-bold text-[#16191f]">{selectedVpc.VpcId}</span>?
              </p>
              {selectedVpc.IsDefault && (
                <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  Warning: This is the default VPC for this Region. Deleting it may disrupt instances relying on default VPC connectivity.
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">
                  To confirm deletion, type <span className="font-mono text-red-600">delete</span> in the field below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="delete"
                  className="w-full text-xs border border-[#d5dbdb] rounded p-2 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-3 text-xs font-medium text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteVpc}
                  disabled={deleteLoading || deleteConfirmText !== "delete"}
                  className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {deleteLoading ? "Deleting..." : "Delete VPC"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
