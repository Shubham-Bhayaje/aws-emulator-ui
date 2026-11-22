"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  NamespaceItem,
  ServiceItem,
  listServicesAction,
  deleteNamespaceAction,
  deleteServiceAction,
} from "../../actions";

interface Props {
  namespace: NamespaceItem;
  initialServices: ServiceItem[];
}

export default function NamespaceDetailClient({
  namespace: initialNs,
  initialServices,
}: Props) {
  const router = useRouter();

  const [namespace] = useState<NamespaceItem>(initialNs);
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loadingServices, setLoadingServices] = useState(false);

  // Delete Namespace Modal
  const [isDeleteNsModalOpen, setIsDeleteNsModalOpen] = useState(false);
  const [deleteNsConfirm, setDeleteNsConfirm] = useState("");
  const [deleteNsLoading, setDeleteNsLoading] = useState(false);
  const [deleteNsError, setDeleteNsError] = useState<string | null>(null);

  // Delete Service Modal
  const [isDeleteSrvModalOpen, setIsDeleteSrvModalOpen] = useState(false);
  const [deleteSrvConfirm, setDeleteSrvConfirm] = useState("");
  const [deleteSrvLoading, setDeleteSrvLoading] = useState(false);
  const [deleteSrvError, setDeleteSrvError] = useState<string | null>(null);

  const selectedService = services.find((s) => s.Id === selectedServiceId);

  const refreshServices = async () => {
    setLoadingServices(true);
    try {
      const res = await listServicesAction();
      if (res.success) {
        const filtered = (res.services || []).filter(
          (s) => s.NamespaceId === namespace.Id
        );
        setServices(filtered);
        if (selectedServiceId && !filtered.find((s) => s.Id === selectedServiceId)) {
          setSelectedServiceId(null);
        }
      }
    } finally {
      setLoadingServices(false);
    }
  };

  const handleDeleteNamespace = async () => {
    if (deleteNsConfirm.toLowerCase() !== "delete") {
      setDeleteNsError('Please type "delete" to confirm.');
      return;
    }

    setDeleteNsLoading(true);
    setDeleteNsError(null);
    try {
      const res = await deleteNamespaceAction(namespace.Id);
      if (res.success) {
        router.push("/cloudmap/namespaces");
        router.refresh();
      } else {
        setDeleteNsError(res.error || "Failed to delete namespace.");
      }
    } catch (err: unknown) {
      setDeleteNsError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleteNsLoading(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;
    if (deleteSrvConfirm.toLowerCase() !== "delete") {
      setDeleteSrvError('Please type "delete" to confirm.');
      return;
    }

    setDeleteSrvLoading(true);
    setDeleteSrvError(null);
    try {
      const res = await deleteServiceAction(selectedService.Id);
      if (res.success) {
        setIsDeleteSrvModalOpen(false);
        setDeleteSrvConfirm("");
        setSelectedServiceId(null);
        await refreshServices();
      } else {
        setDeleteSrvError(res.error || "Failed to delete service.");
      }
    } catch (err: unknown) {
      setDeleteSrvError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleteSrvLoading(false);
    }
  };

  const filteredServices = services.filter((s) => {
    const term = search.toLowerCase();
    return (
      (s.Name && s.Name.toLowerCase().includes(term)) ||
      (s.Id && s.Id.toLowerCase().includes(term)) ||
      (s.Description && s.Description.toLowerCase().includes(term))
    );
  });

  const renderTypeBadge = (type?: string) => {
    if (type === "HTTP") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          HTTP
        </span>
      );
    }
    if (type === "DNS_PRIVATE") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
          Private DNS
        </span>
      );
    }
    if (type === "DNS_PUBLIC") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
          Public DNS
        </span>
      );
    }
    return <span className="text-[12px] text-[#545b64]">-</span>;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/cloudmap" className="hover:underline">
          AWS Cloud Map
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <Link href="/cloudmap/namespaces" className="hover:underline">
          Namespaces
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">{namespace.Name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#16191f]">{namespace.Name}</h1>
            {renderTypeBadge(namespace.Type)}
          </div>
          <p className="text-[12px] font-mono text-[#545b64] mt-1">{namespace.Id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDeleteNsConfirm("");
              setDeleteNsError(null);
              setIsDeleteNsModalOpen(true);
            }}
            className="px-3 py-1.5 text-[13px] font-medium text-red-600 border border-[#d5dbdb] rounded hover:bg-red-50 transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete namespace
          </button>
          <Link
            href={`/cloudmap/services/create?namespaceId=${namespace.Id}`}
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create service
          </Link>
        </div>
      </div>

      {/* Route 53 Managed Integration Banner */}
      {namespace.Type !== "HTTP" && namespace.HostedZoneId && (
        <div className="p-4 bg-[#f8f9fa] border-l-4 border-[#0073bb] rounded-r text-[13px] text-[#16191f] shadow-sm flex items-start justify-between">
          <div>
            <span className="font-semibold text-[#16191f] block mb-0.5">Amazon Route 53 Hosted Zone</span>
            <span className="text-[#545b64]">
              AWS Cloud Map automatically provisions and synchronizes DNS records in Route 53 hosted zone{" "}
              <strong className="font-mono text-[#16191f]">{namespace.HostedZoneId}</strong> for this namespace.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-medium ml-4">
            Managed Route 53
          </span>
        </div>
      )}

      {/* Namespace Details Panel */}
      <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm">
        <h2 className="text-[16px] font-bold text-[#16191f] mb-4">Namespace details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Namespace name</span>
            <span className="text-[#16191f] font-semibold">{namespace.Name}</span>
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Namespace ID</span>
            <span className="font-mono text-[#16191f]">{namespace.Id}</span>
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Instance discovery type</span>
            <span className="text-[#16191f]">
              {namespace.Type === "HTTP"
                ? "API calls (HTTP)"
                : namespace.Type === "DNS_PRIVATE"
                ? "API calls and DNS queries in VPCs (Private DNS)"
                : "API calls and public DNS queries (Public DNS)"}
            </span>
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Hosted zone ID</span>
            <span className="font-mono text-[#16191f]">{namespace.HostedZoneId || "-"}</span>
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Services count</span>
            <span className="text-[#16191f] font-semibold">{services.length}</span>
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#545b64] block">Description</span>
            <span className="text-[#16191f]">{namespace.Description || "-"}</span>
          </div>
          {namespace.Arn && (
            <div className="md:col-span-2 lg:col-span-3">
              <span className="text-[12px] font-medium text-[#545b64] block">ARN</span>
              <span className="font-mono text-[12px] text-[#545b64] break-all">{namespace.Arn}</span>
            </div>
          )}
        </div>
      </div>

      {/* Services in Namespace */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#16191f]">Services ({services.length})</h2>
        </div>

        {/* Services Table Toolbar */}
        <div className="bg-white border border-[#d5dbdb] rounded-t p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              placeholder="Filter services by name, ID, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshServices}
              disabled={loadingServices}
              className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              {loadingServices ? "Refreshing..." : "Refresh"}
            </button>
            <Link
              href={selectedService ? `/cloudmap/services/${selectedService.Id}` : "#"}
              className={`px-3 py-1.5 text-[13px] font-medium rounded border transition-colors inline-flex items-center justify-center ${
                selectedService
                  ? "text-[#16191f] border-[#d5dbdb] hover:bg-[#fafafa]"
                  : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed pointer-events-none"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              View details
            </Link>
            <button
              onClick={() => {
                setDeleteSrvConfirm("");
                setDeleteSrvError(null);
                setIsDeleteSrvModalOpen(true);
              }}
              disabled={!selectedService}
              className={`px-3 py-1.5 text-[13px] font-medium rounded border transition-colors ${
                selectedService
                  ? "text-red-600 border-[#d5dbdb] hover:bg-red-50"
                  : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Delete
            </button>
            <Link
              href={`/cloudmap/services/create?namespaceId=${namespace.Id}`}
              className="px-3 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Create service
            </Link>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white border-x border-b border-[#d5dbdb] rounded-b overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-4">Service name</th>
                <th className="py-2.5 px-4">Service ID</th>
                <th className="py-2.5 px-4 text-center">Instances</th>
                <th className="py-2.5 px-4">Routing policy</th>
                <th className="py-2.5 px-4">DNS records</th>
                <th className="py-2.5 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#545b64]">
                    {search
                      ? "No services match your search."
                      : "No services created in this namespace yet. Click 'Create service' to create one."}
                  </td>
                </tr>
              ) : (
                filteredServices.map((srv) => {
                  const isSelected = selectedServiceId === srv.Id;
                  return (
                    <tr
                      key={srv.Id}
                      onClick={() => setSelectedServiceId(srv.Id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f1faff]" : "hover:bg-[#f9fafb]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => setSelectedServiceId(srv.Id)}
                          className="accent-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-medium">
                        <Link
                          href={`/cloudmap/services/${srv.Id}`}
                          className="text-[#0073bb] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {srv.Name}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">{srv.Id}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-[#f2f3f3] text-[#16191f] text-[12px] font-semibold">
                          {srv.InstanceCount || 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {srv.RoutingPolicy || "None"}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {srv.DnsRecords && srv.DnsRecords.length > 0
                          ? srv.DnsRecords.map((r, i) => (
                              <span key={i} className="inline-block mr-2 font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
                                {r.Type} ({r.TTL}s)
                              </span>
                            ))
                          : "-"}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64] max-w-xs truncate">
                        {srv.Description || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Namespace Modal */}
      {isDeleteNsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Delete namespace</h2>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete namespace{" "}
              <strong className="text-[#16191f]">{namespace.Name}</strong>?
            </p>

            {services.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[12px] text-amber-800">
                <strong>Warning:</strong> This namespace contains {services.length} service(s).
                AWS Cloud Map requires all services inside the namespace to be deleted before the namespace can be deleted.
              </div>
            )}

            <p className="text-[13px] text-[#545b64]">
              To confirm deletion, type <strong className="text-[#16191f]">delete</strong> below:
            </p>

            <input
              type="text"
              value={deleteNsConfirm}
              onChange={(e) => setDeleteNsConfirm(e.target.value)}
              placeholder="delete"
              className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-red-500"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />

            {deleteNsError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-[12px] text-red-700">
                {deleteNsError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setIsDeleteNsModalOpen(false)}
                disabled={deleteNsLoading}
                className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteNamespace}
                disabled={deleteNsLoading || deleteNsConfirm.toLowerCase() !== "delete"}
                className={`px-4 py-1.5 text-[13px] font-bold text-white rounded transition-colors ${
                  deleteNsConfirm.toLowerCase() === "delete" && !deleteNsLoading
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-300 cursor-not-allowed"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleteNsLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Service Modal */}
      {isDeleteSrvModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Delete service</h2>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete service{" "}
              <strong className="text-[#16191f]">{selectedService.Name}</strong> (
              <span className="font-mono text-[12px]">{selectedService.Id}</span>)?
            </p>

            {selectedService.InstanceCount && selectedService.InstanceCount > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[12px] text-amber-800">
                <strong>Warning:</strong> This service contains {selectedService.InstanceCount} registered instance(s).
                AWS Cloud Map requires all instances to be deregistered before the service can be deleted.
              </div>
            ) : null}

            <p className="text-[13px] text-[#545b64]">
              To confirm deletion, type <strong className="text-[#16191f]">delete</strong> below:
            </p>

            <input
              type="text"
              value={deleteSrvConfirm}
              onChange={(e) => setDeleteSrvConfirm(e.target.value)}
              placeholder="delete"
              className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-red-500"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />

            {deleteSrvError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-[12px] text-red-700">
                {deleteSrvError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setIsDeleteSrvModalOpen(false)}
                disabled={deleteSrvLoading}
                className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteService}
                disabled={deleteSrvLoading || deleteSrvConfirm.toLowerCase() !== "delete"}
                className={`px-4 py-1.5 text-[13px] font-bold text-white rounded transition-colors ${
                  deleteSrvConfirm.toLowerCase() === "delete" && !deleteSrvLoading
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-300 cursor-not-allowed"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleteSrvLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
