/**
 * src/components/ec2/InstanceTypesClient.tsx – Instance Types Catalog Client.
 * Displays real instance types queried from AWS emulator.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";

interface InstanceTypeSpec {
  name: string;
  vCpu: number;
  memoryGib: number;
  arch: string;
  networkPerf: string;
  currentGeneration: boolean;
}

interface Props {
  types: InstanceTypeSpec[];
  isLive: boolean;
}

export default function InstanceTypesClient({ types, isLive }: Props) {
  const [search, setSearch] = useState("");

  const filtered = types.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.arch.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Live Badge */}
      <div className="flex items-center justify-between bg-white border border-[#d5dbdb] px-4 py-2.5 rounded-sm awsui-shadow">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isLive ? "bg-[#1d8102]" : "bg-[#ec7211]"
              }`}
            />
            <span className="text-[12px] font-semibold text-[#16191f]">
              {isLive ? "Live Instance Types (AWS Emulator)" : "Offline (Check AWS Emulator Connection)"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">
            Total supported: {types.length} types
          </span>
        </div>
      </div>

      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-[#16191f]">Instance Types</h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Amazon EC2 provides a wide selection of instance types optimized to fit different use cases.
            </p>
          </div>
          <Link
            href="/ec2/launch"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors"
          >
            Launch with instance type
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <input
            type="text"
            placeholder="Search instance type name (e.g. t3.micro)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Instance type</th>
                <th className="py-2.5 px-3">vCPUs</th>
                <th className="py-2.5 px-3">Memory (GiB)</th>
                <th className="py-2.5 px-3">Architecture</th>
                <th className="py-2.5 px-3">Network performance</th>
                <th className="py-2.5 px-3">Generation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.map((t) => (
                <tr key={t.name} className="hover:bg-[#f2f8fd]">
                  <td className="py-3 px-4 font-mono font-bold text-[#0073bb]">{t.name}</td>
                  <td className="py-3 px-3 font-mono font-semibold">{t.vCpu}</td>
                  <td className="py-3 px-3 font-mono">{t.memoryGib} GiB</td>
                  <td className="py-3 px-3 font-mono text-[12px]">{t.arch}</td>
                  <td className="py-3 px-3 text-[#545b64]">{t.networkPerf}</td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#16191f]">
                      {t.currentGeneration ? "Current gen" : "Previous gen"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
