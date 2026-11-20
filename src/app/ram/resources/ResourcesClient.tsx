"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RAMResource } from "../types";
import { formatRAMDate } from "../dateUtils";

interface ResourcesClientProps {
  initialResources: RAMResource[];
}

export default function ResourcesClient({ initialResources }: ResourcesClientProps) {
  const router = useRouter();
  const [resources] = useState<RAMResource[]>(initialResources);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const uniqueTypes = Array.from(new Set(resources.map((r) => r.type)));

  const filtered = resources.filter((r) => {
    const matchesSearch =
      r.arn.toLowerCase().includes(search.toLowerCase()) ||
      (r.resourceShareName || "").toLowerCase().includes(search.toLowerCase()) ||
      r.resourceShareArn.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16191f]">Shared resources</h1>
          <p className="text-sm text-[#545b64] mt-1">
            Resources that you are sharing with other AWS accounts or within your AWS Organization.
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Find resources"
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] bg-white focus:outline-none focus:border-[#0073bb]"
            >
              <option value="ALL">All resource types ({resources.length})</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t} ({resources.filter((r) => r.type === t).length})
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-[#545b64]">
            {filtered.length} {filtered.length === 1 ? "resource" : "resources"}
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 border border-[#eaeded] rounded overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
              <tr>
                <th className="p-3">Resource ARN</th>
                <th className="p-3">Resource Type</th>
                <th className="p-3">Resource Share</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#545b64]">
                    <p className="font-semibold text-sm text-[#16191f]">No shared resources found</p>
                    <p className="text-xs mt-1">
                      You are not sharing any resources yet. Create a resource share and associate subnets or KMS keys to view them here.
                    </p>
                    <Link
                      href="/ram/create"
                      className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm inline-flex items-center justify-center mt-3"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    >
                      Create resource share
                    </Link>
                  </td>
                </tr>
              ) : (
                filtered.map((res) => (
                  <tr key={`${res.arn}-${res.resourceShareArn}`} className="hover:bg-[#f9f9f9]">
                    <td className="p-3 font-mono text-xs">{res.arn}</td>
                    <td className="p-3">
                      <span className="font-mono text-xs bg-[#f2f3f3] px-2 py-0.5 rounded text-[#545b64]">
                        {res.type}
                      </span>
                    </td>
                    <td className="p-3 font-medium">
                      {res.resourceShareArn ? (
                        <Link
                          href={`/ram/${encodeURIComponent(res.resourceShareArn)}`}
                          className="text-[#0073bb] hover:underline"
                        >
                          {res.resourceShareName || "Resource Share"}
                        </Link>
                      ) : (
                        res.resourceShareName || "-"
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ecf7ed] text-[#1d8102]">
                        {res.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-[#545b64]">
                      <span suppressHydrationWarning>{formatRAMDate(res.lastUpdatedTime)}</span>
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
