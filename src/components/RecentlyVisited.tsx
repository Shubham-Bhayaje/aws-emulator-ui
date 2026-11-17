/**
 * RecentlyVisited widget – Tracks services visited using localStorage.
 * Shows a 2-column grid of recent services with real AWS icons.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ServiceIcon } from "./AwsIcons";
import { findServiceByHref } from "@/lib/services-catalog";

type RecentService = {
  name: string;
  href: string;
  visitedAt: number;
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

export default function RecentlyVisited() {
  const [recents, setRecents] = useState<RecentService[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("recentServices") || "[]");
      setRecents(stored.slice(0, 8));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#eaeded]">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-bold text-[#16191f]">Recently visited</h2>
          <button className="text-[12px] text-[#0073bb] hover:text-[#ec7211] hover:underline">
            Info
          </button>
        </div>
        <button className="text-[#545b64] hover:text-[#16191f]" title="Widget options">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {recents.length === 0 ? (
          <p className="text-[13px] text-[#545b64]">
            No recently visited services. Navigate to a service using the menu above.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {recents.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="flex items-center gap-2 py-1 text-[13px] text-[#0073bb] hover:text-[#ec7211] hover:underline"
              >
                {getServiceIcon(s.name, s.href)}
                {s.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#eaeded]">
        <Link
          href="/services"
          className="text-[12px] text-[#0073bb] hover:text-[#ec7211] hover:underline"
        >
          View all services
        </Link>
      </div>
    </div>
  );
}
