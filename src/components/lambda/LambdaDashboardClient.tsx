/**
 * src/components/lambda/LambdaDashboardClient.tsx – Lambda Dashboard & Functions overview.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { LambdaFunction } from "@/lib/lambda-data";
import { fetchLiveLambdaFunctions, deleteLiveFunction } from "@/app/lambda/actions";

interface Props {
  initialFunctions: LambdaFunction[];
  isLive: boolean;
  liveError?: string;
}

export default function LambdaDashboardClient({
  initialFunctions,
  isLive,
  liveError,
}: Props) {
  const [functions, setFunctions] = useState<LambdaFunction[]>(initialFunctions);
  const [searchQuery, setSearchQuery] = useState("");
  const [runtimeFilter, setRuntimeFilter] = useState("all");
  const [selectedFunctionName, setSelectedFunctionName] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalCodeSize = functions.reduce((acc, f) => acc + (f.codeSize || 0), 0);
  const totalCodeSizeFormatted =
    totalCodeSize > 1024 * 1024
      ? `${(totalCodeSize / (1024 * 1024)).toFixed(2)} MB`
      : `${(totalCodeSize / 1024).toFixed(1)} KB`;

  function handleRefresh() {
    startTransition(async () => {
      const res = await fetchLiveLambdaFunctions();
      if (res.isLive) {
        setFunctions(res.functions);
      }
    });
  }

  function handleDelete(fnName: string) {
    setSelectedFunctionName(fnName);
    setShowDeleteModal(true);
  }

  function confirmDelete() {
    if (!selectedFunctionName) return;
    const targetName = selectedFunctionName;
    setShowDeleteModal(false);
    setSelectedFunctionName(null);

    // Optimistic remove
    setFunctions(functions.filter((f) => f.name !== targetName));

    startTransition(async () => {
      await deleteLiveFunction(targetName);
      const res = await fetchLiveLambdaFunctions();
      if (res.isLive) setFunctions(res.functions);
    });
  }

  const filteredFunctions = functions.filter((fn) => {
    const matchesSearch =
      fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fn.arn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRuntime = runtimeFilter === "all" || fn.runtime === runtimeFilter;
    return matchesSearch && matchesRuntime;
  });

  return (
    <div className="space-y-6">
      {/* Live Emulator Connection Banner */}
      <div className="flex items-center justify-between bg-white border border-[#d5dbdb] px-4 py-2.5 rounded-sm awsui-shadow">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isLive ? "bg-[#1d8102]" : "bg-[#d13212]"
              }`}
            />
            <span className="text-[12px] font-semibold text-[#16191f]">
              {isLive ? "AWS Emulator Connected" : "Disconnected from Emulator"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">
            Endpoint: https://127.0.0.1:9297
          </span>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] text-[#545b64]">Region: us-east-1</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="text-[12px] font-medium text-[#0073bb] hover:text-[#005a9e] flex items-center gap-1.5 disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          {isPending ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {liveError && (
        <div className="p-3 bg-[#fdf2e9] border-l-4 border-[#ec7211] text-[12px] text-[#16191f]">
          <span className="font-semibold">Notice:</span> {liveError}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Functions
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {functions.length}
          </div>
          <div className="text-[12px] text-[#1d8102] mt-1 font-medium">
            Active in region
          </div>
        </div>

        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Code Storage Used
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            {totalCodeSizeFormatted}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">
            Limit: 75 GB
          </div>
        </div>

        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Unreserved Concurrency
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">
            1,000
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">
            Standard regional pool
          </div>
        </div>

        <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wide">
            Architecture
          </div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1 font-mono text-[20px] pt-1">
            x86_64 / arm64
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">
            Multi-arch supported
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Functions</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              A Lambda function is code and associated configuration that you upload to AWS Lambda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/lambda/create"
              className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] transition-colors"
            >
              Create function
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-[#eaeded] bg-[#fafafa] flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Find functions by name, ARN or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm bg-white text-[#16191f] text-[13px] focus:outline-none focus:border-[#0073bb]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[12px] font-medium text-[#545b64]">Runtime:</label>
            <select
              value={runtimeFilter}
              onChange={(e) => setRuntimeFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-[#aab7b8] rounded-sm bg-white text-[#16191f] text-[12px]"
            >
              <option value="all">All runtimes</option>
              <option value="nodejs20.x">Node.js 20.x</option>
              <option value="nodejs18.x">Node.js 18.x</option>
              <option value="python3.12">Python 3.12</option>
              <option value="python3.11">Python 3.11</option>
              <option value="java21">Java 21</option>
              <option value="dotnet8">.NET 8</option>
              <option value="ruby3.3">Ruby 3.3</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {filteredFunctions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f2f3f3] text-[#545b64] mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h3 className="text-[16px] font-bold text-[#16191f]">No Lambda functions found</h3>
            <p className="text-[13px] text-[#545b64] mt-1 max-w-md mx-auto">
              Get started by creating your first serverless function running on the local emulator.
            </p>
            <div className="mt-4">
              <Link
                href="/lambda/create"
                className="inline-block px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07]"
              >
                Create function
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Function name</th>
                  <th className="py-2.5 px-3">Runtime</th>
                  <th className="py-2.5 px-3">Architecture</th>
                  <th className="py-2.5 px-3">Memory</th>
                  <th className="py-2.5 px-3">Timeout</th>
                  <th className="py-2.5 px-3">Code size</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                {filteredFunctions.map((fn) => {
                  const sizeFormatted =
                    fn.codeSize > 1024
                      ? `${(fn.codeSize / 1024).toFixed(1)} KB`
                      : `${fn.codeSize} B`;

                  return (
                    <tr key={fn.name} className="hover:bg-[#f2f8fd] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#0073bb]">
                        <Link
                          href={`/lambda/functions/${fn.name}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          {fn.name}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#16191f] border border-[#d5dbdb]">
                          {fn.runtime}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">
                        {fn.architectures?.[0] || "x86_64"}
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px]">
                        {fn.memorySize} MB
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px]">
                        {fn.timeout}s
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">
                        {sizeFormatted}
                      </td>
                      <td className="py-3 px-3 text-[#545b64] text-[12px] max-w-xs truncate">
                        {fn.description || "—"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-3 text-[12px]">
                          <Link
                            href={`/lambda/functions/${fn.name}?tab=test`}
                            className="text-[#0073bb] hover:underline font-medium"
                          >
                            Test
                          </Link>
                          <Link
                            href={`/lambda/functions/${fn.name}`}
                            className="text-[#0073bb] hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(fn.name)}
                            className="text-[#d13212] hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Count */}
        <div className="p-3 border-t border-[#eaeded] bg-[#fafafa] text-[12px] text-[#545b64] flex items-center justify-between">
          <span>
            Showing {filteredFunctions.length} of {functions.length} function(s)
          </span>
          <span className="font-mono text-[11px]">Region: us-east-1</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete function</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to delete function{" "}
              <strong className="text-[#16191f] font-mono">{selectedFunctionName}</strong>?
              This action cannot be undone and will permanently remove the function from the AWS Emulator.
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 bg-[#d13212] text-white rounded-sm text-[13px] font-medium hover:bg-[#b02008]"
              >
                Delete function
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
