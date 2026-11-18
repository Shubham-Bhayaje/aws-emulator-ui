/**
 * src/components/ec2/LaunchConfigurationsClient.tsx – AWS Launch Configurations Console Replica.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  LaunchConfigurationModel,
  deleteLiveLaunchConfiguration,
  fetchLiveLaunchConfigurations,
} from "@/app/ec2/actions";

interface Props {
  initialConfigurations?: LaunchConfigurationModel[];
  isLive?: boolean;
  liveError?: string;
}

export default function LaunchConfigurationsClient({
  initialConfigurations = [],
  isLive = true,
  liveError,
}: Props) {
  const [configurations, setConfigurations] = useState<LaunchConfigurationModel[]>(
    initialConfigurations || []
  );
  const [selectedName, setSelectedName] = useState<string | null>(
    initialConfigurations && initialConfigurations.length > 0
      ? initialConfigurations[0]?.name
      : null
  );
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showDeprecationModal, setShowDeprecationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "security">("details");
  const [isPending, startTransition] = useTransition();

  const selectedLc =
    (configurations || []).find((lc) => lc.name === selectedName) || null;

  const totalCount = (configurations || []).length;

  function refreshConfigurations() {
    startTransition(async () => {
      const res = await fetchLiveLaunchConfigurations();
      const list = res.launchConfigurations || [];
      setConfigurations(list);
      if (
        list.length > 0 &&
        (!selectedName || !list.some((lc) => lc.name === selectedName))
      ) {
        setSelectedName(list[0]?.name || null);
      }
    });
  }

  function handleDelete() {
    if (!selectedLc) return;
    const targetName = selectedLc.name;

    startTransition(async () => {
      setShowDeleteModal(false);
      const res = await deleteLiveLaunchConfiguration(targetName);
      if (res.success) {
        const fresh = await fetchLiveLaunchConfigurations();
        const list = fresh.launchConfigurations || [];
        setConfigurations(list);
        setSelectedName(list.length > 0 ? list[0]?.name : null);
        setFeedback(`Deleted launch configuration "${targetName}" successfully.`);
      } else {
        setFeedback(
          `Failed to delete launch configuration: ${res.error || "Unknown error"}`
        );
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  const filtered = (configurations || []).filter((lc) => {
    const term = search.toLowerCase();
    return (
      (lc.name || "").toLowerCase().includes(term) ||
      (lc.imageId || "").toLowerCase().includes(term) ||
      (lc.instanceType || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Deprecation Warning Banner (Official AWS Cloudscape pattern) */}
      <div className="bg-[#fdf3f1] border border-[#d13212] p-4 rounded-sm shadow-xs flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <svg
            className="text-[#d13212] mt-0.5 shrink-0"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <div className="text-[13px] font-bold text-[#16191f]">
              Amazon EC2 Auto Scaling will retire launch configurations
            </div>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Launch configurations are deprecated. We recommend that you migrate your Auto Scaling groups to use launch templates to take advantage of latest EC2 features like Spot placement score, attribute-based instance selection, and mixed instances policies.
            </p>
          </div>
        </div>
        <Link
          href="/ec2/launch-templates"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[12px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors shrink-0"
        >
          Create launch template
        </Link>
      </div>

      {/* Live Badge Banner */}
      <div className="flex items-center justify-between bg-white border border-[#d5dbdb] px-4 py-2.5 rounded-sm shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isLive ? "bg-[#1d8102]" : "bg-[#ec7211]"
              }`}
            />
            <span className="text-[12px] font-semibold text-[#16191f]">
              {isLive ? "Launch Configurations Connected (AWS Emulator)" : "Disconnected from AWS Emulator (127.0.0.1:9297)"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        <span className="text-[11px] text-[#545b64]">AWS EC2 Auto Scaling Configurations</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Total Launch Configurations
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Existing legacy instance templates</div>
        </div>

        <div className="bg-white border border-[#d5dbdb] p-4 rounded-sm shadow-xs">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Deprecation Status
          </div>
          <div className="text-[24px] font-bold text-[#d13212] mt-1">Deprecated</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Replaced by Amazon EC2 Launch Templates</div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-sm border text-[13px] flex items-center justify-between ${
            feedback.includes("Failed") || feedback.includes("failed")
              ? "bg-[#fdf3f1] border-[#d13212] text-[#d13212]"
              : "bg-[#f2f8fd] border-[#0073bb] text-[#0073bb]"
          }`}
        >
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-[12px] font-bold hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs">
        {/* Header & Actions Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-[#16191f]">
              Launch Configurations ({totalCount})
            </h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              A launch configuration is an instance configuration template that an Auto Scaling group uses to launch EC2 instances.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshConfigurations}
              disabled={isPending}
              title="Refresh configurations"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`mr-1.5 ${isPending ? "animate-spin" : ""}`}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              Refresh
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={!selectedLc || isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`h-[32px] px-3 border rounded-sm text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                selectedLc
                  ? "border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1] bg-white"
                  : "border-[#eaeded] text-[#aab7b8] cursor-not-allowed bg-white"
              }`}
            >
              Delete configuration
            </button>

            <button
              onClick={() => setShowDeprecationModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
            >
              Create launch configuration
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <div className="relative max-w-[450px]">
            <input
              type="text"
              placeholder="Filter launch configurations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
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
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-3">AMI ID</th>
                <th className="py-2.5 px-3">Instance type</th>
                <th className="py-2.5 px-3">Key name</th>
                <th className="py-2.5 px-3">Created time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#545b64]">
                    No launch configurations found in region us-east-1.
                  </td>
                </tr>
              ) : (
                filtered.map((lc) => {
                  const isSelected = selectedName === lc.name;
                  return (
                    <tr
                      key={lc.name}
                      onClick={() => setSelectedName(lc.name)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedLc"
                          checked={isSelected}
                          onChange={() => setSelectedName(lc.name)}
                          className="accent-[#0073bb] cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                        {lc.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">
                        {lc.imageId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#16191f]">
                        {lc.instanceType}
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64]">
                        {lc.keyName || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64] text-[12px]">
                        {lc.createdTime}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloudscape Bottom Drawer for Details */}
      {selectedLc && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs mt-4">
          <div className="border-b border-[#eaeded] flex items-center px-4">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "details"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`py-3 px-4 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "security"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Security groups
            </button>
          </div>

          <div className="p-6">
            {activeTab === "details" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-[13px]">
                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Launch configuration name</div>
                  <div className="font-bold text-[#16191f] mt-1">{selectedLc.name}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">AMI ID</div>
                  <div className="font-mono text-[#0073bb] mt-1">{selectedLc.imageId}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Instance type</div>
                  <div className="font-mono text-[#16191f] mt-1">{selectedLc.instanceType}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Key pair name</div>
                  <div className="text-[#16191f] mt-1">{selectedLc.keyName || "None"}</div>
                </div>

                <div>
                  <div className="text-[12px] text-[#545b64] font-medium">Created time</div>
                  <div className="text-[#545b64] mt-1">{selectedLc.createdTime}</div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <div className="text-[12px] text-[#545b64] font-medium">ARN</div>
                  <div className="font-mono text-[12px] text-[#16191f] mt-1 break-all">
                    {selectedLc.arn}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-[13px] font-bold text-[#16191f] mb-2">Security groups</div>
                <div className="text-[13px] text-[#545b64]">
                  {selectedLc.securityGroups && selectedLc.securityGroups.length > 0
                    ? selectedLc.securityGroups.join(", ")
                    : "No security groups attached."}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deprecation Modal */}
      {showDeprecationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">
                Launch configuration creation is unavailable
              </h3>
              <button
                type="button"
                onClick={() => setShowDeprecationModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-[13px] text-[#545b64]">
              <p>
                AWS has deprecated launch configurations. The Launch Configuration creation operation is not available in modern AWS accounts.
              </p>
              <p>
                Use <strong>Launch Templates</strong> to create configuration templates for your Auto Scaling groups. Launch templates support all recent EC2 features, versioning, and advanced scaling options.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeprecationModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Close
              </button>
              <Link
                href="/ec2/launch-templates"
                onClick={() => setShowDeprecationModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Go to Launch Templates
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete launch configuration</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete launch configuration <strong className="text-[#16191f]">{selectedLc.name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#d13212] text-white rounded-sm text-[13px] font-bold hover:bg-[#b02008] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
