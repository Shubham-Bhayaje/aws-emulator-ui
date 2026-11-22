"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ServiceItem,
  NamespaceItem,
  InstanceItem,
  listInstancesAction,
  registerInstanceAction,
  deregisterInstanceAction,
  updateInstanceHealthStatusAction,
  deleteServiceAction,
  discoverInstancesAction,
} from "../../actions";

interface Props {
  service: ServiceItem;
  namespace?: NamespaceItem;
  initialInstances: InstanceItem[];
}

export default function ServiceDetailClient({
  service: initialService,
  namespace,
  initialInstances,
}: Props) {
  const router = useRouter();

  const [service] = useState<ServiceItem>(initialService);
  const [instances, setInstances] = useState<InstanceItem[]>(initialInstances);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [activeTab, setActiveTab] = useState<"instances" | "discover">("instances");

  // Register Instance Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newInstanceId, setNewInstanceId] = useState("");
  const [newIpv4, setNewIpv4] = useState("");
  const [newPort, setNewPort] = useState("");
  const [newCustomAttrs, setNewCustomAttrs] = useState<{ key: string; value: string }[]>([]);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Deregister Modal State
  const [isDeregisterModalOpen, setIsDeregisterModalOpen] = useState(false);
  const [deregisterLoading, setDeregisterLoading] = useState(false);
  const [deregisterError, setDeregisterError] = useState<string | null>(null);

  // Health Status Update State
  const [healthStatusLoading, setHealthStatusLoading] = useState(false);

  // Delete Service Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Discover Instances Playground State
  const [discoverQueryFilterKey, setDiscoverQueryFilterKey] = useState("");
  const [discoverQueryFilterVal, setDiscoverQueryFilterVal] = useState("");
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverResult, setDiscoverResult] = useState<any | null>(null);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  const selectedInstance = instances.find((i) => i.Id === selectedInstanceId);

  const refreshInstances = async () => {
    setLoadingInstances(true);
    try {
      const res = await listInstancesAction(service.Id);
      if (res.success) {
        setInstances(res.instances);
        if (selectedInstanceId && !res.instances.find((i) => i.Id === selectedInstanceId)) {
          setSelectedInstanceId(null);
        }
      }
    } finally {
      setLoadingInstances(false);
    }
  };

  const handleRegisterInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceId.trim()) {
      setRegisterError("Instance ID is required.");
      return;
    }

    setRegisterLoading(true);
    setRegisterError(null);

    const customAttrs: Record<string, string> = {};
    for (const a of newCustomAttrs) {
      if (a.key.trim() && a.value.trim()) {
        customAttrs[a.key.trim()] = a.value.trim();
      }
    }

    try {
      const res = await registerInstanceAction({
        serviceId: service.Id,
        instanceId: newInstanceId.trim(),
        ipv4: newIpv4.trim() || undefined,
        port: newPort.trim() || undefined,
        customAttributes: Object.keys(customAttrs).length > 0 ? customAttrs : undefined,
      });

      if (res.success) {
        setIsRegisterModalOpen(false);
        setNewInstanceId("");
        setNewIpv4("");
        setNewPort("");
        setNewCustomAttrs([]);
        await refreshInstances();
        router.refresh();
      } else {
        setRegisterError(res.error || "Failed to register instance.");
      }
    } catch (err: unknown) {
      setRegisterError(err instanceof Error ? err.message : String(err));
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleDeregisterInstance = async () => {
    if (!selectedInstance) return;

    setDeregisterLoading(true);
    setDeregisterError(null);
    try {
      const res = await deregisterInstanceAction({
        serviceId: service.Id,
        instanceId: selectedInstance.Id,
      });

      if (res.success) {
        setIsDeregisterModalOpen(false);
        setSelectedInstanceId(null);
        await refreshInstances();
        router.refresh();
      } else {
        setDeregisterError(res.error || "Failed to deregister instance.");
      }
    } catch (err: unknown) {
      setDeregisterError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeregisterLoading(false);
    }
  };

  const handleSetHealth = async (status: "HEALTHY" | "UNHEALTHY") => {
    if (!selectedInstance) return;

    setHealthStatusLoading(true);
    try {
      const res = await updateInstanceHealthStatusAction({
        serviceId: service.Id,
        instanceId: selectedInstance.Id,
        status,
      });

      if (res.success) {
        await refreshInstances();
      } else {
        alert(res.error || "Failed to update custom health status.");
      }
    } finally {
      setHealthStatusLoading(false);
    }
  };

  const handleDeleteService = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteError('Please type "delete" to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await deleteServiceAction(service.Id);
      if (res.success) {
        router.push("/cloudmap/services");
        router.refresh();
      } else {
        setDeleteError(res.error || "Failed to delete service.");
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRunDiscover = async () => {
    if (!namespace?.Name || !service.Name) {
      setDiscoverError("Namespace and service name are required to discover instances.");
      return;
    }

    setDiscoverLoading(true);
    setDiscoverError(null);
    setDiscoverResult(null);

    const queryParams: Record<string, string> = {};
    if (discoverQueryFilterKey.trim() && discoverQueryFilterVal.trim()) {
      queryParams[discoverQueryFilterKey.trim()] = discoverQueryFilterVal.trim();
    }

    try {
      const res = await discoverInstancesAction({
        namespaceName: namespace.Name,
        serviceName: service.Name,
        queryParameters: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      });

      if (res.success) {
        setDiscoverResult(res);
      } else {
        setDiscoverError(res.error || "DiscoverInstances query failed.");
      }
    } catch (err: unknown) {
      setDiscoverError(err instanceof Error ? err.message : String(err));
    } finally {
      setDiscoverLoading(false);
    }
  };

  const filteredInstances = instances.filter((inst) => {
    const term = search.toLowerCase();
    const matchesId = inst.Id.toLowerCase().includes(term);
    const matchesIp = inst.Ipv4 && inst.Ipv4.toLowerCase().includes(term);
    const matchesAttrs =
      inst.Attributes &&
      Object.entries(inst.Attributes).some(
        ([k, v]) => k.toLowerCase().includes(term) || v.toLowerCase().includes(term)
      );
    return matchesId || matchesIp || matchesAttrs;
  });

  const renderHealthBadge = (status?: string) => {
    if (status === "HEALTHY") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          HEALTHY
        </span>
      );
    }
    if (status === "UNHEALTHY") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
          UNHEALTHY
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-50 text-gray-700 border border-gray-200">
        {status || "UNKNOWN"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/cloudmap" className="hover:underline">
          AWS Cloud Map
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <Link href="/cloudmap/services" className="hover:underline">
          Services
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">{service.Name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#16191f]">{service.Name}</h1>
            <span className="text-[14px] text-[#545b64]">
              in{" "}
              {service.NamespaceId ? (
                <Link
                  href={`/cloudmap/namespaces/${service.NamespaceId}`}
                  className="text-[#0073bb] hover:underline font-medium"
                >
                  {service.NamespaceName || service.NamespaceId}
                </Link>
              ) : (
                "-"
              )}
            </span>
          </div>
          <p className="text-[12px] font-mono text-[#545b64] mt-1">{service.Id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setIsDeleteModalOpen(true);
            }}
            className="px-3 py-1.5 text-[13px] font-medium text-red-600 border border-[#d5dbdb] rounded hover:bg-red-50 transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete service
          </button>
          <button
            onClick={() => {
              setNewInstanceId("");
              setNewIpv4("");
              setNewPort("");
              setNewCustomAttrs([]);
              setRegisterError(null);
              setIsRegisterModalOpen(true);
            }}
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Register instance
          </button>
        </div>
      </div>

      {/* Service Details Card */}
      <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm">
        <h2 className="text-[16px] font-bold text-[#16191f] mb-4">Service details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Service name</span>
            <span className="text-[#16191f] font-semibold">{service.Name}</span>
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Service ID</span>
            <span className="font-mono text-[#16191f]">{service.Id}</span>
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Namespace</span>
            {service.NamespaceId ? (
              <Link
                href={`/cloudmap/namespaces/${service.NamespaceId}`}
                className="text-[#0073bb] hover:underline"
              >
                {service.NamespaceName || service.NamespaceId}
              </Link>
            ) : (
              "-"
            )}
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Routing policy</span>
            <span className="text-[#16191f]">{service.RoutingPolicy || "None"}</span>
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">DNS records</span>
            <span className="text-[#16191f]">
              {service.DnsRecords && service.DnsRecords.length > 0
                ? service.DnsRecords.map((r, i) => (
                    <span key={i} className="inline-block mr-2 font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
                      {r.Type} (TTL: {r.TTL}s)
                    </span>
                  ))
                : "None"}
            </span>
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Health check</span>
            <span className="text-[#16191f]">
              {service.HealthCheckCustomConfig ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Custom (Threshold: {service.HealthCheckCustomConfig.FailureThreshold || 1})
                </span>
              ) : (
                "None"
              )}
            </span>
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Registered instances</span>
            <span className="text-[#16191f] font-semibold">{instances.length}</span>
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Description</span>
            <span className="text-[#16191f]">{service.Description || "-"}</span>
          </div>
          {service.Arn && (
            <div className="md:col-span-2 lg:col-span-3">
              <span className="text-[12px] font-medium text-[#545b64] block">ARN</span>
              <span className="font-mono text-[12px] text-[#545b64] break-all">{service.Arn}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded] flex gap-6 text-[14px]">
        <button
          onClick={() => setActiveTab("instances")}
          className={`pb-2 font-medium border-b-2 transition-colors ${
            activeTab === "instances"
              ? "border-[#ec7211] text-[#16191f] font-bold"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Instances ({instances.length})
        </button>
        <button
          onClick={() => setActiveTab("discover")}
          className={`pb-2 font-medium border-b-2 transition-colors ${
            activeTab === "discover"
              ? "border-[#ec7211] text-[#16191f] font-bold"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Discover instances (API playground)
        </button>
      </div>

      {/* Tab 1: Instances View */}
      {activeTab === "instances" && (
        <div className="space-y-3">
          {/* Table Toolbar */}
          <div className="bg-white border border-[#d5dbdb] rounded-t p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                placeholder="Filter instances by ID, IP, or attributes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refreshInstances}
                disabled={loadingInstances}
                className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {loadingInstances ? "Refreshing..." : "Refresh"}
              </button>

              {/* Health status update actions for custom health checks */}
              {service.HealthCheckCustomConfig && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSetHealth("HEALTHY")}
                    disabled={!selectedInstance || healthStatusLoading}
                    className={`px-3 py-1.5 text-[13px] font-medium rounded border transition-colors ${
                      selectedInstance && !healthStatusLoading
                        ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
                    }`}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    title="Set instance custom health status to HEALTHY"
                  >
                    Set Healthy
                  </button>
                  <button
                    onClick={() => handleSetHealth("UNHEALTHY")}
                    disabled={!selectedInstance || healthStatusLoading}
                    className={`px-3 py-1.5 text-[13px] font-medium rounded border transition-colors ${
                      selectedInstance && !healthStatusLoading
                        ? "text-red-700 border-red-300 hover:bg-red-50"
                        : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
                    }`}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    title="Set instance custom health status to UNHEALTHY"
                  >
                    Set Unhealthy
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setDeregisterError(null);
                  setIsDeregisterModalOpen(true);
                }}
                disabled={!selectedInstance}
                className={`px-3 py-1.5 text-[13px] font-medium rounded border transition-colors ${
                  selectedInstance
                    ? "text-red-600 border-[#d5dbdb] hover:bg-red-50"
                    : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Deregister
              </button>
              <button
                onClick={() => {
                  setNewInstanceId("");
                  setNewIpv4("");
                  setNewPort("");
                  setNewCustomAttrs([]);
                  setRegisterError(null);
                  setIsRegisterModalOpen(true);
                }}
                className="px-3 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Register instance
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border-x border-b border-[#d5dbdb] rounded-b overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                  <th className="py-2.5 px-3 w-10 text-center"></th>
                  <th className="py-2.5 px-4">Instance ID</th>
                  <th className="py-2.5 px-4">IP address</th>
                  <th className="py-2.5 px-4">Port</th>
                  <th className="py-2.5 px-4">Health status</th>
                  <th className="py-2.5 px-4">Attributes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {filteredInstances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#545b64]">
                      {search
                        ? "No instances match your search filter."
                        : "No instances registered for this service. Click 'Register instance' to register one."}
                    </td>
                  </tr>
                ) : (
                  filteredInstances.map((inst) => {
                    const isSelected = selectedInstanceId === inst.Id;
                    const nonSystemAttrs = Object.entries(inst.Attributes || {}).filter(
                      ([k]) => !k.startsWith("AWS_")
                    );

                    return (
                      <tr
                        key={inst.Id}
                        onClick={() => setSelectedInstanceId(inst.Id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-[#f1faff]" : "hover:bg-[#f9fafb]"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => setSelectedInstanceId(inst.Id)}
                            className="accent-[#ec7211]"
                          />
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium text-[#16191f]">
                          {inst.Id}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#545b64]">
                          {inst.Ipv4 || "-"}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#545b64]">
                          {inst.Port || "-"}
                        </td>
                        <td className="py-2.5 px-4">
                          {renderHealthBadge(inst.HealthStatus)}
                        </td>
                        <td className="py-2.5 px-4 text-[#545b64]">
                          {nonSystemAttrs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {nonSystemAttrs.map(([k, v]) => (
                                <span
                                  key={k}
                                  className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[#16191f] text-[11px] font-mono"
                                >
                                  {k}={v}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[12px] text-[#879596]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Discover Instances API Playground */}
      {activeTab === "discover" && (
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Discover instances (API playground)</h2>
            <p className="text-[13px] text-[#545b64] mt-1">
              Test how applications and microservices discover healthy instances registered in this service using the AWS Cloud Map <code className="font-mono text-xs">DiscoverInstances</code> API call.
            </p>
          </div>

          <div className="p-4 bg-[#f8f9fa] border border-[#eaeded] rounded space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div>
                <span className="text-[12px] font-medium text-[#545b64] block">Namespace name</span>
                <span className="font-mono font-semibold text-[#16191f]">{namespace?.Name || "-"}</span>
              </div>
              <div>
                <span className="text-[12px] font-medium text-[#545b64] block">Service name</span>
                <span className="font-mono font-semibold text-[#16191f]">{service.Name}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#eaeded]">
              <label className="block text-[12px] font-medium text-[#545b64] mb-1">
                Optional Query Attribute Filter (key-value pair)
              </label>
              <div className="flex items-center gap-2 max-w-lg">
                <input
                  type="text"
                  placeholder="Attribute Key (e.g. stage)"
                  value={discoverQueryFilterKey}
                  onChange={(e) => setDiscoverQueryFilterKey(e.target.value)}
                  className="flex-1 px-3 py-1 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                />
                <span className="text-[#879596]">=</span>
                <input
                  type="text"
                  placeholder="Attribute Value (e.g. prod)"
                  value={discoverQueryFilterVal}
                  onChange={(e) => setDiscoverQueryFilterVal(e.target.value)}
                  className="flex-1 px-3 py-1 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleRunDiscover}
                disabled={discoverLoading}
                className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-60"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {discoverLoading ? "Executing DiscoverInstances..." : "Execute DiscoverInstances API"}
              </button>
            </div>
          </div>

          {discoverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
              {discoverError}
            </div>
          )}

          {discoverResult && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-[#16191f]">
                  Discovery Results ({discoverResult.instances?.length || 0} instance(s) matched)
                </h3>
                {discoverResult.instancesRevision !== undefined && (
                  <span className="text-[12px] text-[#545b64] font-mono">
                    InstancesRevision: {discoverResult.instancesRevision}
                  </span>
                )}
              </div>

              {discoverResult.instances && discoverResult.instances.length > 0 ? (
                <div className="border border-[#d5dbdb] rounded overflow-hidden">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                        <th className="py-2.5 px-4">Instance ID</th>
                        <th className="py-2.5 px-4">Health Status</th>
                        <th className="py-2.5 px-4">Attributes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {discoverResult.instances.map((i: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[#f9fafb]">
                          <td className="py-2.5 px-4 font-mono font-medium text-[#16191f]">
                            {i.InstanceId}
                          </td>
                          <td className="py-2.5 px-4">
                            {renderHealthBadge(i.HealthStatus)}
                          </td>
                          <td className="py-2.5 px-4">
                            <pre className="text-[11px] font-mono bg-gray-50 p-1.5 rounded max-w-md overflow-x-auto">
                              {JSON.stringify(i.Attributes, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 border border-[#d5dbdb] rounded text-center text-[#545b64] text-[13px]">
                  No healthy instances matched the discovery criteria.
                </div>
              )}

              <div>
                <span className="text-[12px] font-bold text-[#545b64] block mb-1">Raw API Response</span>
                <pre className="p-3 bg-[#1e1e1e] text-[#d4d4d4] rounded text-[12px] font-mono overflow-x-auto max-h-64">
                  {JSON.stringify(discoverResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Register Instance Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Register instance</h2>
            <p className="text-[13px] text-[#545b64]">
              Register an instance with service <strong>{service.Name}</strong>. Specify network endpoints and custom discovery attributes.
            </p>

            <form onSubmit={handleRegisterInstance} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Instance ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. i-0123456789abcdef0 or pod-auth-1"
                  value={newInstanceId}
                  onChange={(e) => setNewInstanceId(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                    IPv4 address <span className="text-[11px] font-normal text-[#545b64]">- optional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="10.0.1.50"
                    value={newIpv4}
                    onChange={(e) => setNewIpv4(e.target.value)}
                    className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                    Port <span className="text-[11px] font-normal text-[#545b64]">- optional</span>
                  </label>
                  <input
                    type="number"
                    placeholder="8080"
                    value={newPort}
                    onChange={(e) => setNewPort(e.target.value)}
                    className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13px] font-bold text-[#16191f]">
                    Custom attributes <span className="text-[11px] font-normal text-[#545b64]">- optional</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewCustomAttrs([...newCustomAttrs, { key: "", value: "" }])}
                    className="text-[12px] text-[#0073bb] hover:underline"
                  >
                    + Add attribute
                  </button>
                </div>
                {newCustomAttrs.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Key (e.g. version)"
                      value={attr.key}
                      onChange={(e) => {
                        const copy = [...newCustomAttrs];
                        copy[idx].key = e.target.value;
                        setNewCustomAttrs(copy);
                      }}
                      className="flex-1 px-3 py-1 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 1.0.0)"
                      value={attr.value}
                      onChange={(e) => {
                        const copy = [...newCustomAttrs];
                        copy[idx].value = e.target.value;
                        setNewCustomAttrs(copy);
                      }}
                      className="flex-1 px-3 py-1 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setNewCustomAttrs(newCustomAttrs.filter((_, i) => i !== idx))}
                      className="text-[12px] text-red-600 hover:underline px-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {registerError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-[12px] text-red-700">
                  {registerError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  disabled={registerLoading}
                  className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-60"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {registerLoading ? "Registering..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deregister Instance Modal */}
      {isDeregisterModalOpen && selectedInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Deregister instance</h2>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to deregister instance{" "}
              <strong className="text-[#16191f] font-mono">{selectedInstance.Id}</strong> from service{" "}
              <strong className="text-[#16191f]">{service.Name}</strong>?
            </p>

            {deregisterError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-[12px] text-red-700">
                {deregisterError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setIsDeregisterModalOpen(false)}
                disabled={deregisterLoading}
                className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeregisterInstance}
                disabled={deregisterLoading}
                className="px-4 py-1.5 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deregisterLoading ? "Deregistering..." : "Deregister"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Service Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Delete service</h2>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete service{" "}
              <strong className="text-[#16191f]">{service.Name}</strong> (
              <span className="font-mono text-[12px]">{service.Id}</span>)?
            </p>

            {instances.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[12px] text-amber-800">
                <strong>Warning:</strong> This service contains {instances.length} registered instance(s).
                AWS Cloud Map requires all instances to be deregistered before the service can be deleted.
              </div>
            )}

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

            {deleteError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-[12px] text-red-700">
                {deleteError}
              </div>
            )}

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
                onClick={handleDeleteService}
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
