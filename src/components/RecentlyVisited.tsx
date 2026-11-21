/**
 * RecentlyVisited.tsx – Authentic AWS Console "Recently visited" widget.
 * Features:
 * - 2-column service launcher matching AWS Console Home
 * - Real vector AWS service icons (zero emojis)
 * - Auto-tracking of recently accessed services in localStorage
 * - Interactive hover-to-remove button for individual services
 * - Functional "Clear history" action
 * - Quick link to "All services (200+)" catalog
 * - Cloudscape enterprise styling.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ServiceIcon } from "./AwsIcons";
import { findServiceByHref } from "@/lib/services-catalog";

export type RecentService = {
  name: string;
  href: string;
  visitedAt?: number;
};

// Default service list matching AWS Console Home screenshot with exact active catalog paths
const DEFAULT_SERVICES: RecentService[] = [
  // Left column
  { name: "IoT Core", href: "/iot-core" },
  { name: "DynamoDB", href: "/dynamodb" },
  { name: "Amazon Bedrock", href: "/bedrock" },
  { name: "Security Hub", href: "/securityhub" },
  { name: "Lambda", href: "/lambda" },
  { name: "CloudFront", href: "/cloudfront" },
  { name: "CloudFormation", href: "/cloudformation" },
  { name: "Amazon Polly", href: "/polly" },
  // Right column
  { name: "RDS", href: "/rds" },
  { name: "Device Farm", href: "/devicefarm" },
  { name: "AWS Billing Conductor", href: "/billing-conductor" },
  { name: "S3", href: "/s3" },
  { name: "Route 53", href: "/route53" },
  { name: "Secrets Manager", href: "/secretsmanager" },
  { name: "Systems Manager", href: "/systems-manager" },
];

function getServiceIcon(name: string, href: string) {
  const service = findServiceByHref(href);
  return (
    <ServiceIcon
      id={service?.id || name.toLowerCase().replace(/\s+/g, "")}
      shortName={service?.shortName || name}
      color={service?.color}
      size={16}
    />
  );
}

function formatRelativeTime(ts?: number): string {
  if (!ts) return "";
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

interface RecentlyVisitedProps {
  onRemove?: () => void;
}

export default function RecentlyVisited({ onRemove }: RecentlyVisitedProps) {
  const [recents, setRecents] = useState<RecentService[]>(DEFAULT_SERVICES);
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    try {
      const stored: RecentService[] = JSON.parse(localStorage.getItem("recentServices") || "[]");
      const seen = new Set<string>();
      const deduped: RecentService[] = [];

      for (const item of [...stored, ...DEFAULT_SERVICES]) {
        if (!item || !item.href) continue;

        let cleanHref = item.href.toLowerCase().trim().replace(/\/$/, "");
        const isGlacier = cleanHref === "/glacier" || cleanHref.includes("glacier") || (item.name && item.name.toLowerCase().includes("glacier"));
        if (isGlacier) {
          cleanHref = "/glacier";
        }

        const key = isGlacier ? "service:glacier" : cleanHref;

        if (!seen.has(key)) {
          seen.add(key);
          deduped.push({
            name: isGlacier ? "Amazon S3 Glacier" : item.name,
            href: isGlacier ? "/glacier" : item.href,
            visitedAt: item.visitedAt,
          });
        }
      }

      const finalRecents = deduped.slice(0, 16);
      setRecents(finalRecents);
      // Clean up any stale duplicates in localStorage
      localStorage.setItem("recentServices", JSON.stringify(finalRecents));
    } catch { /* ignore */ }
  }, []);

  function handleServiceClick(service: RecentService) {
    let cleanHref = service.href.toLowerCase().trim().replace(/\/$/, "");
    const isGlacier = cleanHref === "/glacier" || cleanHref.includes("glacier") || (service.name && service.name.toLowerCase().includes("glacier"));
    const targetHref = isGlacier ? "/glacier" : service.href;
    const targetName = isGlacier ? "Amazon S3 Glacier" : service.name;

    const filtered = recents.filter((s) => {
      const sHref = s.href.toLowerCase().trim();
      const sName = s.name.toLowerCase().trim();
      if (isGlacier && (sHref.includes("glacier") || sName.includes("glacier"))) return false;
      return sHref !== targetHref.toLowerCase().trim();
    });

    const updated = [
      { name: targetName, href: targetHref, visitedAt: Date.now() },
      ...filtered,
    ].slice(0, 16);

    setRecents(updated);
    try {
      localStorage.setItem("recentServices", JSON.stringify(updated));
    } catch { /* ignore */ }
  }

  function handleRemoveItem(href: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const norm = href.toLowerCase().trim();
    const updated = recents.filter((s) => s.href.toLowerCase().trim() !== norm);
    setRecents(updated);
    try {
      localStorage.setItem("recentServices", JSON.stringify(updated));
    } catch { /* ignore */ }
  }

  function handleClearRecents() {
    setRecents(DEFAULT_SERVICES);
    try {
      localStorage.removeItem("recentServices");
    } catch { /* ignore */ }
    setShowMenu(false);
  }

  // Split into 2 columns (approx 8 items per column)
  const leftCol = recents.slice(0, Math.ceil(recents.length / 2));
  const rightCol = recents.slice(Math.ceil(recents.length / 2));

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

          <h2 className="text-[14px] font-bold text-[#16191f]">Recently visited</h2>

          <button
            onClick={() => setShowInfoModal(true)}
            className="text-[12px] text-[#0073bb] hover:text-[#ec7211] hover:underline cursor-pointer"
          >
            Info
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
                onClick={handleClearRecents}
                className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
              >
                Reset to default list
              </button>
              <Link
                href="/services"
                className="block w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
                onClick={() => setShowMenu(false)}
              >
                View all services
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

      {/* 2-Column Grid */}
      <div className="p-4 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
          {/* Left Column */}
          <div className="space-y-0.5">
            {leftCol.map((service, idx) => {
              const relTime = formatRelativeTime(service.visitedAt);
              return (
                <div
                  key={`recent-l-${service.href}-${idx}`}
                  className="group relative flex items-center justify-between py-1.5 px-2 -mx-2 rounded hover:bg-[#f2f8fd] transition-colors"
                >
                  <Link
                    href={service.href}
                    onClick={() => handleServiceClick(service)}
                    className="flex items-center gap-2.5 min-w-0 flex-1"
                  >
                    <span className="shrink-0 flex items-center justify-center w-5 h-5">
                      {getServiceIcon(service.name, service.href)}
                    </span>
                    <span className="text-[13px] text-[#0073bb] group-hover:text-[#ec7211] group-hover:underline truncate font-medium">
                      {service.name}
                    </span>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    {relTime && (
                      <span className="text-[10px] text-[#879596] hidden group-hover:inline-block">
                        {relTime}
                      </span>
                    )}
                    <button
                      onClick={(e) => handleRemoveItem(service.href, e)}
                      className="opacity-0 group-hover:opacity-100 text-[#879596] hover:text-[#d13212] p-0.5"
                      title="Remove from recents"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="space-y-0.5">
            {rightCol.map((service, idx) => {
              const relTime = formatRelativeTime(service.visitedAt);
              return (
                <div
                  key={`recent-r-${service.href}-${idx}`}
                  className="group relative flex items-center justify-between py-1.5 px-2 -mx-2 rounded hover:bg-[#f2f8fd] transition-colors"
                >
                  <Link
                    href={service.href}
                    onClick={() => handleServiceClick(service)}
                    className="flex items-center gap-2.5 min-w-0 flex-1"
                  >
                    <span className="shrink-0 flex items-center justify-center w-5 h-5">
                      {getServiceIcon(service.name, service.href)}
                    </span>
                    <span className="text-[13px] text-[#0073bb] group-hover:text-[#ec7211] group-hover:underline truncate font-medium">
                      {service.name}
                    </span>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    {relTime && (
                      <span className="text-[10px] text-[#879596] hidden group-hover:inline-block">
                        {relTime}
                      </span>
                    )}
                    <button
                      onClick={(e) => handleRemoveItem(service.href, e)}
                      className="opacity-0 group-hover:opacity-100 text-[#879596] hover:text-[#d13212] p-0.5"
                      title="Remove from recents"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="px-4 py-2.5 border-t border-[#eaeded] flex items-center justify-between text-[12px] bg-white">
        <Link
          href="/services"
          className="text-[#0073bb] hover:text-[#ec7211] hover:underline font-medium"
        >
          View all services (200+) &rarr;
        </Link>
        <button
          onClick={handleClearRecents}
          className="text-[11px] text-[#879596] hover:text-[#16191f] cursor-pointer"
        >
          Clear history
        </button>
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
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[480px] w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[16px] font-bold text-[#16191f]">About Recently Visited</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Maintains an automatic shortcut history of services you access across the console.
              You can remove individual services or reset to the AWS default launcher.
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
