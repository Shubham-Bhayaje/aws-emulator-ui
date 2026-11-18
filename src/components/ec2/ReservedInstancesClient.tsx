/**
 * src/components/ec2/ReservedInstancesClient.tsx – Authentic AWS EC2 Reserved Instances Management.
 * Connected to live AWS Emulator with real offerings and purchases.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import {
  ReservedInstanceItem,
  fetchLiveReservedInstances,
  purchaseLiveReservedInstance,
} from "@/app/ec2/actions";

interface Props {
  initialReservedInstances: ReservedInstanceItem[];
  isLive: boolean;
}

export default function ReservedInstancesClient({
  initialReservedInstances,
  isLive,
}: Props) {
  const [items, setItems] = useState<ReservedInstanceItem[]>(initialReservedInstances);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialReservedInstances[0]?.id || null
  );
  const [search, setSearch] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"details" | "pricing" | "coverage">("details");

  // Modals
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Form State
  const [instanceType, setInstanceType] = useState("t3.micro");
  const [offeringClass, setOfferingClass] = useState("convertible");
  const [term, setTerm] = useState("1-year");
  const [paymentOption, setPaymentOption] = useState("All Upfront");
  const [scope, setScope] = useState("Region");
  const [quantity, setQuantity] = useState(1);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedRI = items.find((i) => i.id === selectedId) || null;

  async function refreshItems() {
    startTransition(async () => {
      const fresh = await fetchLiveReservedInstances();
      setItems(fresh.reservedInstances);
      setFeedback("Refreshed Reserved Instances from AWS Emulator.");
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await purchaseLiveReservedInstance({
        instanceType,
        instanceCount: quantity,
        offeringClass,
        offeringType: paymentOption,
        duration: term === "3-year" ? 94608000 : 31536000,
      });

      if (res.success && res.reservationId) {
        setShowPurchaseModal(false);
        const fresh = await fetchLiveReservedInstances();
        setItems(fresh.reservedInstances);
        setSelectedId(res.reservationId);
        setFeedback(`Successfully purchased Reserved Instance (${res.reservationId}).`);
      } else {
        setFeedback(`Purchase failed: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  const filtered = items.filter(
    (i) =>
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.instanceType.toLowerCase().includes(search.toLowerCase()) ||
      i.offeringClass.toLowerCase().includes(search.toLowerCase())
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
              {isLive ? "EC2 Capacity & Pricing Connected (AWS Emulator)" : "Disconnected from AWS Emulator (127.0.0.1:9297)"}
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
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-[#16191f]">Reserved Instances</h2>
              <span className="text-[13px] text-[#545b64]">({filtered.length})</span>
            </div>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Reserved Instances provide a significant discount compared to On-Demand pricing and provide a capacity reservation when used in a specific Availability Zone.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
            <button
              onClick={refreshItems}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowPurchaseModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            >
              Purchase Reserved Instances
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[#f8f9fa] border-b border-[#eaeded] flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Filter by reservation ID, instance type, or offering class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm focus:outline-none focus:border-[#ec7211] bg-white text-[#16191f]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[12px]"
              >
                Clear
              </button>
            )}
          </div>
          <span className="text-[12px] text-[#545b64]">
            {filtered.length} of {items.length} instances
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[220px]">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[12px] font-semibold tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-3">Reservation ID</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Instance type</th>
                <th className="py-2.5 px-3">Scope</th>
                <th className="py-2.5 px-3">Availability Zone</th>
                <th className="py-2.5 px-3">Offering class</th>
                <th className="py-2.5 px-3">Payment option</th>
                <th className="py-2.5 px-3 text-right">Count</th>
                <th className="py-2.5 px-3">Term</th>
                <th className="py-2.5 px-3 text-right">Fixed Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#545b64]">
                    <p className="font-semibold text-[14px]">No Reserved Instances found</p>
                    <p className="text-[12px] text-[#879596] mt-1">
                      Purchase a Reserved Instance to receive significant discounts over On-Demand rates.
                    </p>
                    <button
                      onClick={() => setShowPurchaseModal(true)}
                      className="mt-4 px-3 py-1.5 bg-[#ec7211] text-white text-[12px] font-medium rounded-sm hover:bg-[#eb5f07]"
                    >
                      Purchase Reserved Instances
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((ri) => {
                  const isSelected = selectedId === ri.id;
                  const termLabel = ri.duration >= 90000000 ? "3 years" : "1 year";

                  return (
                    <tr
                      key={ri.id}
                      onClick={() => setSelectedId(ri.id)}
                      className={`border-b border-[#eaeded] cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f1faff]" : "hover:bg-[#f8f9fa]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="radio"
                          name="selected_ri"
                          checked={isSelected}
                          onChange={() => setSelectedId(ri.id)}
                          className="accent-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073bb] font-medium">{ri.id}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            ri.state === "active"
                              ? "bg-[#e7f4e4] text-[#1d8102]"
                              : ri.state === "retired"
                              ? "bg-[#eaeded] text-[#545b64]"
                              : "bg-[#fff3e0] text-[#b35900]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              ri.state === "active"
                                ? "bg-[#1d8102]"
                                : ri.state === "retired"
                                ? "bg-[#545b64]"
                                : "bg-[#b35900]"
                            }`}
                          />
                          {ri.state}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium">{ri.instanceType}</td>
                      <td className="py-2.5 px-3 text-[#545b64]">{ri.scope}</td>
                      <td className="py-2.5 px-3 text-[#545b64]">{ri.availabilityZone}</td>
                      <td className="py-2.5 px-3 capitalize">{ri.offeringClass}</td>
                      <td className="py-2.5 px-3">{ri.offeringType}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{ri.instanceCount}</td>
                      <td className="py-2.5 px-3 text-[#545b64]">{termLabel}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-[#16191f]">
                        ${ri.fixedPrice.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Item Drawer */}
      {selectedRI && (
        <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
          <div className="border-b border-[#eaeded] flex items-center px-4 bg-[#fafafa]">
            <button
              onClick={() => setActiveBottomTab("details")}
              className={`py-2.5 px-4 text-[13px] font-semibold border-b-2 transition-colors ${
                activeBottomTab === "details"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveBottomTab("pricing")}
              className={`py-2.5 px-4 text-[13px] font-semibold border-b-2 transition-colors ${
                activeBottomTab === "pricing"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Pricing summary
            </button>
            <button
              onClick={() => setActiveBottomTab("coverage")}
              className={`py-2.5 px-4 text-[13px] font-semibold border-b-2 transition-colors ${
                activeBottomTab === "coverage"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Instance coverage
            </button>
          </div>

          <div className="p-6">
            {activeBottomTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Reserved Instance ID
                    </span>
                    <span className="font-mono text-[#16191f] mt-0.5 block">{selectedRI.id}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      State
                    </span>
                    <span className="font-medium text-[#16191f] capitalize mt-0.5 block">
                      {selectedRI.state}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Instance type
                    </span>
                    <span className="font-mono text-[#16191f] mt-0.5 block">{selectedRI.instanceType}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Scope
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedRI.scope}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Availability Zone
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedRI.availabilityZone}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Offering class
                    </span>
                    <span className="text-[#16191f] capitalize mt-0.5 block">{selectedRI.offeringClass}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Platform
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedRI.productDescription}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Start date
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedRI.start}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      End date
                    </span>
                    <span className="text-[#16191f] mt-0.5 block">{selectedRI.end}</span>
                  </div>
                </div>
              </div>
            )}

            {activeBottomTab === "pricing" && (
              <div className="space-y-4 text-[13px]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Upfront Price
                    </span>
                    <span className="text-[20px] font-bold text-[#16191f] font-mono mt-1 block">
                      ${selectedRI.fixedPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Recurring Hourly Rate
                    </span>
                    <span className="text-[20px] font-bold text-[#16191f] font-mono mt-1 block">
                      $0.00 / hr
                    </span>
                  </div>
                  <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Effective Hourly Rate
                    </span>
                    <span className="text-[20px] font-bold text-[#16191f] font-mono mt-1 block">
                      ${(selectedRI.fixedPrice / (selectedRI.duration / 3600)).toFixed(4)} / hr
                    </span>
                  </div>
                  <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                      Estimated Savings
                    </span>
                    <span className="text-[20px] font-bold text-[#1d8102] mt-1 block">
                      ~38% vs On-Demand
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeBottomTab === "coverage" && (
              <div className="space-y-3 text-[13px] text-[#545b64]">
                <p>
                  This reservation automatically applies billing discount credits to any running{" "}
                  <span className="font-mono text-[#16191f] font-medium">{selectedRI.instanceType}</span>{" "}
                  instances within <span className="font-medium text-[#16191f]">{selectedRI.scope}</span>.
                </p>
                <div className="bg-[#f1faff] border border-[#90cbf0] p-4 rounded-sm text-[#0073bb]">
                  <span className="font-bold block text-[13px] text-[#16191f]">
                    Automatic Regional Billing Benefit Active
                  </span>
                  <span className="text-[12px] text-[#545b64] mt-0.5 block">
                    Because this reservation is scoped to Regional, its billing discount applies to instances in any Availability Zone in us-east-1 and can adapt across instance size footprints.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#16191f]">Purchase Reserved Instances</h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePurchase} className="p-6 space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Instance Type</label>
                <select
                  value={instanceType}
                  onChange={(e) => setInstanceType(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                >
                  <option value="t3.micro">t3.micro (2 vCPU, 1 GiB)</option>
                  <option value="t3.small">t3.small (2 vCPU, 2 GiB)</option>
                  <option value="t3.medium">t3.medium (2 vCPU, 4 GiB)</option>
                  <option value="m5.large">m5.large (2 vCPU, 8 GiB)</option>
                  <option value="c5.xlarge">c5.xlarge (4 vCPU, 8 GiB)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Offering Class</label>
                  <select
                    value={offeringClass}
                    onChange={(e) => setOfferingClass(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                  >
                    <option value="convertible">Convertible (Can change instance families)</option>
                    <option value="standard">Standard (Highest discount rate)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Term</label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                  >
                    <option value="1-year">1 year (31,536,000 seconds)</option>
                    <option value="3-year">3 years (94,608,000 seconds)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Payment Option</label>
                  <select
                    value={paymentOption}
                    onChange={(e) => setPaymentOption(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none"
                  >
                    <option value="All Upfront">All Upfront</option>
                    <option value="Partial Upfront">Partial Upfront</option>
                    <option value="No Upfront">No Upfront</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#16191f] mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full border border-[#aab7b8] rounded-sm px-3 py-1.5 focus:border-[#ec7211] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fa] border border-[#eaeded] rounded-sm space-y-1 text-[12px] text-[#545b64]">
                <div className="flex justify-between">
                  <span>Scope:</span>
                  <span className="font-semibold text-[#16191f]">Region (us-east-1)</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Total:</span>
                  <span className="font-semibold text-[#16191f] font-mono">
                    ${(288.2 * quantity).toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 border border-[#545b64] text-[#16191f] font-bold text-[13px] rounded-sm hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 bg-[#ec7211] text-white font-bold text-[13px] rounded-sm hover:bg-[#eb5f07] disabled:opacity-50 whitespace-nowrap inline-flex items-center justify-center transition-colors"
                >
                  {isPending ? "Purchasing..." : "Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
