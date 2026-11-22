"use client";

import { useState } from "react";
import Link from "next/link";
import { DxLagItem, listLagsAction } from "../dx-actions";

interface Props {
  initialLags: DxLagItem[];
}

export default function LagsClient({ initialLags }: Props) {
  const [lags, setLags] = useState<DxLagItem[]>(initialLags);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredLags = lags.filter((l) => {
    const q = searchTerm.toLowerCase();
    return (
      l.lagId.toLowerCase().includes(q) ||
      (l.lagName || "").toLowerCase().includes(q) ||
      (l.lagState || "").toLowerCase().includes(q) ||
      (l.location || "").toLowerCase().includes(q)
    );
  });

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await listLagsAction();
      if (res.success) {
        setLags(res.lags);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link href="/direct-connect" className="hover:text-[#0073bb]">
          Direct Connect
        </Link>
        <span>&gt;</span>
        <span className="text-gray-900 font-medium">LAGs</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#eaeded] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">LAGs (Link Aggregation Groups)</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            A Link Aggregation Group (LAG) bundles multiple dedicated connections into a single managed logical link using the Link Aggregation Control Protocol (LACP - IEEE 802.3ad).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("Creating a LAG requires multiple dedicated connections at the same colocation facility and AWS port speed. (Scaffolded in emulator)")}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors shadow-sm"
          >
            Create LAG
          </button>
        </div>
      </div>

      {/* Architecture note */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 space-y-1">
        <div className="font-semibold">About Link Aggregation Groups in AWS:</div>
        <div>
          LAGs treat up to four 10 Gbps or 100 Gbps dedicated physical connections as a single high-bandwidth connection (e.g. 4x 100 Gbps = 400 Gbps aggregated throughput). All links in a LAG must terminate on the same AWS device at the same colocation facility.
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search LAGs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-gray-300 rounded focus:outline-none focus:border-[#ec7211]"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="px-3 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden text-[13px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f2f3f3] text-[#545b64] text-xs uppercase tracking-wider border-b border-[#eaeded]">
              <th className="py-2.5 px-4 font-semibold">Name</th>
              <th className="py-2.5 px-4 font-semibold">LAG ID</th>
              <th className="py-2.5 px-4 font-semibold">State</th>
              <th className="py-2.5 px-4 font-semibold">Bandwidth</th>
              <th className="py-2.5 px-4 font-semibold">Location</th>
              <th className="py-2.5 px-4 font-semibold">Number of connections</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filteredLags.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  <p className="font-semibold text-gray-700">No LAGs found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Combine multiple physical ports into a Link Aggregation Group for active-active link aggregation.
                  </p>
                </td>
              </tr>
            ) : (
              filteredLags.map((lag) => (
                <tr key={lag.lagId} className="hover:bg-gray-50">
                  <td className="py-2.5 px-4 font-medium text-[#16191f]">{lag.lagName}</td>
                  <td className="py-2.5 px-4 font-mono text-[12px] text-gray-600">{lag.lagId}</td>
                  <td className="py-2.5 px-4 capitalize">{lag.lagState}</td>
                  <td className="py-2.5 px-4 font-mono">{lag.connectionsBandwidth}</td>
                  <td className="py-2.5 px-4">{lag.location}</td>
                  <td className="py-2.5 px-4 font-mono">{lag.numberOfConnections}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
