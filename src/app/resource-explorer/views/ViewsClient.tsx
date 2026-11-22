"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ViewItem,
  listViewsAction,
  deleteViewAction,
  associateDefaultViewAction,
  disassociateDefaultViewAction,
} from "../actions";

interface Props {
  initialViews: ViewItem[];
  defaultViewArn?: string;
  initialError?: string;
}

export default function ViewsClient({
  initialViews,
  defaultViewArn: initialDefaultArn,
  initialError,
}: Props) {
  const router = useRouter();

  const [views, setViews] = useState<ViewItem[]>(initialViews);
  const [defaultArn, setDefaultArn] = useState<string | undefined>(initialDefaultArn);
  const [selectedArn, setSelectedArn] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectedView = views.find((v) => v.ViewArn === selectedArn);

  const refreshViews = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await listViewsAction();
      if (res.success) {
        setViews(res.views);
        setDefaultArn(res.defaultViewArn);
        if (selectedArn && !res.views.find((v) => v.ViewArn === selectedArn)) {
          setSelectedArn(null);
        }
      } else {
        setErrorMessage(res.error || "Failed to load views.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async () => {
    if (!selectedView) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await associateDefaultViewAction(selectedView.ViewArn);
      if (res.success) {
        setDefaultArn(selectedView.ViewArn);
        await refreshViews();
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to associate default view.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveDefault = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await disassociateDefaultViewAction();
      if (res.success) {
        setDefaultArn(undefined);
        await refreshViews();
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to remove default view.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedView) return;
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteError('Please type "delete" to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await deleteViewAction(selectedView.ViewArn);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
        setSelectedArn(null);
        await refreshViews();
        router.refresh();
      } else {
        setDeleteError(res.error || "Failed to delete view.");
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = views.filter((v) => {
    const term = search.toLowerCase();
    const nameMatch = v.ViewName?.toLowerCase().includes(term);
    const arnMatch = v.ViewArn.toLowerCase().includes(term);
    const filterMatch = v.Filters?.FilterString?.toLowerCase().includes(term);
    return nameMatch || arnMatch || filterMatch;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/resource-explorer" className="hover:underline">
          AWS Resource Explorer
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Views</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#16191f]">Views</h1>
            <span className="text-[14px] text-[#545b64] font-medium">({views.length})</span>
          </div>
          <p className="text-[14px] text-[#545b64] mt-1">
            A view defines the subset of your AWS resources that are searchable and the optional resource attributes included in search results.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/resource-explorer/views/create"
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create view
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
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Filter views by name, ARN, or filter query..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refreshViews}
            disabled={loading}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={handleSetDefault}
            disabled={!selectedView || selectedView.IsDefault || actionLoading}
            className={`px-3 py-1.5 text-[13px] font-medium rounded border transition-colors ${
              selectedView && !selectedView.IsDefault && !actionLoading
                ? "text-[#16191f] border-[#d5dbdb] hover:bg-[#fafafa]"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Set as default view
          </button>

          {selectedView?.IsDefault && (
            <button
              onClick={handleRemoveDefault}
              disabled={actionLoading}
              className="px-3 py-1.5 text-[13px] font-medium text-[#545b64] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Remove default
            </button>
          )}

          <Link
            href={
              selectedView
                ? `/resource-explorer/views/${encodeURIComponent(selectedView.ViewName || selectedView.ViewArn.split("/").pop() || "")}?arn=${encodeURIComponent(selectedView.ViewArn)}`
                : "#"
            }
            className={`px-3 py-1.5 text-[13px] font-medium rounded border transition-colors inline-flex items-center justify-center ${
              selectedView
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
            disabled={!selectedView}
            className={`px-3 py-1.5 text-[13px] font-medium rounded border transition-colors ${
              selectedView
                ? "text-red-600 border-[#d5dbdb] hover:bg-red-50"
                : "text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Views Table */}
      <div className="bg-white border-x border-b border-[#d5dbdb] rounded-b overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
              <th className="py-2.5 px-3 w-10 text-center"></th>
              <th className="py-2.5 px-4">View name</th>
              <th className="py-2.5 px-4">Default status</th>
              <th className="py-2.5 px-4">Scope</th>
              <th className="py-2.5 px-4">Included properties</th>
              <th className="py-2.5 px-4">Filter query</th>
              <th className="py-2.5 px-4">Last modified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#545b64]">
                  {search
                    ? "No views match your filter criteria."
                    : "No views found. Click 'Create view' to create a custom resource view."}
                </td>
              </tr>
            ) : (
              filtered.map((v) => {
                const isSelected = selectedArn === v.ViewArn;
                const viewParam = encodeURIComponent(v.ViewName || v.ViewArn.split("/").pop() || "");

                return (
                  <tr
                    key={v.ViewArn}
                    onClick={() => setSelectedArn(v.ViewArn)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f1faff]" : "hover:bg-[#f9fafb]"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedArn(v.ViewArn)}
                        className="accent-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      <Link
                        href={`/resource-explorer/views/${viewParam}?arn=${encodeURIComponent(v.ViewArn)}`}
                        className="text-[#0073bb] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {v.ViewName || v.ViewArn.split("/").pop()}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4">
                      {v.IsDefault ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Default
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#545b64]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[#545b64] max-w-xs truncate" title={v.Scope}>
                      {v.Scope || "-"}
                    </td>
                    <td className="py-2.5 px-4 text-[#545b64]">
                      {v.IncludedProperties && v.IncludedProperties.length > 0 ? (
                        v.IncludedProperties.map((p, i) => (
                          <span
                            key={i}
                            className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[#16191f] text-[11px] mr-1"
                          >
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-[12px] text-[#879596]">None</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-[#16191f] max-w-xs truncate">
                      {v.Filters?.FilterString || (
                        <span className="text-[#879596] font-sans">All resources</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[#545b64] text-[12px]">
                      {v.LastUpdatedAt ? new Date(v.LastUpdatedAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete View Modal */}
      {isDeleteModalOpen && selectedView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Delete view</h2>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete view{" "}
              <strong className="text-[#16191f]">{selectedView.ViewName || selectedView.ViewArn}</strong>?
            </p>

            {selectedView.IsDefault && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[12px] text-amber-800">
                <strong>Notice:</strong> This is currently the default view for this Region. Deleting it will clear the default view association until a new one is designated.
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
