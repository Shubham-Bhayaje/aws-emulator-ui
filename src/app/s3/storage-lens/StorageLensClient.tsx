/**
 * src/app/s3/storage-lens/StorageLensClient.tsx – S3 Storage Lens Client Component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import type { S3BucketSummary } from "../types";

export function StorageLensClient({ buckets }: { buckets: S3BucketSummary[] }) {
  const [activeRange, setActiveRange] = useState("30d");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">
            Amazon S3 Storage Lens
          </h1>
          <p className="text-[13px] text-[#545b64] mt-1 max-w-4xl">
            S3 Storage Lens provides organization-wide visibility into object storage usage and
            activity trends, and makes actionable recommendations to optimize costs and apply data
            protection best practices.
          </p>
        </div>
        <div>
          <button
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
          >
            Create dashboard
          </button>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm space-y-1">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
            Total storage
          </div>
          <div className="text-[24px] font-bold text-[#16191f]">Active</div>
          <div className="text-[11px] text-[#545b64]">Across {buckets.length} bucket(s)</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm space-y-1">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
            Total buckets
          </div>
          <div className="text-[24px] font-bold text-[#0972d3]">{buckets.length}</div>
          <div className="text-[11px] text-[#545b64]">Region: us-east-1</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm space-y-1">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
            Encrypted bytes
          </div>
          <div className="text-[24px] font-bold text-[#1d8102]">100%</div>
          <div className="text-[11px] text-[#545b64]">Server-side encryption enabled</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm space-y-1">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
            Non-current version bytes
          </div>
          <div className="text-[24px] font-bold text-[#16191f]">0 B</div>
          <div className="text-[11px] text-[#545b64]">Version history preserved</div>
        </div>
      </div>

      {/* Default Dashboard Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eaeded] bg-[#fafafa] flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#16191f]">
            Dashboards (1)
          </h2>
          <span className="text-[12px] text-[#545b64]">Updated daily</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-semibold">
                <th className="py-2.5 px-4">Dashboard name</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Scope</th>
                <th className="py-2.5 px-4">Home Region</th>
                <th className="py-2.5 px-4">Export metrics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              <tr className="hover:bg-[#f2f8fd]">
                <td className="py-3 px-4 font-semibold text-[#0972d3]">
                  default-account-dashboard
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]">
                    Enabled
                  </span>
                </td>
                <td className="py-3 px-4 text-[#545b64]">Entire account (000000000000)</td>
                <td className="py-3 px-4 text-[#545b64]">us-east-1</td>
                <td className="py-3 px-4 text-[#545b64]">Disabled</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
