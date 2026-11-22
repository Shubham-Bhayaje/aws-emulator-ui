"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SubnetItem,
  RouteTableItem,
  NetworkAclItem,
  VpcItem,
  modifySubnetAttributeAction,
  associateRouteTableAction,
  deleteSubnetAction,
} from "../../actions";

interface Props {
  subnet: SubnetItem;
  routeTable?: RouteTableItem;
  networkAcl?: NetworkAclItem;
  allRouteTables: RouteTableItem[];
  vpc?: VpcItem;
}

export default function SubnetDetailClient({
  subnet: initialSubnet,
  routeTable: initialRouteTable,
  networkAcl,
  allRouteTables,
  vpc,
}: Props) {
  const router = useRouter();

  const [subnet, setSubnet] = useState<SubnetItem>(initialSubnet);
  const [routeTable, setRouteTable] = useState<RouteTableItem | undefined>(initialRouteTable);
  const [activeTab, setActiveTab] = useState<"details" | "routetable" | "networkacl" | "resourcemap" | "tags">("details");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isEditSettingsOpen, setIsEditSettingsOpen] = useState(false);
  const [mapPublicIp, setMapPublicIp] = useState(Boolean(subnet.MapPublicIpOnLaunch));

  const [isEditRtbOpen, setIsEditRtbOpen] = useState(false);
  const [selectedRtbId, setSelectedRtbId] = useState(routeTable?.RouteTableId || "");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 1. Toggle / Save Subnet Settings
  const handleSaveSubnetSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await modifySubnetAttributeAction(subnet.SubnetId, mapPublicIp);
      if (res.success) {
        setSubnet((prev) => ({ ...prev, MapPublicIpOnLaunch: mapPublicIp }));
        setIsEditSettingsOpen(false);
        setMessage({ type: "success", text: `Successfully updated subnet settings for ${subnet.SubnetId}` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update subnet settings" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Edit Route Table Association
  const handleSaveRtbAssociation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRtbId) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await associateRouteTableAction(selectedRtbId, subnet.SubnetId);
      if (res.success) {
        const targetRtb = allRouteTables.find((r) => r.RouteTableId === selectedRtbId);
        setRouteTable(targetRtb);
        setIsEditRtbOpen(false);
        setMessage({
          type: "success",
          text: `Successfully associated route table ${selectedRtbId} with subnet ${subnet.SubnetId}`,
        });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to associate route table" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Delete Subnet
  const handleDeleteSubnet = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteSubnetAction(subnet.SubnetId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        router.push("/vpc/subnets");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete subnet" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Virtual Private Cloud
        </Link>
        <span>&gt;</span>
        <Link href="/vpc/subnets" className="hover:text-[#0073bb]">
          Subnets
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{subnet.SubnetId}</span>
      </div>

      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">
              {subnet.Name || subnet.SubnetId}
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {subnet.State}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">{subnet.SubnetId}</p>
        </div>

        <div className="flex items-center gap-2 relative">
          <Link
            href="/vpc/subnets"
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View all subnets
          </Link>

          <div className="relative">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center gap-1.5"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              <span>Actions</span>
              <span className="text-[10px]">▼</span>
            </button>

            {isActionsOpen && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white border border-[#d5dbdb] rounded shadow-lg z-30 py-1"
                onClick={() => setIsActionsOpen(false)}
              >
                <button
                  onClick={() => setIsEditSettingsOpen(true)}
                  className="w-full text-left px-4 py-2 text-xs text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  Edit subnet settings
                </button>
                <button
                  onClick={() => setIsEditRtbOpen(true)}
                  className="w-full text-left px-4 py-2 text-xs text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  Edit route table association
                </button>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete subnet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-3 rounded border text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="font-bold ml-2 text-gray-500 hover:text-black"
          >
            ×
          </button>
        </div>
      )}

      {/* Overview Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Subnet ID</div>
          <div className="text-[13px] font-mono text-[#16191f] font-semibold mt-0.5 truncate">
            {subnet.SubnetId}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">VPC ID</div>
          <div className="text-[13px] font-mono text-[#0073bb] hover:underline font-semibold mt-0.5 truncate">
            <Link href="/vpc/vpcs">{subnet.VpcId}</Link>
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">IPv4 CIDR</div>
          <div className="text-[13px] font-mono text-[#16191f] font-semibold mt-0.5">
            {subnet.CidrBlock}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Available IPv4</div>
          <div className="text-[13px] font-semibold text-[#16191f] mt-0.5">
            {subnet.AvailableIpAddressCount !== undefined ? subnet.AvailableIpAddressCount : "-"}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Availability Zone</div>
          <div className="text-[13px] font-semibold text-[#16191f] mt-0.5 truncate">
            {subnet.AvailabilityZone || "-"}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Auto-Assign Public IP</div>
          <div className="text-[13px] font-semibold text-[#16191f] mt-0.5">
            {subnet.MapPublicIpOnLaunch ? "Yes" : "No"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded]">
        <div className="flex gap-6 text-[13px]">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "details"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("routetable")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "routetable"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Route table
          </button>
          <button
            onClick={() => setActiveTab("networkacl")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "networkacl"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Network ACL
          </button>
          <button
            onClick={() => setActiveTab("resourcemap")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "resourcemap"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Resource map
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({Object.keys(subnet.Tags || {}).length})
          </button>
        </div>
      </div>

      {/* Tab 1: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-[13px]">
            <div>
              <span className="text-[#545b64] block mb-1">Subnet ID</span>
              <span className="font-mono font-semibold text-[#16191f]">{subnet.SubnetId}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Subnet ARN</span>
              <span className="font-mono text-[11px] text-[#16191f] break-all">
                {subnet.SubnetArn || `arn:aws:ec2:us-east-1:000000000000:subnet/${subnet.SubnetId}`}
              </span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">State</span>
              <span className="text-emerald-700 font-semibold">{subnet.State}</span>
            </div>

            <div>
              <span className="text-[#545b64] block mb-1">VPC</span>
              <Link href="/vpc/vpcs" className="font-mono text-[#0073bb] hover:underline font-semibold">
                {subnet.VpcId} {vpc?.Name ? `(${vpc.Name})` : ""}
              </Link>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">IPv4 CIDR</span>
              <span className="font-mono text-[#16191f]">{subnet.CidrBlock}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Available IPv4 addresses</span>
              <span className="text-[#16191f] font-semibold">
                {subnet.AvailableIpAddressCount !== undefined ? subnet.AvailableIpAddressCount : "-"}
              </span>
            </div>

            <div>
              <span className="text-[#545b64] block mb-1">Availability Zone</span>
              <span className="text-[#16191f]">{subnet.AvailabilityZone || "-"}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Availability Zone ID</span>
              <span className="text-[#16191f]">{subnet.AvailabilityZoneId || "-"}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Default subnet</span>
              <span className="text-[#16191f]">{subnet.DefaultForAz ? "Yes" : "No"}</span>
            </div>

            <div>
              <span className="text-[#545b64] block mb-1">Auto-assign public IPv4 address</span>
              <div className="flex items-center gap-2">
                <span className="text-[#16191f] font-medium">
                  {subnet.MapPublicIpOnLaunch ? "Yes" : "No"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditSettingsOpen(true)}
                  className="text-xs text-[#0073bb] hover:underline font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Auto-assign customer-owned IPv4 address</span>
              <span className="text-[#16191f]">No</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Customer-owned IPv4 pool</span>
              <span className="text-[#545b64]">-</span>
            </div>

            <div>
              <span className="text-[#545b64] block mb-1">DNS64</span>
              <span className="text-[#16191f]">Disabled</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Owner</span>
              <span className="font-mono text-[#16191f]">{subnet.OwnerId || "000000000000"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Route Table */}
      {activeTab === "routetable" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#eaeded]">
              <div>
                <h3 className="text-[15px] font-bold text-[#16191f]">Route table details</h3>
                <p className="text-xs text-[#545b64] mt-0.5">
                  Route table associated with this subnet for traffic routing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditRtbOpen(true)}
                className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Edit route table association
              </button>
            </div>

            {routeTable ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-[13px]">
                <div>
                  <span className="text-[#545b64] block mb-1">Route table ID</span>
                  <Link
                    href={`/vpc/route-tables/${routeTable.RouteTableId}`}
                    className="font-mono text-[#0073bb] hover:underline font-semibold"
                  >
                    {routeTable.RouteTableId}
                  </Link>
                </div>
                <div>
                  <span className="text-[#545b64] block mb-1">Name</span>
                  <span className="text-[#16191f]">{routeTable.Name || "-"}</span>
                </div>
                <div>
                  <span className="text-[#545b64] block mb-1">Main route table</span>
                  <span className="text-[#16191f] font-medium">{routeTable.IsMain ? "Yes" : "No"}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#545b64] pt-4">No route table associated.</p>
            )}
          </div>

          {/* Routes Table */}
          <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#16191f]">
                  Routes ({routeTable?.Routes?.length || 0})
                </h3>
                <p className="text-xs text-[#545b64] mt-0.5">
                  Configured destinations and target hops for this subnet.
                </p>
              </div>
              {routeTable && (
                <Link
                  href={`/vpc/route-tables/${routeTable.RouteTableId}`}
                  className="text-xs text-[#0073bb] hover:underline font-semibold"
                >
                  Manage routes in Route Table console ↗
                </Link>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                    <th className="py-2.5 px-6">Destination</th>
                    <th className="py-2.5 px-6">Target</th>
                    <th className="py-2.5 px-6">Status</th>
                    <th className="py-2.5 px-6">Propagated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {(routeTable?.Routes || []).map((route, i) => (
                    <tr key={i} className="hover:bg-[#fafafa]">
                      <td className="py-2.5 px-6 font-mono text-[#16191f]">
                        {route.DestinationCidrBlock || "0.0.0.0/0"}
                      </td>
                      <td className="py-2.5 px-6 font-mono text-[#0073bb]">
                        {route.GatewayId || route.NatGatewayId || route.TransitGatewayId || "local"}
                      </td>
                      <td className="py-2.5 px-6 text-emerald-700 font-medium">
                        {route.State || "Active"}
                      </td>
                      <td className="py-2.5 px-6 text-[#545b64]">No</td>
                    </tr>
                  ))}
                  {(!routeTable?.Routes || routeTable.Routes.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-[#545b64]">
                        No routes configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Network ACL */}
      {activeTab === "networkacl" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded-xl p-6">
            <h3 className="text-[15px] font-bold text-[#16191f]">Network ACL details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-[13px]">
              <div>
                <span className="text-[#545b64] block mb-1">Network ACL ID</span>
                <span className="font-mono text-[#16191f] font-semibold">
                  {networkAcl?.NetworkAclId || "-"}
                </span>
              </div>
              <div>
                <span className="text-[#545b64] block mb-1">Name</span>
                <span className="text-[#16191f]">{networkAcl?.Name || "-"}</span>
              </div>
              <div>
                <span className="text-[#545b64] block mb-1">Default ACL</span>
                <span className="text-[#16191f]">{networkAcl?.IsDefault ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>

          {/* Inbound Rules */}
          <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#eaeded]">
              <h3 className="text-[15px] font-bold text-[#16191f]">Inbound rules</h3>
              <p className="text-xs text-[#545b64] mt-0.5">Rules evaluating incoming traffic into this subnet.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                    <th className="py-2.5 px-6">Rule #</th>
                    <th className="py-2.5 px-6">Type</th>
                    <th className="py-2.5 px-6">Protocol</th>
                    <th className="py-2.5 px-6">Port range</th>
                    <th className="py-2.5 px-6">Source</th>
                    <th className="py-2.5 px-6">Allow / Deny</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {(networkAcl?.Entries || [])
                    .filter((e) => !e.Egress)
                    .map((entry, idx) => (
                      <tr key={idx} className="hover:bg-[#fafafa]">
                        <td className="py-2.5 px-6 font-mono text-[#16191f]">
                          {entry.RuleNumber === 32767 ? "*" : entry.RuleNumber}
                        </td>
                        <td className="py-2.5 px-6 text-[#16191f]">
                          {entry.Protocol === "-1" ? "All traffic" : `Protocol ${entry.Protocol}`}
                        </td>
                        <td className="py-2.5 px-6 font-mono text-[#16191f]">
                          {entry.Protocol === "-1" ? "All" : entry.Protocol}
                        </td>
                        <td className="py-2.5 px-6 font-mono text-[#16191f]">
                          {entry.PortRange ? `${entry.PortRange.From}-${entry.PortRange.To}` : "All"}
                        </td>
                        <td className="py-2.5 px-6 font-mono text-[#16191f]">
                          {entry.CidrBlock || "0.0.0.0/0"}
                        </td>
                        <td className="py-2.5 px-6 font-semibold">
                          <span
                            className={
                              entry.RuleAction === "allow" ? "text-emerald-700" : "text-red-700"
                            }
                          >
                            {entry.RuleAction.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outbound Rules */}
          <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#eaeded]">
              <h3 className="text-[15px] font-bold text-[#16191f]">Outbound rules</h3>
              <p className="text-xs text-[#545b64] mt-0.5">Rules evaluating outgoing traffic from this subnet.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                    <th className="py-2.5 px-6">Rule #</th>
                    <th className="py-2.5 px-6">Type</th>
                    <th className="py-2.5 px-6">Protocol</th>
                    <th className="py-2.5 px-6">Port range</th>
                    <th className="py-2.5 px-6">Destination</th>
                    <th className="py-2.5 px-6">Allow / Deny</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {(networkAcl?.Entries || [])
                    .filter((e) => e.Egress)
                    .map((entry, idx) => (
                      <tr key={idx} className="hover:bg-[#fafafa]">
                        <td className="py-2.5 px-6 font-mono text-[#16191f]">
                          {entry.RuleNumber === 32767 ? "*" : entry.RuleNumber}
                        </td>
                        <td className="py-2.5 px-6 text-[#16191f]">
                          {entry.Protocol === "-1" ? "All traffic" : `Protocol ${entry.Protocol}`}
                        </td>
                        <td className="py-2.5 px-6 font-mono text-[#16191f]">
                          {entry.Protocol === "-1" ? "All" : entry.Protocol}
                        </td>
                        <td className="py-2.5 px-6 font-mono text-[#16191f]">
                          {entry.PortRange ? `${entry.PortRange.From}-${entry.PortRange.To}` : "All"}
                        </td>
                        <td className="py-2.5 px-6 font-mono text-[#16191f]">
                          {entry.CidrBlock || "0.0.0.0/0"}
                        </td>
                        <td className="py-2.5 px-6 font-semibold">
                          <span
                            className={
                              entry.RuleAction === "allow" ? "text-emerald-700" : "text-red-700"
                            }
                          >
                            {entry.RuleAction.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Subnet Resource Map */}
      {activeTab === "resourcemap" && (
        <div className="bg-[#f8f9fa] border border-[#eaeded] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#16191f]">Subnet resource flow</h3>
              <p className="text-xs text-[#545b64] mt-0.5">
                Path tracing from VPC network into this specific subnet and its next hop.
              </p>
            </div>
            <Link
              href="/vpc/vpcs"
              className="text-xs text-[#0073bb] hover:underline font-semibold"
            >
              Open complete VPC Resource Map ↗
            </Link>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8 max-w-4xl mx-auto">
            {/* 1. VPC */}
            <div className="w-full md:w-56 bg-[#0073bb] text-white p-4 rounded shadow-sm">
              <div className="text-[11px] uppercase tracking-wider text-blue-100 font-semibold">VPC</div>
              <div className="font-bold text-[13px] mt-1 truncate">{vpc?.Name || subnet.VpcId}</div>
              <div className="text-[11px] text-blue-200 font-mono mt-0.5">{vpc?.CidrBlock || subnet.CidrBlock}</div>
            </div>

            <span className="text-[#0073bb] font-bold text-lg hidden md:block">➔</span>

            {/* 2. Subnet */}
            <div className="w-full md:w-64 bg-white border-2 border-[#ec7211] p-4 rounded shadow-sm ring-2 ring-orange-200">
              <div className="text-[11px] uppercase tracking-wider text-[#ec7211] font-semibold">This Subnet</div>
              <div className="font-bold text-[13px] text-[#16191f] mt-1 truncate">
                {subnet.Name || subnet.SubnetId}
              </div>
              <div className="text-[11px] text-[#545b64] font-mono mt-0.5">{subnet.CidrBlock}</div>
              <div className="text-[11px] text-[#545b64] mt-1">{subnet.AvailabilityZone}</div>
            </div>

            <span className="text-[#0073bb] font-bold text-lg hidden md:block">➔</span>

            {/* 3. Route Table */}
            <div className="w-full md:w-60 bg-white border border-[#0073bb] p-4 rounded shadow-sm">
              <div className="text-[11px] uppercase tracking-wider text-[#0073bb] font-semibold">Route Table</div>
              {routeTable ? (
                <>
                  <Link
                    href={`/vpc/route-tables/${routeTable.RouteTableId}`}
                    className="font-bold text-[13px] text-[#0073bb] hover:underline mt-1 block truncate"
                  >
                    {routeTable.Name || routeTable.RouteTableId}
                  </Link>
                  <div className="text-[11px] text-[#545b64] mt-0.5">
                    {routeTable.Routes?.length || 0} configured routes
                  </div>
                </>
              ) : (
                <div className="text-xs text-[#545b64] mt-1">No Route Table</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eaeded]">
            <h3 className="text-[15px] font-bold text-[#16191f]">Tags</h3>
            <p className="text-xs text-[#545b64] mt-0.5">Key-value tags assigned to this subnet resource.</p>
          </div>
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                <th className="py-2.5 px-6">Key</th>
                <th className="py-2.5 px-6">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {Object.entries(subnet.Tags || {}).map(([k, v]) => (
                <tr key={k} className="hover:bg-[#fafafa]">
                  <td className="py-2.5 px-6 font-mono text-[#16191f]">{k}</td>
                  <td className="py-2.5 px-6 font-mono text-[#545b64]">{v}</td>
                </tr>
              ))}
              {Object.keys(subnet.Tags || {}).length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-xs text-[#545b64]">
                    No tags associated with this subnet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Subnet Settings Modal */}
      {isEditSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Edit subnet settings</h3>
            <form onSubmit={handleSaveSubnetSettings} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#16191f] block">
                  Auto-assign IP settings
                </label>
                <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                  <input
                    type="checkbox"
                    id="autoPublicIp"
                    checked={mapPublicIp}
                    onChange={(e) => setMapPublicIp(e.target.checked)}
                    className="mt-0.5"
                  />
                  <label htmlFor="autoPublicIp" className="text-xs text-[#16191f] cursor-pointer">
                    <span className="font-semibold block">Enable auto-assign public IPv4 address</span>
                    <span className="text-[#545b64] block mt-0.5">
                      Request a public IPv4 address for all instances launched into this subnet.
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsEditSettingsOpen(false)}
                  className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Route Table Association Modal */}
      {isEditRtbOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Edit route table association</h3>
            <p className="text-xs text-[#545b64]">
              Select the route table to associate with subnet <span className="font-mono font-semibold">{subnet.SubnetId}</span>.
            </p>
            <form onSubmit={handleSaveRtbAssociation} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#16191f] block mb-1">
                  Route table ID
                </label>
                <select
                  value={selectedRtbId}
                  onChange={(e) => setSelectedRtbId(e.target.value)}
                  className="w-full text-xs border border-[#aab7b8] rounded p-2 bg-white"
                  style={{ height: "32px" }}
                >
                  <option value="">Select a route table...</option>
                  {allRouteTables.map((r) => (
                    <option key={r.RouteTableId} value={r.RouteTableId}>
                      {r.RouteTableId} {r.Name ? `(${r.Name})` : ""} {r.IsMain ? "[Main]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsEditRtbOpen(false)}
                  className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !selectedRtbId}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subnet Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete subnet</h3>
            <p className="text-xs text-[#545b64]">
              Are you sure you want to delete subnet <span className="font-mono font-semibold text-red-600">{subnet.SubnetId}</span>? To confirm, type <span className="font-mono font-bold">delete</span> below.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full text-xs border border-[#aab7b8] rounded p-2"
              style={{ height: "32px" }}
            />
            <div className="flex items-center justify-end gap-2 pt-2">
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
                onClick={handleDeleteSubnet}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
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
