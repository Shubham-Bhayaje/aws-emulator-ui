/**
 * src/app/services/page.tsx – Services Catalog page.
 * Full catalog of 200+ AWS services with clear badges on completely built & operational services.
 * Features real-time multi-token search, category filtering, a dedicated Built services filter, and direct navigation.
 * Zero emojis, Cloudscape enterprise styling, strict 32px button height standard.
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES, ALL_SERVICES, isServiceFullyBuilt } from "@/lib/services-catalog";
import { ServiceIcon } from "@/components/AwsIcons";

export default function ServicesCatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [onlyBuilt, setOnlyBuilt] = useState<boolean>(false);

  // Total built services count across the catalog
  const totalBuiltCount = useMemo(() => {
    return ALL_SERVICES.filter((s) => isServiceFullyBuilt(s.id) || s.status === "functional").length;
  }, []);

  const categories = useMemo(() => {
    return ["All", "Built & Operational", ...SERVICE_CATEGORIES.map((c) => c.category)];
  }, []);

  const totalMatchingCount = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);

    return ALL_SERVICES.filter((s) => {
      const isBuilt = isServiceFullyBuilt(s.id) || s.status === "functional";
      if (onlyBuilt && !isBuilt) return false;

      if (selectedCategory === "Built & Operational") {
        if (!isBuilt) return false;
      } else if (selectedCategory !== "All") {
        if (s.category !== selectedCategory) return false;
      }

      if (!q) return true;
      const aliasStr = (s.aliases || []).join(" ").toLowerCase();
      const target = `${s.name} ${s.shortName} ${aliasStr} ${s.desc} ${s.category}`.toLowerCase();
      return tokens.every((t) => target.includes(t)) || target.includes(q);
    }).length;
  }, [searchQuery, selectedCategory, onlyBuilt]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);

    return SERVICE_CATEGORIES
      .filter((cat) => {
        if (selectedCategory === "All" || selectedCategory === "Built & Operational") return true;
        return cat.category === selectedCategory;
      })
      .map((cat) => ({
        ...cat,
        services: cat.services.filter((s) => {
          const isBuilt = isServiceFullyBuilt(s.id) || s.status === "functional";
          if (onlyBuilt && !isBuilt) return false;
          if (selectedCategory === "Built & Operational" && !isBuilt) return false;

          if (!q) return true;
          const aliasStr = (s.aliases || []).join(" ").toLowerCase();
          const target = `${s.name} ${s.shortName} ${aliasStr} ${s.desc} ${cat.category}`.toLowerCase();
          return tokens.every((t) => target.includes(t)) || target.includes(q);
        }),
      }))
      .filter((cat) => cat.services.length > 0);
  }, [searchQuery, selectedCategory, onlyBuilt]);

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[24px] font-bold text-[#16191f]">AWS Services Catalog</h1>
          <span className="text-[12px] bg-[#eaeded] text-[#545b64] font-semibold px-2.5 py-0.5 rounded-full">
            {ALL_SERVICES.length} Services
          </span>
          <span className="text-[12px] bg-[#e7f4e4] text-[#1d8102] border border-[#a2dca0] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#1d8102] inline-block animate-pulse"></span>
            {totalBuiltCount} Completely Built &amp; Live
          </span>
        </div>
        <p className="text-[14px] text-[#545b64] mt-1">
          Explore and launch services across compute, storage, databases, networking, security, and management. Fully built services are tagged and connected to the local AWS emulator.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#d5dbdb] rounded p-4 mb-6 awsui-shadow flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto flex-1">
          <div className="relative flex-1 lg:max-w-[460px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#545b64]"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder={`Search across all ${ALL_SERVICES.length} services...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-[#aab7b8] rounded pl-9 pr-8 py-[7px] text-[13px] text-[#16191f] placeholder-[#8d9ba8] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8d9ba8] hover:text-[#16191f] p-1"
                title="Clear search"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Quick Toggle: Only show built services */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[12px] font-bold text-[#16191f] bg-[#f8f9fa] border border-[#d5dbdb] hover:border-[#1d8102] px-3 py-[6px] rounded hover:bg-[#eaeded] transition-colors whitespace-nowrap">
            <input
              type="checkbox"
              checked={onlyBuilt}
              onChange={(e) => setOnlyBuilt(e.target.checked)}
              className="rounded border-[#aab7b8] text-[#1d8102] focus:ring-[#1d8102] h-4 w-4 cursor-pointer"
            />
            <span className="inline-flex items-center gap-1.5 text-[#16191f]">
              <span className="w-2 h-2 rounded-full bg-[#1d8102]"></span>
              Only Built Services ({totalBuiltCount})
            </span>
          </label>
        </div>

        {/* Category Filter Dropdown / Summary */}
        <div className="flex items-center gap-2 text-[12px] text-[#545b64] w-full lg:w-auto justify-between lg:justify-end">
          <span>
            Showing <strong>{totalMatchingCount}</strong> of {ALL_SERVICES.length} services
          </span>
          {(searchQuery || selectedCategory !== "All" || onlyBuilt) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setOnlyBuilt(false);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center text-[#0073bb] hover:underline font-medium ml-2 px-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex flex-wrap gap-1.5 mb-8 pb-1">
        {categories.map((cat) => {
          let count = 0;
          if (cat === "All") {
            count = ALL_SERVICES.length;
          } else if (cat === "Built & Operational") {
            count = totalBuiltCount;
          } else {
            count = SERVICE_CATEGORIES.find((c) => c.category === cat)?.services.length || 0;
          }

          const isBuiltCategory = cat === "Built & Operational";
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 text-[12px] rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? isBuiltCategory
                    ? "bg-[#1d8102] text-white font-bold shadow-xs"
                    : "bg-[#0073bb] text-white font-semibold shadow-xs"
                  : isBuiltCategory
                  ? "bg-[#e7f4e4] border border-[#a2dca0] text-[#1d8102] font-bold hover:bg-[#d4e8cc]"
                  : "bg-white border border-[#d5dbdb] text-[#545b64] hover:bg-[#f2f3f3] hover:text-[#16191f]"
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? "bg-white/20 text-white font-bold"
                    : isBuiltCategory
                    ? "bg-[#1d8102]/15 text-[#1d8102] font-bold"
                    : "bg-[#eaeded] text-[#545b64]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Services Grid by Category */}
      <div className="space-y-10">
        {filteredCatalog.map((group) => (
          <div key={group.category} className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2.5">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[17px] font-bold text-[#16191f]">{group.category}</h2>
                <span className="text-[12px] font-medium text-[#879596]">
                  ({group.services.length} {group.services.length === 1 ? "service" : "services"})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {group.services.map((service) => {
                const isBuilt = isServiceFullyBuilt(service.id) || service.status === "functional";

                return (
                  <Link
                    key={service.id}
                    href={service.href}
                    className={`rounded-md p-4 transition-all group flex flex-col justify-between relative ${
                      isBuilt
                        ? "bg-white border-2 border-[#1d8102]/40 hover:border-[#1d8102] hover:shadow-md border-l-4 border-l-[#1d8102]"
                        : "bg-white border border-[#d5dbdb] hover:border-[#0073bb] hover:shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-2.5">
                        <div className="shrink-0 mt-0.5">
                          <ServiceIcon
                            id={service.id}
                            shortName={service.shortName}
                            color={service.color}
                            size={24}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold text-[13px] text-[#0073bb] group-hover:text-[#ec7211] group-hover:underline truncate">
                              {service.name}
                            </span>
                            {isBuilt && (
                              <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-[#e7f4e4] text-[#1d8102] border border-[#a2dca0] shadow-2xs">
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="2 6 5 9 10 3" />
                                </svg>
                                Built
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#8d9ba8] font-mono mt-0.5">
                            {service.shortName}
                          </div>
                        </div>
                      </div>

                      <p className="text-[12px] text-[#545b64] leading-relaxed line-clamp-2">
                        {service.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#f2f3f3] flex items-center justify-between">
                      <span className="text-[10px] text-[#879596] font-medium">
                        {service.category}
                      </span>
                      {isBuilt ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#f2f8f0] text-[#1d8102] border border-[#d4e8cc] inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1d8102] inline-block animate-pulse"></span>
                          Live on Emulator
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#879596] bg-[#f8f9fa] border border-[#eaeded] px-1.5 py-0.5 rounded">
                          Preview
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {filteredCatalog.length === 0 && (
          <div className="bg-white border border-[#d5dbdb] rounded p-12 text-center awsui-shadow">
            <h3 className="text-[16px] font-bold text-[#16191f] mb-1">No services found</h3>
            <p className="text-[13px] text-[#545b64]">
              No service matching your search and filter criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setOnlyBuilt(false);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="mt-4 inline-flex items-center justify-center px-4 bg-[#0073bb] text-white rounded text-[13px] font-bold hover:bg-[#005a92] transition-colors"
            >
              Reset search &amp; filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
