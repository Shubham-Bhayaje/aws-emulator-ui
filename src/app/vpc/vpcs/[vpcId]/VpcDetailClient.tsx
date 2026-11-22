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
  NetworkAclItem,
  modifyVpcAttributeAction,
  deleteVpcAction,
} from "../../actions";

interface Props {
  vpc: VpcItem;
  subnets: SubnetItem[];
  routeTables: RouteTableItem[];
  internetGateways: InternetGatewayItem[];
  natGateways: NatGatewayItem[];
  endpoints: VpcEndpointItem[];
  networkAcls: NetworkAclItem[];
}

export default function VpcDetailClient({
  vpc: initialVpc,
  subnets,
  routeTables,
  internetGateways,
  natGateways,
  endpoints,
  networkAcls,
}: Props) {
  const router = useRouter();

  const [vpc, setVpc] = useState<VpcItem>(initialVpc);
  const [activeTab, setActiveTab] = useState<"details" | "cidrs" | "subnets" | "routetables" | "resourcemap" | "tags">("details");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Actions dropdown
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const mainRtb = routeTables.find((r) => r.IsMain) || routeTables[0];
  const defaultNacl = networkAcls.find((n) => n.IsDefault) || networkAcls[0];

  const handleToggleDnsHostnames = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const newVal = !vpc.EnableDnsHostnames;
      const res = await modifyVpcAttributeAction(vpc.VpcId, "enableDnsHostnames", newVal);
      if (res.success) {
        setVpc((prev) => ({ ...prev, EnableDnsHostnames: newVal }));
        setMessage({ type: "success", text: `Updated DNS hostnames to ${newVal ? "enabled" : "disabled"}` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update DNS hostnames" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDnsResolution = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const newVal = !vpc.EnableDnsSupport;
      const res = await modifyVpcAttributeAction(vpc.VpcId, "enableDnsSupport", newVal);
      if (res.success) {
        setVpc((prev) => ({ ...prev, EnableDnsSupport: newVal }));
        setMessage({ type: "success", text: `Updated DNS resolution to ${newVal ? "enabled" : "disabled"}` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update DNS resolution" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVpc = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteVpcAction(vpc.VpcId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        router.push("/vpc/vpcs");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete VPC" });
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
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Your VPCs
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{vpc.VpcId}</span>
      </div>

      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">{vpc.Name || vpc.VpcId}</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {vpc.State}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">{vpc.VpcId}</p>
        </div>

        <div className="flex items-center gap-2 relative">
          <Link
            href="/vpc/vpcs"
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View all VPCs
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
                  onClick={handleToggleDnsHostnames}
                  disabled={actionLoading}
                  className="w-full text-left px-4 py-2 text-xs text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  {vpc.EnableDnsHostnames ? "Disable DNS hostnames" : "Enable DNS hostnames"}
                </button>
                <button
                  onClick={handleToggleDnsResolution}
                  disabled={actionLoading}
                  className="w-full text-left px-4 py-2 text-xs text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  {vpc.EnableDnsSupport ? "Disable DNS resolution" : "Enable DNS resolution"}
                </button>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete VPC
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

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">VPC ID</div>
          <div className="text-[13px] font-mono text-[#16191f] font-semibold mt-0.5 truncate">
            {vpc.VpcId}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">IPv4 CIDR</div>
          <div className="text-[13px] font-mono text-[#16191f] font-semibold mt-0.5">
            {vpc.CidrBlock}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Default VPC</div>
          <div className="text-[13px] font-semibold text-[#16191f] mt-0.5">
            {vpc.IsDefault ? "Yes" : "No"}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Subnets</div>
          <div className="text-[13px] font-semibold text-[#16191f] mt-0.5">
            {subnets.length}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Route Tables</div>
          <div className="text-[13px] font-semibold text-[#16191f] mt-0.5">
            {routeTables.length}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">DNS Hostnames</div>
          <div className="text-[13px] font-semibold text-[#16191f] mt-0.5">
            {vpc.EnableDnsHostnames ? "Enabled" : "Disabled"}
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
            onClick={() => setActiveTab("cidrs")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "cidrs"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            CIDRs ({vpc.CidrBlockAssociationSet?.length || 1})
          </button>
          <button
            onClick={() => setActiveTab("subnets")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "subnets"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Subnets ({subnets.length})
          </button>
          <button
            onClick={() => setActiveTab("routetables")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "routetables"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Route tables ({routeTables.length})
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
            Tags ({Object.keys(vpc.Tags || {}).length})
          </button>
        </div>
      </div>

      {/* Tab 1: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-[13px]">
            <div>
              <span className="text-[#545b64] block mb-1">VPC ID</span>
              <span className="font-mono font-semibold text-[#16191f]">{vpc.VpcId}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">State</span>
              <span className="text-emerald-700 font-semibold">{vpc.State}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">IPv4 CIDR</span>
              <span className="font-mono text-[#16191f]">{vpc.CidrBlock}</span>
            </div>

            <div>
              <span className="text-[#545b64] block mb-1">DHCP options set</span>
              <span className="font-mono text-[#0073bb]">
                {vpc.DhcpOptionsId ? (
                  <Link href={`/vpc/dhcp-options/${vpc.DhcpOptionsId}`} className="hover:underline">
                    {vpc.DhcpOptionsId}
                  </Link>
                ) : (
                  "-"
                )}
              </span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Main route table</span>
              <span className="font-mono text-[#0073bb]">
                {mainRtb ? (
                  <Link href={`/vpc/route-tables/${mainRtb.RouteTableId}`} className="hover:underline">
                    {mainRtb.RouteTableId} {mainRtb.Name ? `(${mainRtb.Name})` : ""}
                  </Link>
                ) : (
                  "-"
                )}
              </span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Main network ACL</span>
              <span className="font-mono text-[#0073bb]">
                {defaultNacl ? (
                  <Link href={`/vpc/network-acls/${defaultNacl.NetworkAclId}`} className="hover:underline">
                    {defaultNacl.NetworkAclId}
                  </Link>
                ) : (
                  "-"
                )}
              </span>
            </div>

            <div>
              <span className="text-[#545b64] block mb-1">Tenancy</span>
              <span className="text-[#16191f]">{vpc.InstanceTenancy || "default"}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Default VPC</span>
              <span className="text-[#16191f]">{vpc.IsDefault ? "Yes" : "No"}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Owner ID</span>
              <span className="font-mono text-[#16191f]">{vpc.OwnerId || "000000000000"}</span>
            </div>

            <div>
              <span className="text-[#545b64] block mb-1">DNS hostnames</span>
              <div className="flex items-center gap-2">
                <span className="text-[#16191f] font-medium">{vpc.EnableDnsHostnames ? "Enabled" : "Disabled"}</span>
                <button
                  type="button"
                  onClick={handleToggleDnsHostnames}
                  className="text-xs text-[#0073bb] hover:underline font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">DNS resolution</span>
              <div className="flex items-center gap-2">
                <span className="text-[#16191f] font-medium">{vpc.EnableDnsSupport ? "Enabled" : "Disabled"}</span>
                <button
                  type="button"
                  onClick={handleToggleDnsResolution}
                  className="text-xs text-[#0073bb] hover:underline font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CIDRs */}
      {activeTab === "cidrs" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eaeded]">
            <h3 className="text-[15px] font-bold text-[#16191f]">IPv4 CIDRs</h3>
            <p className="text-xs text-[#545b64] mt-0.5">IPv4 address blocks associated with this VPC.</p>
          </div>
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                <th className="py-2.5 px-6">IPv4 CIDR</th>
                <th className="py-2.5 px-6">State</th>
                <th className="py-2.5 px-6">Association ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {(vpc.CidrBlockAssociationSet || [{ AssociationId: "primary", CidrBlock: vpc.CidrBlock, State: "associated" }]).map(
                (c, i) => (
                  <tr key={i} className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-6 font-mono text-[#16191f] font-semibold">{c.CidrBlock}</td>
                    <td className="py-2.5 px-6 text-emerald-700 font-medium">{c.State || "associated"}</td>
                    <td className="py-2.5 px-6 font-mono text-[#545b64]">{c.AssociationId || "-"}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Subnets */}
      {activeTab === "subnets" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-[#16191f]">Subnets ({subnets.length})</h3>
              <p className="text-xs text-[#545b64] mt-0.5">Subnets configured within this VPC.</p>
            </div>
            <Link
              href="/vpc/subnets/create"
              className="px-3 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Create subnet
            </Link>
          </div>
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                <th className="py-2.5 px-6">Name</th>
                <th className="py-2.5 px-6">Subnet ID</th>
                <th className="py-2.5 px-6">IPv4 CIDR</th>
                <th className="py-2.5 px-6">Availability Zone</th>
                <th className="py-2.5 px-6">Available IPs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {subnets.map((sub) => (
                <tr key={sub.SubnetId} className="hover:bg-[#fafafa]">
                  <td className="py-2.5 px-6 font-medium text-[#16191f]">
                    <Link href={`/vpc/subnets/${sub.SubnetId}`} className="text-[#0073bb] hover:underline">
                      {sub.Name || "-"}
                    </Link>
                  </td>
                  <td className="py-2.5 px-6 font-mono text-[#0073bb]">
                    <Link href={`/vpc/subnets/${sub.SubnetId}`} className="hover:underline font-semibold">
                      {sub.SubnetId}
                    </Link>
                  </td>
                  <td className="py-2.5 px-6 font-mono text-[#16191f]">{sub.CidrBlock}</td>
                  <td className="py-2.5 px-6 text-[#545b64]">{sub.AvailabilityZone || "-"}</td>
                  <td className="py-2.5 px-6 text-[#16191f]">{sub.AvailableIpAddressCount ?? "-"}</td>
                </tr>
              ))}
              {subnets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-[#545b64]">
                    No subnets found in this VPC.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Route Tables */}
      {activeTab === "routetables" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eaeded]">
            <h3 className="text-[15px] font-bold text-[#16191f]">Route tables ({routeTables.length})</h3>
            <p className="text-xs text-[#545b64] mt-0.5">Route tables routing traffic within this VPC.</p>
          </div>
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                <th className="py-2.5 px-6">Name</th>
                <th className="py-2.5 px-6">Route Table ID</th>
                <th className="py-2.5 px-6">Main</th>
                <th className="py-2.5 px-6">Routes</th>
                <th className="py-2.5 px-6">Explicit Associations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {routeTables.map((rtb) => (
                <tr key={rtb.RouteTableId} className="hover:bg-[#fafafa]">
                  <td className="py-2.5 px-6 font-medium text-[#16191f]">
                    <Link href={`/vpc/route-tables/${rtb.RouteTableId}`} className="text-[#0073bb] hover:underline">
                      {rtb.Name || "-"}
                    </Link>
                  </td>
                  <td className="py-2.5 px-6 font-mono text-[#0073bb]">
                    <Link href={`/vpc/route-tables/${rtb.RouteTableId}`} className="hover:underline font-semibold">
                      {rtb.RouteTableId}
                    </Link>
                  </td>
                  <td className="py-2.5 px-6 text-[#545b64]">{rtb.IsMain ? "Yes" : "No"}</td>
                  <td className="py-2.5 px-6 text-[#16191f]">{rtb.Routes.length}</td>
                  <td className="py-2.5 px-6 text-[#545b64]">
                    {rtb.Associations.filter((a) => !a.Main).length} explicit
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Resource Map Shortcut */}
      {activeTab === "resourcemap" && (
        <div className="bg-[#f8f9fa] border border-[#eaeded] rounded-xl p-6 text-center space-y-4">
          <h3 className="text-[16px] font-bold text-[#16191f]">Interactive VPC Resource Map</h3>
          <p className="text-xs text-[#545b64] max-w-lg mx-auto">
            View the complete visual architecture of this VPC with smooth 90-degree orthogonal network connectors linking subnets, route tables, and gateways.
          </p>
          <div>
            <Link
              href="/vpc/vpcs"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center gap-1.5 transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              <span>Open full interactive Resource Map</span>
              <span>↗</span>
            </Link>
          </div>
        </div>
      )}

      {/* Tab 6: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eaeded]">
            <h3 className="text-[15px] font-bold text-[#16191f]">Tags</h3>
            <p className="text-xs text-[#545b64] mt-0.5">Key-value tags assigned to this VPC.</p>
          </div>
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                <th className="py-2.5 px-6">Key</th>
                <th className="py-2.5 px-6">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {Object.entries(vpc.Tags || {}).map(([k, v]) => (
                <tr key={k} className="hover:bg-[#fafafa]">
                  <td className="py-2.5 px-6 font-mono text-[#16191f]">{k}</td>
                  <td className="py-2.5 px-6 font-mono text-[#545b64]">{v}</td>
                </tr>
              ))}
              {Object.keys(vpc.Tags || {}).length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-xs text-[#545b64]">
                    No tags associated with this VPC.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete VPC Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete VPC</h3>
            <p className="text-xs text-[#545b64]">
              Are you sure you want to delete VPC <span className="font-mono font-semibold text-red-600">{vpc.VpcId}</span>? To confirm, type <span className="font-mono font-bold">delete</span> below.
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
                onClick={handleDeleteVpc}
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
