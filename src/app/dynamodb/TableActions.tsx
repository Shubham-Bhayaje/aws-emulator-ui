/**
 * TableActions – Client component for DynamoDB tables list page.
 * Provides table search, selection, deletion modal, and links to explore items.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteTable } from "./actions";

export interface TableSummary {
  name: string;
  status: string;
  partitionKey: string;
  partitionKeyType: string;
  sortKey?: string;
  sortKeyType?: string;
  itemCount: number;
  sizeBytes: number;
  creationDateTime?: string;
}

interface TableActionsProps {
  tables: TableSummary[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function TableActions({ tables }: TableActionsProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleDelete() {
    if (!selectedTable || confirmInput !== "delete") return;

    startTransition(async () => {
      const res = await deleteTable(selectedTable);
      if (res && res.error) {
        setError(res.error);
      } else {
        setSelectedTable(null);
        setShowDeleteModal(false);
        setConfirmInput("");
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
      {/* Table header bar */}
      <div className="px-4 py-3 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[14px] font-bold text-[#16191f]">
            Tables ({filteredTables.length})
          </h2>
          {/* Search box */}
          <div className="relative w-[260px]">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#545b64]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Find tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-[#aab7b8] rounded px-2.5 pl-8 py-[4px] text-[13px] text-[#16191f] placeholder-[#8d9ba8] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedTable) {
                router.push(`/dynamodb/${encodeURIComponent(selectedTable)}`);
              }
            }}
            disabled={!selectedTable}
            className={`px-3 py-[4px] text-[13px] rounded-sm border font-normal transition-colors ${
              selectedTable
                ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed"
            }`}
          >
            Explore table items
          </button>
          <button
            onClick={() => {
              setConfirmInput("");
              setShowDeleteModal(true);
            }}
            disabled={!selectedTable || isPending}
            className={`px-3 py-[4px] text-[13px] rounded-sm border font-normal transition-colors ${
              selectedTable && !isPending
                ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed"
            }`}
          >
            Delete
          </button>
          <Link
            href="/dynamodb/create"
            className="px-3 py-[4px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] font-medium transition-colors"
          >
            Create table
          </Link>
        </div>
      </div>

      {error && (
        <div className="m-4 p-3 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      {/* Table list view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
            <tr>
              <th className="w-10 px-4 py-2.5">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-4 py-2.5 font-bold text-[#16191f]">Table name</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Partition key</th>
              <th className="px-4 py-2.5">Sort key</th>
              <th className="px-4 py-2.5">Item count</th>
              <th className="px-4 py-2.5">Table size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filteredTables.map((table) => {
              const isSelected = selectedTable === table.name;
              return (
                <tr
                  key={table.name}
                  onClick={() => setSelectedTable(isSelected ? null : table.name)}
                  className={`hover:bg-[#f2f8fd] cursor-pointer transition-colors ${
                    isSelected ? "bg-[#f2f8fd]" : ""
                  }`}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="radio"
                      name="selectedTable"
                      checked={isSelected}
                      onChange={() => setSelectedTable(isSelected ? null : table.name)}
                      className="cursor-pointer text-[#0073bb] focus:ring-[#0073bb]"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/dynamodb/${encodeURIComponent(table.name)}`}
                      className="text-[#0073bb] hover:text-[#ec7211] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {table.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                        table.status === "ACTIVE"
                          ? "bg-[#f2f8f0] text-[#1d8102]"
                          : "bg-[#fff8e7] text-[#9a6700]"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          table.status === "ACTIVE" ? "bg-[#1d8102]" : "bg-[#9a6700]"
                        }`}
                      />
                      {table.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#16191f]">
                    <span className="font-mono text-[12px] bg-[#f2f3f3] px-1.5 py-0.5 rounded">
                      {table.partitionKey}
                    </span>{" "}
                    <span className="text-[#545b64] text-[11px]">
                      ({table.partitionKeyType})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#545b64]">
                    {table.sortKey ? (
                      <>
                        <span className="font-mono text-[12px] bg-[#f2f3f3] px-1.5 py-0.5 rounded text-[#16191f]">
                          {table.sortKey}
                        </span>{" "}
                        <span className="text-[11px]">({table.sortKeyType})</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#16191f] font-mono">
                    {table.itemCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[#545b64]">
                    {formatBytes(table.sizeBytes)}
                  </td>
                </tr>
              );
            })}

            {filteredTables.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#545b64]">
                  {tables.length === 0
                    ? "No DynamoDB tables exist yet in this region."
                    : `No tables match "${searchQuery}".`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#eaeded] text-[12px] text-[#545b64]">
        {filteredTables.length} {filteredTables.length === 1 ? "table" : "tables"}
      </div>

      {/* Delete Table Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-[500px] w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete table: {selectedTable}
            </h3>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Are you sure you want to delete table <strong>{selectedTable}</strong>? All
              data, items, and settings associated with this table will be permanently
              removed.
            </p>
            <div>
              <label className="block text-[13px] font-medium text-[#16191f] mb-1">
                To confirm deletion, type <strong>delete</strong> in the box below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="delete"
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#d13212] focus:ring-1 focus:ring-[#d13212]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmInput !== "delete" || isPending}
                className={`px-4 py-1.5 text-[13px] text-white rounded-sm font-medium ${
                  confirmInput === "delete" && !isPending
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
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
