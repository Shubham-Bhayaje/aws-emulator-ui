/**
 * src/components/ec2/SavingsPlansClient.tsx – Authentic AWS Savings Plans Console.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import {
  SavingsPlanModel,
  fetchLiveSavingsPlans,
  purchaseLiveSavingsPlan,
} from "@/app/ec2/actions";

interface Props {
  initialPlans: SavingsPlanModel[];
  isLive: boolean;
}

export default function SavingsPlansClient({ initialPlans, isLive }: Props) {
  const [plans, setPlans] = useState<SavingsPlanModel[]>(initialPlans);
  const [selectedId, setSelectedId] = useState<string | null>(initialPlans[0]?.id || null);
  const [search, setSearch] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"details" | "utilization">("details");

  // Modals
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Form
  const [planType, setPlanType] = useState("Compute Savings Plan");
  const [term, setTerm] = useState("1 year");
  const [paymentOption, setPaymentOption] = useState("No Upfront");
  const [commitment, setCommitment] = useState("0.05");

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedPlan = plans.find((p) => p.id === selectedId) || null;

  async function refreshPlans() {
    startTransition(async () => {
      const fresh = await fetchLiveSavingsPlans();
      setPlans(fresh.savingsPlans);
      setFeedback("Refreshed Savings Plans.");
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await purchaseLiveSavingsPlan({
        type: planType,
        term,
        paymentOption,
        commitment,
      });

      if (res.success && res.plan) {
        setShowPurchaseModal(false);
        const fresh = await fetchLiveSavingsPlans();
        setPlans(fresh.savingsPlans);
        setSelectedId(res.plan.id);
        setFeedback(`Successfully purchased ${res.plan.type} (${res.plan.id}).`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  const filtered = plans.filter(
    (p) =>
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase())
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
              {isLive ? "Savings Plans Connected (AWS Cost Management)" : "Mock Mode"}
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
              Savings Plans ({plans.length})
            </h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Savings Plans are a flexible pricing model offering lower prices compared to On-Demand pricing, in exchange for a commitment to consistent compute usage.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
            <button
              onClick={refreshPlans}
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
              Purchase Savings Plan
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <input
            type="text"
            placeholder="Filter Savings Plans by ID or plan type..."
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
                <th className="py-2.5 px-4">Plan ID</th>
                <th className="py-2.5 px-3">Plan type</th>
                <th className="py-2.5 px-3">Hourly commitment</th>
                <th className="py-2.5 px-3">Term</th>
                <th className="py-2.5 px-3">Payment option</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Savings rate</th>
                <th className="py-2.5 px-3">Start date</th>
                <th className="py-2.5 px-3">End date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#545b64]">
                    No Savings Plans found. Click &quot;Purchase Savings Plan&quot; to configure your compute discount.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isSelected = selectedId === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fbfbfb]"
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="radio"
                          name="selectedPlan"
                          checked={isSelected}
                          onChange={() => setSelectedId(p.id)}
                          className="text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#0073bb]">
                        {p.id}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#16191f]">
                        {p.type}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-[#1d8102]">
                        {p.commitment}
                      </td>
                      <td className="py-3 px-3 text-[#16191f]">
                        {p.term}
                      </td>
                      <td className="py-3 px-3 text-[#545b64]">
                        {p.paymentOption}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold capitalize bg-[#f2f8f0] text-[#1d8102] border border-[#b8dfaf]">
                          {p.state}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#0073bb]">
                        {p.savingsRate}
                      </td>
                      <td className="py-3 px-3 text-[12px] text-[#545b64]">
                        {p.startTime}
                      </td>
                      <td className="py-3 px-3 text-[12px] text-[#545b64]">
                        {p.endTime}
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
      {selectedPlan && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm awsui-shadow">
          <div className="border-b border-[#eaeded] px-4 pt-3 flex items-center justify-between">
            <div className="flex gap-4 text-[13px]">
              {(["details", "utilization"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveBottomTab(tab)}
                  className={`pb-2.5 font-medium border-b-2 capitalize transition-colors ${
                    activeBottomTab === tab
                      ? "border-[#ec7211] text-[#ec7211]"
                      : "border-transparent text-[#545b64] hover:text-[#16191f]"
                  }`}
                >
                  {tab === "details" ? "Plan details" : "Utilization & Coverage"}
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
                      Plan ID
                    </span>
                    <span className="font-mono text-[#16191f]">{selectedPlan.id}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Plan Type
                    </span>
                    <span className="font-semibold text-[#16191f]">{selectedPlan.type}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Commitment
                    </span>
                    <span className="font-mono font-semibold text-[#1d8102]">{selectedPlan.commitment}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Term & Payment
                    </span>
                    <span className="text-[#16191f]">{selectedPlan.term} • {selectedPlan.paymentOption}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Effective Discount
                    </span>
                    <span className="text-[#0073bb] font-semibold">{selectedPlan.savingsRate}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Active Period
                    </span>
                    <span className="text-[12px] text-[#545b64]">{selectedPlan.startTime} – {selectedPlan.endTime}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#16191f]">Utilization: 100%</span>
                  <span className="text-[#1d8102] font-semibold">Maximized savings</span>
                </div>
                <div className="w-full bg-[#eaeded] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#1d8102] h-full w-full" />
                </div>
                <p className="text-[12px] text-[#545b64]">
                  All eligible EC2 instances and compute services in us-east-1 are receiving the discounted hourly rate.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Purchase Savings Plan */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handlePurchase}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <h3 className="text-[17px] font-bold text-[#16191f]">
              Purchase Savings Plan
            </h3>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Plan Type
              </label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
              >
                <option value="Compute Savings Plan">Compute Savings Plan (EC2, Fargate, Lambda)</option>
                <option value="EC2 Instance Savings Plan">EC2 Instance Savings Plan (Specific family)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Term
                </label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
                >
                  <option value="1 year">1 year</option>
                  <option value="3 years">3 years</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Payment Option
                </label>
                <select
                  value={paymentOption}
                  onChange={(e) => setPaymentOption(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
                >
                  <option value="No Upfront">No Upfront</option>
                  <option value="Partial Upfront">Partial Upfront</option>
                  <option value="All Upfront">All Upfront</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Hourly Commitment ($ / hour)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1.5 text-[#545b64] font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={commitment}
                  onChange={(e) => setCommitment(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 border border-[#aab7b8] rounded-sm font-mono text-[13px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowPurchaseModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isPending ? "Purchasing..." : "Purchase plan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
