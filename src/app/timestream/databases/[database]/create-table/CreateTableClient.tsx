"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTableAction } from "../../../actions";

interface CreateTableClientProps {
  databaseName: string;
}

export default function CreateTableClient({ databaseName }: CreateTableClientProps) {
  const router = useRouter();
  const [tableName, setTableName] = useState("");

  // Memory store retention
  const [memoryValue, setMemoryValue] = useState<number>(24);
  const [memoryUnit, setMemoryUnit] = useState<"hours" | "days">("hours");

  // Magnetic store retention
  const [magneticValue, setMagneticValue] = useState<number>(365);
  const [magneticUnit, setMagneticUnit] = useState<"days" | "months" | "years">("days");

  // Magnetic store writes
  const [enableMagneticWrites, setEnableMagneticWrites] = useState(false);

  // Tags
  const [tags, setTags] = useState<{ Key: string; Value: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAddTag() {
    setTags([...tags, { Key: "", Value: "" }]);
  }

  function handleRemoveTag(index: number) {
    setTags(tags.filter((_, i) => i !== index));
  }

  function handleTagChange(index: number, field: "Key" | "Value", val: string) {
    const updated = [...tags];
    updated[index][field] = val;
    setTags(updated);
  }

  function calculateMemoryHours(): number {
    return memoryUnit === "days" ? memoryValue * 24 : memoryValue;
  }

  function calculateMagneticDays(): number {
    if (magneticUnit === "months") return magneticValue * 30;
    if (magneticUnit === "years") return magneticValue * 365;
    return magneticValue;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const tbl = tableName.trim();
    if (!tbl) {
      setError("Table name is required.");
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(tbl)) {
      setError(
        "Table name can only contain alphanumeric characters, underscores (_), hyphens (-), and periods (.)."
      );
      return;
    }

    const memoryHours = calculateMemoryHours();
    if (memoryHours < 1 || memoryHours > 8760) {
      setError("Memory store retention must be between 1 hour and 8760 hours (1 year).");
      return;
    }

    const magneticDays = calculateMagneticDays();
    if (magneticDays < 1 || magneticDays > 73000) {
      setError("Magnetic store retention must be between 1 day and 73000 days (200 years).");
      return;
    }

    startTransition(async () => {
      const res = await createTableAction({
        databaseName,
        tableName: tbl,
        memoryStoreRetentionPeriodInHours: memoryHours,
        magneticStoreRetentionPeriodInDays: magneticDays,
        enableMagneticStoreWrites: enableMagneticWrites,
        tags: tags.filter((t) => t.Key.trim() && t.Value.trim()),
      });

      if (res.success) {
        router.push(
          `/timestream/databases/${encodeURIComponent(databaseName)}/tables/${encodeURIComponent(
            tbl
          )}`
        );
      } else {
        setError(res.error || "Failed to create table.");
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Create table</h1>
        <p className="text-[14px] text-[#545b64] mt-0.5">
          Tables contain the time series data points, metrics, and dimensions in Amazon Timestream.
        </p>
      </div>

      {error && (
        <div className="bg-[#fdf3f2] border-l-4 border-[#d13212] p-4 text-[13px] text-[#d13212] rounded shadow-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Table details Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-5">
          <h2 className="text-[18px] font-bold text-[#16191f] border-b border-[#eaeded] pb-3">
            Table details
          </h2>

          <div>
            <label className="block text-[13px] font-bold text-[#545b64] mb-1">
              Database name
            </label>
            <div className="text-[14px] font-bold text-[#16191f] bg-[#fafafa] border border-[#eaeded] px-3 py-1.5 rounded w-full max-w-md">
              {databaseName}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Table name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. host_metrics"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              className="w-full max-w-md px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
              required
            />
            <p className="text-[12px] text-[#545b64] mt-1">
              Must be between 1 and 64 characters long and can contain alphanumeric characters, underscores (_), hyphens (-), and periods (.).
            </p>
          </div>
        </div>

        {/* Data retention Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-5">
          <h2 className="text-[18px] font-bold text-[#16191f] border-b border-[#eaeded] pb-3">
            Data retention
          </h2>
          <p className="text-[13px] text-[#545b64]">
            Timestream automatically tiers data from the in-memory store to the cost-optimized magnetic store based on your retention rules.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Memory Store Retention */}
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-[#16191f]">
                Memory store retention <span className="text-[#d13212]">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={memoryUnit === "days" ? 365 : 8760}
                  value={memoryValue}
                  onChange={(e) => setMemoryValue(Number(e.target.value))}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="w-32 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                  required
                />
                <select
                  value={memoryUnit}
                  onChange={(e) => setMemoryUnit(e.target.value as "hours" | "days")}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <p className="text-[12px] text-[#545b64]">
                Between 1 hour and 8,760 hours (1 year). Data is stored in memory for low-latency point-in-time queries.
              </p>
            </div>

            {/* Magnetic Store Retention */}
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-[#16191f]">
                Magnetic store retention <span className="text-[#d13212]">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={magneticUnit === "years" ? 200 : magneticUnit === "months" ? 2400 : 73000}
                  value={magneticValue}
                  onChange={(e) => setMagneticValue(Number(e.target.value))}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="w-32 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                  required
                />
                <select
                  value={magneticUnit}
                  onChange={(e) => setMagneticUnit(e.target.value as "days" | "months" | "years")}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
              <p className="text-[12px] text-[#545b64]">
                Between 1 day and 73,000 days (200 years). Cost-effective storage for historical time-series analytics.
              </p>
            </div>
          </div>

          {/* Magnetic Store Writes Toggle */}
          <div className="pt-2 border-t border-[#eaeded]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableMagneticWrites}
                onChange={(e) => setEnableMagneticWrites(e.target.checked)}
                className="mt-1 accent-[#ec7211]"
              />
              <div>
                <span className="text-[13px] font-bold text-[#16191f]">
                  Enable magnetic store writes
                </span>
                <p className="text-[12px] text-[#545b64]">
                  Enables ingestion of late-arriving data whose timestamps precede the memory store retention window directly into the magnetic store.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Tags Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
            <div>
              <h2 className="text-[18px] font-bold text-[#16191f]">Tags - optional</h2>
              <p className="text-[12px] text-[#545b64]">
                Assign key-value labels to organize, track costs, and filter tables.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[13px] font-bold text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
            >
              Add new tag
            </button>
          </div>

          {tags.length === 0 ? (
            <p className="text-[13px] text-[#545b64]">No tags applied.</p>
          ) : (
            <div className="space-y-3">
              {tags.map((t, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Key"
                    value={t.Key}
                    onChange={(e) => handleTagChange(idx, "Key", e.target.value)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="flex-1 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={t.Value}
                    onChange={(e) => handleTagChange(idx, "Value", e.target.value)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="flex-1 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="px-3 text-[13px] font-bold text-[#d13212] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/timestream/databases/${encodeURIComponent(databaseName)}`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create table"}
          </button>
        </div>
      </form>
    </div>
  );
}
