/**
 * CostAndUsageWidget.tsx – Authentic AWS Console Cost and usage widget.
 * Features:
 * - Live resource-backed cost calculations and estimates
 * - Dynamic "Group by" filter (Service vs Usage Type)
 * - Dynamic Timeframe filter (Last 6 months, Last 3 months, Month to date)
 * - Interactive stacked bar chart with live hover tooltips
 * - Fully functional "AWS Budgets" management (Create, Edit, Delete, Threshold Alerts)
 * - Functional Cost Optimization Hub with actionable recommendations
 * - Interactive "View in Cost Explorer" detailed modal
 * - Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getLiveCostAndUsage, LiveCostData } from "@/app/actions/widgetActions";

interface MonthlyCost {
  month: string;
  ec2: number;
  s3: number;
  dynamodb: number;
  sqs: number;
  other: number;
}

const DEFAULT_MONTHLY_DATA: MonthlyCost[] = [
  { month: "Apr 24", ec2: 42.0, s3: 12.5, dynamodb: 8.2, sqs: 4.5, other: 4.0 },
  { month: "May 24", ec2: 41.5, s3: 13.0, dynamodb: 7.8, sqs: 4.2, other: 3.3 },
  { month: "Jun 24", ec2: 44.2, s3: 14.8, dynamodb: 9.1, sqs: 4.8, other: 3.5 },
  { month: "Jul 24", ec2: 172.0, s3: 38.5, dynamodb: 26.0, sqs: 15.5, other: 16.5 },
  { month: "Aug 24", ec2: 170.5, s3: 37.8, dynamodb: 25.5, sqs: 16.0, other: 17.3 },
  { month: "Sep 24", ec2: 78.0, s3: 24.5, dynamodb: 14.2, sqs: 8.8, other: 8.8 },
];

const SERVICE_COLORS = {
  ec2: { name: "Amazon EC2", color: "#3b82f6" },
  s3: { name: "Amazon S3", color: "#10b981" },
  dynamodb: { name: "Amazon DynamoDB", color: "#8b5cf6" },
  sqs: { name: "Amazon SQS", color: "#f97316" },
  other: { name: "Other Services", color: "#06b6d4" },
};

const USAGE_TYPE_COLORS = {
  compute: { name: "BoxUsage (Compute)", color: "#2563eb" },
  storage: { name: "TimedStorage (GB-Mo)", color: "#059669" },
  requests: { name: "Requests (Tier 1/2)", color: "#7c3aed" },
  dataTransfer: { name: "DataTransfer-Out", color: "#ea580c" },
  other: { name: "Other Usage Types", color: "#0891b2" },
};

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
  { id: "1", name: "Monthly Development Budget", limit: 50.0, actual: 31.1, thresholdPercent: 80, period: "MONTHLY", unit: "USD" },
  { id: "2", name: "S3 Storage Cap", limit: 10.0, actual: 4.2, thresholdPercent: 75, period: "MONTHLY", unit: "USD" },
  { id: "3", name: "Zero-Spend Alert", limit: 1.0, actual: 31.1, thresholdPercent: 100, period: "MONTHLY", unit: "USD" },
];

interface CostAndUsageWidgetProps {
  onRemove?: () => void;
}

export default function CostAndUsageWidget({ onRemove }: CostAndUsageWidgetProps) {
  const [activeTab, setActiveTab] = useState<"cost" | "budgets">("cost");
  const [groupBy, setGroupBy] = useState<"service" | "usageType">("service");
  const [timeframe, setTimeframe] = useState<"6m" | "3m" | "mtd">("6m");
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyCost | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showCostExplorerModal, setShowCostExplorerModal] = useState(false);
  const [showCreateBudgetModal, setShowCreateBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [optHubEnabled, setOptHubEnabled] = useState(false);
  const [optRecommendationsApplied, setOptRecommendationsApplied] = useState<string[]>([]);
  const [showOptHubModal, setShowOptHubModal] = useState(false);

  // Live costs from backend
  const [currentCost, setCurrentCost] = useState(31.10);
  const [forecastCost, setForecastCost] = useState(62.15);
  const [monthlyData, setMonthlyData] = useState<MonthlyCost[]>(DEFAULT_MONTHLY_DATA);
  const [resourceCounts, setResourceCounts] = useState<{ s3Buckets: number; dynamoTables: number; sqsQueues: number } | null>(null);

  // Budgets state with localStorage persistence
  const [budgets, setBudgets] = useState<Budget[]>(DEFAULT_BUDGETS);
  const [newBudgetName, setNewBudgetName] = useState("");
  const [newBudgetLimit, setNewBudgetLimit] = useState("");
  const [newBudgetThreshold, setNewBudgetThreshold] = useState("80");
  const [newBudgetPeriod, setNewBudgetPeriod] = useState<"MONTHLY" | "QUARTERLY">("MONTHLY");

  // Load budgets & live data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aws_console_budgets_v2");
      if (saved) {
        setBudgets(JSON.parse(saved));
      }
      const savedOpt = localStorage.getItem("aws_cost_opt_hub");
      if (savedOpt === "true") setOptHubEnabled(true);
      const savedApplied = localStorage.getItem("aws_cost_opt_applied");
      if (savedApplied) setOptRecommendationsApplied(JSON.parse(savedApplied));
    } catch { /* ignore */ }

    getLiveCostAndUsage().then((res: LiveCostData) => {
      setCurrentCost(res.monthToDate);
      setForecastCost(res.forecasted);
      setMonthlyData(res.monthlyHistory);
      setResourceCounts({
        s3Buckets: res.serviceCounts.s3Buckets,
        dynamoTables: res.serviceCounts.dynamoTables,
        sqsQueues: res.serviceCounts.sqsQueues,
      });
    }).catch(() => {
      // Keep defaults
    });
  }, []);

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
      localStorage.setItem("aws_console_budgets_v2", JSON.stringify(updated));
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
      localStorage.setItem("aws_console_budgets_v2", JSON.stringify(updated));
    } catch { /* ignore */ }
    setEditingBudget(null);
  }

  function handleDeleteBudget(id: string) {
    const updated = budgets.filter((b) => b.id !== id);
    setBudgets(updated);
    try {
      localStorage.setItem("aws_console_budgets_v2", JSON.stringify(updated));
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
    setForecastCost((prev) => +(Math.max(10, prev - savings)).toFixed(2));
    try {
      localStorage.setItem("aws_cost_opt_applied", JSON.stringify(nextApplied));
    } catch { /* ignore */ }
  }

  // Filter monthly data based on timeframe
  const filteredData = monthlyData.slice(
    timeframe === "mtd" ? -1 : timeframe === "3m" ? -3 : 0
  );

  const maxCost = 300;

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
                  <span className="text-emerald-700 font-medium">&darr; 6%</span>
                  <span>compared to last month for same period</span>
                </div>
              </div>

              <div>
                <div className="text-[12px] text-[#545b64] mb-0.5">Forecasted month end costs</div>
                <div className="text-[26px] font-bold text-[#0073bb] leading-none">
                  ${forecastCost.toFixed(2)}
                </div>
                <div className="text-[11px] text-[#545b64] mt-1 flex items-center gap-1">
                  <span className="text-emerald-700 font-medium">&darr; 5%</span>
                  <span>compared to last month&apos;s total costs</span>
                </div>
              </div>

              {resourceCounts && (
                <div className="text-[11px] text-[#545b64] bg-[#f8f9fa] border border-[#eaeded] p-2 rounded">
                  <div className="font-semibold text-[#16191f] mb-0.5">Local Inventory Tracked:</div>
                  <div>S3: {resourceCounts.s3Buckets} buckets | DynamoDB: {resourceCounts.dynamoTables} tables | SQS: {resourceCounts.sqsQueues} queues</div>
                </div>
              )}

              <div className="pt-1">
                <div className="text-[12px] font-bold text-[#16191f] mb-1.5">Savings opportunities</div>
                <button
                  type="button"
                  onClick={toggleOptHub}
                  className={`px-3 py-1.5 text-[12px] rounded-sm font-medium border transition-colors ${
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
                      {3 - optRecommendationsApplied.length} active opportunities
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
                    className={`px-2 py-0.5 rounded ${
                      groupBy === "service"
                        ? "bg-[#0073bb] text-white font-medium"
                        : "bg-[#f2f3f3] text-[#545b64] hover:text-[#16191f]"
                    }`}
                  >
                    Service
                  </button>
                  <button
                    onClick={() => setGroupBy("usageType")}
                    className={`px-2 py-0.5 rounded ${
                      groupBy === "usageType"
                        ? "bg-[#0073bb] text-white font-medium"
                        : "bg-[#f2f3f3] text-[#545b64] hover:text-[#16191f]"
                    }`}
                  >
                    Usage type
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-[#545b64] mr-1">Timeframe:</span>
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
              <div className="relative pt-2 pb-6 border-b border-[#eaeded]">
                {/* Horizontal Gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                  {[300, 200, 100, 0].map((val) => (
                    <div key={val} className="w-full flex items-center gap-2 text-[10px] text-[#879596]">
                      <span className="w-6 text-right font-mono">{val}</span>
                      <div className="flex-1 border-b border-[#eaeded]" />
                    </div>
                  ))}
                </div>

                {/* Bars Container */}
                <div className="relative ml-8 flex items-end justify-around h-[140px] pt-2">
                  {filteredData.map((d) => {
                    const total = d.ec2 + d.s3 + d.dynamodb + d.sqs + d.other;
                    const totalHeightPct = Math.min(100, (total / maxCost) * 100);

                    const pEc2 = (d.ec2 / total) * totalHeightPct;
                    const pS3 = (d.s3 / total) * totalHeightPct;
                    const pDyn = (d.dynamodb / total) * totalHeightPct;
                    const pSqs = (d.sqs / total) * totalHeightPct;
                    const pOth = (d.other / total) * totalHeightPct;

                    return (
                      <div
                        key={d.month}
                        className="group relative flex flex-col items-center cursor-pointer"
                        onMouseEnter={() => setHoveredMonth(d)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      >
                        {/* Hover Tooltip */}
                        {hoveredMonth?.month === d.month && (
                          <div className="absolute bottom-[calc(100%+8px)] z-40 bg-[#16191f] text-white text-[11px] rounded px-3 py-2 shadow-xl whitespace-nowrap min-w-[170px] pointer-events-none">
                            <div className="font-bold border-b border-gray-600 pb-1 mb-1.5 flex justify-between">
                              <span>{d.month}</span>
                              <span className="text-[#fbd89a]">${total.toFixed(2)}</span>
                            </div>
                            {groupBy === "service" ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-xs bg-[#3b82f6]" />
                                    <span>Amazon EC2</span>
                                  </span>
                                  <span className="font-mono">${d.ec2.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-xs bg-[#10b981]" />
                                    <span>Amazon S3</span>
                                  </span>
                                  <span className="font-mono">${d.s3.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-xs bg-[#8b5cf6]" />
                                    <span>Amazon DynamoDB</span>
                                  </span>
                                  <span className="font-mono">${d.dynamodb.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-xs bg-[#f97316]" />
                                    <span>Amazon SQS</span>
                                  </span>
                                  <span className="font-mono">${d.sqs.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-xs bg-[#06b6d4]" />
                                    <span>Other Services</span>
                                  </span>
                                  <span className="font-mono">${d.other.toFixed(2)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-xs bg-[#2563eb]" />
                                    <span>BoxUsage (Compute)</span>
                                  </span>
                                  <span className="font-mono">${d.ec2.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-xs bg-[#059669]" />
                                    <span>TimedStorage (S3)</span>
                                  </span>
                                  <span className="font-mono">${d.s3.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-xs bg-[#7c3aed]" />
                                    <span>Read/Write Units</span>
                                  </span>
                                  <span className="font-mono">${d.dynamodb.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Stacked Bar Segments */}
                        <div
                          className="w-7 sm:w-10 rounded-t flex flex-col-reverse overflow-hidden transition-all duration-200 group-hover:brightness-110 shadow-xs"
                          style={{ height: `${totalHeightPct}%` }}
                        >
                          <div style={{ height: `${pEc2}%` }} className="bg-[#3b82f6]" />
                          <div style={{ height: `${pS3}%` }} className="bg-[#10b981]" />
                          <div style={{ height: `${pDyn}%` }} className="bg-[#8b5cf6]" />
                          <div style={{ height: `${pSqs}%` }} className="bg-[#f97316]" />
                          <div style={{ height: `${pOth}%` }} className="bg-[#06b6d4]" />
                        </div>

                        {/* X-axis Label */}
                        <span className="text-[11px] text-[#545b64] mt-2 group-hover:text-[#16191f] font-medium">
                          {d.month}
                        </span>
                      </div>
                    );
                  })}
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
                <span className="text-[11px] text-[#879596]">Data refreshed today</span>
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
                className="px-3 py-1 text-[12px] bg-[#ec7211] text-white rounded-sm font-medium hover:bg-[#eb5f07] transition-colors"
              >
                + Create budget
              </button>
            </div>

            {/* Budgets List */}
            <div className="space-y-2.5 overflow-y-auto max-h-[190px] pr-1">
              {budgets.map((b) => {
                const pct = Math.min(150, Math.round((b.actual / b.limit) * 100));
                const isOver = b.actual >= b.limit;
                const isWarning = !isOver && pct >= (b.thresholdPercent || 80);

                return (
                  <div key={b.id} className="p-3 border border-[#eaeded] rounded bg-[#fafafa] space-y-1.5">
                    <div className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#16191f]">{b.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            isOver
                              ? "bg-[#fdf3f1] text-[#d13212] border border-[#f5b8b0]"
                              : isWarning
                              ? "bg-[#fff8e6] text-[#b35900] border border-[#fed688]"
                              : "bg-[#f2f8f0] text-[#1d8102] border border-[#b8dfaf]"
                          }`}
                        >
                          {isOver ? "EXCEEDED" : isWarning ? `WARNING (${pct}%)` : `OK (${pct}%)`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#545b64]">
                          ${b.actual.toFixed(2)} / ${b.limit.toFixed(2)} {b.unit}
                        </span>
                        <button
                          onClick={() => setEditingBudget(b)}
                          className="text-[#0073bb] hover:underline text-[11px]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(b.id)}
                          className="text-[#879596] hover:text-[#d13212] p-0.5"
                          title="Delete budget"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#eaeded] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOver ? "bg-[#d13212]" : isWarning ? "bg-[#eb5f07]" : "bg-[#10b981]"
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#eaeded] flex items-center justify-between text-[12px]">
              <button
                onClick={() => setShowCostExplorerModal(true)}
                className="text-[#0073bb] hover:underline font-medium"
              >
                Go to AWS Budgets console &rarr;
              </button>
              <span className="text-[11px] text-[#545b64]">
                Total monthly limit: ${budgets.reduce((acc, b) => acc + b.limit, 0).toFixed(2)} USD
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Resize handle icon */}
      <div className="absolute right-1 bottom-1 text-[#aab7b8] pointer-events-none">
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <line x1="9" y1="3" x2="3" y2="9" />
          <line x1="9" y1="6" x2="6" y2="9" />
        </svg>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[500px] w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[16px] font-bold text-[#16191f]">About Cost and Usage</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Provides real-time visibility into local cloud spending, forecasts month-end invoices,
              and allows setting budget thresholds to control emulator infrastructure costs.
            </p>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 text-[13px] bg-[#0073bb] text-white rounded-sm font-medium hover:bg-[#005a9e]"
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
            className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[460px] w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[16px] font-bold text-[#16191f]">Create Budget</h3>
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
                  placeholder="e.g. S3 Storage Limit"
                  value={newBudgetName}
                  onChange={(e) => setNewBudgetName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[#16191f] focus:border-[#0073bb] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-[#16191f] mb-1">Target Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="100.00"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[#16191f] focus:border-[#0073bb] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-[#16191f] mb-1">Alert Threshold (%)</label>
                <input
                  type="number"
                  placeholder="80"
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
                className="px-4 py-1.5 text-[13px] border border-[#545b64] text-[#16191f] rounded-sm hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-[13px] bg-[#ec7211] text-white rounded-sm font-medium hover:bg-[#eb5f07]"
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
                className="px-4 py-1.5 text-[13px] border border-[#545b64] text-[#16191f] rounded-sm hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-[13px] bg-[#0073bb] text-white rounded-sm font-medium hover:bg-[#005a9e]"
              >
                Update Budget
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cost Explorer Detailed Modal */}
      {showCostExplorerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[700px] w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <div>
                <h3 className="text-[17px] font-bold text-[#16191f]">AWS Cost Explorer (Interactive)</h3>
                <p className="text-[12px] text-[#545b64]">Current Month: September 2024 | Region: us-east-1</p>
              </div>
              <button onClick={() => setShowCostExplorerModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-[#f8f9fa] border border-[#eaeded] rounded text-center">
              <div>
                <div className="text-[11px] text-[#545b64]">Actual Spend (MTD)</div>
                <div className="text-[20px] font-bold text-[#0073bb]">${currentCost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64]">Forecast End of Month</div>
                <div className="text-[20px] font-bold text-[#16191f]">${forecastCost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64]">Daily Average</div>
                <div className="text-[20px] font-bold text-[#16191f]">${(currentCost / 18).toFixed(2)}</div>
              </div>
            </div>

            {/* Service Breakdown Table */}
            <div>
              <div className="text-[13px] font-bold text-[#16191f] mb-2">Cost by Service</div>
              <div className="border border-[#eaeded] rounded overflow-hidden">
                <table className="w-full text-[12px] text-left">
                  <thead className="bg-[#f2f3f3] text-[#545b64] font-semibold">
                    <tr>
                      <th className="py-2 px-3">Service</th>
                      <th className="py-2 px-3">Usage Type</th>
                      <th className="py-2 px-3 text-right">Cost (USD)</th>
                      <th className="py-2 px-3 text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#16191f]">Amazon EC2</td>
                      <td className="py-2 px-3 text-[#545b64]">t3.medium Running Hours</td>
                      <td className="py-2 px-3 text-right font-mono">$18.50</td>
                      <td className="py-2 px-3 text-right font-mono">59.5%</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#16191f]">Amazon S3</td>
                      <td className="py-2 px-3 text-[#545b64]">Standard Storage &amp; GET/PUT</td>
                      <td className="py-2 px-3 text-right font-mono">${(currentCost * 0.18).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono">18.0%</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#16191f]">Amazon DynamoDB</td>
                      <td className="py-2 px-3 text-[#545b64]">Provisioned WCU/RCU</td>
                      <td className="py-2 px-3 text-right font-mono">${(currentCost * 0.12).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono">12.0%</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-[#16191f]">Amazon SQS</td>
                      <td className="py-2 px-3 text-[#545b64]">API Requests &amp; Queue Storage</td>
                      <td className="py-2 px-3 text-right font-mono">${(currentCost * 0.05).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono">5.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowCostExplorerModal(false)}
                className="px-4 py-1.5 text-[13px] bg-[#0073bb] text-white rounded-sm font-medium hover:bg-[#005a9e]"
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
                <p className="text-[12px] text-[#545b64]">Actionable recommendations to reduce your AWS spend</p>
              </div>
              <button onClick={() => setShowOptHubModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: "rec-s3-1",
                  title: "Delete unused test S3 bucket",
                  service: "Amazon S3",
                  savings: 1.80,
                  details: "Bucket has no incoming requests in the last 14 days.",
                },
                {
                  id: "rec-ddb-1",
                  title: "Switch DynamoDB table to On-Demand capacity",
                  service: "Amazon DynamoDB",
                  savings: 3.20,
                  details: "Current read/write utilization is under 5% of provisioned capacity.",
                },
                {
                  id: "rec-glacier-1",
                  title: "Enable S3 Lifecycle Rule for archive objects",
                  service: "Amazon S3",
                  savings: 5.40,
                  details: "Transition objects older than 30 days to Glacier Flexible Retrieval.",
                },
              ].map((rec) => {
                const applied = optRecommendationsApplied.includes(rec.id);
                return (
                  <div key={rec.id} className="p-3 border border-[#eaeded] rounded bg-[#fafafa] flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[13px] text-[#16191f]">{rec.title}</span>
                        <span className="text-[10px] bg-[#f2f8fd] text-[#0073bb] border border-[#d5dbdb] px-1.5 py-0.5 rounded">
                          {rec.service}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#545b64] mt-0.5">{rec.details}</p>
                      <div className="text-[11px] font-semibold text-emerald-700 mt-1">
                        Estimated savings: ${rec.savings.toFixed(2)}/month
                      </div>
                    </div>

                    <button
                      disabled={applied}
                      onClick={() => handleApplyRecommendation(rec.id, rec.savings)}
                      className={`px-3 py-1.5 text-[12px] rounded-sm font-medium transition-colors shrink-0 ${
                        applied
                          ? "bg-[#f2f8f0] text-[#1d8102] border border-[#b8dfaf] cursor-default"
                          : "bg-[#0073bb] text-white hover:bg-[#005a9e]"
                      }`}
                    >
                      {applied ? "Applied" : "Apply"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowOptHubModal(false)}
                className="px-4 py-1.5 text-[13px] bg-[#0073bb] text-white rounded-sm font-medium hover:bg-[#005a9e]"
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
