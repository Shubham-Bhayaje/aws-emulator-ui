"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RequestedServiceQuotaChange } from "../types";
import { formatQuotaDate } from "../dateUtils";

interface HistoryClientProps {
  initialHistory: RequestedServiceQuotaChange[];
}

export default function HistoryClient({ initialHistory }: HistoryClientProps) {
  const router = useRouter();
  const [history] = useState<RequestedServiceQuotaChange[]>(initialHistory);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = history.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(search.toLowerCase()) ||
      req.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      req.quotaName.toLowerCase().includes(search.toLowerCase()) ||
      (req.caseId || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || req.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "APPROVED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ecf7ed] text-[#1d8102] border border-[#a4e7a5]">
          Approved
        </span>
      );
    }
    if (s === "PENDING" || s === "CASE_OPENED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f1faff] text-[#0073bb] border border-[#9fd8f6]">
          {s === "CASE_OPENED" ? "Case opened" : "Pending"}
        </span>
      );
    }
    if (s === "DENIED" || s === "NOT_APPROVED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#fdf2f2] text-[#d13212] border border-[#f8b4b4]">
          Denied
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16191f]">Quota request history</h1>
          <p className="text-sm text-[#545b64] mt-1">
            Track and review all quota increase requests submitted for your account.
          </p>
        </div>
        <button
          onClick={() => router.refresh()}
          className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-3 rounded-[2px] transition-colors flex items-center justify-center self-start sm:self-auto"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          title="Refresh"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by request ID, service name, or quota name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 pl-8 border border-[#aab7b8] rounded-[2px] focus:outline-none focus:border-[#0073bb]"
              />
              <svg
                className="absolute left-2.5 top-2.5 text-[#545b64]"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] bg-white focus:outline-none focus:border-[#0073bb]"
            >
              <option value="ALL">All statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="CASE_OPENED">Case opened</option>
              <option value="DENIED">Denied</option>
            </select>
          </div>
          <div className="text-xs text-[#545b64]">
            Displaying {filtered.length} of {history.length} requests
          </div>
        </div>

        {/* Requests Table */}
        <div className="border border-[#eaeded] rounded overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
              <tr>
                <th className="p-3">Request ID</th>
                <th className="p-3">Service Name</th>
                <th className="p-3">Quota Name</th>
                <th className="p-3">Desired Value</th>
                <th className="p-3">Status</th>
                <th className="p-3">Case ID</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#545b64]">
                    <p className="font-semibold text-sm text-[#16191f]">No request history</p>
                    <p className="text-xs mt-1">
                      You have not submitted any quota increase requests yet. Browse{" "}
                      <Link href="/service-quotas" className="text-[#0073bb] hover:underline">
                        AWS services
                      </Link>{" "}
                      to select a quota and request an increase.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-[#f9f9f9] transition-colors">
                    <td className="p-3 font-mono text-xs font-semibold text-[#0073bb]">
                      {req.id}
                    </td>
                    <td className="p-3 font-medium text-[#16191f]">{req.serviceName}</td>
                    <td className="p-3">
                      {req.serviceCode && req.quotaCode ? (
                        <Link
                          href={`/service-quotas/services/${encodeURIComponent(
                            req.serviceCode
                          )}/${encodeURIComponent(req.quotaCode)}`}
                          className="text-[#0073bb] hover:underline"
                        >
                          {req.quotaName}
                        </Link>
                      ) : (
                        req.quotaName
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {req.desiredValue.toLocaleString()} {req.unit && req.unit !== "None" ? req.unit : ""}
                    </td>
                    <td className="p-3">{getStatusBadge(req.status)}</td>
                    <td className="p-3 font-mono text-xs text-[#545b64]">
                      {req.caseId || "-"}
                    </td>
                    <td className="p-3 text-xs text-[#545b64]">
                      <span suppressHydrationWarning>{formatQuotaDate(req.created)}</span>
                    </td>
                    <td className="p-3 text-xs text-[#545b64]">
                      <span suppressHydrationWarning>{formatQuotaDate(req.lastUpdated)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
