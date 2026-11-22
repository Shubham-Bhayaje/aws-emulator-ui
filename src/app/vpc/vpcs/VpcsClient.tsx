"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  createVpcAndMoreAction,
} from "../actions";

interface Props {
  initialVpcs: VpcItem[];
  initialSubnets?: SubnetItem[];
  initialRouteTables?: RouteTableItem[];
  initialInternetGateways?: InternetGatewayItem[];
  initialNatGateways?: NatGatewayItem[];
  initialEndpoints?: VpcEndpointItem[];
}

/**
 * Authentic AWS-style smooth rounded orthogonal connector path.
 * Connects horizontally from (x1, y1) to (x2, y2) with smooth 90-degree rounded fillets.
 */
function getAwsSmoothPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  forcedChannelX?: number
): string {
  if (x1 === 0 && y1 === 0 && x2 === 0 && y2 === 0) return "";

  // Straight line if Y is within 3 pixels
  if (Math.abs(y2 - y1) <= 3) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  // Midpoint channel X
  const channelX = forcedChannelX !== undefined ? forcedChannelX : x1 + (x2 - x1) * 0.45;
  const radius = Math.min(14, Math.abs(channelX - x1), Math.abs(x2 - channelX), Math.abs(y2 - y1) / 2);
  const R = Math.max(radius, 2);
  const dirY = y2 > y1 ? 1 : -1;

  // Path with smooth 90-degree rounded fillets:
  return `M ${x1} ${y1} L ${channelX - R} ${y1} Q ${channelX} ${y1}, ${channelX} ${y1 + dirY * R} L ${channelX} ${y2 - dirY * R} Q ${channelX} ${y2}, ${channelX + R} ${y2} L ${x2} ${y2}`;
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
    initialVpcs.find((v) => v.Name === "example-vpc-vpc")?.VpcId ||
    (initialVpcs.length > 0 ? initialVpcs[0].VpcId : null)
  );
  const [activeTab, setActiveTab] = useState<"details" | "cidrs" | "resourcemap" | "tags">("resourcemap");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Resource map interactive state
  const [showVpcDetails, setShowVpcDetails] = useState(true);
  const [hoveredSubnetId, setHoveredSubnetId] = useState<string | null>(null);
  const [selectedSubnetId, setSelectedSubnetId] = useState<string | null>(null);
  const [hoveredRtbId, setHoveredRtbId] = useState<string | null>(null);
  const [selectedRtbId, setSelectedRtbId] = useState<string | null>(null);
  const [hoveredGwId, setHoveredGwId] = useState<string | null>(null);
  const [selectedGwId, setSelectedGwId] = useState<string | null>(null);

  // SVG lines state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [svgLines, setSvgLines] = useState<{
    vpcToSubnets: {
      subId: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }[];
    subnetToRtb: {
      subId: string;
      rtbId: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }[];
    rtbToGw: {
      rtbId: string;
      gwId: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }[];
  }>({ vpcToSubnets: [], subnetToRtb: [], rtbToGw: [] });
  const svgLinesKeyRef = useRef<string>("");

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

  const handleCreateSampleMultiTierVpc = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await createVpcAndMoreAction({
        name: "example-vpc",
        cidrBlock: "10.0.0.0/16",
        publicSubnetsCount: 2,
        privateSubnetsCount: 2,
        availabilityZones: ["us-east-1a", "us-east-1b"],
      });
      if (res.success && res.vpcId) {
        await refreshVpcs();
        setSelectedVpcId(res.vpcId);
        setActiveTab("resourcemap");
        setMessage({
          type: "success",
          text: `Provisioned sample 4-subnet multi-tier VPC (${res.vpcId}) matching official AWS architecture.`,
        });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create sample VPC" });
      }
    } finally {
      setActionLoading(false);
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
  // Resource Map Topology Calculations (Memoized to prevent render loops)
  // -------------------------------------------------------------
  const vpcSubnets = useMemo(
    () => subnets.filter((s) => s.VpcId === selectedVpc?.VpcId),
    [subnets, selectedVpc?.VpcId]
  );
  const vpcRouteTables = useMemo(
    () => routeTables.filter((r) => r.VpcId === selectedVpc?.VpcId),
    [routeTables, selectedVpc?.VpcId]
  );
  const vpcIgws = useMemo(
    () => internetGateways.filter((igw) => igw.VpcId === selectedVpc?.VpcId),
    [internetGateways, selectedVpc?.VpcId]
  );
  const vpcNats = useMemo(
    () =>
      natGateways.filter(
        (n) => n.VpcId === selectedVpc?.VpcId || vpcSubnets.some((s) => s.SubnetId === n.SubnetId)
      ),
    [natGateways, selectedVpc?.VpcId, vpcSubnets]
  );
  const vpcEndpoints = useMemo(
    () => endpoints.filter((ep) => ep.VpcId === selectedVpc?.VpcId),
    [endpoints, selectedVpc?.VpcId]
  );
  const mainRtb = useMemo(
    () => vpcRouteTables.find((r) => r.IsMain) || vpcRouteTables[0],
    [vpcRouteTables]
  );

  interface SubnetTopology {
    subnet: SubnetItem;
    routeTable?: RouteTableItem;
    isPublic: boolean;
    azLetter: string;
    connectedGateways: { id: string; name: string; type: string }[];
  }

  // Group subnets by Availability Zone
  const subnetsTopology: SubnetTopology[] = useMemo(() => {
    return vpcSubnets.map((sub) => {
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
              type: `Gateway Endpoint (${ep.VpcEndpointType})`,
            });
          }
        }
      }

      // Extract AZ letter (e.g. us-east-1a -> A)
      const azStr = sub.AvailabilityZone || "a";
      const lastChar = azStr.slice(-1).toUpperCase();
      const azLetter = /[A-Z]/.test(lastChar) ? lastChar : "A";

      return {
        subnet: sub,
        routeTable: rtb,
        isPublic: hasIgw,
        azLetter,
        connectedGateways: connectedGws,
      };
    });
  }, [vpcSubnets, vpcRouteTables, mainRtb, vpcIgws, vpcNats, vpcEndpoints]);

  // Group by AZ
  const subnetsByAz: Record<string, SubnetTopology[]> = useMemo(() => {
    const groups: Record<string, SubnetTopology[]> = {};
    for (const item of subnetsTopology) {
      const az = item.subnet.AvailabilityZone || "Unknown AZ";
      if (!groups[az]) {
        groups[az] = [];
      }
      groups[az].push(item);
    }
    return groups;
  }, [subnetsTopology]);

  // Network Connections (Column 4)
  interface GatewayTarget {
    id: string;
    name: string;
    type: string;
    subtext1: string;
    subtext2?: string;
    associatedRtbIds: string[];
  }

  const gatewayTargets: GatewayTarget[] = useMemo(() => {
    const targets: GatewayTarget[] = [];

    // 1. Internet Gateways
    for (const igw of vpcIgws) {
      const matchingRtbs = vpcRouteTables.filter((r) =>
        r.Routes?.some((rt) => rt.GatewayId === igw.InternetGatewayId)
      );
      const publicCount = subnetsTopology.filter((t) => t.isPublic).length;
      const privateCount = subnetsTopology.filter((t) => !t.isPublic).length;

      targets.push({
        id: igw.InternetGatewayId,
        name: igw.Name || igw.InternetGatewayId,
        type: "Internet Gateway",
        subtext1: `Internet routes to ${publicCount} public subnets`,
        subtext2: `${privateCount} private subnets route to the Internet`,
        associatedRtbIds: matchingRtbs.map((r) => r.RouteTableId),
      });
    }

    // 2. NAT Gateways
    for (const nat of vpcNats) {
      const matchingRtbs = vpcRouteTables.filter((r) =>
        r.Routes?.some((rt) => rt.NatGatewayId === nat.NatGatewayId || rt.GatewayId === nat.NatGatewayId)
      );
      targets.push({
        id: nat.NatGatewayId,
        name: nat.Name || nat.NatGatewayId,
        type: "NAT Gateway",
        subtext1: "NAT gateway for private subnets",
        subtext2: `Status: ${nat.State}`,
        associatedRtbIds: matchingRtbs.map((r) => r.RouteTableId),
      });
    }

    // 3. VPC Endpoints
    for (const ep of vpcEndpoints) {
      const matchingRtbs = vpcRouteTables.filter(
        (r) => ep.RouteTableIds?.includes(r.RouteTableId) || r.Routes?.some((rt) => rt.GatewayId === ep.VpcEndpointId)
      );
      const svcShort = ep.ServiceName.replace("com.amazonaws.us-east-1.", "");
      targets.push({
        id: ep.VpcEndpointId,
        name: ep.VpcEndpointId,
        type: "VPC Endpoint",
        subtext1: `Gateway endpoint to ${svcShort.toUpperCase()}`,
        associatedRtbIds: matchingRtbs.map((r) => r.RouteTableId),
      });
    }

    return targets;
  }, [vpcIgws, vpcRouteTables, subnetsTopology, vpcNats, vpcEndpoints]);

  // Active highlighted items calculation
  const activeSubnet = hoveredSubnetId || selectedSubnetId;
  const activeRtb = hoveredRtbId || selectedRtbId;
  const activeGw = hoveredGwId || selectedGwId;
  const isAnyActive = Boolean(activeSubnet || activeRtb || activeGw);

  const isCardActive = (type: "subnet" | "rtb" | "gw", id: string) => {
    if (!isAnyActive) return false;

    if (activeSubnet) {
      const topo = subnetsTopology.find((t) => t.subnet.SubnetId === activeSubnet);
      if (!topo) return false;
      if (type === "subnet") return id === activeSubnet;
      if (type === "rtb") return id === topo.routeTable?.RouteTableId;
      if (type === "gw") return topo.connectedGateways.some((g) => g.id === id);
    }

    if (activeRtb) {
      if (type === "rtb") return id === activeRtb;
      if (type === "subnet") {
        const topo = subnetsTopology.find((t) => t.subnet.SubnetId === id);
        return topo?.routeTable?.RouteTableId === activeRtb;
      }
      if (type === "gw") {
        const target = gatewayTargets.find((g) => g.id === id);
        return target ? target.associatedRtbIds.includes(activeRtb) : false;
      }
    }

    if (activeGw) {
      const target = gatewayTargets.find((g) => g.id === activeGw);
      if (!target) return false;
      if (type === "gw") return id === activeGw;
      if (type === "rtb") return target.associatedRtbIds.includes(id);
      if (type === "subnet") {
        const topo = subnetsTopology.find((t) => t.subnet.SubnetId === id);
        return topo?.routeTable ? target.associatedRtbIds.includes(topo.routeTable.RouteTableId) : false;
      }
    }

    return false;
  };

  const isLineActive = (fromType: "subnet" | "rtb", fromId: string, toId: string) => {
    if (!isAnyActive) return false;
    if (fromType === "subnet") {
      return isCardActive("subnet", fromId) && isCardActive("rtb", toId);
    }
    if (fromType === "rtb") {
      return isCardActive("rtb", fromId) && isCardActive("gw", toId);
    }
    return false;
  };

  // Recalculate dynamic SVG lines
  const recalculateLines = useCallback(() => {
    if (!mapContainerRef.current) return;
    const container = mapContainerRef.current;
    const containerRect = container.getBoundingClientRect();

    const getRightCenter = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: r.right - containerRect.left,
        y: r.top + r.height / 2 - containerRect.top,
      };
    };

    const getLeftCenter = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: r.left - containerRect.left,
        y: r.top + r.height / 2 - containerRect.top,
      };
    };

    // 1. VPC to all subnets lines
    const vpcToSubLines: {
      subId: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }[] = [];
    const vpcPoint = getRightCenter("resmap-vpc-card");
    if (vpcPoint) {
      for (const item of subnetsTopology) {
        const subPoint = getLeftCenter(`resmap-sub-${item.subnet.SubnetId}`);
        if (subPoint) {
          vpcToSubLines.push({
            subId: item.subnet.SubnetId,
            x1: vpcPoint.x,
            y1: vpcPoint.y,
            x2: subPoint.x,
            y2: subPoint.y,
          });
        }
      }
    }

    // 2. Subnet to Route Table lines
    const subToRtbLines = [];
    for (const item of subnetsTopology) {
      const subPoint = getRightCenter(`resmap-sub-${item.subnet.SubnetId}`);
      const rtbId = item.routeTable?.RouteTableId;
      if (subPoint && rtbId) {
        const rtbPoint = getLeftCenter(`resmap-rtb-${rtbId}`);
        if (rtbPoint) {
          // If multiple subnets connect to the same RTB, distribute their entry points along the left edge
          const sameRtbSubs = subnetsTopology.filter((s) => s.routeTable?.RouteTableId === rtbId);
          const subIdx = sameRtbSubs.findIndex((s) => s.subnet.SubnetId === item.subnet.SubnetId);
          const offsetY = sameRtbSubs.length > 1 ? (subIdx - (sameRtbSubs.length - 1) / 2) * 12 : 0;

          subToRtbLines.push({
            subId: item.subnet.SubnetId,
            rtbId,
            x1: subPoint.x,
            y1: subPoint.y,
            x2: rtbPoint.x,
            y2: rtbPoint.y + offsetY,
          });
        }
      }
    }

    // 3. Route Table to Gateway lines
    const rtbToGwLines = [];
    for (const rtb of vpcRouteTables) {
      const rtbPoint = getRightCenter(`resmap-rtb-${rtb.RouteTableId}`);
      if (!rtbPoint) continue;

      for (const gw of gatewayTargets) {
        if (gw.associatedRtbIds.includes(rtb.RouteTableId)) {
          const gwPoint = getLeftCenter(`resmap-gw-${gw.id}`);
          if (gwPoint) {
            // Distribute entry points along the gateway card
            const sameGwRtbs = vpcRouteTables.filter((r) => gw.associatedRtbIds.includes(r.RouteTableId));
            const rtbIdx = sameGwRtbs.findIndex((r) => r.RouteTableId === rtb.RouteTableId);
            const offsetY = sameGwRtbs.length > 1 ? (rtbIdx - (sameGwRtbs.length - 1) / 2) * 14 : 0;

            rtbToGwLines.push({
              rtbId: rtb.RouteTableId,
              gwId: gw.id,
              x1: rtbPoint.x,
              y1: rtbPoint.y,
              x2: gwPoint.x,
              y2: gwPoint.y + offsetY,
            });
          }
        }
      }
    }

    const newSvgLines = {
      vpcToSubnets: vpcToSubLines,
      subnetToRtb: subToRtbLines,
      rtbToGw: rtbToGwLines,
    };

    const key = JSON.stringify(newSvgLines);
    if (svgLinesKeyRef.current !== key) {
      svgLinesKeyRef.current = key;
      setSvgLines(newSvgLines);
    }
  }, [subnetsTopology, vpcRouteTables, gatewayTargets]);

  useEffect(() => {
    if (activeTab !== "resourcemap") return;

    let animFrameId: number;
    const runRecalc = () => {
      animFrameId = requestAnimationFrame(() => {
        recalculateLines();
      });
    };

    runRecalc();
    const t1 = setTimeout(runRecalc, 60);
    const t2 = setTimeout(runRecalc, 250);

    const handleResize = () => {
      runRecalc();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animFrameId);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeTab, selectedVpcId, recalculateLines]);

  const clearSelection = () => {
    setSelectedSubnetId(null);
    setSelectedRtbId(null);
    setSelectedGwId(null);
    setHoveredSubnetId(null);
    setHoveredRtbId(null);
    setHoveredGwId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Toolbar */}
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

      {/* Filter Toolbar */}
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

      {/* VPC Table */}
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
                        clearSelection();
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
                            clearSelection();
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

      {/* Selected VPC Details & Authentic AWS Resource Map */}
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

          {/* Authentic AWS 4-Column Connected Resource Map */}
          {activeTab === "resourcemap" && (
            <div className="pt-2 space-y-4">
              {/* Header Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-[#545b64]">
                    Interactive topology map for <span className="font-mono font-semibold text-[#16191f]">{selectedVpc.Name || selectedVpc.VpcId}</span>. Click or hover any card to trace its network path.
                  </span>
                  {(selectedSubnetId || selectedRtbId || selectedGwId) && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-[12px] font-medium text-[#0073bb] hover:underline bg-[#f1faff] border border-[#0073bb] px-2 py-0.5 rounded"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCreateSampleMultiTierVpc}
                  disabled={actionLoading}
                  className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Provisioning..." : "Provision sample 4-subnet multi-tier VPC"}
                </button>
              </div>

              {/* Relative Container Holding Columns & Connected SVG Overlay */}
              <div
                ref={mapContainerRef}
                className="relative bg-[#f8f9fa] border border-[#eaeded] rounded-xl p-6 overflow-x-auto"
              >
                {/* SVG Connections Overlay */}
                <svg
                  className="absolute inset-0 pointer-events-none w-full h-full z-10"
                  style={{ minWidth: "1020px" }}
                >
                  {/* VPC to Subnet lines (Unified Smooth Tree Trunk) */}
                  {(() => {
                    const channelX =
                      svgLines.vpcToSubnets.length > 0
                        ? (svgLines.vpcToSubnets[0].x1 + svgLines.vpcToSubnets[0].x2) / 2
                        : undefined;

                    return svgLines.vpcToSubnets.map((line) => {
                      const active = isCardActive("subnet", line.subId);
                      const d = getAwsSmoothPath(line.x1, line.y1, line.x2, line.y2, channelX);

                      return (
                        <path
                          key={`vpc-sub-${line.subId}`}
                          d={d}
                          fill="none"
                          stroke={active ? "#ec7211" : "#0073bb"}
                          strokeWidth={active ? 2.5 : 2}
                          opacity={!isAnyActive || active ? 1 : 0.25}
                          className="transition-all duration-150"
                        />
                      );
                    });
                  })()}

                  {/* Subnet to Route Table lines (Smooth Rounded Connectors) */}
                  {svgLines.subnetToRtb.map((line, idx) => {
                    const active = isLineActive("subnet", line.subId, line.rtbId);
                    const d = getAwsSmoothPath(line.x1, line.y1, line.x2, line.y2);

                    return (
                      <path
                        key={`sub-rtb-${idx}`}
                        d={d}
                        fill="none"
                        stroke={active ? "#ec7211" : "#0073bb"}
                        strokeWidth={active ? 2.5 : 2}
                        opacity={!isAnyActive || active ? 1 : 0.25}
                        className="transition-all duration-150"
                      />
                    );
                  })}

                  {/* Route Table to Network Connections lines (Dotted Smooth Connectors) */}
                  {svgLines.rtbToGw.map((line, idx) => {
                    const active = isLineActive("rtb", line.rtbId, line.gwId);
                    const d = getAwsSmoothPath(line.x1, line.y1, line.x2, line.y2);

                    return (
                      <path
                        key={`rtb-gw-${idx}`}
                        d={d}
                        fill="none"
                        stroke={active ? "#ec7211" : "#0073bb"}
                        strokeWidth={active ? 2.5 : 2}
                        strokeDasharray="4 4"
                        opacity={!isAnyActive || active ? 1 : 0.25}
                        className="transition-all duration-150"
                      />
                    );
                  })}
                </svg>

                {/* 4 Distinct AWS Columns */}
                <div
                  className="grid grid-cols-4 gap-8 relative z-20"
                  style={{ minWidth: "1020px" }}
                >
                  {/* Column 1: VPC */}
                  <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[15px] font-bold text-[#16191f]">VPC</span>
                        <button
                          onClick={() => setShowVpcDetails(!showVpcDetails)}
                          className="text-[12px] text-[#0073bb] hover:underline"
                        >
                          {showVpcDetails ? "Hide details" : "Show details"}
                        </button>
                      </div>
                      <p className="text-[12px] text-[#545b64] mb-4">Your AWS virtual network</p>

                      <div
                        id="resmap-vpc-card"
                        onClick={() => setActiveTab("details")}
                        className="bg-[#0073bb] text-white rounded p-3.5 shadow-sm transition-all cursor-pointer group hover:bg-[#005a9e]"
                        title="Click to view VPC details"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-[13px] truncate group-hover:underline">
                            {selectedVpc.Name || selectedVpc.VpcId}
                          </div>
                          <span className="text-[11px] opacity-75 group-hover:opacity-100">↗</span>
                        </div>
                        <div className="text-[12px] opacity-90 font-mono mt-0.5">
                          {selectedVpc.CidrBlock}
                        </div>
                        {showVpcDetails && (
                          <div className="text-[11px] opacity-80 mt-1">
                            Amazon-provided IPv6
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Subnets */}
                  <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-xs space-y-4">
                    <div>
                      <h3 className="text-[15px] font-bold text-[#16191f]">
                        Subnets ({subnetsTopology.length})
                      </h3>
                      <p className="text-[12px] text-[#545b64]">Subnets within this VPC</p>
                    </div>

                    {subnetsTopology.length === 0 ? (
                      <div className="text-xs text-gray-400 py-6 text-center">
                        No subnets in this VPC.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(subnetsByAz).map(([az, azSubnets]) => (
                          <div key={az} className="space-y-2">
                            <div className="text-[13px] font-bold text-[#16191f]">{az}</div>

                            {azSubnets.map((item) => {
                              const active = isCardActive("subnet", item.subnet.SubnetId);
                              const isSelected = selectedSubnetId === item.subnet.SubnetId;

                              return (
                                <div
                                  key={item.subnet.SubnetId}
                                  id={`resmap-sub-${item.subnet.SubnetId}`}
                                  onMouseEnter={() => setHoveredSubnetId(item.subnet.SubnetId)}
                                  onMouseLeave={() => setHoveredSubnetId(null)}
                                  onClick={() => {
                                    router.push(
                                      `/vpc/subnets/${encodeURIComponent(
                                        item.subnet.SubnetId
                                      )}`
                                    );
                                  }}
                                  className={`bg-white border rounded p-2.5 transition-all cursor-pointer group hover:shadow-md ${
                                    active || isSelected
                                      ? "border-[#ec7211] ring-2 ring-orange-200 shadow-sm"
                                      : "border-[#0073bb] hover:border-[#ec7211]"
                                  } ${isAnyActive && !active ? "opacity-35" : "opacity-100"}`}
                                  title={`Click to open Subnet ${item.subnet.SubnetId} page`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {item.isPublic ? (
                                      /* Public subnet green circle */
                                      <div
                                        className="w-5 h-5 rounded-full bg-[#1e8e3e] text-white flex items-center justify-center text-[10px] font-bold shrink-0"
                                        title="Public Subnet"
                                      >
                                        {item.azLetter}
                                      </div>
                                    ) : (
                                      /* Private subnet blue rounded square */
                                      <div
                                        className="w-5 h-5 rounded bg-[#0073bb] text-white flex items-center justify-center text-[10px] font-bold shrink-0"
                                        title="Private Subnet"
                                      >
                                        {item.azLetter}
                                      </div>
                                    )}

                                    <Link
                                      href={`/vpc/subnets/${encodeURIComponent(
                                        item.subnet.SubnetId
                                      )}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="font-semibold text-[12px] text-[#0073bb] group-hover:underline truncate max-w-[150px]"
                                    >
                                      {item.subnet.Name || item.subnet.SubnetId}
                                    </Link>
                                    <span className="text-[#0073bb] text-[11px] ml-auto shrink-0 opacity-70 group-hover:opacity-100">
                                      ↗
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-[#545b64] font-mono pl-7">
                                    {item.subnet.CidrBlock}
                                  </div>
                                  <div className="text-[11px] text-[#545b64] pl-7">
                                    Amazon-provided IPv6
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Column 3: Route tables */}
                  <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-xs space-y-4">
                    <div>
                      <h3 className="text-[15px] font-bold text-[#16191f]">
                        Route tables ({vpcRouteTables.length})
                      </h3>
                      <p className="text-[12px] text-[#545b64]">Route network traffic to resources</p>
                    </div>

                    {vpcRouteTables.length === 0 ? (
                      <div className="text-xs text-gray-400 py-6 text-center">
                        No route tables in this VPC.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {vpcRouteTables.map((rtb) => {
                          const active = isCardActive("rtb", rtb.RouteTableId);
                          const isSelected = selectedRtbId === rtb.RouteTableId;

                          // Compute routes summary text
                          const igwRoute = rtb.Routes?.find((r) => r.GatewayId?.startsWith("igw-"));
                          const natRoute = rtb.Routes?.find((r) => r.NatGatewayId || r.GatewayId?.startsWith("nat-"));
                          const vpceRoute = rtb.Routes?.find((r) => r.GatewayId?.startsWith("vpce-"));

                          return (
                            <div
                              key={rtb.RouteTableId}
                              id={`resmap-rtb-${rtb.RouteTableId}`}
                              onMouseEnter={() => setHoveredRtbId(rtb.RouteTableId)}
                              onMouseLeave={() => setHoveredRtbId(null)}
                              onClick={() => {
                                router.push(
                                  `/vpc/route-tables/${encodeURIComponent(
                                    rtb.RouteTableId
                                  )}`
                                );
                              }}
                              className={`bg-white border rounded p-2.5 transition-all cursor-pointer group hover:shadow-md ${
                                active || isSelected
                                  ? "border-[#ec7211] ring-2 ring-orange-200 shadow-sm"
                                  : "border-[#0073bb] hover:border-[#ec7211]"
                              } ${isAnyActive && !active ? "opacity-35" : "opacity-100"}`}
                              title={`Click to open Route Table ${rtb.RouteTableId} page`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Link
                                  href={`/vpc/route-tables/${encodeURIComponent(
                                    rtb.RouteTableId
                                  )}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-semibold text-[12px] text-[#0073bb] group-hover:underline truncate max-w-[160px]"
                                >
                                  {rtb.Name || rtb.RouteTableId}
                                </Link>
                                <span className="text-[#0073bb] text-[11px] opacity-70 group-hover:opacity-100 shrink-0">
                                  ↗
                                </span>
                              </div>

                              <div className="mt-1 space-y-0.5 text-[11px] text-[#545b64]">
                                {igwRoute && (
                                  <>
                                    <div>0.0.0.0/0 routes to {igwRoute.GatewayId}</div>
                                    <div>::/0 routes to {igwRoute.GatewayId}</div>
                                  </>
                                )}
                                {natRoute && (
                                  <div>
                                    0.0.0.0/0 routes to {natRoute.NatGatewayId || natRoute.GatewayId}
                                  </div>
                                )}
                                {vpceRoute && (
                                  <div>
                                    Prefix list through {vpceRoute.GatewayId}
                                  </div>
                                )}
                                {!igwRoute && !natRoute && !vpceRoute && (
                                  <div>Local traffic to {selectedVpc.CidrBlock}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Column 4: Network connections */}
                  <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-xs space-y-4">
                    <div>
                      <h3 className="text-[15px] font-bold text-[#16191f]">
                        Network connections ({gatewayTargets.length})
                      </h3>
                      <p className="text-[12px] text-[#545b64]">Connections to other networks</p>
                    </div>

                    {gatewayTargets.length === 0 ? (
                      <div className="text-xs text-gray-400 py-6 text-center">
                        No external gateways attached.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {gatewayTargets.map((target) => {
                          const active = isCardActive("gw", target.id);
                          const isSelected = selectedGwId === target.id;

                          return (
                            <div
                              key={target.id}
                              id={`resmap-gw-${target.id}`}
                              onMouseEnter={() => setHoveredGwId(target.id)}
                              onMouseLeave={() => setHoveredGwId(null)}
                              onClick={() => {
                                const dest =
                                  target.type === "Internet Gateway"
                                    ? `/vpc/internet-gateways?search=${encodeURIComponent(
                                        target.id
                                      )}`
                                    : target.type === "NAT Gateway"
                                    ? `/vpc/nat-gateways?search=${encodeURIComponent(
                                        target.id
                                      )}`
                                    : `/vpc/endpoints?search=${encodeURIComponent(
                                        target.id
                                      )}`;
                                router.push(dest);
                              }}
                              className={`bg-white border rounded p-2.5 transition-all cursor-pointer group hover:shadow-md ${
                                active || isSelected
                                  ? "border-[#ec7211] ring-2 ring-orange-200 shadow-sm"
                                  : "border-[#0073bb] hover:border-[#ec7211]"
                              } ${isAnyActive && !active ? "opacity-35" : "opacity-100"}`}
                              title={`Click to open in ${target.type} console`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Link
                                  href={
                                    target.type === "Internet Gateway"
                                      ? `/vpc/internet-gateways?search=${encodeURIComponent(
                                          target.id
                                        )}`
                                      : target.type === "NAT Gateway"
                                      ? `/vpc/nat-gateways?search=${encodeURIComponent(
                                          target.id
                                        )}`
                                      : `/vpc/endpoints?search=${encodeURIComponent(
                                          target.id
                                        )}`
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-semibold text-[12px] text-[#0073bb] group-hover:underline truncate max-w-[160px]"
                                >
                                  {target.name}
                                </Link>
                                <span className="text-[#0073bb] text-[11px] opacity-70 group-hover:opacity-100 shrink-0">
                                  ↗
                                </span>
                              </div>

                              <div className="mt-1 space-y-0.5 text-[11px] text-[#545b64]">
                                <div>{target.subtext1}</div>
                                {target.subtext2 && <div>{target.subtext2}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
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
