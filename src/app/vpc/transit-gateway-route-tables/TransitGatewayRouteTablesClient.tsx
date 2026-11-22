"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TransitGatewayRouteTableItem,
  TransitGatewayAssociationItem,
  TransitGatewayPropagationItem,
  TransitGatewayRouteItem,
  listTransitGatewayRouteTablesAction,
  deleteTransitGatewayRouteTableAction,
  getTransitGatewayRouteTableDetailAction,
} from "../transit-gateway-actions";

interface Props {
  initialRouteTables: TransitGatewayRouteTableItem[];
}

export default function TransitGatewayRouteTablesClient({ initialRouteTables }: Props) {
  const router = useRouter();

  const [routeTables, setRouteTables] = useState<TransitGatewayRouteTableItem[]>(initialRouteTables);
  const [selectedRtbId, setSelectedRtbId] = useState<string | null>(
    initialRouteTables.length > 0 ? initialRouteTables[0].TransitGatewayRouteTableId : null
  );
  const [activeTab, setActiveTab] = useState<"details" | "associations" | "propagations" | "routes" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Drawer detail state
  const [drawerAssociations, setDrawerAssociations] = useState<TransitGatewayAssociationItem[]>([]);
  const [drawerPropagations, setDrawerPropagations] = useState<TransitGatewayPropagationItem[]>([]);
  const [drawerRoutes, setDrawerRoutes] = useState<TransitGatewayRouteItem[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedRtb = routeTables.find((r) => r.TransitGatewayRouteTableId === selectedRtbId);

  // Load drawer details whenever selectedRtbId changes
  useEffect(() => {
    if (!selectedRtbId) {
      setDrawerAssociations([]);
      setDrawerPropagations([]);
      setDrawerRoutes([]);
      return;
    }

    let active = true;
    setDrawerLoading(true);
    getTransitGatewayRouteTableDetailAction(selectedRtbId).then((res) => {
      if (!active) return;
      setDrawerLoading(false);
      if (res.success) {
        setDrawerAssociations(res.associations || []);
        setDrawerPropagations(res.propagations || []);
        setDrawerRoutes(res.routes || []);
      }
    });

    return () => {
      active = false;
    };
  }, [selectedRtbId]);

  const refreshRouteTables = async () => {
    setLoading(true);
    try {
      const res = await listTransitGatewayRouteTablesAction();
      if (res.success) {
        setRouteTables(res.routeTables);
        if (selectedRtbId && !res.routeTables.some((r) => r.TransitGatewayRouteTableId === selectedRtbId)) {
          setSelectedRtbId(res.routeTables.length > 0 ? res.routeTables[0].TransitGatewayRouteTableId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRouteTable = async () => {
    if (!selectedRtb) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteTransitGatewayRouteTableAction(selectedRtb.TransitGatewayRouteTableId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({ type: "success", text: `Deleted route table ${selectedRtb.TransitGatewayRouteTableId}` });
        setRouteTables(routeTables.filter((r) => r.TransitGatewayRouteTableId !== selectedRtb.TransitGatewayRouteTableId));
        setSelectedRtbId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete transit gateway route table" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredRouteTables = routeTables.filter((r) => {
    const q = searchQuery.toLowerCase();
    const name = r.Name || "";
    return (
      r.TransitGatewayRouteTableId.toLowerCase().includes(q) ||
      r.TransitGatewayId.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      r.State.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transit gateway route tables ({routeTables.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            A transit gateway route table directs traffic from attachments associated with the route table to target resources.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshRouteTables}
            disabled={loading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => {
              if (selectedRtb) {
                router.push(`/vpc/transit-gateway-route-tables/${selectedRtb.TransitGatewayRouteTableId}`);
              }
            }}
            disabled={!selectedRtb}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View details
          </button>

          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedRtb || selectedRtb.DefaultAssociationRouteTable}
            title={selectedRtb?.DefaultAssociationRouteTable ? "Cannot delete default route table while associated" : ""}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete route table
          </button>

          <Link
            href="/vpc/transit-gateway-route-tables/create"
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create transit gateway route table
          </Link>
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

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Filter by route table ID, name, or transit gateway ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-xs w-full max-w-md focus:outline-none focus:border-[#ec7211]"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto text-xs">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <th className="py-2.5 px-3 w-8"></th>
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Transit gateway route table ID</th>
              <th className="py-2.5 px-3">Transit gateway ID</th>
              <th className="py-2.5 px-3">State</th>
              <th className="py-2.5 px-3">Default association</th>
              <th className="py-2.5 px-3">Default propagation</th>
              <th className="py-2.5 px-3">Creation time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRouteTables.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  {routeTables.length === 0
                    ? "No transit gateway route tables found. Create one to get started."
                    : "No matching transit gateway route tables."}
                </td>
              </tr>
            ) : (
              filteredRouteTables.map((rtb) => {
                const isSelected = selectedRtbId === rtb.TransitGatewayRouteTableId;
                return (
                  <tr
                    key={rtb.TransitGatewayRouteTableId}
                    onClick={() => setSelectedRtbId(rtb.TransitGatewayRouteTableId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50/70" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedRtbId(rtb.TransitGatewayRouteTableId)}
                        className="text-[#ec7211] focus:ring-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-gray-900">{rtb.Name || "-"}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#0073bb]">
                      <Link
                        href={`/vpc/transit-gateway-route-tables/${rtb.TransitGatewayRouteTableId}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {rtb.TransitGatewayRouteTableId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                      <Link
                        href={`/vpc/transit-gateways/${rtb.TransitGatewayId}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {rtb.TransitGatewayId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          rtb.State === "available"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {rtb.State}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">
                      {rtb.DefaultAssociationRouteTable ? "Yes" : "No"}
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">
                      {rtb.DefaultPropagationRouteTable ? "Yes" : "No"}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 font-mono">
                      {rtb.CreationTime ? new Date(rtb.CreationTime).toLocaleString() : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Route Table Bottom Drawer */}
      {selectedRtb && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="border-b border-gray-200 bg-gray-50 px-4 pt-3">
            <div className="flex items-center justify-between pb-2">
              <span className="font-bold text-gray-800">
                Route table: <span className="font-mono text-[#0073bb]">{selectedRtb.TransitGatewayRouteTableId}</span>
              </span>
              <Link
                href={`/vpc/transit-gateway-route-tables/${selectedRtb.TransitGatewayRouteTableId}`}
                className="text-[#0073bb] hover:underline font-medium"
              >
                Go to full page &rarr;
              </Link>
            </div>
            <nav className="flex space-x-6 text-xs font-medium">
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-[#ec7211] text-[#ec7211] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("associations")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "associations"
                    ? "border-[#ec7211] text-[#ec7211] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Associations ({drawerAssociations.length})
              </button>
              <button
                onClick={() => setActiveTab("propagations")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "propagations"
                    ? "border-[#ec7211] text-[#ec7211] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Propagations ({drawerPropagations.length})
              </button>
              <button
                onClick={() => setActiveTab("routes")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "routes"
                    ? "border-[#ec7211] text-[#ec7211] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Routes ({drawerRoutes.length})
              </button>
              <button
                onClick={() => setActiveTab("tags")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "tags"
                    ? "border-[#ec7211] text-[#ec7211] font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Tags ({selectedRtb.Tags ? Object.keys(selectedRtb.Tags).length : 0})
              </button>
            </nav>
          </div>

          <div className="p-4">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-gray-500">Route table ID</dt>
                  <dd className="font-mono text-gray-900 font-medium">{selectedRtb.TransitGatewayRouteTableId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Transit gateway ID</dt>
                  <dd>
                    <Link
                      href={`/vpc/transit-gateways/${selectedRtb.TransitGatewayId}`}
                      className="text-[#0073bb] hover:underline font-mono"
                    >
                      {selectedRtb.TransitGatewayId}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">State</dt>
                  <dd className="text-gray-900 font-medium capitalize">{selectedRtb.State}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Default association route table</dt>
                  <dd className="text-gray-900">{selectedRtb.DefaultAssociationRouteTable ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Default propagation route table</dt>
                  <dd className="text-gray-900">{selectedRtb.DefaultPropagationRouteTable ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Creation time</dt>
                  <dd className="font-mono text-gray-900">
                    {selectedRtb.CreationTime ? new Date(selectedRtb.CreationTime).toLocaleString() : "-"}
                  </dd>
                </div>
              </div>
            )}

            {activeTab === "associations" && (
              <div>
                {drawerLoading ? (
                  <div className="py-4 text-center text-gray-500">Loading associations...</div>
                ) : drawerAssociations.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">No attachments associated.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                        <th className="py-2 px-3">Attachment ID</th>
                        <th className="py-2 px-3">Resource ID</th>
                        <th className="py-2 px-3">Resource type</th>
                        <th className="py-2 px-3">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {drawerAssociations.map((assoc) => (
                        <tr key={assoc.TransitGatewayAttachmentId}>
                          <td className="py-2 px-3 font-mono text-[#0073bb]">
                            <Link href={`/vpc/transit-gateway-attachments/${assoc.TransitGatewayAttachmentId}`} className="hover:underline">
                              {assoc.TransitGatewayAttachmentId}
                            </Link>
                          </td>
                          <td className="py-2 px-3 font-mono text-gray-700">{assoc.ResourceId || "-"}</td>
                          <td className="py-2 px-3 capitalize text-gray-700">{assoc.ResourceType || "-"}</td>
                          <td className="py-2 px-3 capitalize text-gray-700">{assoc.State}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "propagations" && (
              <div>
                {drawerLoading ? (
                  <div className="py-4 text-center text-gray-500">Loading propagations...</div>
                ) : drawerPropagations.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">No route propagations enabled.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                        <th className="py-2 px-3">Attachment ID</th>
                        <th className="py-2 px-3">Resource ID</th>
                        <th className="py-2 px-3">Resource type</th>
                        <th className="py-2 px-3">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {drawerPropagations.map((prop) => (
                        <tr key={prop.TransitGatewayAttachmentId}>
                          <td className="py-2 px-3 font-mono text-[#0073bb]">
                            <Link href={`/vpc/transit-gateway-attachments/${prop.TransitGatewayAttachmentId}`} className="hover:underline">
                              {prop.TransitGatewayAttachmentId}
                            </Link>
                          </td>
                          <td className="py-2 px-3 font-mono text-gray-700">{prop.ResourceId || "-"}</td>
                          <td className="py-2 px-3 capitalize text-gray-700">{prop.ResourceType || "-"}</td>
                          <td className="py-2 px-3 capitalize text-gray-700">{prop.State}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "routes" && (
              <div>
                {drawerLoading ? (
                  <div className="py-4 text-center text-gray-500">Loading routes...</div>
                ) : drawerRoutes.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">No routes found in this route table.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                        <th className="py-2 px-3">CIDR</th>
                        <th className="py-2 px-3">Attachment ID</th>
                        <th className="py-2 px-3">Resource ID</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {drawerRoutes.map((r, i) => (
                        <tr key={`${r.DestinationCidrBlock}-${i}`}>
                          <td className="py-2 px-3 font-mono font-medium text-gray-900">{r.DestinationCidrBlock}</td>
                          <td className="py-2 px-3 font-mono text-[#0073bb]">
                            {r.TransitGatewayAttachmentId ? (
                              <Link href={`/vpc/transit-gateway-attachments/${r.TransitGatewayAttachmentId}`} className="hover:underline">
                                {r.TransitGatewayAttachmentId}
                              </Link>
                            ) : (
                              <span className="text-gray-400">blackhole</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-gray-700">{r.ResourceId || "-"}</td>
                          <td className="py-2 px-3 capitalize text-gray-700">{r.Type}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                r.State === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {r.State}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                {!selectedRtb.Tags || Object.keys(selectedRtb.Tags).length === 0 ? (
                  <div className="py-4 text-center text-gray-500">No tags assigned.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                        <th className="py-2 px-3 font-semibold">Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(selectedRtb.Tags).map(([k, v]) => (
                        <tr key={k}>
                          <td className="py-2 px-3 font-mono text-gray-800">{k}</td>
                          <td className="py-2 px-3 text-gray-600">{v}</td>
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedRtb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete transit gateway route table</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete route table{" "}
              <span className="font-mono font-bold text-red-600">
                {selectedRtb.TransitGatewayRouteTableId}
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
