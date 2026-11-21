"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyspaceDetail, TableSummary } from "../types";
import { deleteKeyspaceAction, deleteTableAction } from "../actions";

interface KeyspaceDetailClientProps {
  keyspace: KeyspaceDetail;
  initialTables: TableSummary[];
  initialError?: string;
}

export default function KeyspaceDetailClient({
  keyspace,
  initialTables,
  initialError,
}: KeyspaceDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"tables" | "tags">("tables");
  const [tables, setTables] = useState<TableSummary[]>(initialTables);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError || null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Delete Keyspace Modal
  const [showDeleteKeyspaceModal, setShowDeleteKeyspaceModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // Delete Table Modal
  const [showDeleteTableModal, setShowDeleteTableModal] = useState(false);
  const [deleteTableText, setDeleteTableText] = useState("");

  const filteredTables = tables.filter((t) =>
    t.tableName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleDeleteKeyspace() {
    if (deleteConfirmationText !== "delete") return;
    setError(null);
    startTransition(async () => {
      const res = await deleteKeyspaceAction(keyspace.keyspaceName);
      if (res.success) {
        router.push("/keyspaces");
      } else {
        setError(res.error || "Failed to delete keyspace.");
      }
    });
  }

  function handleDeleteTable() {
    if (!selectedTable || deleteTableText !== "delete") return;
    setError(null);
    startTransition(async () => {
      const res = await deleteTableAction(keyspace.keyspaceName, selectedTable);
      if (res.success) {
        setTables(tables.filter((t) => t.tableName !== selectedTable));
        setSuccessBanner(`Table '${selectedTable}' was successfully deleted.`);
        setSelectedTable(null);
        setShowDeleteTableModal(false);
        setDeleteTableText("");
      } else {
        setError(res.error || "Failed to delete table.");
      }
    });
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/" className="hover:underline text-[#0073bb]">Console Home</Link>
        <span>/</span>
        <Link href="/keyspaces" className="hover:underline text-[#0073bb]">Keyspaces</Link>
        <span>/</span>
        <span className="text-[#16191f] font-medium">{keyspace.keyspaceName}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-bold text-[#16191f]">{keyspace.keyspaceName}</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f3f3] text-[#16191f] border border-[#eaeded]">
              {keyspace.replicationStrategy}
            </span>
            {keyspace.isSystem && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
                System
              </span>
            )}
          </div>
          <p className="text-[12px] font-mono text-[#545b64] mt-1 break-all">
            {keyspace.resourceArn}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/keyspaces/${encodeURIComponent(keyspace.keyspaceName)}/create-table`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            Create table
          </Link>

          {!keyspace.isSystem && (
            <button
              onClick={() => {
                setDeleteConfirmationText("");
                setShowDeleteKeyspaceModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#d13212] text-[#d13212] bg-white hover:bg-[#fdf3f1] transition-colors"
            >
              Delete keyspace
            </button>
          )}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Replication strategy
          </div>
          <div className="text-[18px] font-bold text-[#16191f] mt-1">
            {keyspace.replicationStrategy}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">Single-Region placement</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Tables in keyspace
          </div>
          <div className="text-[18px] font-bold text-[#16191f] mt-1 text-[#0073bb]">
            {tables.length}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">Cassandra data tables</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Region
          </div>
          <div className="text-[18px] font-bold text-[#16191f] mt-1">
            us-east-1
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">US East (N. Virginia)</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded]">
        <nav className="flex space-x-6 text-[13px] font-bold">
          <button
            onClick={() => setActiveTab("tables")}
            className={`py-2 border-b-2 transition-colors ${
              activeTab === "tables"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tables ({tables.length})
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`py-2 border-b-2 transition-colors ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({Object.keys(keyspace.tags || {}).length})
          </button>
        </nav>
      </div>

      {/* Tab: Tables */}
      {activeTab === "tables" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm">
          <div className="p-4 border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Filter tables by name"
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (selectedTable) {
                    router.push(
                      `/keyspaces/${encodeURIComponent(keyspace.keyspaceName)}/tables/${encodeURIComponent(selectedTable)}`
                    );
                  }
                }}
                disabled={!selectedTable}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border transition-colors ${
                  selectedTable
                    ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] bg-white cursor-pointer"
                    : "border-[#d5dbdb] text-[#aab7b8] bg-[#f2f3f3] cursor-not-allowed"
                }`}
              >
                View details
              </button>

              <button
                onClick={() => {
                  if (selectedTable) {
                    setDeleteTableText("");
                    setShowDeleteTableModal(true);
                  }
                }}
                disabled={!selectedTable}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border transition-colors ${
                  selectedTable
                    ? "border-[#d13212] text-[#d13212] hover:bg-[#fdf3f1] bg-white cursor-pointer"
                    : "border-[#d5dbdb] text-[#aab7b8] bg-[#f2f3f3] cursor-not-allowed"
                }`}
              >
                Delete table
              </button>
            </div>
          </div>

          {filteredTables.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="text-[16px] font-bold text-[#16191f]">No tables found</div>
              <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
                {searchQuery
                  ? `No tables match '${searchQuery}'. Clear your filter to view all tables.`
                  : "You do not have any tables in this keyspace. Create a table to start storing Cassandra records."}
              </p>
              {!searchQuery && (
                <div className="pt-2">
                  <Link
                    href={`/keyspaces/${encodeURIComponent(keyspace.keyspaceName)}/create-table`}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                  >
                    Create table
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
                    <th className="px-4 py-3">Table name</th>
                    <th className="px-4 py-3">Resource ARN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {filteredTables.map((t) => {
                    const isChecked = selectedTable === t.tableName;
                    return (
                      <tr
                        key={t.tableName}
                        onClick={() => setSelectedTable(t.tableName)}
                        className={`cursor-pointer transition-colors ${
                          isChecked ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                        }`}
                      >
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            name="selected_table"
                            checked={isChecked}
                            onChange={() => setSelectedTable(t.tableName)}
                            className="h-4 w-4 text-[#ec7211] focus:ring-[#ec7211]"
                          />
                        </td>
                        <td className="px-4 py-3 font-bold">
                          <Link
                            href={`/keyspaces/${encodeURIComponent(keyspace.keyspaceName)}/tables/${encodeURIComponent(t.tableName)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#0073bb] hover:underline"
                          >
                            {t.tableName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] text-[#545b64]">
                          {t.resourceArn}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-4 border-t border-[#eaeded] text-[12px] text-[#545b64]">
            Showing {filteredTables.length} of {tables.length} tables
          </div>
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
          {Object.keys(keyspace.tags || {}).length === 0 ? (
            <p className="text-[13px] text-[#545b64]">No tags assigned to this keyspace.</p>
          ) : (
            <table className="w-full max-w-lg text-left text-[13px] border border-[#eaeded] rounded">
              <thead className="bg-[#fafafa] text-[#545b64] font-bold text-[11px] uppercase border-b border-[#eaeded]">
                <tr>
                  <th className="px-4 py-2">Key</th>
                  <th className="px-4 py-2">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {Object.entries(keyspace.tags || {}).map(([key, val]) => (
                  <tr key={key}>
                    <td className="px-4 py-2 font-mono text-[12px] text-[#16191f]">{key}</td>
                    <td className="px-4 py-2 text-[#545b64]">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Delete Keyspace Modal */}
      {showDeleteKeyspaceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">
                Delete keyspace: {keyspace.keyspaceName}
              </h3>
              <button
                onClick={() => setShowDeleteKeyspaceModal(false)}
                className="text-[#879596] hover:text-[#16191f]"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-[#fdf3f1] border-l-4 border-[#d13212] rounded text-[13px] text-[#16191f] space-y-1">
              <div className="font-bold text-[#d13212]">Permanent deletion warning</div>
              <p>
                Deleting this keyspace will permanently remove all {tables.length} tables and data records contained within it.
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
                className="w-full px-3 border border-[#eaeded] rounded font-mono text-[13px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setShowDeleteKeyspaceModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center px-4 rounded border border-[#545b64] text-[#16191f] font-bold text-[13px] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteKeyspace}
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

      {/* Delete Table Modal */}
      {showDeleteTableModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">
                Delete table: {selectedTable}
              </h3>
              <button
                onClick={() => setShowDeleteTableModal(false)}
                className="text-[#879596] hover:text-[#16191f]"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-[#fdf3f1] border-l-4 border-[#d13212] rounded text-[13px] text-[#16191f]">
              <div className="font-bold text-[#d13212]">Permanent deletion warning</div>
              <p>Deleting this table will permanently remove all stored items and schema definitions.</p>
            </div>

            <div className="space-y-2 text-[13px]">
              <p className="text-[#545b64]">
                To confirm deletion, type <strong className="font-mono text-[#16191f]">delete</strong> in the field below:
              </p>
              <input
                type="text"
                placeholder="delete"
                value={deleteTableText}
                onChange={(e) => setDeleteTableText(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 border border-[#eaeded] rounded font-mono text-[13px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setShowDeleteTableModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center px-4 rounded border border-[#545b64] text-[#16191f] font-bold text-[13px] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTable}
                disabled={deleteTableText !== "delete" || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`inline-flex items-center justify-center px-4 rounded font-bold text-[13px] text-white transition-colors ${
                  deleteTableText === "delete" && !isPending
                    ? "bg-[#d13212] hover:bg-[#b02a0f] cursor-pointer"
                    : "bg-[#eaeded] text-[#aab7b8] cursor-not-allowed"
                }`}
              >
                {isPending ? "Deleting..." : "Delete table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
