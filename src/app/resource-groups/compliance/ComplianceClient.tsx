"use client";

import React, { useState } from "react";
import Link from "next/link";

interface ComplianceClientProps {
  buckets: string[];
}

export function ComplianceClient({ buckets }: ComplianceClientProps) {
  const [selectedBucket, setSelectedBucket] = useState(buckets[0] || "");
  const [reportBanner, setReportBanner] = useState<{ type: "info" | "warning"; message: string } | null>(null);

  const handleGenerateReport = () => {
    setReportBanner({
      type: "warning",
      message:
        "Tag compliance report generation (StartReportCreation / GetComplianceSummary) is not supported by this emulator. In real AWS Organizations, this generates a CSV report in your target S3 bucket evaluating resource tag compliance against organization tag policies.",
    });
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto text-[#16191f]">
      {/* Banner */}
      {reportBanner && (
        <div className="mb-4 p-4 rounded text-sm flex items-start justify-between border bg-[#fffbf2] border-[#f29f05] text-[#875904]">
          <div>
            <strong>Feature limitation:</strong> {reportBanner.message}
          </div>
          <button
            onClick={() => setReportBanner(null)}
            className="text-xs font-bold hover:opacity-80 ml-4"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-[#eaeded] mb-6">
        <h1 className="text-xl font-bold text-[#16191f]">Tag policies compliance and reports</h1>
        <p className="text-xs text-[#545b64] mt-1">
          Monitor resource compliance with tag policies across your AWS Organization.
        </p>
      </div>

      {/* Organization Tag Policy Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-5 mb-6">
        <h2 className="text-sm font-bold text-[#16191f] mb-2">Generate organization compliance report</h2>
        <p className="text-xs text-[#545b64] mb-4">
          Generate a detailed CSV report that lists all tagged resources across accounts in your AWS Organization and
          checks whether they comply with effective tag policies.
        </p>

        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#16191f] mb-1">
              Target Amazon S3 bucket
            </label>
            {buckets.length === 0 ? (
              <div className="text-xs text-[#545b64] p-3 border border-[#eaeded] rounded bg-[#fafafa]">
                No S3 buckets found.{" "}
                <Link href="/s3" className="text-[#0073bb] font-semibold hover:underline">
                  Create a bucket in Amazon S3
                </Link>{" "}
                first to store compliance reports.
              </div>
            ) : (
              <select
                value={selectedBucket}
                onChange={(e) => setSelectedBucket(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 text-xs bg-white focus:outline-none focus:border-[#ec7211]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                {buckets.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-[#545b64] mt-1">
              Select an Amazon S3 bucket where the compliance report will be delivered.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGenerateReport}
              className="px-4 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Generate compliance report
            </button>
          </div>
        </div>
      </div>

      {/* Tag Compliance Table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <h2 className="text-xs font-bold text-[#16191f]">Non-compliant tag summary</h2>
        </div>
        <div className="p-6 text-center text-xs text-[#545b64]">
          <div className="font-semibold text-sm mb-1 text-[#16191f]">No compliance issues detected</div>
          <p>
            No non-compliant resources were reported. In real AWS, active tag policies defined in AWS Organizations
            enforce key casing and value constraints across your resources.
          </p>
        </div>
      </div>
    </div>
  );
}
