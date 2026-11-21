"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyspaceSummary } from "./types";
import { deleteKeyspaceAction } from "./actions";

interface KeyspacesClientProps {
  initialKeyspaces: KeyspaceSummary[];
  initialError?: string;
}

export default function KeyspacesClient({
  initialKeyspaces,
  initialError,
}: KeyspacesClientProps) {
  const router = useRouter();
  const [keyspaces, setKeyspaces] = useState<KeyspaceSummary[]>(initialKeyspaces);
  const [selectedKeyspace, setSelectedKeyspace] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "user" | "system">("all");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError || null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const filtered = keyspaces.filter((k) => {
    const matchesSearch = k.keyspaceName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === "user") return !k.isSystem;
    if (filterType === "system") return k.isSystem;
    return true;
  });

  const totalCount = keyspaces.length;
  const userCount = keyspaces.filter((k) => !k.isSystem).length;
  const systemCount = keyspaces.filter((k) => k.isSystem).length;

  const selectedItem = keyspaces.find((k) => k.keyspaceName === selectedKeyspace);
  const isSelectedSystem = selectedItem?.isSystem ?? false;

  function handleDelete() {
    if (!selectedKeyspace || deleteConfirmationText !== "delete") return;
    setError(null);
    startTransition(async () => {
      const res = await deleteKeyspaceAction(selectedKeyspace);
      if (res.success) {
        setKeyspaces(keyspaces.filter((k) => k.keyspaceName !== selectedKeyspace));
        setSuccessBanner(`Keyspace '${selectedKeyspace}' was successfully deleted.`);
        setSelectedKeyspace(null);
        setShowDeleteModal(false);
        setDeleteConfirmationText("");
      } else {
        setError(res.error || "Failed to delete keyspace.");
      }
    });
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-bold text-[#16191f]">Keyspaces</h1>
            <span className="text-[12px] font-semibold px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
              {totalCount}
            </span>
          </div>
          <p className="text-[14px] text-[#545b64] mt-0.5">
            A keyspace is a container for tables in Amazon Keyspaces (for Apache Cassandra).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/keyspaces/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            Create keyspace
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border-l-4 border-[#d13212] text-[13px] text-[#d13212] rounded flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">&times;</button>
        </div>
      )}
      {successBanner && (
        <div className="p-3 bg-[#edf7ed] border-l-4 border-[#1d8102] text-[13px] text-[#1d8102] rounded flex justify-between items-center">
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Total keyspaces
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {totalCount}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">All keyspaces in this Region</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            User keyspaces
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1 text-[#0073bb]">
            {userCount}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">Application data stores</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            System keyspaces
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1 text-[#545b64]">
            {systemCount}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">Cassandra system metadata</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Filter keyspaces by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full pl-8 pr-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
              />
              <svg
                className="absolute left-2.5 top-2.5 text-[#545b64] w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <div className="flex items-center rounded border border-[#eaeded] overflow-hidden text-[12px]">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className={`px-3 font-medium transition-colors ${
                  filterType === "all" ? "bg-[#f2f8fd] text-[#0073bb] font-bold" : "bg-white text-[#545b64] hover:bg-[#fafafa]"
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("user")}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className={`px-3 font-medium border-l border-[#eaeded] transition-colors ${
                  filterType === "user" ? "bg-[#f2f8fd] text-[#0073bb] font-bold" : "bg-white text-[#545b64] hover:bg-[#fafafa]"
                }`}
              >
                User ({userCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("system")}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className={`px-3 font-medium border-l border-[#eaeded] transition-colors ${
                  filterType === "system" ? "bg-[#f2f8fd] text-[#0073bb] font-bold" : "bg-white text-[#545b64] hover:bg-[#fafafa]"
                }`}
              >
                System ({systemCount})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedKeyspace) {
                  router.push(`/keyspaces/${encodeURIComponent(selectedKeyspace)}`);
                }
              }}
              disabled={!selectedKeyspace}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border transition-colors ${
                selectedKeyspace
                  ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] bg-white cursor-pointer"
                  : "border-[#d5dbdb] text-[#aab7b8] bg-[#f2f3f3] cursor-not-allowed"
              }`}
            >
              View details
            </button>

            <button
              onClick={() => {
                if (selectedKeyspace && !isSelectedSystem) {
                  setDeleteConfirmationText("");
                  setShowDeleteModal(true);
                }
              }}
              disabled={!selectedKeyspace || isSelectedSystem}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border transition-colors ${
                selectedKeyspace && !isSelectedSystem
                  ? "border-[#d13212] text-[#d13212] hover:bg-[#fdf3f1] bg-white cursor-pointer"
                  : "border-[#d5dbdb] text-[#aab7b8] bg-[#f2f3f3] cursor-not-allowed"
              }`}
            >
              Delete keyspace
            </button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="text-[16px] font-bold text-[#16191f]">No keyspaces found</div>
            <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
              {searchQuery
                ? `No keyspaces match '${searchQuery}'. Clear your filter to view all keyspaces.`
                : "You do not have any application keyspaces in this Region. Create a keyspace to start organizing your Cassandra tables."}
            </p>
            {!searchQuery && (
              <div className="pt-2">
                <Link
                  href="/keyspaces/create"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Create keyspace
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="w-12 px-4 py-3 text-center"></th>
                  <th className="px-4 py-3">Keyspace name</th>
                  <th className="px-4 py-3">Resource ARN</th>
                  <th className="px-4 py-3">Replication strategy</th>
                  <th className="px-4 py-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {filtered.map((k) => {
                  const isChecked = selectedKeyspace === k.keyspaceName;
                  return (
                    <tr
                      key={k.keyspaceName}
                      onClick={() => setSelectedKeyspace(k.keyspaceName)}
                      className={`cursor-pointer transition-colors ${
                        isChecked ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selected_keyspace"
                          checked={isChecked}
                          onChange={() => setSelectedKeyspace(k.keyspaceName)}
                          className="h-4 w-4 text-[#ec7211] focus:ring-[#ec7211] border-[#eaeded]"
                        />
                      </td>
                      <td className="px-4 py-3 font-bold">
                        <Link
                          href={`/keyspaces/${encodeURIComponent(k.keyspaceName)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#0073bb] hover:underline"
                        >
                          {k.keyspaceName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#545b64]">
                        {k.resourceArn}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f3f3] text-[#16191f] border border-[#eaeded]">
                          {k.replicationStrategy}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {k.isSystem ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
                            System
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e7f3fb] text-[#0073bb] border border-[#c3e3f7]">
                            User
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-[#eaeded] text-[12px] text-[#545b64]">
          Showing {filtered.length} of {totalCount} keyspaces
        </div>
      </div>

      {/* Delete Keyspace Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">
                Delete keyspace: {selectedItem.keyspaceName}
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#879596] hover:text-[#16191f]"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-[#fdf3f1] border-l-4 border-[#d13212] rounded text-[13px] text-[#16191f] space-y-1">
              <div className="font-bold text-[#d13212]">Permanent deletion warning</div>
              <p>
                Deleting this keyspace will permanently delete the keyspace and all tables, data, and schema definitions
                contained within it. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-2 text-[13px]">
              <p className="text-[#545b64]">
                To confirm deletion, type <strong className="font-mono text-[#16191f]">delete</strong> in the field below:
              </p>
              <input
                type="text"
                placeholder="delete"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 border border-[#eaeded] rounded focus:outline-none focus:border-[#d13212] font-mono text-[13px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center px-4 rounded border border-[#545b64] text-[#16191f] font-bold text-[13px] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmationText !== "delete" || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`inline-flex items-center justify-center px-4 rounded font-bold text-[13px] text-white transition-colors ${
                  deleteConfirmationText === "delete" && !isPending
                    ? "bg-[#d13212] hover:bg-[#b02a0f] cursor-pointer"
                    : "bg-[#eaeded] text-[#aab7b8] cursor-not-allowed"
                }`}
              >
                {isPending ? "Deleting..." : "Delete keyspace"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
