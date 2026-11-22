"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClientVpnEndpointItem,
  ClientVpnTargetNetworkItem,
  ClientVpnRouteItem,
  ClientVpnDependencyData,
  associateClientVpnTargetNetworkAction,
  disassociateClientVpnTargetNetworkAction,
  createClientVpnRouteAction,
  deleteClientVpnRouteAction,
  deleteClientVpnEndpointAction,
  generateClientVpnConfigurationAction,
  applySecurityGroupsToClientVpnTargetNetworkAction,
} from "../../client-vpn-actions";

interface Props {
  endpoint: ClientVpnEndpointItem;
  initialTargetNetworks: ClientVpnTargetNetworkItem[];
  initialRoutes: ClientVpnRouteItem[];
  dependencies: ClientVpnDependencyData;
}

export default function ClientVpnEndpointDetailClient({
  endpoint,
  initialTargetNetworks,
  initialRoutes,
  dependencies,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as any) || "details";

  const [activeTab, setActiveTab] = useState<
    "details" | "associations" | "routes" | "auth-rules" | "security-groups" | "connections" | "tags"
  >(initialTab);

  const [targetNetworks, setTargetNetworks] = useState<ClientVpnTargetNetworkItem[]>(initialTargetNetworks);
  const [routes, setRoutes] = useState<ClientVpnRouteItem[]>(initialRoutes);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Modal: Download Config
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadConfigData, setDownloadConfigData] = useState<{ filename: string; content: string } | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Modal: Associate Target Network
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
  const [selectedVpcId, setSelectedVpcId] = useState(dependencies.vpcs.length > 0 ? dependencies.vpcs[0].VpcId : "");
  const [selectedSubnetId, setSelectedSubnetId] = useState(dependencies.subnets.length > 0 ? dependencies.subnets[0].SubnetId : "");
  const [associateLoading, setAssociateLoading] = useState(false);

  // Modal: Create Route
  const [isCreateRouteModalOpen, setIsCreateRouteModalOpen] = useState(false);
  const [routeDestCidr, setRouteDestCidr] = useState("0.0.0.0/0");
  const [routeTargetSubnet, setRouteTargetSubnet] = useState(
    targetNetworks.length > 0 ? targetNetworks[0].TargetNetworkId : (dependencies.subnets[0]?.SubnetId || "")
  );
  const [routeDesc, setRouteDesc] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);

  // Modal: Apply Security Groups
  const [isApplySgModalOpen, setIsApplySgModalOpen] = useState(false);
  const [selectedSgIds, setSelectedSgIds] = useState<string[]>(endpoint.SecurityGroupIds || []);
  const [applySgLoading, setApplySgLoading] = useState(false);

  // Modal: Delete Endpoint
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const availableSubnetsForVpc = dependencies.subnets.filter(
    (s) => !selectedVpcId || s.VpcId === selectedVpcId
  );

  const handleOpenDownloadConfig = async () => {
    setDownloadLoading(true);
    setMessage(null);
    try {
      const res = await generateClientVpnConfigurationAction(endpoint.ClientVpnEndpointId);
      if (res.success) {
        setDownloadConfigData({
          filename: res.filename,
          content: res.configContent,
        });
        setIsDownloadModalOpen(true);
      } else {
        setMessage({
          type: "error",
          text: res.error || "Failed to generate configuration file.",
        });
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadFile = () => {
    if (!downloadConfigData) return;
    const blob = new Blob([downloadConfigData.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadConfigData.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAssociateTargetNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubnetId) return;

    setAssociateLoading(true);
    setMessage(null);
    try {
      const res = await associateClientVpnTargetNetworkAction(endpoint.ClientVpnEndpointId, selectedSubnetId);
      if (res.success) {
        const newAssoc: ClientVpnTargetNetworkItem = {
          AssociationId: res.associationId || `cvpn-assoc-temp-${Date.now()}`,
          VpcId: selectedVpcId,
          TargetNetworkId: selectedSubnetId,
          ClientVpnEndpointId: endpoint.ClientVpnEndpointId,
          Status: { Code: "associating" },
        };
        setTargetNetworks((prev) => [...prev, newAssoc]);
        setIsAssociateModalOpen(false);
        setMessage({
          type: "success",
          text: `Successfully associated target network ${selectedSubnetId} (${res.associationId}).`,
        });
        router.refresh();
      } else {
        setMessage({
          type: "error",
          text: res.error || "Failed to associate target network",
        });
      }
    } finally {
      setAssociateLoading(false);
    }
  };

  const handleDisassociateTargetNetwork = async (assocId: string) => {
    setMessage(null);
    try {
      const res = await disassociateClientVpnTargetNetworkAction(endpoint.ClientVpnEndpointId, assocId);
      if (res.success) {
        setTargetNetworks((prev) => prev.filter((n) => n.AssociationId !== assocId));
        setMessage({
          type: "success",
          text: `Successfully initiated disassociation of ${assocId}.`,
        });
      } else {
        if (res.error?.includes("NotImplemented")) {
          setMessage({
            type: "info",
            text: `Notice: DisassociateClientVpnTargetNetwork is scaffolded in the AWS emulator. In production AWS, association ${assocId} would transition to disassociating and delete. (${res.error})`,
          });
        } else {
          setMessage({ type: "error", text: res.error || "Failed to disassociate network" });
        }
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeDestCidr || !routeTargetSubnet) return;

    setRouteLoading(true);
    setMessage(null);
    try {
      const res = await createClientVpnRouteAction({
        clientVpnEndpointId: endpoint.ClientVpnEndpointId,
        destinationCidrBlock: routeDestCidr.trim(),
        targetVpcSubnetId: routeTargetSubnet,
        description: routeDesc.trim() || undefined,
      });

      if (res.success) {
        const newRoute: ClientVpnRouteItem = {
          ClientVpnEndpointId: endpoint.ClientVpnEndpointId,
          DestinationCidr: routeDestCidr.trim(),
          TargetSubnet: routeTargetSubnet,
          Type: "Nat",
          Origin: "manual",
          Status: { Code: "creating" },
          Description: routeDesc.trim() || undefined,
        };
        setRoutes((prev) => [...prev, newRoute]);
        setIsCreateRouteModalOpen(false);
        setMessage({
          type: "success",
          text: `Successfully created route ${routeDestCidr} targeting ${routeTargetSubnet}.`,
        });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create client VPN route" });
      }
    } finally {
      setRouteLoading(false);
    }
  };

  const handleDeleteRoute = async (destCidr: string, targetSubnet: string) => {
    setMessage(null);
    try {
      const res = await deleteClientVpnRouteAction({
        clientVpnEndpointId: endpoint.ClientVpnEndpointId,
        destinationCidrBlock: destCidr,
        targetVpcSubnetId: targetSubnet,
      });

      if (res.success) {
        setRoutes((prev) => prev.filter((r) => !(r.DestinationCidr === destCidr && r.TargetSubnet === targetSubnet)));
        setMessage({
          type: "success",
          text: `Successfully deleted route ${destCidr}.`,
        });
      } else {
        if (res.error?.includes("NotImplemented")) {
          setMessage({
            type: "info",
            text: `Notice: DeleteClientVpnRoute is scaffolded in the AWS emulator. In production AWS, route ${destCidr} would be deleted. (${res.error})`,
          });
        } else {
          setMessage({ type: "error", text: res.error || "Failed to delete route" });
        }
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleApplySecurityGroups = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endpoint.VpcId) {
      setMessage({ type: "error", text: "No target VPC associated with this endpoint." });
      return;
    }

    setApplySgLoading(true);
    setMessage(null);
    try {
      const res = await applySecurityGroupsToClientVpnTargetNetworkAction({
        clientVpnEndpointId: endpoint.ClientVpnEndpointId,
        vpcId: endpoint.VpcId,
        securityGroupIds: selectedSgIds,
      });

      if (res.success) {
        setIsApplySgModalOpen(false);
        setMessage({
          type: "success",
          text: "Successfully applied security groups to Client VPN endpoint.",
        });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to apply security groups" });
      }
    } finally {
      setApplySgLoading(false);
    }
  };

  const handleDeleteEndpoint = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteClientVpnEndpointAction(endpoint.ClientVpnEndpointId);
      if (res.success) {
        router.push("/vpc/client-vpn-endpoints");
      } else {
        if (res.error?.includes("NotImplemented")) {
          setMessage({
            type: "info",
            text: `Notice: DeleteClientVpnEndpoint is scaffolded in the AWS emulator. In production AWS, this endpoint would transition to deleting and delete. (${res.error})`,
          });
          setIsDeleteModalOpen(false);
        } else {
          setMessage({ type: "error", text: res.error || "Failed to delete client VPN endpoint" });
        }
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const isAvailable = endpoint.Status?.Code === "available";
  const isPending = endpoint.Status?.Code === "pending-associate";

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Virtual Private Cloud
        </Link>
        <span>&gt;</span>
        <Link href="/vpc/client-vpn-endpoints" className="hover:text-[#0073bb]">
          Client VPN endpoints
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{endpoint.ClientVpnEndpointId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f] font-mono">
              {endpoint.ClientVpnEndpointId}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                isAvailable
                  ? "bg-green-100 text-green-800"
                  : isPending
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {endpoint.Status?.Code || "unknown"}
            </span>
          </div>
          {endpoint.Name && endpoint.Name !== endpoint.ClientVpnEndpointId && (
            <p className="text-[13px] text-[#545b64] mt-0.5">{endpoint.Name}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenDownloadConfig}
            disabled={downloadLoading}
            className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {downloadLoading ? "Generating..." : "Download client configuration"}
          </button>

          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              className="px-3 text-xs font-semibold bg-white border border-[#d5dbdb] text-[#16191f] hover:bg-gray-50 rounded transition-colors flex items-center gap-1.5 shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              <span>Actions</span>
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {actionMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-64 bg-white border border-[#d5dbdb] rounded shadow-lg py-1 z-20 text-[13px]"
                onMouseLeave={() => setActionMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    setIsAssociateModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#16191f]"
                >
                  Associate target network
                </button>
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    setIsCreateRouteModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#16191f]"
                >
                  Create client VPN route
                </button>
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    setIsApplySgModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#16191f]"
                >
                  Apply security groups
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                >
                  Delete client VPN endpoint
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banner Message */}
      {message && (
        <div
          className={`p-3 rounded border text-[13px] flex items-center justify-between ${
            message.type === "success"
              ? "bg-[#f2fcf5] border-[#037f0c] text-[#037f0c]"
              : message.type === "info"
              ? "bg-[#f1faff] border-[#0073bb] text-[#0073bb]"
              : "bg-[#fdf2f2] border-[#d13212] text-[#d13212]"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600 font-bold ml-4">
            x
          </button>
        </div>
      )}

      {/* Overview Quick Stats */}
      <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
        <div>
          <div className="text-xs text-[#545b64] font-medium">Client IPv4 CIDR</div>
          <div className="font-mono text-[#16191f] font-semibold mt-1">{endpoint.ClientCidrBlock || "-"}</div>
        </div>
        <div>
          <div className="text-xs text-[#545b64] font-medium">DNS Name</div>
          <div className="font-mono text-[12px] text-[#0073bb] mt-1 break-all select-all">
            {endpoint.DnsName || "-"}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#545b64] font-medium">Protocol / Port</div>
          <div className="font-mono text-[#16191f] mt-1 uppercase">
            {endpoint.TransportProtocol || "udp"}:{endpoint.VpnPort || 443}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#545b64] font-medium">Split-tunnel</div>
          <div className="text-[#16191f] mt-1 font-medium">
            {endpoint.SplitTunnel ? "Enabled" : "Disabled"}
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
            onClick={() => setActiveTab("associations")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "associations"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Target network associations ({targetNetworks.length})
          </button>
          <button
            onClick={() => setActiveTab("routes")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "routes"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Route table ({routes.length})
          </button>
          <button
            onClick={() => setActiveTab("auth-rules")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "auth-rules"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Authorization rules
          </button>
          <button
            onClick={() => setActiveTab("security-groups")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "security-groups"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Security groups
          </button>
          <button
            onClick={() => setActiveTab("connections")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "connections"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Connections
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({endpoint.Tags ? endpoint.Tags.length : 0})
          </button>
        </div>
      </div>

      {/* Tab 1: Details */}
      {activeTab === "details" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-[15px] font-bold text-[#16191f]">Client VPN endpoint details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-[13px]">
              <div>
                <div className="text-xs text-[#545b64]">Client VPN endpoint ID</div>
                <div className="font-mono text-[#16191f] mt-0.5">{endpoint.ClientVpnEndpointId}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">State</div>
                <div className="mt-0.5 font-semibold text-gray-800">{endpoint.Status?.Code || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">Description</div>
                <div className="text-[#16191f] mt-0.5">{endpoint.Description || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">Client IPv4 CIDR</div>
                <div className="font-mono text-[#16191f] mt-0.5">{endpoint.ClientCidrBlock || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">DNS Name</div>
                <div className="font-mono text-[12px] text-[#0073bb] mt-0.5 break-all">{endpoint.DnsName || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">Server Certificate ARN</div>
                <div className="font-mono text-[12px] text-[#16191f] mt-0.5 break-all">{endpoint.ServerCertificateArn || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">Transport Protocol</div>
                <div className="font-mono uppercase text-[#16191f] mt-0.5">{endpoint.TransportProtocol || "udp"}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">VPN Port</div>
                <div className="font-mono text-[#16191f] mt-0.5">{endpoint.VpnPort || 443}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">Split-tunnel</div>
                <div className="text-[#16191f] mt-0.5">{endpoint.SplitTunnel ? "Enabled" : "Disabled"}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">Session Timeout</div>
                <div className="text-[#16191f] mt-0.5">{endpoint.SessionTimeoutHours || 24} hours</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">Connection Logging</div>
                <div className="text-[#16191f] mt-0.5">
                  {endpoint.ConnectionLogOptions?.Enabled
                    ? `Enabled (Group: ${endpoint.ConnectionLogOptions.CloudWatchLogGroup || "-"})`
                    : "Disabled"}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">Creation Time</div>
                <div className="font-mono text-xs text-[#16191f] mt-0.5" suppressHydrationWarning>
                  {endpoint.CreationTime ? new Date(endpoint.CreationTime).toLocaleString() : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Authentication methods card */}
          <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-[15px] font-bold text-[#16191f]">Authentication methods</h3>
            {(!endpoint.AuthenticationOptions || endpoint.AuthenticationOptions.length === 0) ? (
              <p className="text-xs text-gray-500">No authentication options specified.</p>
            ) : (
              <div className="divide-y divide-gray-100 text-[13px]">
                {endpoint.AuthenticationOptions.map((auth, i) => (
                  <div key={i} className="py-2.5 flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-[#16191f] capitalize">
                        {auth.Type?.replace("-", " ")}
                      </div>
                      {auth.MutualAuthentication?.ClientRootCertificateChain && (
                        <div className="text-xs font-mono text-gray-600 mt-1">
                          Client root certificate: {auth.MutualAuthentication.ClientRootCertificateChain}
                        </div>
                      )}
                      {auth.ActiveDirectory?.DirectoryId && (
                        <div className="text-xs font-mono text-gray-600 mt-1">
                          Directory ID: {auth.ActiveDirectory.DirectoryId}
                        </div>
                      )}
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 text-[#0073bb] rounded text-[11px] font-medium">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Target Network Associations */}
      {activeTab === "associations" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-[#16191f]">Target network associations</h3>
              <p className="text-xs text-[#545b64] mt-0.5">
                VPC Subnets associated with this Client VPN endpoint to grant access to VPC resources.
              </p>
            </div>
            <button
              onClick={() => setIsAssociateModalOpen(true)}
              className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Associate target network
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                  <th className="py-2.5 px-6">Association ID</th>
                  <th className="py-2.5 px-6">VPC ID</th>
                  <th className="py-2.5 px-6">Subnet ID</th>
                  <th className="py-2.5 px-6">Status</th>
                  <th className="py-2.5 px-6">Security Groups</th>
                  <th className="py-2.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {targetNetworks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No target networks associated with this Client VPN endpoint.
                    </td>
                  </tr>
                ) : (
                  targetNetworks.map((net) => (
                    <tr key={net.AssociationId} className="hover:bg-gray-50">
                      <td className="py-2.5 px-6 font-mono text-[#16191f] font-medium">
                        {net.AssociationId}
                      </td>
                      <td className="py-2.5 px-6 font-mono text-[#0073bb]">
                        <Link href={`/vpc/vpcs`} className="hover:underline">
                          {net.VpcId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-6 font-mono text-[#0073bb]">
                        <Link href={`/vpc/subnets`} className="hover:underline">
                          {net.TargetNetworkId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-800">
                          {net.Status?.Code || "associated"}
                        </span>
                      </td>
                      <td className="py-2.5 px-6 font-mono text-[12px] text-gray-600">
                        {net.SecurityGroups && net.SecurityGroups.length > 0 ? net.SecurityGroups.join(", ") : "-"}
                      </td>
                      <td className="py-2.5 px-6 text-right">
                        <button
                          onClick={() => handleDisassociateTargetNetwork(net.AssociationId)}
                          className="text-xs text-red-600 hover:underline font-medium"
                        >
                          Disassociate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Route Table */}
      {activeTab === "routes" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-[#16191f]">Client VPN route table</h3>
              <p className="text-xs text-[#545b64] mt-0.5">
                Routes determining where network traffic from connecting VPN clients is directed.
              </p>
            </div>
            <button
              onClick={() => setIsCreateRouteModalOpen(true)}
              className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Create client VPN route
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                  <th className="py-2.5 px-6">Destination CIDR</th>
                  <th className="py-2.5 px-6">Target Subnet</th>
                  <th className="py-2.5 px-6">Type</th>
                  <th className="py-2.5 px-6">Origin</th>
                  <th className="py-2.5 px-6">Status</th>
                  <th className="py-2.5 px-6">Description</th>
                  <th className="py-2.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {routes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No routes found. Create a route to direct client traffic.
                    </td>
                  </tr>
                ) : (
                  routes.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2.5 px-6 font-mono font-medium text-[#16191f]">
                        {r.DestinationCidr}
                      </td>
                      <td className="py-2.5 px-6 font-mono text-[#0073bb]">
                        {r.TargetSubnet ? (
                          <Link href={`/vpc/subnets`} className="hover:underline">
                            {r.TargetSubnet}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2.5 px-6 text-gray-600">{r.Type || "Nat"}</td>
                      <td className="py-2.5 px-6 text-gray-600 capitalize">{r.Origin || "associate"}</td>
                      <td className="py-2.5 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-800">
                          {r.Status?.Code || "active"}
                        </span>
                      </td>
                      <td className="py-2.5 px-6 text-gray-500">{r.Description || "-"}</td>
                      <td className="py-2.5 px-6 text-right">
                        {r.TargetSubnet && (
                          <button
                            onClick={() => handleDeleteRoute(r.DestinationCidr, r.TargetSubnet!)}
                            className="text-xs text-red-600 hover:underline font-medium"
                          >
                            Delete route
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Authorization Rules */}
      {activeTab === "auth-rules" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#16191f]">Authorization rules</h3>
              <p className="text-xs text-[#545b64] mt-0.5">
                Ingress authorization rules specify which network CIDR blocks clients can reach and whether access is restricted to specific Active Directory groups.
              </p>
            </div>
            <button
              disabled
              className="px-3 text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded cursor-not-allowed shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Add authorization rule
            </button>
          </div>

          <div className="p-4 bg-[#f1faff] border border-[#0073bb] rounded text-[13px] text-[#16191f] space-y-2">
            <p className="font-semibold text-[#0073bb]">AWS Emulator Notice</p>
            <p>
              In AWS, authorization rules are configured via <code>AuthorizeClientVpnIngress</code> to define granular firewall permissions per Active Directory group or all users.
            </p>
            <p className="text-xs text-gray-600">
              The operation <code>AuthorizeClientVpnIngress</code> is scaffolded in the local AWS emulator (returns NotImplemented). All connected clients automatically inherit network route reachability.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                  <th className="py-2.5 px-6">Destination Network</th>
                  <th className="py-2.5 px-6">Access To</th>
                  <th className="py-2.5 px-6">Status</th>
                  <th className="py-2.5 px-6">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="py-2.5 px-6 font-mono text-[#16191f]">0.0.0.0/0 (Default Ingress)</td>
                  <td className="py-2.5 px-6 text-gray-700">All users</td>
                  <td className="py-2.5 px-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-800">
                      active
                    </span>
                  </td>
                  <td className="py-2.5 px-6 text-gray-500">Allow all connected clients access</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Security Groups */}
      {activeTab === "security-groups" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#16191f]">Security groups</h3>
              <p className="text-xs text-[#545b64] mt-0.5">
                Security groups applied to the Client VPN network interface to restrict inbound and outbound traffic.
              </p>
            </div>
            <button
              onClick={() => setIsApplySgModalOpen(true)}
              className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Apply security groups
            </button>
          </div>

          {(!endpoint.SecurityGroupIds || endpoint.SecurityGroupIds.length === 0) ? (
            <p className="text-xs text-gray-500">No security groups explicitly assigned.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {endpoint.SecurityGroupIds.map((sgId) => (
                <div key={sgId} className="py-2 flex items-center justify-between text-[13px]">
                  <span className="font-mono text-[#0073bb] font-medium">{sgId}</span>
                  <span className="text-xs text-gray-500">Applied</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Connections */}
      {activeTab === "connections" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-[15px] font-bold text-[#16191f]">Active client connections</h3>
            <p className="text-xs text-[#545b64] mt-0.5">
              Current OpenVPN client sessions connected to this endpoint.
            </p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">No active client sessions</p>
            <p>
              When clients connect using the downloaded <code>.ovpn</code> profile, their session telemetry (Client IP, User, Ingress/Egress bytes) appears here.
            </p>
          </div>
        </div>
      )}

      {/* Tab 7: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-[15px] font-bold text-[#16191f]">Tags</h3>
          {(!endpoint.Tags || endpoint.Tags.length === 0) ? (
            <p className="text-xs text-gray-500">No tags assigned to this client VPN endpoint.</p>
          ) : (
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                  <th className="py-2.5 px-6">Key</th>
                  <th className="py-2.5 px-6">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {endpoint.Tags.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2.5 px-6 font-mono text-[#16191f]">{t.Key}</td>
                    <td className="py-2.5 px-6 font-mono text-gray-700">{t.Value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal: Download Config */}
      {isDownloadModalOpen && downloadConfigData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-[#16191f]">Download client configuration</h3>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                x
              </button>
            </div>

            <p className="text-xs text-[#545b64]">
              Configuration file preview for <strong>{downloadConfigData.filename}</strong>:
            </p>

            <pre className="p-3 bg-gray-900 text-green-400 font-mono text-[11px] rounded max-h-64 overflow-y-auto whitespace-pre-wrap">
              {downloadConfigData.content}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setIsDownloadModalOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDownloadFile}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Download .ovpn file
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Associate Target Network */}
      {isAssociateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Associate target network</h3>
            <p className="text-xs text-[#545b64]">
              Select a VPC and subnet to associate with this Client VPN endpoint.
            </p>

            <form onSubmit={handleAssociateTargetNetwork} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#16191f] block mb-1">
                  VPC <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedVpcId}
                  onChange={(e) => setSelectedVpcId(e.target.value)}
                  className="w-full text-xs border border-[#aab7b8] rounded p-2 bg-white font-mono"
                  style={{ height: "32px" }}
                >
                  {dependencies.vpcs.map((v) => (
                    <option key={v.VpcId} value={v.VpcId}>
                      {v.VpcId} {v.Name ? `(${v.Name})` : ""} [{v.CidrBlock}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#16191f] block mb-1">
                  Subnet <span className="text-red-500">*</span>
                </label>
                {availableSubnetsForVpc.length === 0 ? (
                  <p className="text-xs text-gray-500">No subnets found for this VPC.</p>
                ) : (
                  <select
                    value={selectedSubnetId}
                    onChange={(e) => setSelectedSubnetId(e.target.value)}
                    className="w-full text-xs border border-[#aab7b8] rounded p-2 bg-white font-mono"
                    style={{ height: "32px" }}
                  >
                    {availableSubnetsForVpc.map((s) => (
                      <option key={s.SubnetId} value={s.SubnetId}>
                        {s.SubnetId} {s.Name ? `(${s.Name})` : ""} [{s.CidrBlock}] ({s.AvailabilityZone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsAssociateModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={associateLoading || !selectedSubnetId}
                  className={`px-4 py-1.5 text-xs font-semibold text-white rounded transition-colors shadow-sm ${
                    associateLoading || !selectedSubnetId
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#ec7211] hover:bg-[#eb5f07]"
                  }`}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {associateLoading ? "Associating..." : "Associate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Route */}
      {isCreateRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Create client VPN route</h3>
            <p className="text-xs text-[#545b64]">
              Specify destination CIDR and select the target subnet to route traffic from VPN clients.
            </p>

            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#16191f] block mb-1">
                  Destination CIDR <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="0.0.0.0/0"
                  value={routeDestCidr}
                  onChange={(e) => setRouteDestCidr(e.target.value)}
                  className="w-full text-xs border border-[#aab7b8] rounded p-2 font-mono"
                  style={{ height: "32px" }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#16191f] block mb-1">
                  Target VPC Subnet <span className="text-red-500">*</span>
                </label>
                <select
                  value={routeTargetSubnet}
                  onChange={(e) => setRouteTargetSubnet(e.target.value)}
                  className="w-full text-xs border border-[#aab7b8] rounded p-2 bg-white font-mono"
                  style={{ height: "32px" }}
                >
                  {dependencies.subnets.map((s) => (
                    <option key={s.SubnetId} value={s.SubnetId}>
                      {s.SubnetId} {s.Name ? `(${s.Name})` : ""} [{s.CidrBlock}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#16191f] block mb-1">
                  Description <span className="text-[11px] text-gray-500 font-normal">- optional</span>
                </label>
                <input
                  type="text"
                  placeholder="Route to internet / VPC services"
                  value={routeDesc}
                  onChange={(e) => setRouteDesc(e.target.value)}
                  className="w-full text-xs border border-[#aab7b8] rounded p-2"
                  style={{ height: "32px" }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsCreateRouteModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={routeLoading || !routeDestCidr || !routeTargetSubnet}
                  className={`px-4 py-1.5 text-xs font-semibold text-white rounded transition-colors shadow-sm ${
                    routeLoading || !routeDestCidr || !routeTargetSubnet
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#ec7211] hover:bg-[#eb5f07]"
                  }`}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {routeLoading ? "Creating..." : "Create route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Apply Security Groups */}
      {isApplySgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Apply security groups</h3>
            <p className="text-xs text-[#545b64]">
              Select security groups to attach to the Client VPN endpoint network interface.
            </p>

            <form onSubmit={handleApplySecurityGroups} className="space-y-4">
              <div className="space-y-2 border border-gray-200 rounded p-3 max-h-48 overflow-y-auto bg-gray-50">
                {dependencies.securityGroups.map((sg) => (
                  <label key={sg.GroupId} className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSgIds.includes(sg.GroupId)}
                      onChange={() => {
                        if (selectedSgIds.includes(sg.GroupId)) {
                          setSelectedSgIds(selectedSgIds.filter((id) => id !== sg.GroupId));
                        } else {
                          setSelectedSgIds([...selectedSgIds, sg.GroupId]);
                        }
                      }}
                      className="text-[#ec7211] focus:ring-[#ec7211]"
                    />
                    <span className="font-mono text-[12px] text-[#16191f]">{sg.GroupId}</span>
                    <span className="text-gray-600">({sg.GroupName || "default"})</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsApplySgModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applySgLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded shadow-sm"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {applySgLoading ? "Applying..." : "Apply security groups"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Endpoint */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete client VPN endpoint</h3>
            <p className="text-xs text-[#545b64]">
              Are you sure you want to delete client VPN endpoint{" "}
              <strong className="text-black font-mono">{endpoint.ClientVpnEndpointId}</strong>?
            </p>
            <div>
              <label className="text-xs font-semibold text-[#16191f] block mb-1">
                Type <strong>delete</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full text-xs border border-[#aab7b8] rounded p-2"
                style={{ height: "32px" }}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
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
                onClick={handleDeleteEndpoint}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded transition-colors shadow-sm ${
                  deleteConfirmText === "delete" && !deleteLoading
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-gray-300 cursor-not-allowed"
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
