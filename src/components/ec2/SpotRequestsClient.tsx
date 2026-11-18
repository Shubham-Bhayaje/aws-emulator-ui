/**
 * src/components/ec2/SpotRequestsClient.tsx – Authentic AWS EC2 Spot Requests Management.
 * Connected to live AWS Emulator with real request creation, cancellation, and drawer inspection.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import {
  requestLiveSpotInstances,
  cancelLiveSpotRequest,
  fetchLiveSpotRequests,
} from "@/app/ec2/actions";

export interface SpotRequestItem {
  id: string;
  type: string;
  status: string;
  instanceType: string;
  createTime: string;
}

interface Props {
  initialSpotRequests: SpotRequestItem[];
  isLive: boolean;
}

export default function SpotRequestsClient({ initialSpotRequests, isLive }: Props) {
  const [requests, setRequests] = useState<SpotRequestItem[]>(initialSpotRequests);
  const [selectedId, setSelectedId] = useState<string | null>(initialSpotRequests[0]?.id || null);
  const [search, setSearch] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"details" | "fulfillment">("details");

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form
  const [instanceType, setInstanceType] = useState("t3.micro");
  const [requestType, setRequestType] = useState<"one-time" | "persistent">("one-time");
  const [targetCapacity, setTargetCapacity] = useState(1);
  const [maxPrice, setMaxPrice] = useState("default");

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedRequest = requests.find((r) => r.id === selectedId) || null;

  async function refreshRequests() {
    startTransition(async () => {
      const fresh = await fetchLiveSpotRequests();
      setRequests(fresh.spotRequests);
      setFeedback("Refreshed Spot requests from AWS Emulator.");
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  function handleCreateSpot(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await requestLiveSpotInstances({
        instanceType,
        type: requestType,
        instanceCount: targetCapacity,
        maxPrice,
      });

      if (res.success) {
        setShowRequestModal(false);
        const fresh = await fetchLiveSpotRequests();
        setRequests(fresh.spotRequests);
        setSelectedId(res.requestId || null);
        setFeedback(`Requested Spot instance (${res.requestId || "success"}).`);
      } else {
        setFeedback(`Error: ${res.error}`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  function handleCancelSpot() {
    if (!selectedId) return;
    const targetId = selectedId;
    setShowCancelModal(false);

    startTransition(async () => {
      const res = await cancelLiveSpotRequest(targetId);
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === targetId ? { ...r, status: "cancelled" } : r))
        );
        setFeedback(`Cancelled Spot request ${targetId}.`);
      } else {
        setFeedback(`Error: ${res.error}`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  const filtered = requests.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.instanceType.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
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
              {isLive ? "Spot Requests Connected (AWS Emulator)" : "Mock Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
        {feedback && <span className="text-[12px] text-[#0073bb] font-medium">{feedback}</span>}
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-[18px] font-bold text-[#16191f]">
              Spot Requests ({requests.length})
            </h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Amazon EC2 Spot Instances let you take advantage of unused EC2 capacity in the AWS cloud at steep discounts.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
            <button
              onClick={refreshRequests}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={!selectedRequest || selectedRequest.status === "cancelled"}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 border border-[#aab7b8] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors hover:border-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed cursor-pointer"
            >
              Cancel Spot request
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            >
              Request Spot Instances
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <input
            type="text"
            placeholder="Filter Spot requests by ID, type, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white focus:outline-none focus:border-[#ec7211]"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-4">Request ID</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Instance type</th>
                <th className="py-2.5 px-3">Created time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#545b64]">
                    No Spot requests found in region us-east-1 on the emulator.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isSelected = selectedId === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fbfbfb]"
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="radio"
                          name="selectedSpot"
                          checked={isSelected}
                          onChange={() => setSelectedId(r.id)}
                          className="text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#0073bb]">
                        {r.id}
                      </td>
                      <td className="py-3 px-3 capitalize text-[#16191f]">
                        {r.type}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize border ${
                            r.status === "fulfilled" || r.status === "active"
                              ? "bg-[#f2f8f0] text-[#1d8102] border-[#b8dfaf]"
                              : r.status === "cancelled"
                              ? "bg-[#fdf3f1] text-[#d13212] border-[#f5b8b0]"
                              : "bg-[#f2f3f3] text-[#545b64] border-[#d5dbdb]"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {r.instanceType}
                      </td>
                      <td className="py-3 px-3 text-[12px] text-[#545b64]">
                        {r.createTime}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Drawer */}
      {selectedRequest && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm awsui-shadow">
          <div className="border-b border-[#eaeded] px-4 pt-3 flex items-center justify-between">
            <div className="flex gap-4 text-[13px]">
              {(["details", "fulfillment"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveBottomTab(tab)}
                  className={`pb-2.5 font-medium border-b-2 capitalize transition-colors ${
                    activeBottomTab === tab
                      ? "border-[#ec7211] text-[#ec7211]"
                      : "border-transparent text-[#545b64] hover:text-[#16191f]"
                  }`}
                >
                  {tab === "details" ? "Request details" : "Fulfillment details"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 text-[13px]">
            {activeBottomTab === "details" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Request ID
                    </span>
                    <span className="font-mono text-[#16191f]">{selectedRequest.id}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Status
                    </span>
                    <span className="font-semibold text-[#16191f] capitalize">{selectedRequest.status}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Request Type
                    </span>
                    <span className="text-[#16191f] capitalize">{selectedRequest.type}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Instance Type
                    </span>
                    <span className="font-mono text-[#16191f]">{selectedRequest.instanceType}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Creation Time
                    </span>
                    <span className="text-[#16191f]">{selectedRequest.createTime}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Target Capacity
                    </span>
                    <span className="text-[#16191f]">1 instance</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                    Fulfillment Status
                  </span>
                  <p className="text-[#16191f] mt-1">
                    {selectedRequest.status === "cancelled"
                      ? "Request was cancelled before fulfillment."
                      : "Spot capacity provisioned successfully in us-east-1a."}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                    Spot Pricing
                  </span>
                  <p className="text-[#16191f] mt-1">
                    Current spot rate: <span className="font-mono font-semibold text-[#1d8102]">$0.0035 / hr</span> (~68% discount vs On-Demand)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Request Spot Instances */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreateSpot}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <h3 className="text-[17px] font-bold text-[#16191f]">
              Request Spot Instances
            </h3>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Instance Type
              </label>
              <select
                value={instanceType}
                onChange={(e) => setInstanceType(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white font-mono"
              >
                <option value="t3.nano">t3.nano (2 vCPU, 0.5 GiB)</option>
                <option value="t3.micro">t3.micro (2 vCPU, 1.0 GiB)</option>
                <option value="t3.small">t3.small (2 vCPU, 2.0 GiB)</option>
                <option value="t3.medium">t3.medium (2 vCPU, 4.0 GiB)</option>
                <option value="c5.large">c5.large (2 vCPU, 4.0 GiB)</option>
                <option value="m5.large">m5.large (2 vCPU, 8.0 GiB)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Target Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={targetCapacity}
                  onChange={(e) => setTargetCapacity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Request Type
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
                >
                  <option value="one-time">One-time</option>
                  <option value="persistent">Persistent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Maximum Price
              </label>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white font-mono"
              >
                <option value="default">Default (Cap at On-Demand price)</option>
                <option value="0.0050">$0.0050 / hour</option>
                <option value="0.0100">$0.0100 / hour</option>
                <option value="0.0200">$0.0200 / hour</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isPending ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Cancel Spot Request */}
      {showCancelModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#d13212]">
              Cancel Spot request?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to cancel Spot request <strong className="font-mono text-[#16191f]">{selectedRequest.id}</strong>? If an instance is already fulfilled, it will continue to run until terminated.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px]"
              >
                Close
              </button>
              <button
                onClick={handleCancelSpot}
                disabled={isPending}
                className="px-4 py-1.5 bg-[#d13212] text-white rounded-sm text-[13px] font-medium hover:bg-[#b02008] disabled:opacity-50"
              >
                {isPending ? "Cancelling..." : "Cancel request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
