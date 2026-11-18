/**
 * SecurityWidget.tsx – Authentic AWS Console Security widget matching AWS Security Hub.
 * Features:
 * - Live security posture score (AWS Foundational Security Best Practices)
 * - Real live emulator audits across IAM, S3, and SQS
 * - Interactive "Run security scan" button with live scanning spinner
 * - Interactive Security Details modal with filterable findings (Critical, High, Medium)
 * - Functional "Resolve / Suppress" actions that update posture score in real time
 * - Direct remediation deep-links to IAM, S3, and SQS console pages
 * - Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { runLiveSecurityAudit, SecurityAuditResponse, SecurityFinding } from "@/app/actions/widgetActions";

interface SecurityWidgetProps {
  onRemove?: () => void;
}

const DEFAULT_FINDINGS: SecurityFinding[] = [
  {
    id: "SEC-IAM-01",
    title: "IAM.1 Root account should have MFA enabled",
    severity: "CRITICAL",
    resource: "arn:aws:iam::000000000000:root",
    remediationHref: "/iam",
    remediationLabel: "Configure in IAM",
    reason: "Root user credentials should not have direct console access without multi-factor authentication.",
  },
  {
    id: "SEC-USER-shubh",
    title: "IAM.2 Console access without active MFA for user: shubh",
    severity: "HIGH",
    resource: "arn:aws:iam::000000000000:user/shubh",
    remediationHref: "/iam/users/shubh",
    remediationLabel: "Manage shubh",
    reason: "User shubh does not have an active virtual or hardware MFA device attached.",
  },
  {
    id: "SEC-S3-01",
    title: "S3.2 S3 Bucket default encryption disabled",
    severity: "HIGH",
    resource: "arn:aws:s3:::test-bucket",
    remediationHref: "/s3",
    remediationLabel: "View in S3",
    reason: "Bucket test-bucket does not mandate AWS KMS or AES-256 server-side encryption by default.",
  },
  {
    id: "SEC-SQS-01",
    title: "SQS.1 SQS Queue Server-Side Encryption (SSE) disabled",
    severity: "CRITICAL",
    resource: "arn:aws:sqs:us-east-1:000000000000:billing-events",
    remediationHref: "/sqs",
    remediationLabel: "View in SQS",
    reason: "Queue billing-events transmits unencrypted payloads at rest.",
  },
];

export default function SecurityWidget({ onRemove }: SecurityWidgetProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Security score and findings
  const [score, setScore] = useState(75);
  const [failedControls, setFailedControls] = useState(63);
  const [totalControls, setTotalControls] = useState(326);
  const [criticalCount, setCriticalCount] = useState(11);
  const [highCount, setHighCount] = useState(34);
  const [mediumCount, setMediumCount] = useState(18);
  const [findings, setFindings] = useState<SecurityFinding[]>(DEFAULT_FINDINGS);
  const [resolvedFindingIds, setResolvedFindingIds] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState("Sep 24, 2024, 09:12 AM");

  const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "high" | "medium">("all");

  // Load saved resolved state and trigger live audit
  useEffect(() => {
    try {
      const savedResolved = localStorage.getItem("aws_sec_resolved_findings");
      if (savedResolved) setResolvedFindingIds(JSON.parse(savedResolved));
    } catch { /* ignore */ }

    handleRunScan(false);
  }, []);

  async function handleRunScan(showLoader = true) {
    if (showLoader) setIsScanning(true);
    try {
      const res: SecurityAuditResponse = await runLiveSecurityAudit();
      setScore(res.scorePercentage);
      setFailedControls(res.failedControlsCount);
      setTotalControls(res.totalControlsCount);
      setCriticalCount(res.criticalCount);
      setHighCount(res.highCount);
      setMediumCount(res.mediumCount);
      if (res.findings.length > 0) {
        setFindings(res.findings);
      }
      setLastUpdated(res.lastUpdated);
    } catch (err) {
      console.error("Audit error:", err);
    } finally {
      if (showLoader) {
        setTimeout(() => setIsScanning(false), 600);
      }
    }
  }

  function toggleResolveFinding(id: string) {
    const isResolved = resolvedFindingIds.includes(id);
    let next: string[];
    if (isResolved) {
      next = resolvedFindingIds.filter((x) => x !== id);
      setScore((s) => Math.max(50, s - 3));
    } else {
      next = [...resolvedFindingIds, id];
      setScore((s) => Math.min(100, s + 3));
    }
    setResolvedFindingIds(next);
    try {
      localStorage.setItem("aws_sec_resolved_findings", JSON.stringify(next));
    } catch { /* ignore */ }
  }

  const activeFindings = findings.filter((f) => {
    if (filterSeverity === "critical") return f.severity === "CRITICAL";
    if (filterSeverity === "high") return f.severity === "HIGH";
    if (filterSeverity === "medium") return f.severity === "MEDIUM";
    return true;
  });

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

          <h2 className="text-[14px] font-bold text-[#16191f]">Security</h2>

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
            onClick={() => handleRunScan(true)}
            disabled={isScanning}
            className="p-1 text-[#545b64] hover:text-[#0073bb] rounded hover:bg-[#f2f3f3]"
            title="Scan security posture now"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className={isScanning ? "animate-spin text-[#0073bb]" : ""}
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
                  Security score details
                </button>
                <button
                  onClick={() => {
                    handleRunScan(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
                >
                  Run live compliance scan
                </button>
                <Link
                  href="/securityhub"
                  className="block w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
                  onClick={() => setShowMenu(false)}
                >
                  Go to Security Hub
                </Link>
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
        {/* Region & Last updated */}
        <div className="text-[12px] text-[#545b64] flex items-center justify-between">
          <span className="font-medium text-[#16191f]">US East (N. Virginia)</span>
          <span className="text-[11px] text-[#879596]">Updated {lastUpdated}</span>
        </div>

        {/* Security Score Block */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            {/* SVG Circular Progress Meter */}
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#eaeded]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={score >= 80 ? "text-[#10b981]" : score >= 60 ? "text-[#eb5f07]" : "text-[#d13212]"}
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[17px] font-bold text-[#16191f]">{score}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[14px] font-bold text-[#16191f]">Security score</div>
            <div className="text-[12px] text-[#545b64]">
              <span className="font-semibold text-[#d13212]">{failedControls - resolvedFindingIds.length}</span> of{" "}
              {totalControls} controls failed
            </div>
            <button
              onClick={() => setShowDetailsModal(true)}
              className="text-[12px] text-[#0073bb] hover:text-[#ec7211] hover:underline font-medium cursor-pointer"
            >
              View details &rarr;
            </button>
          </div>
        </div>

        {/* Findings Summary Pills */}
        <div className="space-y-1.5 pt-2 border-t border-[#eaeded]">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Unresolved Findings
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div
              onClick={() => {
                setFilterSeverity("critical");
                setShowDetailsModal(true);
              }}
              className="p-2 border border-[#f5b8b0] bg-[#fdf3f1] rounded cursor-pointer hover:brightness-95 transition-all"
            >
              <div className="text-[16px] font-bold text-[#d13212] leading-tight">{criticalCount}</div>
              <div className="text-[10px] font-medium text-[#d13212]">Critical</div>
            </div>
            <div
              onClick={() => {
                setFilterSeverity("high");
                setShowDetailsModal(true);
              }}
              className="p-2 border border-[#fed688] bg-[#fff8e6] rounded cursor-pointer hover:brightness-95 transition-all"
            >
              <div className="text-[16px] font-bold text-[#b35900] leading-tight">{highCount}</div>
              <div className="text-[10px] font-medium text-[#b35900]">High</div>
            </div>
            <div
              onClick={() => {
                setFilterSeverity("medium");
                setShowDetailsModal(true);
              }}
              className="p-2 border border-[#d5dbdb] bg-[#f2f3f3] rounded cursor-pointer hover:brightness-95 transition-all"
            >
              <div className="text-[16px] font-bold text-[#545b64] leading-tight">{mediumCount}</div>
              <div className="text-[10px] font-medium text-[#545b64]">Medium</div>
            </div>
          </div>
        </div>

        {/* Footer Deep-link */}
        <div className="pt-2 border-t border-[#eaeded] flex items-center justify-between text-[12px]">
          <Link
            href="/securityhub"
            className="text-[#0073bb] hover:text-[#ec7211] hover:underline font-medium"
          >
            Go to AWS Security Hub &rarr;
          </Link>
          <span className="text-[11px] text-[#879596]">AWS Foundational v1.0.0</span>
        </div>
      </div>

      {/* Resize handle icon */}
      <div className="absolute right-1 bottom-1 text-[#aab7b8] pointer-events-none">
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <line x1="9" y1="3" x2="3" y2="9" />
          <line x1="9" y1="6" x2="6" y2="9" />
        </svg>
      </div>

      {/* Security Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[700px] w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3 shrink-0">
              <div>
                <h3 className="text-[17px] font-bold text-[#16191f]">Security Posture &amp; Failed Controls</h3>
                <p className="text-[12px] text-[#545b64]">
                  Active evaluation results against AWS Foundational Security Best Practices
                </p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex items-center justify-between gap-2 shrink-0 border-b border-[#eaeded] pb-2">
              <div className="flex items-center gap-1.5 text-[12px]">
                <span className="text-[#545b64] font-medium mr-1">Severity:</span>
                {(["all", "critical", "high", "medium"] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-colors ${
                      filterSeverity === sev
                        ? "bg-[#0073bb] text-white"
                        : "bg-[#f2f3f3] text-[#545b64] hover:text-[#16191f]"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-[#545b64]">
                Resolved / Suppressed: <span className="font-semibold text-[#1d8102]">{resolvedFindingIds.length}</span>
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {activeFindings.length === 0 ? (
                <div className="py-8 text-center text-[#545b64] text-[13px]">
                  No findings matching this filter.
                </div>
              ) : (
                activeFindings.map((finding) => {
                  const isResolved = resolvedFindingIds.includes(finding.id);

                  return (
                    <div
                      key={finding.id}
                      className={`p-3.5 border rounded space-y-2 transition-all ${
                        isResolved
                          ? "border-[#b8dfaf] bg-[#f2f8f0] opacity-75"
                          : "border-[#eaeded] bg-[#fafafa]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                finding.severity === "CRITICAL"
                                  ? "bg-[#fdf3f1] text-[#d13212] border border-[#f5b8b0]"
                                  : finding.severity === "HIGH"
                                  ? "bg-[#fff8e6] text-[#b35900] border border-[#fed688]"
                                  : "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
                              }`}
                            >
                              {finding.severity}
                            </span>
                            <span className={`text-[13px] font-bold text-[#16191f] ${isResolved ? "line-through text-gray-500" : ""}`}>
                              {finding.title}
                            </span>
                            {isResolved && (
                              <span className="text-[10px] bg-[#d4e8cc] text-[#1d8102] px-1.5 py-0.2 rounded font-semibold">
                                Suppressed
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-[#545b64] mt-1">{finding.reason}</p>
                          <div className="font-mono text-[11px] text-[#879596] mt-1">
                            Resource: {finding.resource}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Link
                            href={finding.remediationHref}
                            className="px-3 py-1 text-[11px] bg-[#0073bb] text-white rounded font-medium hover:bg-[#005a9e] transition-colors"
                          >
                            {finding.remediationLabel} &rarr;
                          </Link>
                          <button
                            onClick={() => toggleResolveFinding(finding.id)}
                            className="text-[11px] text-[#545b64] hover:text-[#16191f] underline cursor-pointer"
                          >
                            {isResolved ? "Unsuppress" : "Suppress"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-[#eaeded] shrink-0">
              <button
                onClick={() => handleRunScan(true)}
                disabled={isScanning}
                className="px-3 py-1.5 text-[12px] border border-[#545b64] text-[#16191f] rounded hover:bg-[#f2f3f3] flex items-center gap-1.5"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={isScanning ? "animate-spin" : ""}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>{isScanning ? "Scanning..." : "Re-scan Audit"}</span>
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
              <h3 className="text-[16px] font-bold text-[#16191f]">About Security Widget</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Provides continuous compliance monitoring against AWS Foundational Security Best Practices
              and tracks misconfigurations across active emulator resources (IAM, S3, SQS).
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
