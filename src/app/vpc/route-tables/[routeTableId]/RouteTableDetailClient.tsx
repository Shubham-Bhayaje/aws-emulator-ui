"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RouteTableItem,
  SubnetItem,
  InternetGatewayItem,
  NatGatewayItem,
  VpcEndpointItem,
  VpcItem,
  createRouteAction,
  deleteRouteAction,
  associateRouteTableAction,
  disassociateRouteTableAction,
  deleteRouteTableAction,
} from "../../actions";

interface Props {
  routeTable: RouteTableItem;
  associatedSubnets: SubnetItem[];
  unassociatedSubnets: SubnetItem[];
  allSubnets: SubnetItem[];
  internetGateways: InternetGatewayItem[];
  natGateways: NatGatewayItem[];
  endpoints: VpcEndpointItem[];
  vpc?: VpcItem;
}

export default function RouteTableDetailClient({
  routeTable: initialRouteTable,
  associatedSubnets: initialAssociated,
  unassociatedSubnets: initialUnassociated,
  allSubnets,
  internetGateways,
  natGateways,
  endpoints,
  vpc,
}: Props) {
  const router = useRouter();

  const [routeTable, setRouteTable] = useState<RouteTableItem>(initialRouteTable);
  const [associatedSubnets, setAssociatedSubnets] = useState<SubnetItem[]>(initialAssociated);
  const [unassociatedSubnets, setUnassociatedSubnets] = useState<SubnetItem[]>(initialUnassociated);
  const [activeTab, setActiveTab] = useState<"details" | "routes" | "associations" | "edge" | "tags">("routes");

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Add Route Modal
  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);
  const [routeDestination, setRouteDestination] = useState("");
  const [targetType, setTargetType] = useState<"igw" | "nat" | "vpce">("igw");
  const [targetId, setTargetId] = useState(internetGateways.length > 0 ? internetGateways[0].InternetGatewayId : "");

  // Edit Subnet Associations Modal
  const [isEditAssocOpen, setIsEditAssocOpen] = useState(false);
  const [selectedSubnetIds, setSelectedSubnetIds] = useState<string[]>(
    initialAssociated.map((s) => s.SubnetId)
  );

  // Delete Route Table Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 1. Add Route
  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeDestination.trim() || !targetId) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await createRouteAction({
        routeTableId: routeTable.RouteTableId,
        destinationCidrBlock: routeDestination.trim(),
        gatewayId: targetType === "igw" || targetType === "vpce" ? targetId : undefined,
        natGatewayId: targetType === "nat" ? targetId : undefined,
      });

      if (res.success) {
        setRouteTable((prev) => ({
          ...prev,
          Routes: [
            ...prev.Routes,
            {
              DestinationCidrBlock: routeDestination.trim(),
              GatewayId: targetType === "igw" || targetType === "vpce" ? targetId : undefined,
              NatGatewayId: targetType === "nat" ? targetId : undefined,
              State: "active",
              Origin: "CreateRoute",
            },
          ],
        }));
        setIsAddRouteOpen(false);
        setRouteDestination("");
        setMessage({
          type: "success",
          text: `Successfully created route ${routeDestination} -> ${targetId}`,
        });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create route" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Delete Route
  const handleDeleteRoute = async (destCidr: string) => {
    if (destCidr === "local" || destCidr === routeTable.VpcId) {
      setMessage({ type: "error", text: "Cannot delete local VPC route" });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await deleteRouteAction(routeTable.RouteTableId, destCidr);
      if (res.success) {
        setRouteTable((prev) => ({
          ...prev,
          Routes: prev.Routes.filter((r) => r.DestinationCidrBlock !== destCidr),
        }));
        setMessage({ type: "success", text: `Successfully deleted route ${destCidr}` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete route" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Save Subnet Associations
  const handleSaveAssociations = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    try {
      const currentAssocIds = new Set(associatedSubnets.map((s) => s.SubnetId));
      const desiredIds = new Set(selectedSubnetIds);

      // Subnets to associate
      for (const subId of selectedSubnetIds) {
        if (!currentAssocIds.has(subId)) {
          await associateRouteTableAction(routeTable.RouteTableId, subId);
        }
      }

      // Subnets to disassociate
      for (const sub of associatedSubnets) {
        if (!desiredIds.has(sub.SubnetId)) {
          const assoc = routeTable.Associations.find((a) => a.SubnetId === sub.SubnetId);
          if (assoc) {
            await disassociateRouteTableAction(assoc.RouteTableAssociationId);
          }
        }
      }

      const newAssociated = allSubnets.filter((s) => desiredIds.has(s.SubnetId));
      const newUnassociated = allSubnets.filter((s) => !desiredIds.has(s.SubnetId));

      setAssociatedSubnets(newAssociated);
      setUnassociatedSubnets(newUnassociated);
      setIsEditAssocOpen(false);
      setMessage({ type: "success", text: "Successfully updated subnet associations" });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Delete Route Table
  const handleDeleteRouteTable = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteRouteTableAction(routeTable.RouteTableId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        router.push("/vpc/route-tables");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete route table" });
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
        <Link href="/vpc/route-tables" className="hover:text-[#0073bb]">
          Route tables
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{routeTable.RouteTableId}</span>
      </div>

      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">
              {routeTable.Name || routeTable.RouteTableId}
            </h1>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                routeTable.IsMain
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {routeTable.IsMain ? "Main" : "Custom"}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">{routeTable.RouteTableId}</p>
        </div>

        <div className="flex items-center gap-2 relative">
          <Link
            href="/vpc/route-tables"
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View all route tables
          </Link>

          <button
            onClick={() => setIsAddRouteOpen(true)}
            className="px-3 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Edit routes
          </button>

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
                  onClick={() => setIsAddRouteOpen(true)}
                  className="w-full text-left px-4 py-2 text-xs text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  Edit routes
                </button>
                <button
                  onClick={() => setIsEditAssocOpen(true)}
                  className="w-full text-left px-4 py-2 text-xs text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  Edit subnet associations
                </button>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={routeTable.IsMain}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete route table
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

      {/* Overview Metrics Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Route Table ID</div>
          <div className="text-[13px] font-mono text-[#16191f] font-semibold mt-0.5 truncate">
            {routeTable.RouteTableId}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">VPC ID</div>
          <div className="text-[13px] font-mono text-[#0073bb] hover:underline font-semibold mt-0.5 truncate">
            <Link href="/vpc/vpcs">{routeTable.VpcId}</Link>
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Main</div>
          <div className="text-[13px] font-semibold text-[#16191f] mt-0.5">
            {routeTable.IsMain ? "Yes" : "No"}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Explicit Subnet Associations</div>
          <div className="text-[13px] font-semibold text-[#16191f] mt-0.5">
            {associatedSubnets.length}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Routes</div>
          <div className="text-[13px] font-semibold text-[#16191f] mt-0.5">
            {routeTable.Routes.length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded]">
        <div className="flex gap-6 text-[13px]">
          <button
            onClick={() => setActiveTab("routes")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "routes"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Routes ({routeTable.Routes.length})
          </button>
          <button
            onClick={() => setActiveTab("associations")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "associations"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Subnet associations ({associatedSubnets.length})
          </button>
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
            onClick={() => setActiveTab("edge")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "edge"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Edge associations (0)
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({Object.keys(routeTable.Tags || {}).length})
          </button>
        </div>
      </div>

      {/* Tab 1: Routes */}
      {activeTab === "routes" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-[#16191f]">Routes</h3>
              <p className="text-xs text-[#545b64] mt-0.5">Destination CIDRs and target gateway hops.</p>
            </div>
            <button
              onClick={() => setIsAddRouteOpen(true)}
              className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Add route
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                  <th className="py-2.5 px-6">Destination</th>
                  <th className="py-2.5 px-6">Target</th>
                  <th className="py-2.5 px-6">Status</th>
                  <th className="py-2.5 px-6">Propagated</th>
                  <th className="py-2.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {routeTable.Routes.map((route, i) => {
                  const target = route.GatewayId || route.NatGatewayId || route.TransitGatewayId || "local";
                  const isLocal = target === "local" || !route.DestinationCidrBlock || route.DestinationCidrBlock === vpc?.CidrBlock;

                  return (
                    <tr key={i} className="hover:bg-[#fafafa]">
                      <td className="py-2.5 px-6 font-mono text-[#16191f]">
                        {route.DestinationCidrBlock || "0.0.0.0/0"}
                      </td>
                      <td className="py-2.5 px-6 font-mono text-[#0073bb]">
                        {target.startsWith("igw-") ? (
                          <Link href={`/vpc/internet-gateways?search=${target}`} className="hover:underline">
                            {target}
                          </Link>
                        ) : target.startsWith("nat-") ? (
                          <Link href={`/vpc/nat-gateways?search=${target}`} className="hover:underline">
                            {target}
                          </Link>
                        ) : target.startsWith("vpce-") ? (
                          <Link href={`/vpc/endpoints?search=${target}`} className="hover:underline">
                            {target}
                          </Link>
                        ) : (
                          <span>{target}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-6 text-emerald-700 font-medium">
                        {route.State || "Active"}
                      </td>
                      <td className="py-2.5 px-6 text-[#545b64]">No</td>
                      <td className="py-2.5 px-6 text-right">
                        {!isLocal && route.DestinationCidrBlock && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRoute(route.DestinationCidrBlock!)}
                            className="text-xs text-red-600 hover:underline font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Subnet Associations */}
      {activeTab === "associations" && (
        <div className="space-y-6">
          {/* Explicit Subnet Associations */}
          <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#16191f]">
                  Explicit subnet associations ({associatedSubnets.length})
                </h3>
                <p className="text-xs text-[#545b64] mt-0.5">
                  Subnets that are explicitly associated with this route table.
                </p>
              </div>
              <button
                onClick={() => setIsEditAssocOpen(true)}
                className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Edit subnet associations
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                    <th className="py-2.5 px-6">Subnet ID</th>
                    <th className="py-2.5 px-6">Name</th>
                    <th className="py-2.5 px-6">IPv4 CIDR</th>
                    <th className="py-2.5 px-6">Availability Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {associatedSubnets.map((sub) => (
                    <tr key={sub.SubnetId} className="hover:bg-[#fafafa]">
                      <td className="py-2.5 px-6 font-mono text-[#0073bb]">
                        <Link href={`/vpc/subnets/${sub.SubnetId}`} className="hover:underline font-semibold">
                          {sub.SubnetId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-6 text-[#16191f]">{sub.Name || "-"}</td>
                      <td className="py-2.5 px-6 font-mono text-[#16191f]">{sub.CidrBlock}</td>
                      <td className="py-2.5 px-6 text-[#545b64]">{sub.AvailabilityZone || "-"}</td>
                    </tr>
                  ))}
                  {associatedSubnets.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-[#545b64]">
                        You do not have any explicit subnet associations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subnets without explicit associations */}
          <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#eaeded]">
              <h3 className="text-[15px] font-bold text-[#16191f]">
                Subnets without explicit associations ({unassociatedSubnets.length})
              </h3>
              <p className="text-xs text-[#545b64] mt-0.5">
                The following subnets have not been explicitly associated with any route table and are associated with the main route table by default.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                    <th className="py-2.5 px-6">Subnet ID</th>
                    <th className="py-2.5 px-6">Name</th>
                    <th className="py-2.5 px-6">IPv4 CIDR</th>
                    <th className="py-2.5 px-6">Availability Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {unassociatedSubnets.map((sub) => (
                    <tr key={sub.SubnetId} className="hover:bg-[#fafafa]">
                      <td className="py-2.5 px-6 font-mono text-[#0073bb]">
                        <Link href={`/vpc/subnets/${sub.SubnetId}`} className="hover:underline font-semibold">
                          {sub.SubnetId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-6 text-[#16191f]">{sub.Name || "-"}</td>
                      <td className="py-2.5 px-6 font-mono text-[#16191f]">{sub.CidrBlock}</td>
                      <td className="py-2.5 px-6 text-[#545b64]">{sub.AvailabilityZone || "-"}</td>
                    </tr>
                  ))}
                  {unassociatedSubnets.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-[#545b64]">
                        All subnets in this VPC have explicit route table associations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-[13px]">
            <div>
              <span className="text-[#545b64] block mb-1">Route table ID</span>
              <span className="font-mono font-semibold text-[#16191f]">{routeTable.RouteTableId}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Route table ARN</span>
              <span className="font-mono text-[11px] text-[#16191f] break-all">
                {routeTable.RouteTableArn || `arn:aws:ec2:us-east-1:000000000000:route-table/${routeTable.RouteTableId}`}
              </span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Name</span>
              <span className="text-[#16191f]">{routeTable.Name || "-"}</span>
            </div>

            <div>
              <span className="text-[#545b64] block mb-1">VPC</span>
              <Link href="/vpc/vpcs" className="font-mono text-[#0073bb] hover:underline font-semibold">
                {routeTable.VpcId} {vpc?.Name ? `(${vpc.Name})` : ""}
              </Link>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Main</span>
              <span className="text-[#16191f] font-medium">{routeTable.IsMain ? "Yes" : "No"}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Owner</span>
              <span className="font-mono text-[#16191f]">{routeTable.OwnerId || "000000000000"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Edge Associations */}
      {activeTab === "edge" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6">
          <h3 className="text-[15px] font-bold text-[#16191f]">Edge associations</h3>
          <p className="text-xs text-[#545b64] mt-1">
            No edge associations are configured for this route table.
          </p>
        </div>
      )}

      {/* Tab 5: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eaeded]">
            <h3 className="text-[15px] font-bold text-[#16191f]">Tags</h3>
            <p className="text-xs text-[#545b64] mt-0.5">Key-value tags assigned to this route table.</p>
          </div>
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                <th className="py-2.5 px-6">Key</th>
                <th className="py-2.5 px-6">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {Object.entries(routeTable.Tags || {}).map(([k, v]) => (
                <tr key={k} className="hover:bg-[#fafafa]">
                  <td className="py-2.5 px-6 font-mono text-[#16191f]">{k}</td>
                  <td className="py-2.5 px-6 font-mono text-[#545b64]">{v}</td>
                </tr>
              ))}
              {Object.keys(routeTable.Tags || {}).length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-xs text-[#545b64]">
                    No tags associated with this route table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Route Modal */}
      {isAddRouteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Add route</h3>
            <p className="text-xs text-[#545b64]">
              Specify destination CIDR and select the target network hop.
            </p>
            <form onSubmit={handleAddRoute} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#16191f] block mb-1">
                  Destination CIDR
                </label>
                <input
                  type="text"
                  required
                  placeholder="0.0.0.0/0"
                  value={routeDestination}
                  onChange={(e) => setRouteDestination(e.target.value)}
                  className="w-full text-xs border border-[#aab7b8] rounded p-2"
                  style={{ height: "32px" }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#16191f] block mb-1">
                  Target Type
                </label>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "igw"}
                      onChange={() => {
                        setTargetType("igw");
                        setTargetId(internetGateways[0]?.InternetGatewayId || "");
                      }}
                    />
                    <span>Internet Gateway</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "nat"}
                      onChange={() => {
                        setTargetType("nat");
                        setTargetId(natGateways[0]?.NatGatewayId || "");
                      }}
                    />
                    <span>NAT Gateway</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "vpce"}
                      onChange={() => {
                        setTargetType("vpce");
                        setTargetId(endpoints[0]?.VpcEndpointId || "");
                      }}
                    />
                    <span>Gateway Endpoint</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#16191f] block mb-1">
                  Target
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full text-xs border border-[#aab7b8] rounded p-2 bg-white"
                  style={{ height: "32px" }}
                >
                  {targetType === "igw" &&
                    internetGateways.map((g) => (
                      <option key={g.InternetGatewayId} value={g.InternetGatewayId}>
                        {g.InternetGatewayId} {g.Name ? `(${g.Name})` : ""}
                      </option>
                    ))}
                  {targetType === "nat" &&
                    natGateways.map((n) => (
                      <option key={n.NatGatewayId} value={n.NatGatewayId}>
                        {n.NatGatewayId} {n.Name ? `(${n.Name})` : ""}
                      </option>
                    ))}
                  {targetType === "vpce" &&
                    endpoints.map((ep) => (
                      <option key={ep.VpcEndpointId} value={ep.VpcEndpointId}>
                        {ep.VpcEndpointId} ({ep.ServiceName.replace("com.amazonaws.us-east-1.", "")})
                      </option>
                    ))}
                  {((targetType === "igw" && internetGateways.length === 0) ||
                    (targetType === "nat" && natGateways.length === 0) ||
                    (targetType === "vpce" && endpoints.length === 0)) && (
                    <option value="">No targets of this type available</option>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsAddRouteOpen(false)}
                  className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !routeDestination || !targetId}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subnet Associations Modal */}
      {isEditAssocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Edit subnet associations</h3>
            <p className="text-xs text-[#545b64]">
              Select subnets to associate with route table <span className="font-mono font-semibold">{routeTable.RouteTableId}</span>.
            </p>
            <form onSubmit={handleSaveAssociations} className="space-y-4">
              <div className="border border-[#eaeded] rounded max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-[#eaeded]">
                    <tr>
                      <th className="p-2 w-10 text-center">Select</th>
                      <th className="p-2">Subnet ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">IPv4 CIDR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {allSubnets.map((sub) => {
                      const isChecked = selectedSubnetIds.includes(sub.SubnetId);
                      return (
                        <tr key={sub.SubnetId} className="hover:bg-gray-50">
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubnetIds([...selectedSubnetIds, sub.SubnetId]);
                                } else {
                                  setSelectedSubnetIds(selectedSubnetIds.filter((id) => id !== sub.SubnetId));
                                }
                              }}
                            />
                          </td>
                          <td className="p-2 font-mono text-[#0073bb] font-semibold">{sub.SubnetId}</td>
                          <td className="p-2 text-[#16191f]">{sub.Name || "-"}</td>
                          <td className="p-2 font-mono text-[#545b64]">{sub.CidrBlock}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsEditAssocOpen(false)}
                  className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Saving..." : "Save associations"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Route Table Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete route table</h3>
            <p className="text-xs text-[#545b64]">
              Are you sure you want to delete route table <span className="font-mono font-semibold text-red-600">{routeTable.RouteTableId}</span>? To confirm, type <span className="font-mono font-bold">delete</span> below.
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
                onClick={handleDeleteRouteTable}
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
