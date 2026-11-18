/**
 * src/components/ec2/InstanceTypesClient.tsx – Instance Types Catalog Client.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";

interface InstanceTypeSpec {
  name: string;
  family: string;
  vCpu: number;
  memoryGib: number;
  arch: "x86_64" | "arm64" | "both";
  storage: string;
  networkPerf: string;
  ebsOptimized: boolean;
  freeTier: boolean;
}

const INSTANCE_TYPES: InstanceTypeSpec[] = [
  { name: "t3.nano", family: "General Purpose", vCpu: 2, memoryGib: 0.5, arch: "x86_64", storage: "EBS only", networkPerf: "Up to 5 Gbps", ebsOptimized: true, freeTier: false },
  { name: "t3.micro", family: "General Purpose", vCpu: 2, memoryGib: 1.0, arch: "x86_64", storage: "EBS only", networkPerf: "Up to 5 Gbps", ebsOptimized: true, freeTier: true },
  { name: "t3.small", family: "General Purpose", vCpu: 2, memoryGib: 2.0, arch: "x86_64", storage: "EBS only", networkPerf: "Up to 5 Gbps", ebsOptimized: true, freeTier: false },
  { name: "t3.medium", family: "General Purpose", vCpu: 2, memoryGib: 4.0, arch: "x86_64", storage: "EBS only", networkPerf: "Up to 5 Gbps", ebsOptimized: true, freeTier: false },
  { name: "t3.large", family: "General Purpose", vCpu: 2, memoryGib: 8.0, arch: "x86_64", storage: "EBS only", networkPerf: "Up to 5 Gbps", ebsOptimized: true, freeTier: false },
  { name: "t3.xlarge", family: "General Purpose", vCpu: 4, memoryGib: 16.0, arch: "x86_64", storage: "EBS only", networkPerf: "Up to 5 Gbps", ebsOptimized: true, freeTier: false },
  { name: "t4g.nano", family: "General Purpose", vCpu: 2, memoryGib: 0.5, arch: "arm64", storage: "EBS only", networkPerf: "Up to 5 Gbps", ebsOptimized: true, freeTier: false },
  { name: "t4g.micro", family: "General Purpose", vCpu: 2, memoryGib: 1.0, arch: "arm64", storage: "EBS only", networkPerf: "Up to 5 Gbps", ebsOptimized: true, freeTier: true },
  { name: "t4g.small", family: "General Purpose", vCpu: 2, memoryGib: 2.0, arch: "arm64", storage: "EBS only", networkPerf: "Up to 5 Gbps", ebsOptimized: true, freeTier: false },
  { name: "t4g.medium", family: "General Purpose", vCpu: 2, memoryGib: 4.0, arch: "arm64", storage: "EBS only", networkPerf: "Up to 5 Gbps", ebsOptimized: true, freeTier: false },
  { name: "m5.large", family: "General Purpose", vCpu: 2, memoryGib: 8.0, arch: "x86_64", storage: "EBS only", networkPerf: "Up to 10 Gbps", ebsOptimized: true, freeTier: false },
  { name: "m5.xlarge", family: "General Purpose", vCpu: 4, memoryGib: 16.0, arch: "x86_64", storage: "EBS only", networkPerf: "Up to 10 Gbps", ebsOptimized: true, freeTier: false },
  { name: "c5.large", family: "Compute Optimized", vCpu: 2, memoryGib: 4.0, arch: "x86_64", storage: "EBS only", networkPerf: "Up to 10 Gbps", ebsOptimized: true, freeTier: false },
  { name: "c5.xlarge", family: "Compute Optimized", vCpu: 4, memoryGib: 8.0, arch: "x86_64", storage: "EBS only", networkPerf: "Up to 10 Gbps", ebsOptimized: true, freeTier: false },
  { name: "r5.large", family: "Memory Optimized", vCpu: 2, memoryGib: 16.0, arch: "x86_64", storage: "EBS only", networkPerf: "Up to 10 Gbps", ebsOptimized: true, freeTier: false },
];

export default function InstanceTypesClient() {
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState("all");

  const filtered = INSTANCE_TYPES.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchFamily = familyFilter === "all" || t.family === familyFilter;
    return matchSearch && matchFamily;
  });

  return (
    <div className="space-y-6">
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
            className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07]"
          >
            Launch with instance type
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa] flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search instance type name (e.g. t3.micro)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
          />
          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
          >
            <option value="all">All families</option>
            <option value="General Purpose">General Purpose</option>
            <option value="Compute Optimized">Compute Optimized</option>
            <option value="Memory Optimized">Memory Optimized</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Instance type</th>
                <th className="py-2.5 px-3">Family</th>
                <th className="py-2.5 px-3">vCPUs</th>
                <th className="py-2.5 px-3">Memory (GiB)</th>
                <th className="py-2.5 px-3">Architecture</th>
                <th className="py-2.5 px-3">Storage</th>
                <th className="py-2.5 px-3">Network performance</th>
                <th className="py-2.5 px-3">Free tier eligible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.map((t) => (
                <tr key={t.name} className="hover:bg-[#f2f8fd]">
                  <td className="py-3 px-4 font-mono font-bold text-[#0073bb]">{t.name}</td>
                  <td className="py-3 px-3 text-[#545b64]">{t.family}</td>
                  <td className="py-3 px-3 font-mono font-semibold">{t.vCpu}</td>
                  <td className="py-3 px-3 font-mono">{t.memoryGib} GiB</td>
                  <td className="py-3 px-3 font-mono text-[12px]">{t.arch}</td>
                  <td className="py-3 px-3 text-[#545b64]">{t.storage}</td>
                  <td className="py-3 px-3 text-[#545b64]">{t.networkPerf}</td>
                  <td className="py-3 px-3">
                    {t.freeTier ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                        Free tier eligible
                      </span>
                    ) : (
                      <span className="text-[#545b64]">—</span>
                    )}
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
