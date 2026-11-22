"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ServiceItem,
  NamespaceItem,
  listServicesAction,
  deleteServiceAction,
} from "../actions";

interface Props {
  initialServices: ServiceItem[];
  namespaces: NamespaceItem[];
  initialError?: string;
}

export default function ServicesClient({
  initialServices,
  namespaces,
  initialError,
}: Props) {
  const router = useRouter();
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [namespaceFilter, setNamespaceFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refreshServices = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await listServicesAction();
      if (res.success) {
        setServices(res.services);
        if (selectedId && !res.services.find((s) => s.Id === selectedId)) {
          setSelectedId(null);
        }
      } else {
        setErrorMessage(res.error || "Failed to load services.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find((s) => s.Id === selectedId);

  const filtered = services.filter((s) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (s.Name && s.Name.toLowerCase().includes(term)) ||
      (s.Id && s.Id.toLowerCase().includes(term)) ||
      (s.NamespaceName && s.NamespaceName.toLowerCase().includes(term)) ||
      (s.Description && s.Description.toLowerCase().includes(term));
    const matchesNs =
      namespaceFilter === "ALL" || s.NamespaceId === namespaceFilter;
    return matchesSearch && matchesNs;
  });

  const handleDelete = async () => {
    if (!selectedService) return;
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteError('Please type "delete" to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await deleteServiceAction(selectedService.Id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
        setSelectedId(null);
        await refreshServices();
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/cloudmap" className="hover:underline">
          AWS Cloud Map
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Services</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#16191f]">Services</h1>
            <span className="text-[14px] text-[#545b64] font-medium">({services.length})</span>
          </div>
          <p className="text-[14px] text-[#545b64] mt-1">
            A service acts as a registry for the instances of your application. You can define how instances are registered and discovered.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/cloudmap/services/create"
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create service
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Table Toolbar */}
      <div className="bg-white border border-[#d5dbdb] rounded-t p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Filter services by name, ID, or namespace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
          </div>
          <select
            value={namespaceFilter}
            onChange={(e) => setNamespaceFilter(e.target.value)}
            className="px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded bg-white text-[#16191f] focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          >
            <option value="ALL">All namespaces</option>
            {namespaces.map((ns) => (
              <option key={ns.Id} value={ns.Id}>
                {ns.Name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshServices}
            disabled={loading}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
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
              setDeleteConfirmText("");
              setDeleteError(null);
              setIsDeleteModalOpen(true);
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-x border-b border-[#d5dbdb] rounded-b overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
              <th className="py-2.5 px-3 w-10 text-center"></th>
              <th className="py-2.5 px-4">Service name</th>
              <th className="py-2.5 px-4">Service ID</th>
              <th className="py-2.5 px-4">Namespace</th>
              <th className="py-2.5 px-4 text-center">Instances</th>
              <th className="py-2.5 px-4">Routing policy</th>
              <th className="py-2.5 px-4">DNS records</th>
              <th className="py-2.5 px-4">Health check</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#545b64]">
                  {search || namespaceFilter !== "ALL"
                    ? "No services match your filter criteria."
                    : "No services found. Click 'Create service' to register your first service."}
                </td>
              </tr>
            ) : (
              filtered.map((srv) => {
                const isSelected = selectedId === srv.Id;
                return (
                  <tr
                    key={srv.Id}
                    onClick={() => setSelectedId(srv.Id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f1faff]" : "hover:bg-[#f9fafb]"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedId(srv.Id)}
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
                    <td className="py-2.5 px-4">
                      {srv.NamespaceId ? (
                        <Link
                          href={`/cloudmap/namespaces/${srv.NamespaceId}`}
                          className="text-[#0073bb] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {srv.NamespaceName || srv.NamespaceId}
                        </Link>
                      ) : (
                        <span className="text-[#545b64]">-</span>
                      )}
                    </td>
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
                    <td className="py-2.5 px-4 text-[#545b64]">
                      {srv.HealthCheckCustomConfig ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Custom
                        </span>
                      ) : (
                        <span className="text-[#545b64] text-[12px]">None</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedService && (
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
                onClick={handleDelete}
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
