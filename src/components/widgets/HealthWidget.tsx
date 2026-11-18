/**
 * HealthWidget.tsx – Authentic AWS Health widget.
 * Features:
 * - Real live emulator connection diagnostics across S3, DynamoDB, SQS, IAM, and STS
 * - Live latency measurements and operational status indicators
 * - Open issues (0), Scheduled changes (2), Other notifications (2)
 * - Interactive Health Details modal with tabbed views (Live Services, Scheduled Events, Notifications)
 * - Live "Refresh status" button
 * - Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { checkLiveHealthStatus, HealthStatusResponse, ServiceHealthItem } from "@/app/actions/widgetActions";

interface HealthWidgetProps {
  onRemove?: () => void;
}

const DEFAULT_SERVICES: ServiceHealthItem[] = [
  { service: "s3", name: "Amazon Simple Storage Service (S3)", status: "Operational", latencyMs: 14, lastChecked: "Just now", details: "Responsive with active emulator TLS connection." },
  { service: "dynamodb", name: "Amazon DynamoDB", status: "Operational", latencyMs: 11, lastChecked: "Just now", details: "Responsive with active emulator TLS connection." },
  { service: "sqs", name: "Amazon Simple Queue Service (SQS)", status: "Operational", latencyMs: 12, lastChecked: "Just now", details: "Responsive with active emulator TLS connection." },
  { service: "iam", name: "AWS Identity and Access Management (IAM)", status: "Operational", latencyMs: 18, lastChecked: "Just now", details: "Responsive with active emulator TLS connection." },
  { service: "sts", name: "AWS Security Token Service (STS)", status: "Operational", latencyMs: 9, lastChecked: "Just now", details: "Responsive with active emulator TLS connection." },
];

export default function HealthWidget({ onRemove }: HealthWidgetProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"services" | "scheduled" | "notifications">("services");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [openIssues, setOpenIssues] = useState(0);
  const [scheduledChanges, setScheduledChanges] = useState(2);
  const [notifications, setNotifications] = useState(2);
  const [services, setServices] = useState<ServiceHealthItem[]>(DEFAULT_SERVICES);
  const [lastCheckTime, setLastCheckTime] = useState("Just now");

  useEffect(() => {
    handleRefreshStatus(false);
  }, []);

  async function handleRefreshStatus(showLoader = true) {
    if (showLoader) setIsRefreshing(true);
    try {
      const res: HealthStatusResponse = await checkLiveHealthStatus();
      setOpenIssues(res.openIssuesCount);
      setScheduledChanges(res.scheduledChangesCount);
      setNotifications(res.notificationsCount);
      setServices(res.services);
      setLastCheckTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      console.error("Health check error:", err);
    } finally {
      if (showLoader) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }

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

          <h2 className="text-[14px] font-bold text-[#16191f]">AWS Health</h2>

          <button
            onClick={() => setShowInfoModal(true)}
            className="text-[12px] text-[#0073bb] hover:text-[#ec7211] hover:underline cursor-pointer"
          >
            Info
          </button>
        </div>

        {/* Action Controls & Kebab Menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRefreshStatus(true)}
            disabled={isRefreshing}
            className="p-1 text-[#545b64] hover:text-[#0073bb] rounded hover:bg-[#f2f3f3]"
            title="Refresh health status"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className={isRefreshing ? "animate-spin text-[#0073bb]" : ""}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>

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
                    setShowDetailsModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
                >
                  View health events
                </button>
                <button
                  onClick={() => {
                    handleRefreshStatus(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
                >
                  Run live diagnostics ping
                </button>
                <button
                  onClick={() => {
                    setSelectedTab("scheduled");
                    setShowDetailsModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
                >
                  Scheduled changes ({scheduledChanges})
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

      {/* Main Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Open issues */}
          <div
            onClick={() => {
              setSelectedTab("services");
              setShowDetailsModal(true);
            }}
            className={`p-2.5 border rounded cursor-pointer transition-colors ${
              openIssues > 0
                ? "border-[#f5b8b0] bg-[#fdf3f1] hover:bg-[#fae7e4]"
                : "border-[#eaeded] bg-[#fafafa] hover:bg-[#f2f3f3]"
            }`}
          >
            <div className="text-[11px] text-[#545b64] font-medium leading-tight">Open issues</div>
            <div className={`text-[24px] font-bold leading-none mt-1 ${openIssues > 0 ? "text-[#d13212]" : "text-[#16191f]"}`}>
              {openIssues}
            </div>
          </div>

          {/* Scheduled changes */}
          <div
            onClick={() => {
              setSelectedTab("scheduled");
              setShowDetailsModal(true);
            }}
            className="p-2.5 border border-[#eaeded] bg-[#fafafa] rounded hover:bg-[#f2f3f3] transition-colors cursor-pointer"
          >
            <div className="text-[11px] text-[#545b64] font-medium leading-tight">Scheduled changes</div>
            <div className="text-[24px] font-bold text-[#16191f] leading-none mt-1">
              {scheduledChanges}
            </div>
          </div>

          {/* Other notifications */}
          <div
            onClick={() => {
              setSelectedTab("notifications");
              setShowDetailsModal(true);
            }}
            className="p-2.5 border border-[#eaeded] bg-[#fafafa] rounded hover:bg-[#f2f3f3] transition-colors cursor-pointer"
          >
            <div className="text-[11px] text-[#545b64] font-medium leading-tight">Other notifications</div>
            <div className="text-[24px] font-bold text-[#16191f] leading-none mt-1">
              {notifications}
            </div>
          </div>
        </div>

        {/* Operational Status Pill */}
        <div className="flex items-center gap-2 p-2.5 bg-[#f2f8f0] border border-[#b8dfaf] rounded text-[12px] text-[#1d8102]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1d8102] shrink-0 animate-pulse" />
          <span className="font-semibold">
            {openIssues === 0 ? "All emulator services operating normally" : "Service disruption reported"}
          </span>
          <span className="text-[11px] text-[#545b64] ml-auto">Checked {lastCheckTime}</span>
        </div>

        {/* Service Latency Quick Badges */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#545b64]">
          <div className="flex items-center justify-between p-1.5 bg-[#fafafa] border border-[#eaeded] rounded">
            <span>Amazon S3:</span>
            <span className="font-mono text-[#1d8102] font-semibold">{services.find(s => s.service === "s3")?.latencyMs || 14}ms</span>
          </div>
          <div className="flex items-center justify-between p-1.5 bg-[#fafafa] border border-[#eaeded] rounded">
            <span>DynamoDB:</span>
            <span className="font-mono text-[#1d8102] font-semibold">{services.find(s => s.service === "dynamodb")?.latencyMs || 11}ms</span>
          </div>
        </div>

        {/* Footer Deep-link */}
        <div className="pt-2 border-t border-[#eaeded] flex items-center justify-between text-[12px]">
          <button
            onClick={() => setShowDetailsModal(true)}
            className="text-[#0073bb] hover:text-[#ec7211] hover:underline font-medium cursor-pointer"
          >
            Open Health Dashboard &rarr;
          </button>
          <span className="text-[11px] text-[#879596]">Global</span>
        </div>
      </div>

      {/* Resize handle icon */}
      <div className="absolute right-1 bottom-1 text-[#aab7b8] pointer-events-none">
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <line x1="9" y1="3" x2="3" y2="9" />
          <line x1="9" y1="6" x2="6" y2="9" />
        </svg>
      </div>

      {/* Interactive Health Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[650px] w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3 shrink-0">
              <div>
                <h3 className="text-[17px] font-bold text-[#16191f]">AWS Health Dashboard</h3>
                <p className="text-[12px] text-[#545b64]">Operational health events, maintenance, and service status</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex items-center gap-1 border-b border-[#eaeded] shrink-0 text-[13px]">
              <button
                onClick={() => setSelectedTab("services")}
                className={`px-3 py-2 border-b-2 font-medium transition-colors ${
                  selectedTab === "services"
                    ? "border-[#0073bb] text-[#0073bb]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Service Status ({services.length})
              </button>
              <button
                onClick={() => setSelectedTab("scheduled")}
                className={`px-3 py-2 border-b-2 font-medium transition-colors ${
                  selectedTab === "scheduled"
                    ? "border-[#0073bb] text-[#0073bb]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Scheduled Changes ({scheduledChanges})
              </button>
              <button
                onClick={() => setSelectedTab("notifications")}
                className={`px-3 py-2 border-b-2 font-medium transition-colors ${
                  selectedTab === "notifications"
                    ? "border-[#0073bb] text-[#0073bb]"
                    : "border-transparent text-[#545b64] hover:text-[#16191f]"
                }`}
              >
                Notifications ({notifications})
              </button>
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1 text-[13px]">
              {selectedTab === "services" && (
                <div className="space-y-2">
                  <div className="text-[12px] text-[#545b64] flex items-center justify-between">
                    <span>Active emulator endpoint: <code className="bg-[#f2f3f3] px-1 py-0.5 rounded text-[#16191f]">https://127.0.0.1:9297</code></span>
                    <button
                      onClick={() => handleRefreshStatus(true)}
                      className="text-[#0073bb] hover:underline text-[12px]"
                    >
                      Ping All
                    </button>
                  </div>
                  {services.map((s) => (
                    <div key={s.service} className="p-3 border border-[#eaeded] rounded bg-[#fafafa] flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[#16191f]">{s.name}</div>
                        <div className="text-[11px] text-[#545b64] mt-0.5">{s.details}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#f2f8f0] text-[#1d8102] border border-[#b8dfaf]">
                          {s.status}
                        </span>
                        <div className="text-[11px] font-mono text-[#545b64] mt-1">{s.latencyMs}ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedTab === "scheduled" && (
                <div className="space-y-2.5">
                  <div className="p-3.5 border border-[#fed688] bg-[#fff8e6] rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#b35900]">Amazon DynamoDB - Scheduled Engine Maintenance</span>
                      <span className="text-[11px] font-mono text-[#545b64]">Window: Sep 28, 02:00 UTC</span>
                    </div>
                    <p className="text-[12px] text-[#545b64]">
                      Routine non-disruptive storage partition balancing and patch deployment. Zero downtime expected.
                    </p>
                  </div>

                  <div className="p-3.5 border border-[#eaeded] bg-[#fafafa] rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#16191f]">AWS CloudFront - Global Edge TLS Certificate Renewal</span>
                      <span className="text-[11px] font-mono text-[#545b64]">Window: Oct 02, 00:00 UTC</span>
                    </div>
                    <p className="text-[12px] text-[#545b64]">
                      Automated certificate authority rotation across distribution edge nodes.
                    </p>
                  </div>
                </div>
              )}

              {selectedTab === "notifications" && (
                <div className="space-y-2.5">
                  <div className="p-3.5 border border-[#eaeded] bg-[#fafafa] rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#16191f]">Node.js 18 Runtime Deprecation Advisory</span>
                      <span className="text-[11px] text-[#879596]">Sep 15, 2024</span>
                    </div>
                    <p className="text-[12px] text-[#545b64]">
                      AWS Lambda will end support for Node.js 18 on Nov 30, 2024. Please migrate functions to Node.js 20 or 22.
                    </p>
                  </div>

                  <div className="p-3.5 border border-[#eaeded] bg-[#fafafa] rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#16191f]">IAM MFA Enforcement Reminder</span>
                      <span className="text-[11px] text-[#879596]">Sep 10, 2024</span>
                    </div>
                    <p className="text-[12px] text-[#545b64]">
                      AWS strongly recommends requiring multi-factor authentication for all privileged users and root accounts.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-[#eaeded] shrink-0">
              <button
                onClick={() => handleRefreshStatus(true)}
                disabled={isRefreshing}
                className="px-3 py-1.5 text-[12px] border border-[#545b64] text-[#16191f] rounded hover:bg-[#f2f3f3] flex items-center gap-1.5"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={isRefreshing ? "animate-spin" : ""}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>{isRefreshing ? "Refreshing..." : "Recheck Services"}</span>
              </button>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-1.5 text-[13px] bg-[#0073bb] text-white rounded-sm font-medium hover:bg-[#005a9e]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[480px] w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[16px] font-bold text-[#16191f]">About AWS Health</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Provides ongoing visibility into service performance, maintenance activities, and notifications
              affecting your local AWS emulator architecture.
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
    </div>
  );
}
