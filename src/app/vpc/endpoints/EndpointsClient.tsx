"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  VpcEndpointItem,
  VpcItem,
  RouteTableItem,
  SubnetItem,
  listVpcEndpointsAction,
  createVpcEndpointAction,
  deleteVpcEndpointsAction,
} from "../actions";
import { formatDateTime } from "@/lib/dateUtils";

interface Props {
  initialEndpoints: VpcEndpointItem[];
  vpcs: VpcItem[];
  routeTables: RouteTableItem[];
  subnets: SubnetItem[];
  initialSearch?: string;
}

const AVAILABLE_SERVICES = [
  { name: "com.amazonaws.us-east-1.s3", type: "Gateway", desc: "Amazon S3 Gateway Endpoint" },
  { name: "com.amazonaws.us-east-1.dynamodb", type: "Gateway", desc: "Amazon DynamoDB Gateway Endpoint" },
  { name: "com.amazonaws.us-east-1.ec2", type: "Interface", desc: "Amazon EC2 Interface Endpoint" },
  { name: "com.amazonaws.us-east-1.sqs", type: "Interface", desc: "Amazon SQS Interface Endpoint" },
  { name: "com.amazonaws.us-east-1.sns", type: "Interface", desc: "Amazon SNS Interface Endpoint" },
];

export default function EndpointsClient({
  initialEndpoints,
  vpcs,
  routeTables,
  subnets,
  initialSearch = "",
}: Props) {
  const router = useRouter();

  const [endpoints, setEndpoints] = useState<VpcEndpointItem[]>(initialEndpoints);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(() => {
    if (initialSearch) {
      const match = initialEndpoints.find(
        (e) =>
          e.VpcEndpointId.toLowerCase().includes(initialSearch.toLowerCase()) ||
          e.ServiceName.toLowerCase().includes(initialSearch.toLowerCase())
      );
      if (match) return match.VpcEndpointId;
    }
    return initialEndpoints.length > 0 ? initialEndpoints[0].VpcEndpointId : null;
  });
  const [activeTab, setActiveTab] = useState<"details" | "routes_subnets" | "tags">("details");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create endpoint modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [endpointName, setEndpointName] = useState("");
  const [selectedService, setSelectedService] = useState(AVAILABLE_SERVICES[0]);
  const [selectedVpcId, setSelectedVpcId] = useState(vpcs.length > 0 ? vpcs[0].VpcId : "");
  const [selectedRouteTableIds, setSelectedRouteTableIds] = useState<string[]>([]);
  const [selectedSubnetIds, setSelectedSubnetIds] = useState<string[]>([]);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedEndpoint = endpoints.find((e) => e.VpcEndpointId === selectedEndpointId);

  const refreshEndpoints = async () => {
    setLoading(true);
    try {
      const res = await listVpcEndpointsAction();
      if (res.success) {
        setEndpoints(res.endpoints);
        if (selectedEndpointId && !res.endpoints.some((e) => e.VpcEndpointId === selectedEndpointId)) {
          setSelectedEndpointId(res.endpoints.length > 0 ? res.endpoints[0].VpcEndpointId : null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVpcId || !selectedService) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await createVpcEndpointAction({
        serviceName: selectedService.name,
        vpcId: selectedVpcId,
        vpcEndpointType: selectedService.type as "Gateway" | "Interface",
        routeTableIds: selectedService.type === "Gateway" ? selectedRouteTableIds : undefined,
        subnetIds: selectedService.type === "Interface" ? selectedSubnetIds : undefined,
        name: endpointName.trim() || undefined,
      });

      if (res.success && res.endpointId) {
        setIsCreateModalOpen(false);
        setEndpointName("");
        setSelectedRouteTableIds([]);
        setSelectedSubnetIds([]);
        setMessage({ type: "success", text: `Successfully created VPC endpoint ${res.endpointId}` });
        await refreshEndpoints();
        setSelectedEndpointId(res.endpointId);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create VPC endpoint" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEndpoint = async () => {
    if (!selectedEndpoint) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteVpcEndpointsAction([selectedEndpoint.VpcEndpointId]);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setMessage({ type: "success", text: `Deleted VPC endpoint ${selectedEndpoint.VpcEndpointId}` });
        setEndpoints(endpoints.filter((e) => e.VpcEndpointId !== selectedEndpoint.VpcEndpointId));
        setSelectedEndpointId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete VPC endpoint" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredEndpoints = endpoints.filter((e) => {
    const q = searchQuery.toLowerCase();
    const name = e.Tags?.Name || "";
    return (
      e.VpcEndpointId.toLowerCase().includes(q) ||
      e.ServiceName.toLowerCase().includes(q) ||
      e.VpcId.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q)
    );
  });

  const availableRouteTables = routeTables.filter((r) => r.VpcId === selectedVpcId);
  const availableSubnets = subnets.filter((s) => s.VpcId === selectedVpcId);

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Endpoints ({endpoints.length})</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            VPC endpoints enable private connections between your VPC and supported AWS services without requiring an internet gateway.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshEndpoints}
            disabled={loading}
            className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => {
              if (selectedEndpoint) {
                router.push(`/vpc/endpoints/${selectedEndpoint.VpcEndpointId}`);
              }
            }}
            disabled={!selectedEndpoint}
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
            disabled={!selectedEndpoint}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete VPC endpoints
          </button>

          {/* Create primary button */}
          <button
            onClick={() => {
              setEndpointName("");
              if (vpcs.length > 0 && !selectedVpcId) setSelectedVpcId(vpcs[0].VpcId);
              setSelectedRouteTableIds([]);
              setSelectedSubnetIds([]);
              setIsCreateModalOpen(true);
            }}
            className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create endpoint
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
              placeholder="Filter endpoints by name, ID or service"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
            />
          </div>
          <span className="text-xs text-gray-500">
            Showing {filteredEndpoints.length} of {endpoints.length} endpoints
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 font-semibold">Name</th>
                <th className="py-2.5 px-3 font-semibold">Endpoint ID</th>
                <th className="py-2.5 px-3 font-semibold">Service name</th>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">VPC ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {filteredEndpoints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No VPC endpoints found.
                  </td>
                </tr>
              ) : (
                filteredEndpoints.map((ep) => {
                  const isSelected = ep.VpcEndpointId === selectedEndpointId;
                  const isAvailable = ep.State === "available";
                  return (
                    <tr
                      key={ep.VpcEndpointId}
                      onClick={() => setSelectedEndpointId(ep.VpcEndpointId)}
                      onDoubleClick={() => router.push(`/vpc/endpoints/${ep.VpcEndpointId}`)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-[#F2F8FD]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="radio"
                          name="selected_ep"
                          checked={isSelected}
                          onChange={() => setSelectedEndpointId(ep.VpcEndpointId)}
                          className="h-3.5 w-3.5 text-[#EC7211] focus:ring-[#EC7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        <Link
                          href={`/vpc/endpoints/${ep.VpcEndpointId}`}
                          className="hover:underline"
                        >
                          {ep.Tags?.Name || "-"}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073BB]">
                        <Link
                          href={`/vpc/endpoints/${ep.VpcEndpointId}`}
                          className="hover:underline"
                        >
                          {ep.VpcEndpointId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">
                        {ep.ServiceName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-medium">
                          {ep.VpcEndpointType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            isAvailable
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {ep.State}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {ep.VpcId}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Tabs for Selected Endpoint */}
      {selectedEndpoint && (
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
                onClick={() => setActiveTab("routes_subnets")}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "routes_subnets"
                    ? "border-[#EC7211] text-[#EC7211]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {selectedEndpoint.VpcEndpointType === "Gateway" ? "Route tables" : "Subnets"}
              </button>
              <button
                onClick={() => setActiveTab("tags")}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "tags"
                    ? "border-[#EC7211] text-[#EC7211]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Tags ({Object.keys(selectedEndpoint.Tags || {}).length})
              </button>
            </div>
            <Link
              href={`/vpc/endpoints/${selectedEndpoint.VpcEndpointId}`}
              className="text-[12px] font-medium text-[#0073bb] hover:underline flex items-center gap-1"
            >
              <span>Open endpoint page</span>
              <span>↗</span>
            </Link>
          </div>

          <div className="p-4">
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <dt className="text-gray-500 font-medium">Endpoint ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono font-semibold">{selectedEndpoint.VpcEndpointId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Service name</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedEndpoint.ServiceName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Endpoint type</dt>
                  <dd className="text-gray-900 mt-1">{selectedEndpoint.VpcEndpointType}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Status</dt>
                  <dd className="text-gray-900 mt-1 capitalize">{selectedEndpoint.State}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">VPC ID</dt>
                  <dd className="text-gray-900 mt-1 font-mono">{selectedEndpoint.VpcId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Creation time</dt>
                  <dd className="text-gray-900 mt-1" suppressHydrationWarning>
                    {formatDateTime(selectedEndpoint.CreationTimestamp)}
                  </dd>
                </div>
              </div>
            )}

            {activeTab === "routes_subnets" && (
              <div>
                {selectedEndpoint.VpcEndpointType === "Gateway" ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Route tables configured for this gateway endpoint:</p>
                    {!selectedEndpoint.RouteTableIds || selectedEndpoint.RouteTableIds.length === 0 ? (
                      <p className="text-xs text-gray-400">No route tables associated.</p>
                    ) : (
                      <ul className="list-disc pl-5 text-xs text-gray-800 space-y-1 font-mono">
                        {selectedEndpoint.RouteTableIds.map((rtbId) => (
                          <li key={rtbId}>{rtbId}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Subnets configured for this interface endpoint:</p>
                    {!selectedEndpoint.SubnetIds || selectedEndpoint.SubnetIds.length === 0 ? (
                      <p className="text-xs text-gray-400">No subnets associated.</p>
                    ) : (
                      <ul className="list-disc pl-5 text-xs text-gray-800 space-y-1 font-mono">
                        {selectedEndpoint.SubnetIds.map((sId) => (
                          <li key={sId}>{sId}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "tags" && (
              <div>
                {!selectedEndpoint.Tags || Object.keys(selectedEndpoint.Tags).length === 0 ? (
                  <p className="text-xs text-gray-500">No tags assigned to this endpoint.</p>
                ) : (
                  <table className="w-full text-left text-xs border border-gray-200">
                    <thead className="bg-[#FAFAFA] text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(selectedEndpoint.Tags).map(([key, val]) => (
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

      {/* Create Endpoint Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Create endpoint</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateEndpoint} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Name tag (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. s3-endpoint"
                  value={endpointName}
                  onChange={(e) => setEndpointName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#EC7211]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Service name <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 border border-gray-200 rounded p-2">
                  {AVAILABLE_SERVICES.map((svc) => (
                    <label key={svc.name} className="flex items-start gap-2 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="svc_name"
                        checked={selectedService.name === svc.name}
                        onChange={() => {
                          setSelectedService(svc);
                          setSelectedRouteTableIds([]);
                          setSelectedSubnetIds([]);
                        }}
                        className="mt-0.5 text-[#EC7211] focus:ring-[#EC7211]"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{svc.name}</div>
                        <div className="text-gray-500 text-[11px]">{svc.desc} ({svc.type})</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  VPC <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedVpcId}
                  onChange={(e) => {
                    setSelectedVpcId(e.target.value);
                    setSelectedRouteTableIds([]);
                    setSelectedSubnetIds([]);
                  }}
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

              {/* Gateway endpoint: Route tables checklist */}
              {selectedService.type === "Gateway" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Route tables
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2">
                    Select route tables to add routes pointing to this gateway endpoint automatically.
                  </p>
                  {availableRouteTables.length === 0 ? (
                    <p className="text-xs text-gray-400">No route tables found for this VPC.</p>
                  ) : (
                    <div className="space-y-1.5 border border-gray-200 rounded p-2 max-h-36 overflow-y-auto">
                      {availableRouteTables.map((rtb) => {
                        const isChecked = selectedRouteTableIds.includes(rtb.RouteTableId);
                        return (
                          <label key={rtb.RouteTableId} className="flex items-center gap-2 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRouteTableIds([...selectedRouteTableIds, rtb.RouteTableId]);
                                } else {
                                  setSelectedRouteTableIds(selectedRouteTableIds.filter((id) => id !== rtb.RouteTableId));
                                }
                              }}
                              className="text-[#EC7211] focus:ring-[#EC7211] rounded"
                            />
                            <span className="font-mono">{rtb.RouteTableId}</span>
                            {rtb.Name && <span className="text-gray-500">({rtb.Name})</span>}
                            {rtb.IsMain && <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded">Main</span>}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Interface endpoint: Subnets checklist */}
              {selectedService.type === "Interface" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Subnets
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2">
                    Select subnets in which to create endpoint network interfaces.
                  </p>
                  {availableSubnets.length === 0 ? (
                    <p className="text-xs text-gray-400">No subnets found for this VPC.</p>
                  ) : (
                    <div className="space-y-1.5 border border-gray-200 rounded p-2 max-h-36 overflow-y-auto">
                      {availableSubnets.map((sub) => {
                        const isChecked = selectedSubnetIds.includes(sub.SubnetId);
                        return (
                          <label key={sub.SubnetId} className="flex items-center gap-2 cursor-pointer text-xs">
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
                              className="text-[#EC7211] focus:ring-[#EC7211] rounded"
                            />
                            <span className="font-mono">{sub.SubnetId}</span>
                            {sub.Name && <span className="text-gray-500">({sub.Name})</span>}
                            <span className="text-gray-400 font-mono">[{sub.AvailabilityZone}]</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
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
                  disabled={actionLoading || !selectedVpcId}
                  className="px-4 text-xs font-bold text-white bg-[#EC7211] rounded hover:bg-[#EB5F07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Creating..." : "Create endpoint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedEndpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">Delete VPC endpoint</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700">
                Are you sure you want to delete VPC endpoint{" "}
                <span className="font-mono font-bold text-gray-900">{selectedEndpoint.VpcEndpointId}</span> ({selectedEndpoint.ServiceName})?
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
                  onClick={handleDeleteEndpoint}
                  disabled={deleteLoading || deleteConfirmText !== "delete"}
                  className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {deleteLoading ? "Deleting..." : "Delete endpoint"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
