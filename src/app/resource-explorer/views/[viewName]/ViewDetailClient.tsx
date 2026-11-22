"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ViewItem,
  updateViewAction,
  deleteViewAction,
  associateDefaultViewAction,
  disassociateDefaultViewAction,
} from "../../actions";

interface Props {
  view: ViewItem;
}

export default function ViewDetailClient({ view: initialView }: Props) {
  const router = useRouter();

  const [view, setView] = useState<ViewItem>(initialView);
  const [isEditing, setIsEditing] = useState(false);
  const [filterString, setFilterString] = useState(view.Filters?.FilterString || "");
  const [includeTags, setIncludeTags] = useState(
    view.IncludedProperties?.includes("tags") || false
  );

  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSetDefault = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await associateDefaultViewAction(view.ViewArn);
      if (res.success) {
        setView({ ...view, IsDefault: true });
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to set as default view.");
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
        setView({ ...view, IsDefault: false });
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

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await updateViewAction({
        viewArn: view.ViewArn,
        filterString: filterString.trim(),
        includeTags,
      });

      if (res.success) {
        setView({
          ...view,
          Filters: { FilterString: filterString.trim() || undefined },
          IncludedProperties: includeTags ? ["tags"] : [],
          LastUpdatedAt: new Date().toISOString(),
        });
        setIsEditing(false);
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to update view.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteError('Please type "delete" to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await deleteViewAction(view.ViewArn);
      if (res.success) {
        router.push("/resource-explorer/views");
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/resource-explorer" className="hover:underline">
          AWS Resource Explorer
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <Link href="/resource-explorer/views" className="hover:underline">
          Views
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">{view.ViewName || view.ViewArn}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#16191f]">
              {view.ViewName || view.ViewArn.split("/").pop()}
            </h1>
            {view.IsDefault && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Default
              </span>
            )}
          </div>
          <p className="text-[12px] font-mono text-[#545b64] mt-1 break-all">{view.ViewArn}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/resource-explorer?view=${encodeURIComponent(view.ViewArn)}`}
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Search with this view
          </Link>

          {!view.IsDefault ? (
            <button
              onClick={handleSetDefault}
              disabled={actionLoading}
              className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Set as default view
            </button>
          ) : (
            <button
              onClick={handleRemoveDefault}
              disabled={actionLoading}
              className="px-3 py-1.5 text-[13px] font-medium text-[#545b64] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Remove default
            </button>
          )}

          <button
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setIsDeleteModalOpen(true);
            }}
            className="px-3 py-1.5 text-[13px] font-medium text-red-600 border border-[#d5dbdb] rounded hover:bg-red-50 transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete view
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
          {errorMessage}
        </div>
      )}

      {/* View Details Card */}
      <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
          <h2 className="text-[16px] font-bold text-[#16191f]">View overview</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-[12px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Edit view filters
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
            <div>
              <span className="text-[12px] font-medium text-[#545b64] block">View name</span>
              <span className="text-[#16191f] font-semibold">{view.ViewName || "-"}</span>
            </div>
            <div>
              <span className="text-[12px] font-medium text-[#545b64] block">Default view</span>
              <span className="text-[#16191f]">{view.IsDefault ? "Yes" : "No"}</span>
            </div>
            <div>
              <span className="text-[12px] font-medium text-[#545b64] block">Scope</span>
              <span className="font-mono text-[12px] text-[#545b64]">{view.Scope || "-"}</span>
            </div>
            <div>
              <span className="text-[12px] font-medium text-[#545b64] block">Included optional properties</span>
              <span className="text-[#16191f]">
                {view.IncludedProperties && view.IncludedProperties.length > 0
                  ? view.IncludedProperties.join(", ")
                  : "None"}
              </span>
            </div>
            <div>
              <span className="text-[12px] font-medium text-[#545b64] block">Filter query expression</span>
              <span className="font-mono text-[12px] text-[#16191f]">
                {view.Filters?.FilterString || "All resources"}
              </span>
            </div>
            <div>
              <span className="text-[12px] font-medium text-[#545b64] block">Last modified</span>
              <span className="text-[#16191f]">
                {view.LastUpdatedAt ? new Date(view.LastUpdatedAt).toLocaleString() : "-"}
              </span>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <span className="text-[12px] font-medium text-[#545b64] block">View ARN</span>
              <span className="font-mono text-[12px] text-[#545b64] break-all">{view.ViewArn}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveUpdate} className="space-y-4 pt-2">
            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Filter query expression
              </label>
              <input
                type="text"
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
                placeholder="Leave blank for All resources, or enter query (e.g. service:s3)"
                className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={includeTags}
                onChange={(e) => setIncludeTags(e.target.checked)}
                className="mt-1 accent-[#ec7211]"
              />
              <div>
                <span className="text-[13px] font-medium text-[#16191f]">
                  Include tags in search results
                </span>
                <p className="text-[12px] text-[#545b64]">
                  Tags are indexed and returned when searching using this view.
                </p>
              </div>
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFilterString(view.Filters?.FilterString || "");
                  setIncludeTags(view.IncludedProperties?.includes("tags") || false);
                  setIsEditing(false);
                }}
                disabled={saving}
                className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-60"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Delete View Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Delete view</h2>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete view{" "}
              <strong className="text-[#16191f]">{view.ViewName || view.ViewArn}</strong>?
            </p>

            {view.IsDefault && (
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
