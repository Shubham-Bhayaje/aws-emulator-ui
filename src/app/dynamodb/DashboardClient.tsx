"use client";

import Link from "next/link";
import { TableSummary } from "./types";

interface DashboardClientProps {
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

export default function DashboardClient({
  tables,
  totalItemCount,
  totalSizeBytes,
  error,
}: DashboardClientProps) {
  const activeTablesCount = tables.filter((t) => t.status.toUpperCase() === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Amazon DynamoDB</h1>
          <p className="text-[14px] text-[#545b64] mt-0.5">
            Fast, flexible NoSQL database service for single-digit millisecond performance at any scale.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dynamodb/tables/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            Create table
          </Link>
          <Link
            href="/dynamodb/explore"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
          >
            Explore items
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border-l-4 border-[#d13212] text-[13px] text-[#d13212] rounded">
          {error}
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Total tables
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {tables.length}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">
            In current Region
          </div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Active tables
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {activeTablesCount}
          </div>
          <div className="text-[12px] text-[#1d8102] mt-1 font-medium">
            Ready for read/write requests
          </div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Total items
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {totalItemCount.toLocaleString()}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">
            Aggregated item count
          </div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Total storage
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {formatBytes(totalSizeBytes)}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">
            Data and secondary indexes
          </div>
        </div>
      </div>

      {/* Tables Table Preview */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#eaeded] flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Tables</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Review your provisioned tables and storage.
            </p>
          </div>
          <Link
            href="/dynamodb/tables"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3] transition-colors"
          >
            View all tables ({tables.length})
          </Link>
        </div>

        {tables.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-[14px] text-[#545b64]">No DynamoDB tables found in this Region.</p>
            <div>
              <Link
                href="/dynamodb/tables/create"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
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
                  <th className="px-5 py-3">Partition key</th>
                  <th className="px-5 py-3">Sort key</th>
                  <th className="px-5 py-3">Capacity mode</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {tables.slice(0, 5).map((t) => (
                  <tr key={t.name} className="hover:bg-[#f2f8fd] transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/dynamodb/tables/${encodeURIComponent(t.name)}`}
                        className="font-bold text-[#0073bb] hover:underline"
                      >
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
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
                    <td className="px-5 py-3 font-mono text-[12px] text-[#16191f]">
                      {t.partitionKey} <span className="text-[#545b64] font-sans">({t.partitionKeyType})</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px] text-[#16191f]">
                      {t.sortKey ? (
                        <>
                          {t.sortKey} <span className="text-[#545b64] font-sans">({t.sortKeyType})</span>
                        </>
                      ) : (
                        <span className="text-[#879596]">–</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#16191f]">
                      {t.billingMode === "PAY_PER_REQUEST" ? "On-demand" : "Provisioned"}
                    </td>
                    <td className="px-5 py-3 text-[#16191f]">
                      {t.itemCount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-[#16191f]">
                      {formatBytes(t.sizeBytes)}
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <Link
                        href={`/dynamodb/tables/${encodeURIComponent(t.name)}`}
                        className="text-[12px] text-[#0073bb] hover:underline font-medium"
                      >
                        Details
                      </Link>
                      <span className="text-[#eaeded]">|</span>
                      <Link
                        href={`/dynamodb/tables/${encodeURIComponent(t.name)}?tab=items`}
                        className="text-[12px] text-[#0073bb] hover:underline font-medium"
                      >
                        Explore items
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Educational & Quick Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm space-y-2">
          <h3 className="text-[15px] font-bold text-[#16191f]">NoSQL Performance</h3>
          <p className="text-[13px] text-[#545b64]">
            DynamoDB is a key-value and document database that delivers single-digit millisecond performance at any scale with automatic data partitioning.
          </p>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm space-y-2">
          <h3 className="text-[15px] font-bold text-[#16191f]">Flexible Billing Modes</h3>
          <p className="text-[13px] text-[#545b64]">
            Select On-Demand capacity for unpredictable workloads or Provisioned capacity with RCU/WCU to lock in predictable throughput and cost.
          </p>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm space-y-2">
          <h3 className="text-[15px] font-bold text-[#16191f]">Continuous Resilience</h3>
          <p className="text-[13px] text-[#545b64]">
            Protect mission-critical data with Point-in-Time Recovery (PITR), on-demand backups, and Time to Live (TTL) automatic item expiration.
          </p>
        </div>
      </div>
    </div>
  );
}
