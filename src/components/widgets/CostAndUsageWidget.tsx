/**
 * CostAndUsageWidget.tsx – Authentic AWS Console Cost and usage widget.
 * Features:
 * - Real dynamic billing calculation system backed by live emulator resources
 * - Automatically assigns and calculates usage costs to resources when created
 * - Dynamic "Group by" filter (Service vs Usage Type)
 * - Dynamic Timeframe filter (Last 6 months, Last 3 months, Month to date)
 * - Dynamic calendar months (calculated from actual date)
 * - Interactive stacked bar chart with live hover tooltips
 * - Fully functional "AWS Budgets" management (Create, Edit, Delete, Threshold Alerts)
 * - Functional Cost Optimization Hub with actionable recommendations
 * - Interactive "View in Cost Explorer" detailed modal listing live itemized resources
 * - Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getLiveCostAndUsage,
  LiveBillingResult,
  BilledResource,
  MonthlyCostItem,
} from "@/app/actions/widgetActions";

export interface Budget {
  id: string;
  name: string;
  limit: number;
  actual: number;
  thresholdPercent: number;
  period: "MONTHLY" | "QUARTERLY";
  unit: string;
}

const DEFAULT_BUDGETS: Budget[] = [
  { id: "1", name: "Monthly Development Budget", limit: 50.0, actual: 0.0, thresholdPercent: 80, period: "MONTHLY", unit: "USD" },
  { id: "2", name: "S3 Storage Cap", limit: 10.0, actual: 0.0, thresholdPercent: 75, period: "MONTHLY", unit: "USD" },
  { id: "3", name: "Zero-Spend Alert", limit: 1.0, actual: 0.0, thresholdPercent: 100, period: "MONTHLY", unit: "USD" },
];

interface CostAndUsageWidgetProps {
  onRemove?: () => void;
}

export default function CostAndUsageWidget({ onRemove }: CostAndUsageWidgetProps) {
  const [activeTab, setActiveTab] = useState<"cost" | "budgets">("cost");
  const [groupBy, setGroupBy] = useState<"service" | "usageType">("service");
  const [timeframe, setTimeframe] = useState<"6m" | "3m" | "mtd">("6m");
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyCostItem | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showCostExplorerModal, setShowCostExplorerModal] = useState(false);
  const [showCreateBudgetModal, setShowCreateBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [optHubEnabled, setOptHubEnabled] = useState(false);
  const [optRecommendationsApplied, setOptRecommendationsApplied] = useState<string[]>([]);
  const [showOptHubModal, setShowOptHubModal] = useState(false);

  // Live billing result from backend
  const [billingData, setBillingData] = useState<LiveBillingResult | null>(null);
  const [currentCost, setCurrentCost] = useState(0.0);
  const [forecastCost, setForecastCost] = useState(0.0);
  const [monthlyData, setMonthlyData] = useState<MonthlyCostItem[]>([]);
  const [billedResources, setBilledResources] = useState<BilledResource[]>([]);

  // Budgets state with localStorage persistence
  const [budgets, setBudgets] = useState<Budget[]>(DEFAULT_BUDGETS);
  const [newBudgetName, setNewBudgetName] = useState("");
  const [newBudgetLimit, setNewBudgetLimit] = useState("");
  const [newBudgetThreshold, setNewBudgetThreshold] = useState("80");
  const [newBudgetPeriod, setNewBudgetPeriod] = useState<"MONTHLY" | "QUARTERLY">("MONTHLY");

  // Load budgets & live billing data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aws_console_budgets_v3");
      if (saved) {
        setBudgets(JSON.parse(saved));
      }
      const savedOpt = localStorage.getItem("aws_cost_opt_hub");
      if (savedOpt === "true") setOptHubEnabled(true);
      const savedApplied = localStorage.getItem("aws_cost_opt_applied");
      if (savedApplied) setOptRecommendationsApplied(JSON.parse(savedApplied));
    } catch { /* ignore */ }

    fetchBillingData();
  }, []);

  async function fetchBillingData() {
    try {
      const res = await getLiveCostAndUsage();
      setBillingData(res);
      setCurrentCost(res.monthToDate);
      setForecastCost(res.forecasted);
      setMonthlyData(res.monthlyHistory);
      setBilledResources(res.billedResources);

      // Update actual spend on active budgets
      setBudgets((prev) =>
        prev.map((b) => ({ ...b, actual: res.monthToDate }))
      );
    } catch (err) {
      console.error("Failed to fetch live billing data:", err);
    }
  }

  function handleCreateBudget(e: React.FormEvent) {
    e.preventDefault();
    const limitNum = parseFloat(newBudgetLimit);
    const thresholdNum = parseFloat(newBudgetThreshold) || 80;
    if (!newBudgetName.trim() || isNaN(limitNum) || limitNum <= 0) return;

    const newB: Budget = {
      id: Date.now().toString(),
      name: newBudgetName.trim(),
      limit: limitNum,
      actual: currentCost,
      thresholdPercent: thresholdNum,
      period: newBudgetPeriod,
      unit: "USD",
    };

    const updated = [...budgets, newB];
    setBudgets(updated);
    try {
      localStorage.setItem("aws_console_budgets_v3", JSON.stringify(updated));
    } catch { /* ignore */ }

    setNewBudgetName("");
    setNewBudgetLimit("");
    setNewBudgetThreshold("80");
    setShowCreateBudgetModal(false);
  }

  function handleUpdateBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBudget) return;
    const updated = budgets.map((b) => (b.id === editingBudget.id ? editingBudget : b));
    setBudgets(updated);
    try {
      localStorage.setItem("aws_console_budgets_v3", JSON.stringify(updated));
    } catch { /* ignore */ }
    setEditingBudget(null);
  }

  function handleDeleteBudget(id: string) {
    const updated = budgets.filter((b) => b.id !== id);
    setBudgets(updated);
    try {
      localStorage.setItem("aws_console_budgets_v3", JSON.stringify(updated));
    } catch { /* ignore */ }
  }

  function toggleOptHub() {
    const next = !optHubEnabled;
    setOptHubEnabled(next);
    try {
      localStorage.setItem("aws_cost_opt_hub", next ? "true" : "false");
    } catch { /* ignore */ }
    if (next) setShowOptHubModal(true);
  }

  function handleApplyRecommendation(id: string, savings: number) {
    const nextApplied = [...optRecommendationsApplied, id];
    setOptRecommendationsApplied(nextApplied);
    setForecastCost((prev) => +(Math.max(0, prev - savings)).toFixed(2));
    try {
      localStorage.setItem("aws_cost_opt_applied", JSON.stringify(nextApplied));
    } catch { /* ignore */ }
  }

  // Filter monthly data based on timeframe
  const filteredData = monthlyData.slice(
    timeframe === "mtd" ? -1 : timeframe === "3m" ? -3 : 0
  );

  // Dynamic max cost for chart scaling
  const highestSpend = Math.max(0, ...filteredData.map((d) => d.total));
  const maxCost = highestSpend > 0 ? Math.max(10, Math.ceil(highestSpend * 1.25)) : 10;
  const gridSteps = [maxCost, +(maxCost * 0.66).toFixed(1), +(maxCost * 0.33).toFixed(1), 0];

  return (
    <div className="relative bg-white border border-[#d5dbdb] rounded-sm awsui-shadow flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#eaeded] bg-white">
        <div className="flex items-center gap-2">
          {/* Drag Handle Icon */}
          <div className="text-[#879596] cursor-grab active:cursor-grabbing p-0.5" title="Move widget">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="9" cy="6" r="1.5" fill="currentColor" />
              <circle cx="15" cy="6" r="1.5" fill="currentColor" />
              <circle cx="9" cy="12" r="1.5" fill="currentColor" />
              <circle cx="15" cy="12" r="1.5" fill="currentColor" />
              <circle cx="9" cy="18" r="1.5" fill="currentColor" />
              <circle cx="15" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </div>

          <h2 className="text-[14px] font-bold text-[#16191f]">Cost and usage</h2>

          <button
            onClick={() => setShowInfoModal(true)}
            className="text-[12px] text-[#0073bb] hover:text-[#ec7211] hover:underline cursor-pointer"
          >
            Info
          </button>
        </div>

        {/* Tab pill toggle */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#f2f3f3] p-0.5 rounded text-[11px]">
            <button
              onClick={() => setActiveTab("cost")}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === "cost"
                  ? "bg-white font-medium text-[#16191f] shadow-xs"
                  : "text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Cost &amp; usage
            </button>
            <button
              onClick={() => setActiveTab("budgets")}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === "budgets"
                  ? "bg-white font-medium text-[#16191f] shadow-xs"
                  : "text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Budgets ({budgets.length})
            </button>
          </div>

          {/* Kebab Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-[#545b64] hover:text-[#16191f] rounded hover:bg-[#f2f3f3]"
              title="Widget actions"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="12" cy="19" r="1.8" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#d5dbdb] rounded shadow-lg py-1 z-30 text-[13px]">
                <button
                  onClick={() => {
                    fetchBillingData();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
                >
                  Refresh billing
                </button>
                <button
                  onClick={() => {
                    setShowInfoModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
                >
                  Widget info
                </button>
                <button
                  onClick={() => {
                    setShowCostExplorerModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
                >
                  Open Cost Explorer
                </button>
                <button
                  onClick={() => {
                    setShowOptHubModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
                >
                  Optimization Hub
                </button>
                {onRemove && (
                  <button
                    onClick={() => {
                      onRemove();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#fdf3f1] text-[#d13212] border-t border-[#eaeded]"
                  >
                    Remove widget
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex-1 flex flex-col">
        {activeTab === "cost" ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1">
            {/* Left Metrics Column */}
            <div className="md:col-span-4 space-y-4 pr-2">
              <div>
                <div className="text-[12px] text-[#545b64] mb-0.5">Current month costs</div>
                <div className="text-[26px] font-bold text-[#0073bb] leading-none">
                  ${currentCost.toFixed(2)}
                </div>
                <div className="text-[11px] text-[#545b64] mt-1 flex items-center gap-1">
                  {currentCost === 0 ? (
                    <span className="text-[#879596]">$0.00 (No active resource spend)</span>
                  ) : billingData && billingData.percentChange !== 0 ? (
                    <>
                      <span className={billingData.percentChange > 0 ? "text-amber-700 font-medium" : "text-emerald-700 font-medium"}>
                        {billingData.percentChange > 0 ? `+${billingData.percentChange}%` : `${billingData.percentChange}%`}
                      </span>
                      <span>compared to last month</span>
                    </>
                  ) : (
                    <span className="text-[#879596]">Baseline initial tracking</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64] mb-0.5">Forecasted month end costs</div>
                <div className="text-[26px] font-bold text-[#0073bb] leading-none">
                  ${forecastCost.toFixed(2)}
                </div>
                <div className="text-[11px] text-[#545b64] mt-1">
                  {currentCost === 0
                    ? "Forecasted spend will update as resources run"
                    : "Estimated full month cost at current run-rate"}
                </div>
              </div>

              {/* Resource Inventory */}
              <div className="text-[11px] text-[#545b64] bg-[#f8f9fa] border border-[#eaeded] p-2.5 rounded">
                <div className="font-semibold text-[#16191f] mb-1 flex items-center justify-between">
                  <span>Live Tracked Inventory:</span>
                  <span className="text-[10px] text-[#0073bb] font-mono">
                    {billingData?.resourceCounts.totalActive || 0} active
                  </span>
                </div>
                {billingData && billingData.resourceCounts.totalActive > 0 ? (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
                    <div>EC2: <strong className="text-[#16191f]">{billingData.resourceCounts.ec2Instances}</strong></div>
                    <div>EBS: <strong className="text-[#16191f]">{billingData.resourceCounts.ebsVolumes}</strong></div>
                    <div>S3: <strong className="text-[#16191f]">{billingData.resourceCounts.s3Buckets}</strong></div>
                    <div>DynamoDB: <strong className="text-[#16191f]">{billingData.resourceCounts.dynamoTables}</strong></div>
                    <div>SQS: <strong className="text-[#16191f]">{billingData.resourceCounts.sqsQueues}</strong></div>
                    <div>Other: <strong className="text-[#16191f]">{billingData.resourceCounts.loadBalancers + billingData.resourceCounts.elasticIps + billingData.resourceCounts.lambdaFunctions}</strong></div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#879596] leading-tight">
                    No active billable resources. Launching an EC2 instance, creating an EBS volume, or creating an S3 bucket will automatically bill them here.
                  </p>
                )}
              </div>

              <div className="pt-1">
                <div className="text-[12px] font-bold text-[#16191f] mb-1.5">Savings opportunities</div>
                <button
                  type="button"
                  onClick={toggleOptHub}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className={`px-3 text-[12px] rounded-sm font-medium border transition-colors whitespace-nowrap inline-flex items-center justify-center ${
                    optHubEnabled
                      ? "bg-[#f2f8fd] border-[#0073bb] text-[#0073bb]"
                      : "bg-white border-[#0073bb] text-[#0073bb] hover:bg-[#f2f8fd]"
                  }`}
                >
                  {optHubEnabled ? "Cost Optimization Hub Enabled" : "Enable Cost Optimization Hub"}
                </button>
                {optHubEnabled && (
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-medium">
                      Optimization active
                    </span>
                    <button
                      onClick={() => setShowOptHubModal(true)}
                      className="text-[#0073bb] hover:underline"
                    >
                      View
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Chart Column */}
            <div className="md:col-span-8 flex flex-col justify-between">
              {/* Chart Controls: Group by & Timeframe */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[#eaeded]">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-[#545b64] font-medium">Group by:</span>
                  <button
                    onClick={() => setGroupBy("service")}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      groupBy === "service" ? "bg-[#0073bb] text-white" : "bg-[#f2f3f3] text-[#545b64] hover:text-[#16191f]"
                    }`}
                  >
                    Service
                  </button>
                  <button
                    onClick={() => setGroupBy("usageType")}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      groupBy === "usageType" ? "bg-[#0073bb] text-white" : "bg-[#f2f3f3] text-[#545b64] hover:text-[#16191f]"
                    }`}
                  >
                    Usage type
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-[#545b64] mr-1 font-medium">Timeframe:</span>
                  <button
                    onClick={() => setTimeframe("6m")}
                    className={`px-1.5 py-0.5 rounded ${
                      timeframe === "6m" ? "font-bold text-[#0073bb] underline" : "text-[#545b64] hover:text-[#16191f]"
                    }`}
                  >
                    6M
                  </button>
                  <button
                    onClick={() => setTimeframe("3m")}
                    className={`px-1.5 py-0.5 rounded ${
                      timeframe === "3m" ? "font-bold text-[#0073bb] underline" : "text-[#545b64] hover:text-[#16191f]"
                    }`}
                  >
                    3M
                  </button>
                  <button
                    onClick={() => setTimeframe("mtd")}
                    className={`px-1.5 py-0.5 rounded ${
                      timeframe === "mtd" ? "font-bold text-[#0073bb] underline" : "text-[#545b64] hover:text-[#16191f]"
                    }`}
                  >
                    MTD
                  </button>
                </div>
              </div>

              {/* Stacked Bar Chart Graphic */}
              <div className="relative pt-2 pb-2">
                {/* Horizontal Gridlines */}
                <div className="absolute inset-0 h-[140px] flex flex-col justify-between pointer-events-none">
                  {gridSteps.map((val) => (
                    <div key={val} className="w-full flex items-center gap-2 text-[10px] text-[#879596]">
                      <span className="w-8 text-right font-mono">${val}</span>
                      <div className="flex-1 border-b border-[#eaeded]" />
                    </div>
                  ))}
                </div>

                {/* Bars Container */}
                <div className="relative ml-10 flex items-end justify-around h-[140px] z-10">
                  {filteredData.map((d) => {
                    const total = d.total;
                    const maxBarHeightPx = 118;
                    const barHeightPx = total > 0 ? Math.max(10, Math.round((total / maxCost) * maxBarHeightPx)) : 0;

                    return (
                      <div
                        key={d.month}
                        className="group relative flex flex-col items-center justify-end h-full cursor-pointer w-12 sm:w-16"
                        onMouseEnter={() => setHoveredMonth(d)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      >
                        {/* Hover Tooltip */}
                        {hoveredMonth?.month === d.month && (
                          <div className="absolute bottom-[calc(100%+8px)] z-40 bg-[#16191f] text-white text-[11px] rounded px-3 py-2 shadow-xl whitespace-nowrap min-w-[190px] pointer-events-none">
                            <div className="font-bold border-b border-gray-600 pb-1 mb-1.5 flex justify-between">
                              <span>{d.month}</span>
                              <span className="text-[#fbd89a] font-mono">${total.toFixed(2)}</span>
                            </div>
                            {total === 0 ? (
                              <div className="text-[11px] text-gray-400 py-0.5">
                                No active resource spend
                              </div>
                            ) : groupBy === "service" ? (
                              <div className="space-y-1">
                                {d.ec2 > 0 && (
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-[#3b82f6]" />
                                      <span>Amazon EC2</span>
                                    </span>
                                    <span className="font-mono">${d.ec2.toFixed(2)}</span>
                                  </div>
                                )}
                                {d.ebs > 0 && (
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-[#2563eb]" />
                                      <span>Amazon EBS</span>
                                    </span>
                                    <span className="font-mono">${d.ebs.toFixed(2)}</span>
                                  </div>
                                )}
                                {d.s3 > 0 && (
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-[#10b981]" />
                                      <span>Amazon S3</span>
                                    </span>
                                    <span className="font-mono">${d.s3.toFixed(2)}</span>
                                  </div>
                                )}
                                {d.dynamodb > 0 && (
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-[#8b5cf6]" />
                                      <span>Amazon DynamoDB</span>
                                    </span>
                                    <span className="font-mono">${d.dynamodb.toFixed(2)}</span>
                                  </div>
                                )}
                                {d.sqs > 0 && (
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-[#f97316]" />
                                      <span>Amazon SQS</span>
                                    </span>
                                    <span className="font-mono">${d.sqs.toFixed(2)}</span>
                                  </div>
                                )}
                                {d.other > 0 && (
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-[#06b6d4]" />
                                      <span>Other Services</span>
                                    </span>
                                    <span className="font-mono">${d.other.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {d.ec2 > 0 && (
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-[#2563eb]" />
                                      <span>BoxUsage (Compute)</span>
                                    </span>
                                    <span className="font-mono">${d.ec2.toFixed(2)}</span>
                                  </div>
                                )}
                                {d.ebs > 0 && (
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-[#3b82f6]" />
                                      <span>VolumeStorage (EBS)</span>
                                    </span>
                                    <span className="font-mono">${d.ebs.toFixed(2)}</span>
                                  </div>
                                )}
                                {d.s3 > 0 && (
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-[#059669]" />
                                      <span>TimedStorage (S3)</span>
                                    </span>
                                    <span className="font-mono">${d.s3.toFixed(2)}</span>
                                  </div>
                                )}
                                {d.dynamodb > 0 && (
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-[#7c3aed]" />
                                      <span>ProvisionedCapacity</span>
                                    </span>
                                    <span className="font-mono">${d.dynamodb.toFixed(2)}</span>
                                  </div>
                                )}
                                {(d.sqs > 0 || d.other > 0) && (
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-[#0891b2]" />
                                      <span>Requests &amp; Other</span>
                                    </span>
                                    <span className="font-mono">${(d.sqs + d.other).toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Stacked Bar Segments */}
                        {barHeightPx > 0 ? (
                          <div
                            className="w-7 sm:w-10 rounded-t flex flex-col-reverse overflow-hidden transition-all duration-200 group-hover:brightness-110 shadow-xs border border-white/20"
                            style={{ height: `${barHeightPx}px` }}
                          >
                            {groupBy === "service" ? (
                              <>
                                {d.ec2 > 0 && (
                                  <div style={{ height: `${(d.ec2 / total) * 100}%` }} className="bg-[#3b82f6] shrink-0" />
                                )}
                                {d.ebs > 0 && (
                                  <div style={{ height: `${(d.ebs / total) * 100}%` }} className="bg-[#2563eb] shrink-0" />
                                )}
                                {d.s3 > 0 && (
                                  <div style={{ height: `${(d.s3 / total) * 100}%` }} className="bg-[#10b981] shrink-0" />
                                )}
                                {d.dynamodb > 0 && (
                                  <div style={{ height: `${(d.dynamodb / total) * 100}%` }} className="bg-[#8b5cf6] shrink-0" />
                                )}
                                {d.sqs > 0 && (
                                  <div style={{ height: `${(d.sqs / total) * 100}%` }} className="bg-[#f97316] shrink-0" />
                                )}
                                {d.other > 0 && (
                                  <div style={{ height: `${(d.other / total) * 100}%` }} className="bg-[#06b6d4] shrink-0" />
                                )}
                              </>
                            ) : (
                              <>
                                {d.ec2 > 0 && (
                                  <div style={{ height: `${(d.ec2 / total) * 100}%` }} className="bg-[#2563eb] shrink-0" />
                                )}
                                {d.ebs > 0 && (
                                  <div style={{ height: `${(d.ebs / total) * 100}%` }} className="bg-[#3b82f6] shrink-0" />
                                )}
                                {d.s3 > 0 && (
                                  <div style={{ height: `${(d.s3 / total) * 100}%` }} className="bg-[#059669] shrink-0" />
                                )}
                                {d.dynamodb > 0 && (
                                  <div style={{ height: `${(d.dynamodb / total) * 100}%` }} className="bg-[#7c3aed] shrink-0" />
                                )}
                                {(d.sqs > 0 || d.other > 0) && (
                                  <div style={{ height: `${((d.sqs + d.other) / total) * 100}%` }} className="bg-[#0891b2] shrink-0" />
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="w-7 sm:w-10 h-1 bg-[#d5dbdb] rounded-full mb-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X-axis Labels */}
                <div className="ml-10 flex justify-around pt-1.5 border-t border-[#d5dbdb]">
                  {filteredData.map((d) => (
                    <span key={d.month} className="w-12 sm:w-16 text-center text-[11px] text-[#545b64] font-medium">
                      {d.month}
                    </span>
                  ))}
                </div>

                {/* Color Legend */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2.5 text-[11px] text-[#545b64]">
                  {groupBy === "service" ? (
                    <>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#3b82f6]" />Amazon EC2</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb]" />Amazon EBS</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#10b981]" />Amazon S3</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#8b5cf6]" />Amazon DynamoDB</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#f97316]" />Amazon SQS</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#06b6d4]" />Other</span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb]" />BoxUsage (Compute)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#3b82f6]" />VolumeStorage (EBS)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#059669]" />TimedStorage (S3)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#7c3aed]" />ProvisionedCapacity</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#0891b2]" />Requests &amp; Other</span>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer Links */}
              <div className="pt-2 flex items-center justify-between text-[12px]">
                <button
                  onClick={() => setShowCostExplorerModal(true)}
                  className="text-[#0073bb] hover:text-[#ec7211] hover:underline font-medium cursor-pointer"
                >
                  View in Cost Explorer &rarr;
                </button>
                <span className="text-[11px] text-[#879596]">Data refreshed live from emulator</span>
              </div>
            </div>
          </div>
        ) : (
          /* Budgets Tab */
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-bold text-[#16191f]">Active Budgets</h3>
                <p className="text-[11px] text-[#545b64]">
                  Track spending against targets with threshold alerting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateBudgetModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-3 text-[12px] bg-[#ec7211] text-white rounded-sm font-medium hover:bg-[#eb5f07] transition-colors whitespace-nowrap inline-flex items-center justify-center"
              >
                + Create budget
              </button>
            </div>

            {/* Budgets List */}
            <div className="space-y-2.5 overflow-y-auto max-h-[190px] pr-1">
              {budgets.map((b) => {
                const pct = b.limit > 0 ? Math.min(150, Math.round((b.actual / b.limit) * 100)) : 0;
                const isOver = b.actual >= b.limit && b.actual > 0;
                const isWarning = !isOver && pct >= (b.thresholdPercent || 80);

                return (
                  <div key={b.id} className="p-3 border border-[#eaeded] rounded bg-[#fafafa] space-y-1.5">
                    <div className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#16191f]">{b.name}</span>
                        <span className="text-[10px] text-[#545b64] border border-[#d5dbdb] px-1.5 py-0.5 rounded">
                          {b.period}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#16191f]">
                          ${b.actual.toFixed(2)} / ${b.limit.toFixed(2)} {b.unit}
                        </span>
                        <button
                          onClick={() => setEditingBudget(b)}
                          className="text-[11px] text-[#0073bb] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(b.id)}
                          className="text-[11px] text-[#d13212] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-[#eaeded] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOver ? "bg-[#d13212]" : isWarning ? "bg-[#eb5f07]" : "bg-[#10b981]"
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#545b64]">
                      <span>{pct}% of target spend</span>
                      <span>Alert at {b.thresholdPercent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#eaeded] flex justify-between items-center text-[12px]">
              <span className="text-[11px] text-[#545b64]">
                Total Budgets: <strong>{budgets.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowCreateBudgetModal(true)}
                className="text-[#0073bb] hover:underline text-[12px] font-medium"
              >
                Add new threshold budget &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[480px] w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[16px] font-bold text-[#16191f]">Cost and Usage Widget Info</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="text-[13px] text-[#545b64] space-y-2">
              <p>
                This widget scans all active resources in your AWS Emulator (EC2 instances, EBS volumes, S3 buckets, DynamoDB tables, SQS queues) and computes real month-to-date and forecasted costs using official AWS pricing rates.
              </p>
              <p>
                When you launch an EC2 instance, create an S3 bucket, or provision an EBS volume, this widget automatically assigns usage costs to each resource.
              </p>
            </div>
            <div className="flex justify-end pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setShowInfoModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] bg-[#0073bb] text-white rounded-sm font-medium hover:bg-[#005a9e] whitespace-nowrap inline-flex items-center justify-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {showCreateBudgetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBudget}
            className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[440px] w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[16px] font-bold text-[#16191f]">Create AWS Budget</h3>
              <button type="button" onClick={() => setShowCreateBudgetModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <label className="block font-medium text-[#16191f] mb-1">Budget Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly EC2 Cap"
                  value={newBudgetName}
                  onChange={(e) => setNewBudgetName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[#16191f] focus:border-[#0073bb] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-[#16191f] mb-1">Target Limit (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="50.00"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[#16191f] focus:border-[#0073bb] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-[#16191f] mb-1">Alert Threshold (%)</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={newBudgetThreshold}
                  onChange={(e) => setNewBudgetThreshold(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[#16191f] focus:border-[#0073bb] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-[#16191f] mb-1">Period</label>
                <select
                  value={newBudgetPeriod}
                  onChange={(e) => setNewBudgetPeriod(e.target.value as "MONTHLY" | "QUARTERLY")}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[#16191f] focus:border-[#0073bb] outline-hidden bg-white"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCreateBudgetModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] border border-[#545b64] text-[#16191f] rounded-sm hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] bg-[#ec7211] text-white rounded-sm font-medium hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center"
              >
                Save Budget
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateBudget}
            className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[440px] w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[16px] font-bold text-[#16191f]">Edit Budget: {editingBudget.name}</h3>
              <button type="button" onClick={() => setEditingBudget(null)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <label className="block font-medium text-[#16191f] mb-1">Target Limit (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingBudget.limit}
                  onChange={(e) => setEditingBudget({ ...editingBudget, limit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[#16191f] focus:border-[#0073bb] outline-hidden"
                />
              </div>
              <div>
                <label className="block font-medium text-[#16191f] mb-1">Threshold (%)</label>
                <input
                  type="number"
                  value={editingBudget.thresholdPercent || 80}
                  onChange={(e) => setEditingBudget({ ...editingBudget, thresholdPercent: parseFloat(e.target.value) || 80 })}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[#16191f] focus:border-[#0073bb] outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] border border-[#545b64] text-[#16191f] rounded-sm hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] bg-[#0073bb] text-white rounded-sm font-medium hover:bg-[#005a9e] whitespace-nowrap inline-flex items-center justify-center"
              >
                Update Budget
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cost Explorer Detailed Modal with Live Billed Resources */}
      {showCostExplorerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[840px] w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3 shrink-0">
              <div>
                <h3 className="text-[17px] font-bold text-[#16191f]">AWS Cost Explorer (Interactive Replica)</h3>
                <p className="text-[12px] text-[#545b64]">Live Resource Usage Billing Engine | Region: us-east-1</p>
              </div>
              <button onClick={() => setShowCostExplorerModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-[#f8f9fa] border border-[#eaeded] rounded text-center shrink-0">
              <div>
                <div className="text-[11px] text-[#545b64]">Actual Spend (MTD)</div>
                <div className="text-[20px] font-bold text-[#0073bb]">${currentCost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64]">Forecast End of Month</div>
                <div className="text-[20px] font-bold text-[#16191f]">${forecastCost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64]">Active Billed Resources</div>
                <div className="text-[20px] font-bold text-[#16191f]">{billedResources.length}</div>
              </div>
            </div>

            {/* Billed Resources Table */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
              <div className="text-[13px] font-bold text-[#16191f]">Itemized Resource Charges</div>
              <div className="border border-[#eaeded] rounded overflow-hidden">
                <table className="w-full text-[12px] text-left">
                  <thead className="bg-[#f2f3f3] text-[#545b64] font-semibold sticky top-0 bg-[#f2f3f3]">
                    <tr>
                      <th className="py-2 px-3">Resource ID</th>
                      <th className="py-2 px-3">Service</th>
                      <th className="py-2 px-3">Usage Type</th>
                      <th className="py-2 px-3">Rate</th>
                      <th className="py-2 px-3 text-right">MTD Cost</th>
                      <th className="py-2 px-3 text-right">Forecasted</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {billedResources.length > 0 ? (
                      billedResources.map((res) => (
                        <tr key={res.id} className="hover:bg-[#f9fafb]">
                          <td className="py-2 px-3 font-mono font-medium text-[#0073bb]">{res.id}</td>
                          <td className="py-2 px-3 text-[#16191f] font-medium">{res.service}</td>
                          <td className="py-2 px-3 text-[#545b64]">{res.usageType}</td>
                          <td className="py-2 px-3 text-[#545b64] font-mono text-[11px]">{res.rateDescription}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#16191f]">
                            ${res.mtdCost.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[#545b64]">
                            ${res.forecastedCost.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              res.status === "running" || res.status === "in-use" || res.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}>
                              {res.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 px-4 text-center text-[#545b64] space-y-1">
                          <div className="font-semibold text-[13px] text-[#16191f]">No active usage charges</div>
                          <p className="text-[12px] text-[#879596]">
                            No billable AWS resources are currently active. Launch an EC2 instance, create an EBS volume, create an S3 bucket, or provision a DynamoDB table to see live usage charges here.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#eaeded] shrink-0">
              <button
                onClick={() => setShowCostExplorerModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] bg-[#0073bb] text-white rounded-sm font-medium hover:bg-[#005a9e] whitespace-nowrap inline-flex items-center justify-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cost Optimization Hub Modal */}
      {showOptHubModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[560px] w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">Cost Optimization Hub</h3>
                <p className="text-[12px] text-[#545b64]">Actionable recommendations based on active resources</p>
              </div>
              <button onClick={() => setShowOptHubModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {billedResources.length > 0 ? (
                billedResources
                  .filter((r) => r.status === "stopped" || r.usageType.includes("IdleAddress"))
                  .map((res) => {
                    const id = `opt-${res.id}`;
                    const applied = optRecommendationsApplied.includes(id);
                    const savings = res.forecastedCost;

                    return (
                      <div key={id} className="p-3 border border-[#eaeded] rounded bg-[#fafafa] flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[13px] text-[#16191f]">
                              Release idle resource: {res.id}
                            </span>
                            <span className="text-[10px] bg-[#f2f8fd] text-[#0073bb] border border-[#d5dbdb] px-1.5 py-0.5 rounded">
                              {res.serviceKey.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#545b64] mt-0.5">
                            Resource is in {res.status} state. Terminating or releasing eliminates storage/idle charges.
                          </p>
                          <div className="text-[11px] font-semibold text-emerald-700 mt-1">
                            Estimated savings: ${savings.toFixed(2)}/month
                          </div>
                        </div>

                        <button
                          disabled={applied}
                          onClick={() => handleApplyRecommendation(id, savings)}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          className={`px-3 text-[12px] rounded-sm font-medium transition-colors shrink-0 whitespace-nowrap inline-flex items-center justify-center ${
                            applied
                              ? "bg-[#f2f8f0] text-[#1d8102] border border-[#b8dfaf] cursor-default"
                              : "bg-[#0073bb] text-white hover:bg-[#005a9e]"
                          }`}
                        >
                          {applied ? "Applied" : "Optimize"}
                        </button>
                      </div>
                    );
                  })
              ) : null}

              {billedResources.filter((r) => r.status === "stopped" || r.usageType.includes("IdleAddress")).length === 0 && (
                <div className="p-6 text-center text-[#545b64] space-y-1">
                  <div className="font-semibold text-[13px] text-[#16191f]">No optimization actions required</div>
                  <p className="text-[12px] text-[#879596]">
                    All active resources are operating efficiently with zero unattached idle addresses or wasteful stopped allocations.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowOptHubModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] bg-[#0073bb] text-white rounded-sm font-medium hover:bg-[#005a9e] whitespace-nowrap inline-flex items-center justify-center"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
