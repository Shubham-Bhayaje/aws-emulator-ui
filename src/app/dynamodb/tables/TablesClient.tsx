"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TableSummary } from "../types";
import { deleteTableAction } from "../actions";

interface TablesClientProps {
  tables: TableSummary[];
  totalItemCount: number;
  totalSizeBytes: number;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function TablesClient({
  tables,
  totalItemCount,
  totalSizeBytes,
  error: initialError,
}: TablesClientProps) {
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError || null);
  const router = useRouter();

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTable = tables.find((t) => t.name === selectedTableName);

  function handleDelete() {
    if (!selectedTableName || confirmInput !== selectedTableName) return;

    startTransition(async () => {
      const res = await deleteTableAction(selectedTableName);
      if (res && res.error) {
        setError(res.error);
      } else {
        setSelectedTableName(null);
        setShowDeleteModal(false);
        setConfirmInput("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Tables</h1>
          <p className="text-[14px] text-[#545b64] mt-0.5">
            Tables store data in Amazon DynamoDB. A table is a collection of items, and each item is a collection of attributes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dynamodb/tables/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            Create table
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border-l-4 border-[#d13212] text-[13px] text-[#d13212] rounded">
          {error}
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Total tables
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {tables.length}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">In current Region</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Active tables
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {tables.filter((t) => t.status.toUpperCase() === "ACTIVE").length}
          </div>
          <div className="text-[12px] text-[#1d8102] mt-1 font-medium">Ready for traffic</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Total items
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {totalItemCount.toLocaleString()}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">Aggregated count</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Total storage
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {formatBytes(totalSizeBytes)}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">Table and index payloads</div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Find tables"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full pl-9 pr-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
              />
              <svg
                className="absolute left-2.5 top-2.5 w-4 h-4 text-[#879596]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedTableName) {
                  router.push(`/dynamodb/tables/${encodeURIComponent(selectedTableName)}`);
                }
              }}
              disabled={!selectedTableName}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`px-3 text-[13px] font-bold rounded border transition-colors ${
                selectedTableName
                  ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                  : "border-[#eaeded] text-[#879596] cursor-not-allowed bg-[#fafafa]"
              }`}
            >
              View details
            </button>

            <button
              onClick={() => {
                if (selectedTableName) {
                  router.push(`/dynamodb/tables/${encodeURIComponent(selectedTableName)}?tab=items`);
                }
              }}
              disabled={!selectedTableName}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`px-3 text-[13px] font-bold rounded border transition-colors ${
                selectedTableName
                  ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                  : "border-[#eaeded] text-[#879596] cursor-not-allowed bg-[#fafafa]"
              }`}
            >
              Explore items
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={!selectedTableName}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`px-3 text-[13px] font-bold rounded border transition-colors ${
                selectedTableName
                  ? "border-[#d13212] text-[#d13212] hover:bg-[#fdf2f2]"
                  : "border-[#eaeded] text-[#879596] cursor-not-allowed bg-[#fafafa]"
              }`}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Tables Table */}
        {filteredTables.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-[14px] text-[#545b64]">
              {searchQuery ? `No tables matching "${searchQuery}".` : "No DynamoDB tables in this Region."}
            </p>
            {!searchQuery && (
              <div>
                <Link
                  href="/dynamodb/tables/create"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
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
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3">Table name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Partition key</th>
                  <th className="px-4 py-3">Sort key</th>
                  <th className="px-4 py-3">Capacity mode</th>
                  <th className="px-4 py-3">RCU / WCU</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Creation date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {filteredTables.map((t) => {
                  const isSelected = selectedTableName === t.name;
                  return (
                    <tr
                      key={t.name}
                      onClick={() => setSelectedTableName(t.name)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="radio"
                          name="selectedTable"
                          checked={isSelected}
                          onChange={() => setSelectedTableName(t.name)}
                          className="h-4 w-4 text-[#ec7211] border-[#d5dbdb] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dynamodb/tables/${encodeURIComponent(t.name)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-[#0073bb] hover:underline"
                        >
                          {t.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            t.status.toUpperCase() === "ACTIVE"
                              ? "bg-[#edf7ed] text-[#1d8102]"
                              : t.status.toUpperCase() === "CREATING"
                              ? "bg-[#e8f0fe] text-[#1a73e8]"
                              : "bg-[#fef3d6] text-[#b35900]"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#16191f]">
                        {t.partitionKey} <span className="text-[#545b64] font-sans">({t.partitionKeyType})</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#16191f]">
                        {t.sortKey ? (
                          <>
                            {t.sortKey} <span className="text-[#545b64] font-sans">({t.sortKeyType})</span>
                          </>
                        ) : (
                          <span className="text-[#879596]">–</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#16191f]">
                        {t.billingMode === "PAY_PER_REQUEST" ? "On-demand" : "Provisioned"}
                      </td>
                      <td className="px-4 py-3 text-[#16191f]">
                        {t.billingMode === "PROVISIONED"
                          ? `${t.readCapacityUnits ?? 5} / ${t.writeCapacityUnits ?? 5}`
                          : "–"}
                      </td>
                      <td className="px-4 py-3 text-[#16191f]">
                        {t.itemCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[#16191f]">
                        {formatBytes(t.sizeBytes)}
                      </td>
                      <td className="px-4 py-3 text-[#545b64] text-[12px]">
                        {t.creationDateTime ? new Date(t.creationDateTime).toLocaleString() : "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 bg-[#fafafa] border-t border-[#eaeded] text-[12px] text-[#545b64]">
          Showing {filteredTables.length} of {tables.length} tables
        </div>
      </div>

      {/* Delete Table Modal */}
      {showDeleteModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete table: {selectedTable.name}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete table <strong className="text-[#16191f]">{selectedTable.name}</strong>?
              All data, secondary indexes, and provisioned throughput will be permanently deleted. This action cannot be undone.
            </p>

            <div className="bg-[#fdf2f2] border-l-4 border-[#d13212] p-3 text-[13px] text-[#d13212]">
              To confirm deletion, enter <strong className="font-mono">{selectedTable.name}</strong> below:
            </div>

            <div>
              <input
                type="text"
                placeholder={selectedTable.name}
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmInput("");
                }}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmInput !== selectedTable.name || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`px-4 text-[13px] font-bold rounded transition-colors ${
                  confirmInput === selectedTable.name && !isPending
                    ? "bg-[#d13212] text-white hover:bg-[#b02a0f]"
                    : "bg-[#eaeded] text-[#879596] cursor-not-allowed"
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
