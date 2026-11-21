"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DatabaseSummary } from "../types";
import { deleteDatabaseAction } from "../actions";

interface DatabasesClientProps {
  initialDatabases: DatabaseSummary[];
  totalTables: number;
  defaultKmsCount: number;
  customerKmsCount: number;
  error?: string;
}

export default function DatabasesClient({
  initialDatabases,
  totalTables: initTotalTables,
  defaultKmsCount: initDefaultKms,
  customerKmsCount: initCustomerKms,
  error: initialError,
}: DatabasesClientProps) {
  const router = useRouter();
  const [databases, setDatabases] = useState<DatabaseSummary[]>(initialDatabases);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError || null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState("");

  // Edit emulator notice modal
  const [showEditNotice, setShowEditNotice] = useState(false);

  const filteredDatabases = databases.filter((db) =>
    db.DatabaseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDatabases = databases.length;
  const currentTotalTables = databases.reduce((acc, db) => acc + (db.TableCount || 0), 0);

  function handleDeleteDatabase() {
    if (!selectedDb || confirmDeleteInput !== selectedDb) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteDatabaseAction(selectedDb);
      if (res.success) {
        setDatabases((prev) => prev.filter((d) => d.DatabaseName !== selectedDb));
        setSuccessBanner(`Database '${selectedDb}' was successfully deleted.`);
        setSelectedDb(null);
        setShowDeleteModal(false);
        setConfirmDeleteInput("");
      } else {
        setError(res.error || "Failed to delete database.");
      }
    });
  }

  function formatKmsKey(kmsId: string): string {
    if (!kmsId) return "Default (aws/timestream)";
    if (kmsId.includes("alias/aws/timestream")) return "aws/timestream (AWS managed)";
    const parts = kmsId.split("/");
    return parts[parts.length - 1] || kmsId;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Notifications */}
      {successBanner && (
        <div className="bg-[#f2f8fd] border-l-4 border-[#0073bb] p-4 text-[13px] text-[#16191f] flex items-center justify-between shadow-sm">
          <div>{successBanner}</div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-[#545b64] hover:text-[#16191f] font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="bg-[#fdf3f2] border-l-4 border-[#d13212] p-4 text-[13px] text-[#d13212] flex items-center justify-between shadow-sm">
          <div>{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-[#545b64] hover:text-[#16191f] font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Databases</h1>
          <p className="text-[14px] text-[#545b64] mt-0.5">
            Amazon Timestream is a fast, scalable, and serverless time series database service for IoT and operational applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/timestream/databases/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
          >
            Create database
          </Link>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Total Databases
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">{totalDatabases}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Across current region</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Total Tables
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">{currentTotalTables}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Time series tables</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Default KMS Keys
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">{initDefaultKms}</div>
          <div className="text-[12px] text-[#545b64] mt-1">AWS owned encryption</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Customer KMS Keys
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">{initCustomerKms}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Customer managed</div>
        </div>
      </div>

      {/* Databases Inventory Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        {/* Table toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <input
              type="text"
              placeholder="Find databases by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedDb) {
                  router.push(`/timestream/databases/${encodeURIComponent(selectedDb)}`);
                }
              }}
              disabled={!selectedDb}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`font-bold text-[13px] px-3 rounded border transition-colors ${
                selectedDb
                  ? "bg-white text-[#16191f] border-[#d5dbdb] hover:bg-[#fafafa]"
                  : "bg-[#f2f3f3] text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
              }`}
            >
              View details
            </button>
            <button
              onClick={() => setShowEditNotice(true)}
              disabled={!selectedDb}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`font-bold text-[13px] px-3 rounded border transition-colors ${
                selectedDb
                  ? "bg-white text-[#16191f] border-[#d5dbdb] hover:bg-[#fafafa]"
                  : "bg-[#f2f3f3] text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (selectedDb) {
                  setConfirmDeleteInput("");
                  setShowDeleteModal(true);
                }
              }}
              disabled={!selectedDb}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`font-bold text-[13px] px-3 rounded border transition-colors ${
                selectedDb
                  ? "bg-white text-[#d13212] border-[#d5dbdb] hover:bg-[#fafafa]"
                  : "bg-[#f2f3f3] text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
              }`}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Databases Table */}
        {filteredDatabases.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-[16px] font-bold text-[#16191f]">No databases found</h3>
            <p className="text-[13px] text-[#545b64] mt-1 max-w-md mx-auto">
              Get started by creating your first Amazon Timestream time-series database.
            </p>
            <div className="mt-4">
              <Link
                href="/timestream/databases/create"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Create database
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-5 py-3">Database name</th>
                  <th className="px-5 py-3">Tables</th>
                  <th className="px-5 py-3">KMS key</th>
                  <th className="px-5 py-3">Last updated</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {filteredDatabases.map((db) => {
                  const isSelected = selectedDb === db.DatabaseName;
                  return (
                    <tr
                      key={db.DatabaseName}
                      onClick={() => setSelectedDb(db.DatabaseName)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selected-db"
                          checked={isSelected}
                          onChange={() => setSelectedDb(db.DatabaseName)}
                          className="accent-[#ec7211] cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3 font-bold">
                        <Link
                          href={`/timestream/databases/${encodeURIComponent(db.DatabaseName)}`}
                          className="text-[#0073bb] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {db.DatabaseName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[#16191f]">{db.TableCount}</td>
                      <td className="px-5 py-3 text-[#545b64] font-mono text-[12px]">
                        {formatKmsKey(db.KmsKeyId)}
                      </td>
                      <td className="px-5 py-3 text-[#545b64]">
                        {db.LastUpdatedTime ? new Date(db.LastUpdatedTime).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-3 text-[#545b64]">
                        {db.CreationTime ? new Date(db.CreationTime).toLocaleString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Database Modal */}
      {showDeleteModal && selectedDb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete database: {selectedDb}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this database? All tables and time-series data contained inside will be permanently deleted. This action cannot be undone.
            </p>
            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1.5 py-0.5 rounded font-mono text-[#d13212]">{selectedDb}</code> below:
              </label>
              <input
                type="text"
                placeholder={selectedDb}
                value={confirmDeleteInput}
                onChange={(e) => setConfirmDeleteInput(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#d13212]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmDeleteInput("");
                }}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDatabase}
                disabled={confirmDeleteInput !== selectedDb || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`px-4 text-[13px] font-bold text-white rounded transition-colors ${
                  confirmDeleteInput === selectedDb && !isPending
                    ? "bg-[#d13212] hover:bg-[#a82a0f]"
                    : "bg-[#eaeded] text-[#aab7b8] cursor-not-allowed"
                }`}
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Unsupported Notice Modal */}
      {showEditNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Operation Not Supported
            </h3>
            <div className="bg-[#f2f8fd] border-l-4 border-[#0073bb] p-3 text-[13px] text-[#16191f]">
              <code>UpdateDatabase</code> is scaffolded in the AWS Emulator, but not implemented in this local emulator version.
            </div>
            <p className="text-[13px] text-[#545b64]">
              Database KMS key modifications are not supported by the local emulator engine. To change KMS encryption, please create a new database with your chosen key.
            </p>
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowEditNotice(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
