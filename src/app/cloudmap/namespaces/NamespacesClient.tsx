"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NamespaceItem, listNamespacesAction, deleteNamespaceAction } from "../actions";

interface Props {
  initialNamespaces: NamespaceItem[];
  initialError?: string;
}

export default function NamespacesClient({ initialNamespaces, initialError }: Props) {
  const router = useRouter();
  const [namespaces, setNamespaces] = useState<NamespaceItem[]>(initialNamespaces);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refreshNamespaces = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await listNamespacesAction();
      if (res.success) {
        setNamespaces(res.namespaces);
        if (selectedId && !res.namespaces.find((n) => n.Id === selectedId)) {
          setSelectedId(null);
        }
      } else {
        setErrorMessage(res.error || "Failed to load namespaces.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const selectedNamespace = namespaces.find((n) => n.Id === selectedId);

  const filtered = namespaces.filter((n) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (n.Name && n.Name.toLowerCase().includes(term)) ||
      (n.Id && n.Id.toLowerCase().includes(term)) ||
      (n.Description && n.Description.toLowerCase().includes(term));
    const matchesType = typeFilter === "ALL" || n.Type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async () => {
    if (!selectedNamespace) return;
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteError('Please type "delete" to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await deleteNamespaceAction(selectedNamespace.Id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
        setSelectedId(null);
        await refreshNamespaces();
        router.refresh();
      } else {
        setDeleteError(res.error || "Failed to delete namespace.");
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleteLoading(false);
    }
  };

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
        <span className="text-[#16191f] font-medium">Namespaces</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#16191f]">Namespaces</h1>
            <span className="text-[14px] text-[#545b64] font-medium">({namespaces.length})</span>
          </div>
          <p className="text-[14px] text-[#545b64] mt-1">
            A namespace specifies the domain name for your service instances. You can create HTTP, private DNS, or public DNS namespaces.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/cloudmap/namespaces/create"
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create namespace
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
              placeholder="Filter namespaces by name, ID, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded bg-white text-[#16191f] focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          >
            <option value="ALL">All types</option>
            <option value="HTTP">HTTP</option>
            <option value="DNS_PRIVATE">Private DNS</option>
            <option value="DNS_PUBLIC">Public DNS</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshNamespaces}
            disabled={loading}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href={selectedNamespace ? `/cloudmap/namespaces/${selectedNamespace.Id}` : "#"}
            className={`px-3 py-1.5 text-[13px] font-medium rounded border transition-colors inline-flex items-center justify-center ${
              selectedNamespace
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
            disabled={!selectedNamespace}
            className={`px-3 py-1.5 text-[13px] font-medium rounded border transition-colors ${
              selectedNamespace
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
              <th className="py-2.5 px-4">Namespace name</th>
              <th className="py-2.5 px-4">Namespace ID</th>
              <th className="py-2.5 px-4">Type</th>
              <th className="py-2.5 px-4">Hosted zone ID</th>
              <th className="py-2.5 px-4 text-center">Services</th>
              <th className="py-2.5 px-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#545b64]">
                  {search || typeFilter !== "ALL"
                    ? "No namespaces match your filter criteria."
                    : "No namespaces found. Create a namespace to begin discovering services."}
                </td>
              </tr>
            ) : (
              filtered.map((ns) => {
                const isSelected = selectedId === ns.Id;
                return (
                  <tr
                    key={ns.Id}
                    onClick={() => setSelectedId(ns.Id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f1faff]" : "hover:bg-[#f9fafb]"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedId(ns.Id)}
                        className="accent-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      <Link
                        href={`/cloudmap/namespaces/${ns.Id}`}
                        className="text-[#0073bb] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ns.Name}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">{ns.Id}</td>
                    <td className="py-2.5 px-4">{renderTypeBadge(ns.Type)}</td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                      {ns.HostedZoneId || "-"}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#f2f3f3] text-[#16191f] text-[12px] font-semibold">
                        {ns.ServiceCount || 0}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#545b64] max-w-xs truncate">
                      {ns.Description || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedNamespace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Delete namespace</h2>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete namespace{" "}
              <strong className="text-[#16191f]">{selectedNamespace.Name}</strong> (
              <span className="font-mono text-[12px]">{selectedNamespace.Id}</span>)?
            </p>

            {selectedNamespace.ServiceCount && selectedNamespace.ServiceCount > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[12px] text-amber-800">
                <strong>Warning:</strong> This namespace contains {selectedNamespace.ServiceCount} service(s).
                AWS Cloud Map requires all services inside the namespace to be deleted before the namespace can be deleted.
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
