"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TableSummary, RecordInput } from "../../../../types";
import { deleteTableAction, writeRecordsAction } from "../../../../actions";

interface TableDetailClientProps {
  table: TableSummary;
}

export default function TableDetailClient({ table }: TableDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "write" | "monitoring" | "tags">("overview");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState("");

  // Edit retention notice modal
  const [showEditNotice, setShowEditNotice] = useState(false);

  // Write record state
  const [measureName, setMeasureName] = useState("cpu_utilization");
  const [measureValue, setMeasureValue] = useState("78.5");
  const [measureValueType, setMeasureValueType] = useState<"DOUBLE" | "BIGINT" | "VARCHAR" | "BOOLEAN">("DOUBLE");
  const [dimensions, setDimensions] = useState<{ Name: string; Value: string }[]>([
    { Name: "host", Value: "server-01" },
    { Name: "region", Value: "us-east-1" },
  ]);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  function handleDeleteTable() {
    if (confirmDeleteInput !== table.TableName) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteTableAction(table.DatabaseName, table.TableName);
      if (res.success) {
        router.push(`/timestream/databases/${encodeURIComponent(table.DatabaseName)}`);
      } else {
        setError(res.error || "Failed to delete table.");
      }
    });
  }

  function handleAddDimension() {
    setDimensions([...dimensions, { Name: "", Value: "" }]);
  }

  function handleRemoveDimension(index: number) {
    setDimensions(dimensions.filter((_, i) => i !== index));
  }

  function handleDimensionChange(index: number, field: "Name" | "Value", val: string) {
    const updated = [...dimensions];
    updated[index][field] = val;
    setDimensions(updated);
  }

  function handleIngestRecord(e: React.FormEvent) {
    e.preventDefault();
    setIngestSuccess(null);
    setError(null);

    const record: RecordInput = {
      MeasureName: measureName.trim(),
      MeasureValue: measureValue.trim(),
      MeasureValueType: measureValueType,
      Time: String(Date.now()),
      TimeUnit: "MILLISECONDS",
      Dimensions: dimensions.filter((d) => d.Name.trim() && d.Value.trim()),
    };

    startTransition(async () => {
      const res = await writeRecordsAction({
        databaseName: table.DatabaseName,
        tableName: table.TableName,
        records: [record],
      });

      if (res.success) {
        const stats = res.recordsIngested;
        setIngestSuccess(
          `Successfully ingested record into ${table.TableName} (Total: ${stats?.Total ?? 1}, MemoryStore: ${stats?.MemoryStore ?? 1}, MagneticStore: ${stats?.MagneticStore ?? 0})`
        );
      } else {
        setError(res.error || "Failed to ingest record.");
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
            <h1 className="text-[24px] font-bold text-[#16191f]">{table.TableName}</h1>
            <span className="text-[12px] font-semibold px-2 py-0.5 rounded bg-[#f2fcf3] text-[#1d8102] border border-[#a2e19c]">
              {table.TableStatus}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Database:{" "}
            <Link
              href={`/timestream/databases/${encodeURIComponent(table.DatabaseName)}`}
              className="text-[#0073bb] hover:underline font-bold"
            >
              {table.DatabaseName}
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("write")}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
          >
            Write sample records
          </button>
          <button
            onClick={() => setShowEditNotice(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-bold text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
          >
            Edit retention
          </button>
          <button
            onClick={() => {
              setConfirmDeleteInput("");
              setShowDeleteModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-bold text-[#d13212] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
          >
            Delete table
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Status
          </div>
          <div className="text-[20px] font-bold text-[#1d8102] mt-1">{table.TableStatus}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Ready for queries and writes</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Memory Retention
          </div>
          <div className="text-[20px] font-bold text-[#16191f] mt-1">
            {table.RetentionProperties?.MemoryStoreRetentionPeriodInHours || 24} hours
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">In-memory hot store</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Magnetic Retention
          </div>
          <div className="text-[20px] font-bold text-[#16191f] mt-1">
            {table.RetentionProperties?.MagneticStoreRetentionPeriodInDays || 365} days
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">Historical cold store</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Created
          </div>
          <div className="text-[13px] font-bold text-[#16191f] mt-2">
            {table.CreationTime ? new Date(table.CreationTime).toLocaleDateString() : "—"}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">
            {table.CreationTime ? new Date(table.CreationTime).toLocaleTimeString() : ""}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded] flex gap-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("write")}
          className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
            activeTab === "write"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Write records
        </button>
        <button
          onClick={() => setActiveTab("monitoring")}
          className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
            activeTab === "monitoring"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Monitoring
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

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f] border-b border-[#eaeded] pb-3">
              Table properties
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
              <div>
                <span className="text-[#545b64] block font-medium">Table name</span>
                <span className="text-[#16191f] font-bold">{table.TableName}</span>
              </div>
              <div>
                <span className="text-[#545b64] block font-medium">Database name</span>
                <span className="text-[#16191f] font-bold">{table.DatabaseName}</span>
              </div>
              <div>
                <span className="text-[#545b64] block font-medium">Amazon Resource Name (ARN)</span>
                <span className="text-[#16191f] font-mono text-[12px] break-all">{table.Arn}</span>
              </div>
              <div>
                <span className="text-[#545b64] block font-medium">Magnetic store writes</span>
                <span className="text-[#16191f]">
                  {table.MagneticStoreWriteProperties?.EnableMagneticStoreWrites
                    ? "Enabled (late-arriving records accepted)"
                    : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f] border-b border-[#eaeded] pb-3">
              Storage tiering configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
              <div className="border border-[#eaeded] rounded p-4 bg-[#fafafa]">
                <div className="font-bold text-[#16191f] text-[14px]">Memory Store</div>
                <div className="text-[24px] font-bold text-[#16191f] mt-1">
                  {table.RetentionProperties?.MemoryStoreRetentionPeriodInHours || 24} hours
                </div>
                <p className="text-[12px] text-[#545b64] mt-2">
                  High-throughput, in-memory retention tier designed for sub-second dashboards and point-in-time anomaly detection.
                </p>
              </div>

              <div className="border border-[#eaeded] rounded p-4 bg-[#fafafa]">
                <div className="font-bold text-[#16191f] text-[14px]">Magnetic Store</div>
                <div className="text-[24px] font-bold text-[#16191f] mt-1">
                  {table.RetentionProperties?.MagneticStoreRetentionPeriodInDays || 365} days
                </div>
                <p className="text-[12px] text-[#545b64] mt-2">
                  Cost-optimized historical storage tier automatically ingested as records age past the memory store window.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Write Records Utility */}
      {activeTab === "write" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-5">
          <div className="border-b border-[#eaeded] pb-3">
            <h2 className="text-[18px] font-bold text-[#16191f]">
              Write time-series records
            </h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Directly ingest real time-series data points into this table via the AWS SDK <code className="font-mono bg-[#f2f3f3] px-1 py-0.5 rounded">WriteRecords</code> API.
            </p>
          </div>

          {ingestSuccess && (
            <div className="bg-[#f2fcf3] border-l-4 border-[#1d8102] p-4 text-[13px] text-[#1d8102] rounded">
              {ingestSuccess}
            </div>
          )}

          <form onSubmit={handleIngestRecord} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Measure Name <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. cpu_utilization"
                  value={measureName}
                  onChange={(e) => setMeasureName(e.target.value)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Measure Value Type
                </label>
                <select
                  value={measureValueType}
                  onChange={(e) => setMeasureValueType(e.target.value as any)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                >
                  <option value="DOUBLE">DOUBLE (Numeric decimal)</option>
                  <option value="BIGINT">BIGINT (Integer)</option>
                  <option value="VARCHAR">VARCHAR (Text)</option>
                  <option value="BOOLEAN">BOOLEAN (True / False)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Measure Value <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 78.5"
                value={measureValue}
                onChange={(e) => setMeasureValue(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                required
              />
            </div>

            {/* Dimensions */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-bold text-[#16191f]">
                  Dimensions (Attributes)
                </label>
                <button
                  type="button"
                  onClick={handleAddDimension}
                  style={{ height: "28px", minHeight: "28px", maxHeight: "28px" }}
                  className="px-2 text-[12px] font-bold text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                >
                  + Add Dimension
                </button>
              </div>

              <div className="space-y-2">
                {dimensions.map((dim, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Dimension name (e.g. host)"
                      value={dim.Name}
                      onChange={(e) => handleDimensionChange(idx, "Name", e.target.value)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      className="flex-1 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                    />
                    <input
                      type="text"
                      placeholder="Dimension value (e.g. server-01)"
                      value={dim.Value}
                      onChange={(e) => handleDimensionChange(idx, "Value", e.target.value)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      className="flex-1 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDimension(idx)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      className="px-3 text-[12px] font-bold text-[#d13212] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm disabled:opacity-50"
              >
                {isPending ? "Ingesting..." : "Ingest record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Monitoring */}
      {activeTab === "monitoring" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
            <div>
              <h2 className="text-[18px] font-bold text-[#16191f]">
                Operational CloudWatch metrics
              </h2>
              <p className="text-[12px] text-[#545b64]">
                Real-time ingestion throughput, storage consumption, and query latencies.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
              Available after CloudWatch is built
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-[#eaeded] rounded p-4 text-center">
              <div className="text-[12px] font-bold text-[#545b64]">Ingested Bytes</div>
              <div className="text-[20px] font-bold text-[#16191f] mt-2">Active</div>
              <div className="text-[11px] text-[#545b64] mt-1">Live streaming ingestion</div>
            </div>
            <div className="border border-[#eaeded] rounded p-4 text-center">
              <div className="text-[12px] font-bold text-[#545b64]">System Errors</div>
              <div className="text-[20px] font-bold text-[#1d8102] mt-2">0</div>
              <div className="text-[11px] text-[#545b64] mt-1">5xx error rate</div>
            </div>
            <div className="border border-[#eaeded] rounded p-4 text-center">
              <div className="text-[12px] font-bold text-[#545b64]">User Errors</div>
              <div className="text-[20px] font-bold text-[#1d8102] mt-2">0</div>
              <div className="text-[11px] text-[#545b64] mt-1">4xx rejection rate</div>
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
          <p className="text-[13px] text-[#545b64]">No tags applied to this table.</p>
        </div>
      )}

      {/* Delete Table Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete table: {table.TableName}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this table? All time series telemetry data will be permanently destroyed. This action cannot be undone.
            </p>
            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1.5 py-0.5 rounded font-mono text-[#d13212]">{table.TableName}</code> below:
              </label>
              <input
                type="text"
                placeholder={table.TableName}
                value={confirmDeleteInput}
                onChange={(e) => setConfirmDeleteInput(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#d13212]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTable}
                disabled={confirmDeleteInput !== table.TableName || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`px-4 text-[13px] font-bold text-white rounded transition-colors ${
                  confirmDeleteInput === table.TableName && !isPending
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

      {/* Edit Retention Unsupported Notice */}
      {showEditNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Operation Not Supported
            </h3>
            <div className="bg-[#f2f8fd] border-l-4 border-[#0073bb] p-3 text-[13px] text-[#16191f]">
              <code>UpdateTable</code> is scaffolded in the AWS Emulator, but not implemented in this local emulator version.
            </div>
            <p className="text-[13px] text-[#545b64]">
              Modifying memory or magnetic retention policies on existing tables is not currently supported by the local emulator engine. To change retention, please create a new table with your desired settings.
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
