"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteApplicationAction } from "../actions";

interface ApplicationItem {
  id: string;
  name: string;
  description: string;
}

interface ApplicationsClientProps {
  initialApplications: ApplicationItem[];
}

export default function ApplicationsClient({ initialApplications }: ApplicationsClientProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationItem[]>(initialApplications);
  const [search, setSearch] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = applications.filter((app) => {
    const q = search.toLowerCase();
    return app.name.toLowerCase().includes(q) || app.id.toLowerCase().includes(q);
  });

  const selectedApp = applications.find((a) => a.id === selectedAppId);

  const handleDelete = async () => {
    if (!selectedAppId) return;
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteError('Please type "delete" to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    const res = await deleteApplicationAction(selectedAppId);
    setDeleteLoading(false);

    if (res.success) {
      setApplications((prev) => prev.filter((a) => a.id !== selectedAppId));
      setSelectedAppId(null);
      setIsDeleteModalOpen(false);
      setDeleteConfirmText("");
      router.refresh();
    } else {
      setDeleteError(res.error || "Failed to delete application.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Applications</h1>
          <p className="text-[13px] text-[#545b64]">
            An AWS AppConfig application is a logical unit of code that provides capabilities for your customers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={selectedAppId ? `/appconfig/applications/${selectedAppId}` : "#"}
            aria-disabled={!selectedAppId}
            className={`px-3 text-[13px] font-medium border rounded flex items-center justify-center transition-colors ${
              selectedAppId
                ? "text-[#16191f] bg-white border-[#aab7b8] hover:bg-[#fafafa]"
                : "text-[#879596] bg-[#f2f3f3] border-[#eaeded] pointer-events-none opacity-60"
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
            disabled={!selectedAppId}
            className="px-3 text-[13px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2] disabled:opacity-40 transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
          <Link
            href="/appconfig/applications/create"
            className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create application
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">
            Total applications
          </div>
          <div className="text-[28px] font-light text-[#16191f] mt-1">{applications.length}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">
            Service status
          </div>
          <div className="text-[14px] font-medium text-[#1d8102] mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1d8102]" />
            Operating normally
          </div>
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-xs">
        <div className="p-4 border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Find applications"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] bg-white text-[#16191f]"
            />
            <svg
              className="w-4 h-4 text-[#545b64] absolute left-2.5 top-2.5 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="text-[13px] text-[#545b64]">
            {filtered.length} of {applications.length} applications
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-[14px] font-semibold text-[#16191f]">No applications</div>
            <p className="text-[13px] text-[#545b64] mt-1 max-w-md mx-auto">
              No applications match your search criteria. Create an application to get started with AWS AppConfig.
            </p>
            <Link
              href="/appconfig/applications/create"
              className="mt-4 inline-flex items-center px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Create application
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-10"></th>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Application ID</th>
                  <th className="py-2.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {filtered.map((app) => {
                  const isSelected = selectedAppId === app.id;
                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedAppId(isSelected ? null : app.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <input
                          type="radio"
                          name="selected-app"
                          checked={isSelected}
                          onChange={() => setSelectedAppId(app.id)}
                          className="h-3.5 w-3.5 text-[#0073bb] border-[#aab7b8] focus:ring-0"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-medium">
                        <Link
                          href={`/appconfig/applications/${app.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#0073bb] hover:underline"
                        >
                          {app.name}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">{app.id}</td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {app.description || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#eaeded] shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#eaeded]">
              <h3 className="text-[16px] font-bold text-[#16191f]">Delete application</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                ✕
              </button>
            </div>
            <p className="text-[13px] text-[#16191f]">
              Are you sure you want to delete application{" "}
              <strong className="text-[#16191f]">{selectedApp.name}</strong> ({selectedApp.id})? This will
              permanently remove all configuration profiles and environments associated with this application.
            </p>
            {deleteError && (
              <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
                {deleteError}
              </div>
            )}
            <div>
              <label className="block text-[12px] font-medium text-[#545b64] mb-1">
                To confirm deletion, type <code className="text-[#d13212] font-mono">delete</code>:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading || deleteConfirmText.toLowerCase() !== "delete"}
                className="px-4 text-[13px] font-semibold text-white bg-[#d13212] hover:bg-[#b02a0f] rounded disabled:opacity-40"
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
