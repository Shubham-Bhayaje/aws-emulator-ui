/**
 * RecentlyVisited.tsx – Authentic AWS Console "Recently visited" widget.
 * Features:
 * - Dynamic display of ONLY services accessed by the user (no fixed/default pre-population)
 * - Real vector AWS service icons (zero emojis)
 * - Auto-tracking of recently accessed services in localStorage
 * - Interactive hover-to-remove button for individual services
 * - Functional "Clear history" action
 * - Authentic AWS empty state when no services have been accessed yet
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
  const [recents, setRecents] = useState<RecentService[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recentServices");
      if (!raw) {
        setRecents([]);
        setIsLoaded(true);
        return;
      }

      const stored: RecentService[] = JSON.parse(raw);
      const seen = new Set<string>();
      const deduped: RecentService[] = [];

      for (const item of stored) {
        if (!item || !item.href || !item.name) continue;

        // Discard any legacy unvisited default items (only keep genuine visits with visitedAt timestamp)
        if (!item.visitedAt) continue;

        let cleanHref = item.href.toLowerCase().trim().replace(/\/$/, "");
        const isGlacier = cleanHref === "/glacier" || cleanHref.includes("glacier") || item.name.toLowerCase().includes("glacier");
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
      // Clean up any stale unvisited items from localStorage
      localStorage.setItem("recentServices", JSON.stringify(finalRecents));
    } catch {
      setRecents([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  function handleServiceClick(service: RecentService) {
    let cleanHref = service.href.toLowerCase().trim().replace(/\/$/, "");
    const isGlacier = cleanHref === "/glacier" || cleanHref.includes("glacier") || service.name.toLowerCase().includes("glacier");
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
    setRecents([]);
    try {
      localStorage.removeItem("recentServices");
    } catch { /* ignore */ }
    setShowMenu(false);
  }

  // Split into 2 columns
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
              {recents.length > 0 && (
                <button
                  onClick={handleClearRecents}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#d13212]"
                >
                  Clear history
                </button>
              )}
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

      {/* Content Area */}
      {isLoaded && recents.length === 0 ? (
        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#f2f3f3] flex items-center justify-center text-[#545b64] mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="text-[14px] font-bold text-[#16191f] mb-1">
            You don&apos;t have any recently visited services
          </div>
          <div className="text-[12px] text-[#545b64] max-w-[340px] mb-4 leading-normal">
            Services you access across the AWS Management Console will automatically appear here for quick navigation.
          </div>
          <Link
            href="/services"
            className="inline-flex items-center justify-center text-[13px] font-bold px-4 rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          >
            View all services
          </Link>
        </div>
      ) : (
        /* 2-Column Grid */
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
                        className="opacity-0 group-hover:opacity-100 text-[#879596] hover:text-[#d13212] p-0.5 cursor-pointer"
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
                        className="opacity-0 group-hover:opacity-100 text-[#879596] hover:text-[#d13212] p-0.5 cursor-pointer"
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
      )}

      {/* Footer Link */}
      <div className="px-4 py-2.5 border-t border-[#eaeded] flex items-center justify-between text-[12px] bg-white mt-auto">
        <Link
          href="/services"
          className="text-[#0073bb] hover:text-[#ec7211] hover:underline font-medium"
        >
          View all services (200+) &rarr;
        </Link>
        {recents.length > 0 && (
          <button
            onClick={handleClearRecents}
            className="text-[11px] text-[#879596] hover:text-[#d13212] cursor-pointer hover:underline"
          >
            Clear history
          </button>
        )}
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
              The <strong>Recently visited</strong> widget automatically records the services you have accessed in this console session. No default services are pre-populated.
            </p>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              You can remove an individual service by hovering over it and clicking the <strong>&times;</strong> icon, or clear your entire navigation history by clicking <strong>Clear history</strong>.
            </p>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
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
