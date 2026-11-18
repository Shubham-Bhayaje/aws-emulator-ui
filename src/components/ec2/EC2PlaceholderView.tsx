/**
 * src/components/ec2/EC2PlaceholderView.tsx – Standard authentic AWS EC2 console view.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Props {
  title: string;
  description: string;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  columns: string[];
  rows?: Array<Record<string, string>>;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function EC2PlaceholderView({
  title,
  description,
  primaryActionLabel,
  primaryActionHref,
  columns,
  rows = [],
  emptyTitle,
  emptyDescription,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = rows.filter((r) =>
    Object.values(r).some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Live Badge */}
      <div className="flex items-center justify-between bg-white border border-[#d5dbdb] px-4 py-2.5 rounded-sm awsui-shadow">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1d8102]" />
            <span className="text-[12px] font-semibold text-[#16191f]">
              Live AWS Emulator Connected (127.0.0.1:9297)
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
      </div>

      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        {/* Header Bar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-[#16191f]">{title}</h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">{description}</p>
          </div>

          {primaryActionLabel && (
            <Link
              href={primaryActionHref || "/ec2/launch"}
              className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] transition-colors"
            >
              {primaryActionLabel}
            </Link>
          )}
        </div>

        {/* Filter */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <input
            type="text"
            placeholder={`Filter ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="py-2.5 px-4">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f2f3f3] text-[#545b64] mb-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <h3 className="text-[15px] font-bold text-[#16191f]">
                      {emptyTitle || `No ${title.toLowerCase()} found`}
                    </h3>
                    <p className="text-[12px] text-[#545b64] mt-1 max-w-md mx-auto">
                      {emptyDescription || `There are no ${title.toLowerCase()} currently configured in region us-east-1.`}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#f2f8fd]">
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="py-3 px-4 font-mono text-[12px]">
                        {row[col] || "—"}
                      </td>
                    ))}
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
