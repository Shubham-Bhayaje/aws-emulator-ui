"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TableDetail } from "../../../types";
import { updateTableAction, deleteTableAction } from "../../../actions";

interface TableDetailClientProps {
  table: TableDetail;
  initialError?: string;
}

export default function TableDetailClient({
  table,
  initialError,
}: TableDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "edit" | "tags">("overview");
  const [tableData, setTableData] = useState<TableDetail>(table);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError || null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Edit Settings state
  const [editThroughputMode, setEditThroughputMode] = useState<"PAY_PER_REQUEST" | "PROVISIONED">(
    tableData.capacitySpecification.throughputMode === "PROVISIONED" ? "PROVISIONED" : "PAY_PER_REQUEST"
  );
  const [editRcu, setEditRcu] = useState(tableData.capacitySpecification.readCapacityUnits || 5);
  const [editWcu, setEditWcu] = useState(tableData.capacitySpecification.writeCapacityUnits || 5);
  const [editPitr, setEditPitr] = useState(tableData.pointInTimeRecovery?.status === "ENABLED");
  const [editTtl, setEditTtl] = useState(Boolean(tableData.defaultTimeToLive && tableData.defaultTimeToLive > 0));
  const [editTtlSeconds, setEditTtlSeconds] = useState(tableData.defaultTimeToLive || 86400);

  // New Column addition state
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState("text");

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const partitionKeyNames = new Set(tableData.schemaDefinition.partitionKeys.map((p) => p.name));
  const clusteringKeyMap = new Map(
    tableData.schemaDefinition.clusteringKeys.map((ck) => [ck.name, ck.orderBy])
  );

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessBanner(null);

    const addColumns = newColName.trim()
      ? [{ name: newColName.trim(), type: newColType }]
      : undefined;

    startTransition(async () => {
      const res = await updateTableAction({
        keyspaceName: tableData.keyspaceName,
        tableName: tableData.tableName,
        addColumns,
        capacitySpecification: {
          throughputMode: editThroughputMode,
          readCapacityUnits: editThroughputMode === "PROVISIONED" ? Number(editRcu) : undefined,
          writeCapacityUnits: editThroughputMode === "PROVISIONED" ? Number(editWcu) : undefined,
        },
        pointInTimeRecovery: {
          status: editPitr ? "ENABLED" : "DISABLED",
        },
        defaultTimeToLive: editTtl ? Number(editTtlSeconds) : 0,
      });

      if (res.success) {
        setSuccessBanner("Table settings were successfully updated.");
        const updatedSchema = { ...tableData.schemaDefinition };
        if (addColumns && addColumns.length > 0) {
          updatedSchema.allColumns = [...updatedSchema.allColumns, ...addColumns];
        }

        setTableData({
          ...tableData,
          schemaDefinition: updatedSchema,
          capacitySpecification: {
            ...tableData.capacitySpecification,
            throughputMode: editThroughputMode,
            readCapacityUnits: editThroughputMode === "PROVISIONED" ? Number(editRcu) : undefined,
            writeCapacityUnits: editThroughputMode === "PROVISIONED" ? Number(editWcu) : undefined,
          },
          pointInTimeRecovery: {
            status: editPitr ? "ENABLED" : "DISABLED",
          },
          defaultTimeToLive: editTtl ? Number(editTtlSeconds) : 0,
        });

        setNewColName("");
        setActiveTab("overview");
      } else {
        setError(res.error || "Failed to update table settings.");
      }
    });
  }

  function handleDeleteTable() {
    if (deleteConfirmationText !== "delete") return;
    setError(null);
    startTransition(async () => {
      const res = await deleteTableAction(tableData.keyspaceName, tableData.tableName);
      if (res.success) {
        router.push(`/keyspaces/${encodeURIComponent(tableData.keyspaceName)}`);
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
        <Link href={`/keyspaces/${encodeURIComponent(tableData.keyspaceName)}`} className="hover:underline text-[#0073bb]">
          {tableData.keyspaceName}
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-medium">{tableData.tableName}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-bold text-[#16191f]">{tableData.tableName}</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#edf7ed] text-[#1d8102]">
              {tableData.status}
            </span>
          </div>
          <p className="text-[12px] font-mono text-[#545b64] mt-1 break-all">
            {tableData.resourceArn}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("edit")}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
          >
            Edit settings
          </button>
          <button
            onClick={() => {
              setDeleteConfirmationText("");
              setShowDeleteModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#d13212] text-[#d13212] bg-white hover:bg-[#fdf3f1] transition-colors"
          >
            Delete table
          </button>
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Table status
          </div>
          <div className="text-[18px] font-bold text-[#1d8102] mt-1">
            {tableData.status}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">Available for reads and writes</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Capacity mode
          </div>
          <div className="text-[18px] font-bold text-[#16191f] mt-1">
            {tableData.capacitySpecification.throughputMode === "PROVISIONED" ? "Provisioned" : "On-demand"}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">
            {tableData.capacitySpecification.throughputMode === "PROVISIONED"
              ? `${tableData.capacitySpecification.readCapacityUnits || 0} RCU / ${tableData.capacitySpecification.writeCapacityUnits || 0} WCU`
              : "Pay per request"}
          </div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Point-in-time recovery
          </div>
          <div className="text-[18px] font-bold text-[#16191f] mt-1">
            {tableData.pointInTimeRecovery?.status || "DISABLED"}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">Continuous automated backups</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Default TTL
          </div>
          <div className="text-[18px] font-bold text-[#16191f] mt-1">
            {tableData.defaultTimeToLive && tableData.defaultTimeToLive > 0
              ? `${tableData.defaultTimeToLive}s`
              : "Disabled"}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">Row expiration setting</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#eaeded]">
        <nav className="flex space-x-6 text-[13px] font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className={`py-2 border-b-2 transition-colors ${
              activeTab === "edit"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Edit settings
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`py-2 border-b-2 transition-colors ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({Object.keys(tableData.tags || {}).length})
          </button>
        </nav>
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Columns & Schema Definition */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#eaeded]">
              <h2 className="text-[16px] font-bold text-[#16191f]">Columns & primary key</h2>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                The Cassandra schema definition for table {tableData.tableName}.
              </p>
            </div>

            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Column name</th>
                  <th className="px-4 py-3">Data type</th>
                  <th className="px-4 py-3">Key role</th>
                  <th className="px-4 py-3">Clustering order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {tableData.schemaDefinition.allColumns.map((col) => {
                  const isPartition = partitionKeyNames.has(col.name);
                  const isClustering = clusteringKeyMap.has(col.name);
                  const clusteringOrder = clusteringKeyMap.get(col.name);

                  return (
                    <tr key={col.name} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 font-mono font-bold text-[#16191f]">
                        {col.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#545b64]">
                        {col.type}
                      </td>
                      <td className="px-4 py-3">
                        {isPartition && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e7f3fb] text-[#0073bb] border border-[#c3e3f7]">
                            Partition key (HASH)
                          </span>
                        )}
                        {isClustering && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f3f3] text-[#16191f] border border-[#eaeded]">
                            Clustering key
                          </span>
                        )}
                        {!isPartition && !isClustering && (
                          <span className="text-[#879596] text-[12px]">Regular column</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#545b64]">
                        {clusteringOrder ? (
                          <span className="font-mono font-semibold">{clusteringOrder}</span>
                        ) : (
                          <span className="text-[#aab7b8] italic">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Encryption Card */}
            <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm space-y-3">
              <h3 className="text-[14px] font-bold text-[#16191f]">Encryption at rest</h3>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between py-1 border-b border-[#eaeded]">
                  <span className="text-[#545b64]">Encryption type</span>
                  <span className="font-medium text-[#16191f]">
                    {tableData.encryptionSpecification?.type === "CUSTOMER_MANAGED_KMS_KEY"
                      ? "Customer managed key (KMS)"
                      : "AWS owned key"}
                  </span>
                </div>
                {tableData.encryptionSpecification?.kmsKeyIdentifier && (
                  <div className="py-1 border-b border-[#eaeded]">
                    <span className="text-[#545b64] block mb-1">KMS Key ARN</span>
                    <span className="font-mono text-[11px] text-[#16191f] break-all">
                      {tableData.encryptionSpecification.kmsKeyIdentifier}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* PITR & TTL Details */}
            <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm space-y-3">
              <h3 className="text-[14px] font-bold text-[#16191f]">Recovery & row lifecycle</h3>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between py-1 border-b border-[#eaeded]">
                  <span className="text-[#545b64]">Point-in-time recovery</span>
                  <span className="font-medium text-[#16191f]">
                    {tableData.pointInTimeRecovery?.status || "DISABLED"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#eaeded]">
                  <span className="text-[#545b64]">Default Time to Live (TTL)</span>
                  <span className="font-medium text-[#16191f]">
                    {tableData.defaultTimeToLive && tableData.defaultTimeToLive > 0
                      ? `${tableData.defaultTimeToLive} seconds`
                      : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Edit Settings */}
      {activeTab === "edit" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Capacity Mode Update */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Capacity mode</h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="edit_capacity_mode"
                  value="PAY_PER_REQUEST"
                  checked={editThroughputMode === "PAY_PER_REQUEST"}
                  onChange={() => setEditThroughputMode("PAY_PER_REQUEST")}
                  className="mt-1 h-4 w-4 text-[#ec7211]"
                />
                <div className="space-y-1">
                  <span className="font-bold text-[13px] text-[#16191f]">On-demand (Pay per request)</span>
                  <p className="text-[12px] text-[#545b64]">
                    Automatically handles unpredictable read and write workloads.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="edit_capacity_mode"
                  value="PROVISIONED"
                  checked={editThroughputMode === "PROVISIONED"}
                  onChange={() => setEditThroughputMode("PROVISIONED")}
                  className="mt-1 h-4 w-4 text-[#ec7211]"
                />
                <div className="space-y-1 flex-1">
                  <span className="font-bold text-[13px] text-[#16191f]">Provisioned</span>
                  <p className="text-[12px] text-[#545b64]">
                    Specify predetermined read and write throughput units.
                  </p>

                  {editThroughputMode === "PROVISIONED" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                      <div className="space-y-1">
                        <label className="block text-[12px] font-bold text-[#16191f]">Read capacity units</label>
                        <input
                          type="number"
                          min="1"
                          value={editRcu}
                          onChange={(e) => setEditRcu(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                          className="w-full px-3 border border-[#eaeded] rounded text-[13px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[12px] font-bold text-[#16191f]">Write capacity units</label>
                        <input
                          type="number"
                          min="1"
                          value={editWcu}
                          onChange={(e) => setEditWcu(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                          className="w-full px-3 border border-[#eaeded] rounded text-[13px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Add Column Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Add column to schema</h2>
            <p className="text-[12px] text-[#545b64]">
              You can alter the table schema by appending new non-primary key columns.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-[#16191f]">New column name</label>
                <input
                  type="text"
                  placeholder="new_column"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="w-full px-3 border border-[#eaeded] rounded font-mono text-[13px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-[#16191f]">Data type</label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="w-full px-3 border border-[#eaeded] rounded text-[13px] bg-white font-mono"
                >
                  <option value="text">text</option>
                  <option value="int">int</option>
                  <option value="bigint">bigint</option>
                  <option value="boolean">boolean</option>
                  <option value="timestamp">timestamp</option>
                  <option value="uuid">uuid</option>
                  <option value="blob">blob</option>
                  <option value="double">double</option>
                </select>
              </div>
            </div>
          </div>

          {/* PITR & TTL Toggles */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Point-in-time recovery & Time to live</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="edit_pitr"
                  checked={editPitr}
                  onChange={(e) => setEditPitr(e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#ec7211] rounded border-[#eaeded]"
                />
                <label htmlFor="edit_pitr" className="cursor-pointer space-y-1">
                  <span className="font-bold text-[13px] text-[#16191f]">Enable Point-in-time recovery (PITR)</span>
                  <p className="text-[12px] text-[#545b64]">
                    Continuous backups for point-in-time table restoration down to the second.
                  </p>
                </label>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-[#eaeded]">
                <input
                  type="checkbox"
                  id="edit_ttl"
                  checked={editTtl}
                  onChange={(e) => setEditTtl(e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#ec7211] rounded border-[#eaeded]"
                />
                <div className="cursor-pointer space-y-1 flex-1">
                  <label htmlFor="edit_ttl" className="font-bold text-[13px] text-[#16191f]">
                    Enable Default Time to Live (TTL)
                  </label>
                  <p className="text-[12px] text-[#545b64]">
                    Rows without custom TTL expire automatically after this duration.
                  </p>

                  {editTtl && (
                    <div className="pt-2 max-w-xs space-y-1">
                      <label className="block text-[12px] font-bold text-[#16191f]">Duration (seconds)</label>
                      <input
                        type="number"
                        min="1"
                        value={editTtlSeconds}
                        onChange={(e) => setEditTtlSeconds(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                        className="w-full px-3 border border-[#eaeded] rounded text-[13px]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center px-4 rounded border border-[#545b64] text-[#16191f] font-bold text-[13px] hover:bg-[#f2f3f3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center px-5 rounded bg-[#ec7211] text-white font-bold text-[13px] hover:bg-[#eb5f07] transition-colors"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
          {Object.keys(tableData.tags || {}).length === 0 ? (
            <p className="text-[13px] text-[#545b64]">No tags assigned to this table.</p>
          ) : (
            <table className="w-full max-w-lg text-left text-[13px] border border-[#eaeded] rounded">
              <thead className="bg-[#fafafa] text-[#545b64] font-bold text-[11px] uppercase border-b border-[#eaeded]">
                <tr>
                  <th className="px-4 py-2">Key</th>
                  <th className="px-4 py-2">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {Object.entries(tableData.tags || {}).map(([key, val]) => (
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

      {/* Delete Table Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">
                Delete table: {tableData.tableName}
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#879596] hover:text-[#16191f]"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-[#fdf3f1] border-l-4 border-[#d13212] rounded text-[13px] text-[#16191f]">
              <div className="font-bold text-[#d13212]">Permanent deletion warning</div>
              <p>Deleting this table will permanently remove all rows and the schema definition from keyspace {tableData.keyspaceName}.</p>
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
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center px-4 rounded border border-[#545b64] text-[#16191f] font-bold text-[13px] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTable}
                disabled={deleteConfirmationText !== "delete" || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`inline-flex items-center justify-center px-4 rounded font-bold text-[13px] text-white transition-colors ${
                  deleteConfirmationText === "delete" && !isPending
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
