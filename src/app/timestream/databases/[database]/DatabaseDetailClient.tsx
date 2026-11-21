"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DatabaseSummary, TableSummary } from "../../types";
import { deleteDatabaseAction, deleteTableAction } from "../../actions";

interface DatabaseDetailClientProps {
  database: DatabaseSummary;
  initialTables: TableSummary[];
}

export default function DatabaseDetailClient({
  database,
  initialTables,
}: DatabaseDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"tables" | "configuration" | "tags">("tables");
  const [tables, setTables] = useState<TableSummary[]>(initialTables);
  const [searchTableQuery, setSearchTableQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Delete Database modal
  const [showDeleteDbModal, setShowDeleteDbModal] = useState(false);
  const [confirmDbInput, setConfirmDbInput] = useState("");

  // Delete Table modal
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [confirmTableInput, setConfirmTableInput] = useState("");

  const filteredTables = tables.filter((t) =>
    t.TableName.toLowerCase().includes(searchTableQuery.toLowerCase())
  );

  function handleDeleteDatabase() {
    if (confirmDbInput !== database.DatabaseName) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteDatabaseAction(database.DatabaseName);
      if (res.success) {
        router.push("/timestream/databases");
      } else {
        setError(res.error || "Failed to delete database.");
      }
    });
  }

  function handleDeleteTable() {
    if (!tableToDelete || confirmTableInput !== tableToDelete) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteTableAction(database.DatabaseName, tableToDelete);
      if (res.success) {
        setTables((prev) => prev.filter((t) => t.TableName !== tableToDelete));
        setSuccessBanner(`Table '${tableToDelete}' was successfully deleted.`);
        setTableToDelete(null);
        setConfirmTableInput("");
      } else {
        setError(res.error || "Failed to delete table.");
      }
    });
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-bold text-[#16191f]">{database.DatabaseName}</h1>
            <span className="text-[12px] font-semibold px-2 py-0.5 rounded bg-[#f2fcf3] text-[#1d8102] border border-[#a2e19c]">
              ACTIVE
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-0.5 font-mono truncate max-w-xl">
            {database.Arn}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/timestream/databases/${encodeURIComponent(database.DatabaseName)}/create-table`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
          >
            Create table
          </Link>
          <button
            onClick={() => {
              setConfirmDbInput("");
              setShowDeleteDbModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-bold text-[#d13212] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
          >
            Delete database
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Tables Count
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{tables.length}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Active time series tables</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            KMS Key
          </div>
          <div className="text-[13px] font-bold text-[#16191f] mt-2 truncate font-mono">
            {database.KmsKeyId.includes("alias/aws/timestream")
              ? "aws/timestream (Default)"
              : database.KmsKeyId.split("/").pop()}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">Encryption at rest</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Created
          </div>
          <div className="text-[13px] font-bold text-[#16191f] mt-2">
            {database.CreationTime ? new Date(database.CreationTime).toLocaleDateString() : "—"}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">
            {database.CreationTime ? new Date(database.CreationTime).toLocaleTimeString() : ""}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Last Updated
          </div>
          <div className="text-[13px] font-bold text-[#16191f] mt-2">
            {database.LastUpdatedTime ? new Date(database.LastUpdatedTime).toLocaleDateString() : "—"}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">
            {database.LastUpdatedTime ? new Date(database.LastUpdatedTime).toLocaleTimeString() : ""}
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-[#eaeded] flex gap-6">
        <button
          onClick={() => setActiveTab("tables")}
          className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
            activeTab === "tables"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Tables ({tables.length})
        </button>
        <button
          onClick={() => setActiveTab("configuration")}
          className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
            activeTab === "configuration"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab("tags")}
          className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
            activeTab === "tags"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Tags
        </button>
      </div>

      {/* Tab: Tables */}
      {activeTab === "tables" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden space-y-0">
          <div className="p-4 border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Find tables by name"
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
              />
            </div>
            <div>
              <Link
                href={`/timestream/databases/${encodeURIComponent(database.DatabaseName)}/create-table`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Create table
              </Link>
            </div>
          </div>

          {filteredTables.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-[16px] font-bold text-[#16191f]">No tables found</h3>
              <p className="text-[13px] text-[#545b64] mt-1">
                This database does not contain any tables yet.
              </p>
              <div className="mt-4">
                <Link
                  href={`/timestream/databases/${encodeURIComponent(database.DatabaseName)}/create-table`}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Create table
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Table name</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Memory store retention</th>
                    <th className="px-5 py-3">Magnetic store retention</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {filteredTables.map((t) => (
                    <tr key={t.TableName} className="hover:bg-[#fafafa]">
                      <td className="px-5 py-3 font-bold">
                        <Link
                          href={`/timestream/databases/${encodeURIComponent(
                            database.DatabaseName
                          )}/tables/${encodeURIComponent(t.TableName)}`}
                          className="text-[#0073bb] hover:underline"
                        >
                          {t.TableName}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2fcf3] text-[#1d8102] border border-[#a2e19c]">
                          {t.TableStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#16191f]">
                        {t.RetentionProperties?.MemoryStoreRetentionPeriodInHours} hours
                      </td>
                      <td className="px-5 py-3 text-[#16191f]">
                        {t.RetentionProperties?.MagneticStoreRetentionPeriodInDays} days
                      </td>
                      <td className="px-5 py-3 text-[#545b64]">
                        {t.CreationTime ? new Date(t.CreationTime).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => {
                            setTableToDelete(t.TableName);
                            setConfirmTableInput("");
                          }}
                          className="text-[13px] font-bold text-[#d13212] hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Configuration */}
      {activeTab === "configuration" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[18px] font-bold text-[#16191f] border-b border-[#eaeded] pb-3">
            Database details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
            <div>
              <span className="text-[#545b64] block font-medium">Database name</span>
              <span className="text-[#16191f] font-bold">{database.DatabaseName}</span>
            </div>
            <div>
              <span className="text-[#545b64] block font-medium">Amazon Resource Name (ARN)</span>
              <span className="text-[#16191f] font-mono text-[12px] break-all">{database.Arn}</span>
            </div>
            <div>
              <span className="text-[#545b64] block font-medium">KMS key identifier</span>
              <span className="text-[#16191f] font-mono text-[12px] break-all">{database.KmsKeyId}</span>
            </div>
            <div>
              <span className="text-[#545b64] block font-medium">Encryption key management</span>
              <span className="text-[#16191f]">
                {database.KmsKeyId.includes("alias/aws/timestream")
                  ? "AWS owned key (Default)"
                  : "Customer managed key"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
            <h2 className="text-[18px] font-bold text-[#16191f]">Tags (0)</h2>
            <button
              disabled
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[13px] font-bold text-[#aab7b8] bg-[#f2f3f3] border border-[#eaeded] rounded cursor-not-allowed"
            >
              Manage tags
            </button>
          </div>
          <p className="text-[13px] text-[#545b64]">No tags associated with this database.</p>
        </div>
      )}

      {/* Delete Database Modal */}
      {showDeleteDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete database: {database.DatabaseName}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this database? All tables and data will be permanently removed. This action cannot be undone.
            </p>
            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1.5 py-0.5 rounded font-mono text-[#d13212]">{database.DatabaseName}</code> below:
              </label>
              <input
                type="text"
                placeholder={database.DatabaseName}
                value={confirmDbInput}
                onChange={(e) => setConfirmDbInput(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#d13212]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteDbModal(false)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDatabase}
                disabled={confirmDbInput !== database.DatabaseName || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`px-4 text-[13px] font-bold text-white rounded transition-colors ${
                  confirmDbInput === database.DatabaseName && !isPending
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

      {/* Delete Table Modal */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete table: {tableToDelete}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this table? All time-series telemetry data will be permanently destroyed.
            </p>
            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1.5 py-0.5 rounded font-mono text-[#d13212]">{tableToDelete}</code> below:
              </label>
              <input
                type="text"
                placeholder={tableToDelete}
                value={confirmTableInput}
                onChange={(e) => setConfirmTableInput(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#d13212]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTable}
                disabled={confirmTableInput !== tableToDelete || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`px-4 text-[13px] font-bold text-white rounded transition-colors ${
                  confirmTableInput === tableToDelete && !isPending
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
    </div>
  );
}
