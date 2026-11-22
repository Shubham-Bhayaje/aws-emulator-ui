"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TransitGatewayRouteTableItem,
  TransitGatewayAssociationItem,
  TransitGatewayPropagationItem,
  TransitGatewayRouteItem,
  TransitGatewayAttachmentItem,
  getTransitGatewayRouteTableDetailAction,
  deleteTransitGatewayRouteTableAction,
  associateTransitGatewayRouteTableAction,
  enableTransitGatewayRouteTablePropagationAction,
  disableTransitGatewayRouteTablePropagationAction,
  createTransitGatewayRouteAction,
  deleteTransitGatewayRouteAction,
} from "../../transit-gateway-actions";

interface Props {
  routeTable: TransitGatewayRouteTableItem;
  associations: TransitGatewayAssociationItem[];
  propagations: TransitGatewayPropagationItem[];
  routes: TransitGatewayRouteItem[];
  availableAttachments: TransitGatewayAttachmentItem[];
}

export default function TransitGatewayRouteTableDetailClient({
  routeTable: initialRouteTable,
  associations: initialAssociations,
  propagations: initialPropagations,
  routes: initialRoutes,
  availableAttachments,
}: Props) {
  const router = useRouter();

  const [routeTable, setRouteTable] = useState<TransitGatewayRouteTableItem>(initialRouteTable);
  const [associations, setAssociations] = useState<TransitGatewayAssociationItem[]>(initialAssociations);
  const [propagations, setPropagations] = useState<TransitGatewayPropagationItem[]>(initialPropagations);
  const [routes, setRoutes] = useState<TransitGatewayRouteItem[]>(initialRoutes);

  const [activeTab, setActiveTab] = useState<"details" | "associations" | "propagations" | "routes" | "tags">("details");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete Route Table Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create Association Modal
  const [isAssocModalOpen, setIsAssocModalOpen] = useState(false);
  const [assocAttachmentId, setAssocAttachmentId] = useState(
    availableAttachments.length > 0 ? availableAttachments[0].TransitGatewayAttachmentId : ""
  );
  const [assocLoading, setAssocLoading] = useState(false);

  // Create Propagation Modal
  const [isPropModalOpen, setIsPropModalOpen] = useState(false);
  const [propAttachmentId, setPropAttachmentId] = useState(
    availableAttachments.length > 0 ? availableAttachments[0].TransitGatewayAttachmentId : ""
  );
  const [propLoading, setPropLoading] = useState(false);

  // Create Route Modal
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeCidr, setRouteCidr] = useState("");
  const [routeAttachmentId, setRouteAttachmentId] = useState(
    availableAttachments.length > 0 ? availableAttachments[0].TransitGatewayAttachmentId : ""
  );
  const [routeBlackhole, setRouteBlackhole] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  // Selection states
  const [selectedRouteCidr, setSelectedRouteCidr] = useState<string | null>(null);
  const [selectedPropAttachmentId, setSelectedPropAttachmentId] = useState<string | null>(null);

  const refreshDetails = async () => {
    setLoading(true);
    try {
      const res = await getTransitGatewayRouteTableDetailAction(routeTable.TransitGatewayRouteTableId);
      if (res.success && res.routeTable) {
        setRouteTable(res.routeTable);
        setAssociations(res.associations || []);
        setPropagations(res.propagations || []);
        setRoutes(res.routes || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRouteTable = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteTransitGatewayRouteTableAction(routeTable.TransitGatewayRouteTableId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        router.push("/vpc/transit-gateway-route-tables");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete route table" });
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateAssociation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assocAttachmentId) return;
    setAssocLoading(true);
    setMessage(null);
    try {
      const res = await associateTransitGatewayRouteTableAction(
        routeTable.TransitGatewayRouteTableId,
        assocAttachmentId
      );
      if (res.success) {
        setIsAssocModalOpen(false);
        setMessage({ type: "success", text: `Successfully associated attachment ${assocAttachmentId}` });
        await refreshDetails();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create association" });
      }
    } finally {
      setAssocLoading(false);
    }
  };

  const handleEnablePropagation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propAttachmentId) return;
    setPropLoading(true);
    setMessage(null);
    try {
      const res = await enableTransitGatewayRouteTablePropagationAction(
        routeTable.TransitGatewayRouteTableId,
        propAttachmentId
      );
      if (res.success) {
        setIsPropModalOpen(false);
        setMessage({ type: "success", text: `Enabled route propagation for attachment ${propAttachmentId}` });
        await refreshDetails();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to enable route propagation" });
      }
    } finally {
      setPropLoading(false);
    }
  };

  const handleDisablePropagation = async (attachmentId: string) => {
    setMessage(null);
    try {
      const res = await disableTransitGatewayRouteTablePropagationAction(
        routeTable.TransitGatewayRouteTableId,
        attachmentId
      );
      if (res.success) {
        setMessage({ type: "success", text: `Disabled route propagation for attachment ${attachmentId}` });
        setSelectedPropAttachmentId(null);
        await refreshDetails();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to disable route propagation" });
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeCidr.trim()) return;
    setRouteLoading(true);
    setMessage(null);
    try {
      const res = await createTransitGatewayRouteAction({
        routeTableId: routeTable.TransitGatewayRouteTableId,
        destinationCidrBlock: routeCidr.trim(),
        transitGatewayAttachmentId: routeBlackhole ? undefined : routeAttachmentId,
        blackhole: routeBlackhole,
      });
      if (res.success) {
        setIsRouteModalOpen(false);
        setRouteCidr("");
        setRouteBlackhole(false);
        setMessage({ type: "success", text: `Created route to ${routeCidr}` });
        await refreshDetails();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create route" });
      }
    } finally {
      setRouteLoading(false);
    }
  };

  const handleDeleteRoute = async (destinationCidr: string) => {
    setMessage(null);
    try {
      const res = await deleteTransitGatewayRouteAction(
        routeTable.TransitGatewayRouteTableId,
        destinationCidr
      );
      if (res.success) {
        setMessage({ type: "success", text: `Deleted route ${destinationCidr}` });
        setSelectedRouteCidr(null);
        await refreshDetails();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete route" });
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : String(err) });
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Virtual Private Cloud
        </Link>
        <span>&gt;</span>
        <Link href="/vpc/transit-gateway-route-tables" className="hover:text-[#0073bb]">
          Transit gateway route tables
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">{routeTable.TransitGatewayRouteTableId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 border border-[#eaeded] rounded shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {routeTable.Name || routeTable.TransitGatewayRouteTableId}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                routeTable.State === "available"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              {routeTable.State}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            {routeTable.TransitGatewayRouteTableId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshDetails}
            disabled={loading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={routeTable.DefaultAssociationRouteTable}
            title={routeTable.DefaultAssociationRouteTable ? "Cannot delete default association route table" : ""}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete route table
          </button>
        </div>
      </div>

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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("associations")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "associations"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Associations ({associations.length})
          </button>
          <button
            onClick={() => setActiveTab("propagations")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "propagations"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Propagations ({propagations.length})
          </button>
          <button
            onClick={() => setActiveTab("routes")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "routes"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Routes ({routes.length})
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Tags ({routeTable.Tags ? Object.keys(routeTable.Tags).length : 0})
          </button>
        </nav>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-gray-200 rounded p-6 shadow-sm space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">
              Route table details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
              <div>
                <dt className="text-gray-500">Route table ID</dt>
                <dd className="font-mono text-gray-900 font-medium select-all">
                  {routeTable.TransitGatewayRouteTableId}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Transit gateway ID</dt>
                <dd>
                  <Link
                    href={`/vpc/transit-gateways/${routeTable.TransitGatewayId}`}
                    className="text-[#0073bb] hover:underline font-mono"
                  >
                    {routeTable.TransitGatewayId}
                  </Link>
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">State</dt>
                <dd className="text-gray-900 font-medium capitalize">{routeTable.State}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Default association route table</dt>
                <dd className="text-gray-900 font-medium">
                  {routeTable.DefaultAssociationRouteTable ? "Yes" : "No"}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Default propagation route table</dt>
                <dd className="text-gray-900 font-medium">
                  {routeTable.DefaultPropagationRouteTable ? "Yes" : "No"}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Creation time</dt>
                <dd className="text-gray-900 font-mono" suppressHydrationWarning>
                  {routeTable.CreationTime
                    ? new Date(routeTable.CreationTime).toLocaleString()
                    : "-"}
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Associations */}
      {activeTab === "associations" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Associations ({associations.length})</h3>
              <p className="text-gray-500 text-[11px]">
                Each attachment can be associated with exactly one transit gateway route table.
              </p>
            </div>
            <button
              onClick={() => setIsAssocModalOpen(true)}
              className="px-3 text-xs font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Create association
            </button>
          </div>

          {associations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border border-dashed rounded bg-gray-50">
              No attachments are currently associated with this route table.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <th className="py-2.5 px-3 font-semibold">Attachment ID</th>
                  <th className="py-2.5 px-3 font-semibold">Resource ID</th>
                  <th className="py-2.5 px-3 font-semibold">Resource type</th>
                  <th className="py-2.5 px-3 font-semibold">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {associations.map((assoc) => (
                  <tr key={assoc.TransitGatewayAttachmentId} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                      <Link
                        href={`/vpc/transit-gateway-attachments/${assoc.TransitGatewayAttachmentId}`}
                        className="hover:underline"
                      >
                        {assoc.TransitGatewayAttachmentId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gray-800">{assoc.ResourceId || "-"}</td>
                    <td className="py-2.5 px-3 capitalize text-gray-700">{assoc.ResourceType || "-"}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
                        {assoc.State}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Propagations */}
      {activeTab === "propagations" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Propagations ({propagations.length})</h3>
              <p className="text-gray-500 text-[11px]">
                Attachments can propagate their CIDRs dynamically into this route table.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (selectedPropAttachmentId) {
                    handleDisablePropagation(selectedPropAttachmentId);
                  }
                }}
                disabled={!selectedPropAttachmentId}
                className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Disable propagation
              </button>
              <button
                onClick={() => setIsPropModalOpen(true)}
                className="px-3 text-xs font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Create propagation
              </button>
            </div>
          </div>

          {propagations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border border-dashed rounded bg-gray-50">
              No attachments have route propagation enabled for this route table.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3 font-semibold">Attachment ID</th>
                  <th className="py-2.5 px-3 font-semibold">Resource ID</th>
                  <th className="py-2.5 px-3 font-semibold">Resource type</th>
                  <th className="py-2.5 px-3 font-semibold">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {propagations.map((prop) => {
                  const isChecked = selectedPropAttachmentId === prop.TransitGatewayAttachmentId;
                  return (
                    <tr
                      key={prop.TransitGatewayAttachmentId}
                      onClick={() => setSelectedPropAttachmentId(isChecked ? null : prop.TransitGatewayAttachmentId)}
                      className={`cursor-pointer ${isChecked ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          checked={isChecked}
                          onChange={() => setSelectedPropAttachmentId(isChecked ? null : prop.TransitGatewayAttachmentId)}
                          className="text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                        <Link
                          href={`/vpc/transit-gateway-attachments/${prop.TransitGatewayAttachmentId}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {prop.TransitGatewayAttachmentId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-800">{prop.ResourceId || "-"}</td>
                      <td className="py-2.5 px-3 capitalize text-gray-700">{prop.ResourceType || "-"}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
                          {prop.State}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Routes */}
      {activeTab === "routes" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Routes ({routes.length})</h3>
              <p className="text-gray-500 text-[11px]">
                Routes direct network traffic to specific attachments or blackhole them.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (selectedRouteCidr) {
                    handleDeleteRoute(selectedRouteCidr);
                  }
                }}
                disabled={!selectedRouteCidr}
                className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Delete route
              </button>
              <button
                onClick={() => setIsRouteModalOpen(true)}
                className="px-3 text-xs font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Create static route
              </button>
            </div>
          </div>

          {routes.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border border-dashed rounded bg-gray-50">
              No routes in this route table.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3 font-semibold">Destination CIDR</th>
                  <th className="py-2.5 px-3 font-semibold">Attachment ID</th>
                  <th className="py-2.5 px-3 font-semibold">Resource ID</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {routes.map((r, i) => {
                  const isChecked = selectedRouteCidr === r.DestinationCidrBlock;
                  return (
                    <tr
                      key={`${r.DestinationCidrBlock}-${i}`}
                      onClick={() => setSelectedRouteCidr(isChecked ? null : r.DestinationCidrBlock)}
                      className={`cursor-pointer ${isChecked ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          checked={isChecked}
                          onChange={() => setSelectedRouteCidr(isChecked ? null : r.DestinationCidrBlock)}
                          className="text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-gray-900">{r.DestinationCidrBlock}</td>
                      <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                        {r.TransitGatewayAttachmentId ? (
                          <Link
                            href={`/vpc/transit-gateway-attachments/${r.TransitGatewayAttachmentId}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {r.TransitGatewayAttachmentId}
                          </Link>
                        ) : (
                          <span className="text-gray-400">blackhole</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">{r.ResourceId || "-"}</td>
                      <td className="py-2.5 px-3 capitalize text-gray-700">{r.Type}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            r.State === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {r.State}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-900">Tags</h3>
          </div>
          {!routeTable.Tags || Object.keys(routeTable.Tags).length === 0 ? (
            <div className="p-6 text-center text-gray-500">No tags assigned.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <th className="py-2 px-3 font-semibold">Key</th>
                  <th className="py-2 px-3 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(routeTable.Tags).map(([k, v]) => (
                  <tr key={k} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono text-gray-800">{k}</td>
                    <td className="py-2 px-3 text-gray-600">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create Association Modal */}
      {isAssocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Create route table association</h3>
            <p className="text-xs text-gray-600">
              Associate an attachment with route table{" "}
              <span className="font-mono font-medium">{routeTable.TransitGatewayRouteTableId}</span>.
            </p>

            <form onSubmit={handleCreateAssociation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Transit gateway attachment ID <span className="text-red-500">*</span>
                </label>
                {availableAttachments.length === 0 ? (
                  <div className="p-3 border border-dashed rounded text-xs text-gray-600 bg-gray-50">
                    No attachments available.{" "}
                    <Link href="/vpc/transit-gateway-attachments/create" className="text-[#0073bb] hover:underline">
                      Create an attachment
                    </Link>{" "}
                    first.
                  </div>
                ) : (
                  <select
                    value={assocAttachmentId}
                    onChange={(e) => setAssocAttachmentId(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#ec7211] bg-white"
                  >
                    {availableAttachments.map((att) => (
                      <option key={att.TransitGatewayAttachmentId} value={att.TransitGatewayAttachmentId}>
                        {att.TransitGatewayAttachmentId} ({att.ResourceType} {att.ResourceId || ""})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssocModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assocLoading || !assocAttachmentId}
                  className="px-4 text-xs font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {assocLoading ? "Associating..." : "Create association"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Propagation Modal */}
      {isPropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Create route propagation</h3>
            <p className="text-xs text-gray-600">
              Enable route propagation from an attachment into route table{" "}
              <span className="font-mono font-medium">{routeTable.TransitGatewayRouteTableId}</span>.
            </p>

            <form onSubmit={handleEnablePropagation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Transit gateway attachment ID <span className="text-red-500">*</span>
                </label>
                {availableAttachments.length === 0 ? (
                  <div className="p-3 border border-dashed rounded text-xs text-gray-600 bg-gray-50">
                    No attachments available.
                  </div>
                ) : (
                  <select
                    value={propAttachmentId}
                    onChange={(e) => setPropAttachmentId(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#ec7211] bg-white"
                  >
                    {availableAttachments.map((att) => (
                      <option key={att.TransitGatewayAttachmentId} value={att.TransitGatewayAttachmentId}>
                        {att.TransitGatewayAttachmentId} ({att.ResourceType} {att.ResourceId || ""})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPropModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={propLoading || !propAttachmentId}
                  className="px-4 text-xs font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {propLoading ? "Enabling..." : "Create propagation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Static Route Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Create static route</h3>
            <p className="text-xs text-gray-600">
              Add a static route to route table{" "}
              <span className="font-mono font-medium">{routeTable.TransitGatewayRouteTableId}</span>.
            </p>

            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  CIDR <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10.0.0.0/16 or 0.0.0.0/0"
                  value={routeCidr}
                  onChange={(e) => setRouteCidr(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#ec7211]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="blackholeCheck"
                  checked={routeBlackhole}
                  onChange={(e) => setRouteBlackhole(e.target.checked)}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <label htmlFor="blackholeCheck" className="text-xs text-gray-800">
                  Drop traffic (Blackhole)
                </label>
              </div>

              {!routeBlackhole && (
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                    Transit gateway attachment ID <span className="text-red-500">*</span>
                  </label>
                  {availableAttachments.length === 0 ? (
                    <div className="p-2 border border-dashed rounded text-xs text-gray-600 bg-gray-50">
                      No attachments available.
                    </div>
                  ) : (
                    <select
                      value={routeAttachmentId}
                      onChange={(e) => setRouteAttachmentId(e.target.value)}
                      required={!routeBlackhole}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#ec7211] bg-white"
                    >
                      {availableAttachments.map((att) => (
                        <option key={att.TransitGatewayAttachmentId} value={att.TransitGatewayAttachmentId}>
                          {att.TransitGatewayAttachmentId} ({att.ResourceType} {att.ResourceId || ""})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={routeLoading || !routeCidr.trim() || (!routeBlackhole && !routeAttachmentId)}
                  className="px-4 text-xs font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {routeLoading ? "Creating..." : "Create static route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete transit gateway route table</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete route table{" "}
              <span className="font-mono font-bold text-red-600">
                {routeTable.TransitGatewayRouteTableId}
              </span>
              ? Any associated attachments will no longer be routed through this table.
            </p>

            <div className="space-y-1">
              <label className="text-xs text-gray-700 block">
                To confirm deletion, type <span className="font-bold font-mono">delete</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
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
                onClick={handleDeleteRouteTable}
                disabled={deleteConfirmText.toLowerCase() !== "delete" || deleteLoading}
                className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
