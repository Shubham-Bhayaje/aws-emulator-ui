/**
 * Services Catalog page – Full catalog of 200+ AWS services.
 * Features real-time search, category filtering, and direct navigation.
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES, ALL_SERVICES } from "@/lib/services-catalog";
import { ServiceIcon } from "@/components/AwsIcons";

export default function ServicesCatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => ["All", ...SERVICE_CATEGORIES.map((c) => c.category)], []);

  const totalMatchingCount = useMemo(() => {
    if (!searchQuery.trim() && selectedCategory === "All") return ALL_SERVICES.length;
    const q = searchQuery.toLowerCase().trim();
    return ALL_SERVICES.filter((s) => {
      const matchesCat = selectedCategory === "All" || s.category === selectedCategory;
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    }).length;
  }, [searchQuery, selectedCategory]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SERVICE_CATEGORIES
      .filter((cat) => selectedCategory === "All" || cat.category === selectedCategory)
      .map((cat) => ({
        ...cat,
        services: cat.services.filter((s) => {
          if (!q) return true;
          return (
            s.name.toLowerCase().includes(q) ||
            s.shortName.toLowerCase().includes(q) ||
            s.desc.toLowerCase().includes(q) ||
            cat.category.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((cat) => cat.services.length > 0);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-bold text-[#16191f]">AWS Services Catalog</h1>
          <span className="text-[12px] bg-[#eaeded] text-[#545b64] font-semibold px-2.5 py-0.5 rounded-full">
            {ALL_SERVICES.length} Services
          </span>
        </div>
        <p className="text-[14px] text-[#545b64] mt-1">
          Explore and launch services across compute, storage, databases, networking, security, machine learning, and more.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#d5dbdb] rounded p-4 mb-6 awsui-shadow flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative w-full lg:w-[460px]">
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

        {/* Category Filter Dropdown / Summary */}
        <div className="flex items-center gap-2 text-[12px] text-[#545b64] w-full lg:w-auto justify-between lg:justify-end">
          <span>Showing <strong>{totalMatchingCount}</strong> of {ALL_SERVICES.length} services</span>
          {(searchQuery || selectedCategory !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="text-[#0073bb] hover:underline font-medium ml-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex flex-wrap gap-1.5 mb-8 pb-1">
        {categories.map((cat) => {
          const count = cat === "All"
            ? ALL_SERVICES.length
            : (SERVICE_CATEGORIES.find((c) => c.category === cat)?.services.length || 0);

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-[12px] rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? "bg-[#0073bb] text-white font-semibold shadow-xs"
                  : "bg-white border border-[#d5dbdb] text-[#545b64] hover:bg-[#f2f3f3] hover:text-[#16191f]"
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat ? "bg-white/20 text-white" : "bg-[#eaeded] text-[#545b64]"
              }`}>
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
              {group.services.map((service) => (
                <Link
                  key={service.id}
                  href={service.href}
                  className="bg-white border border-[#d5dbdb] rounded-md p-4 hover:border-[#0073bb] hover:shadow-sm transition-all group flex flex-col justify-between"
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
                    <span className="text-[10px] text-[#879596]">
                      {service.category}
                    </span>
                    {service.status === "functional" && (
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#f2f8f0] text-[#1d8102] border border-[#d4e8cc]">
                        Active
                      </span>
                    )}
                    {service.status === "emulator" && (
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#f2f8fd] text-[#0073bb] border border-[#cbe2f2]">
                        Emulator Ready
                      </span>
                    )}
                    {!service.status && (
                      <span className="text-[10px] text-[#879596]">
                        Explore
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {filteredCatalog.length === 0 && (
          <div className="bg-white border border-[#d5dbdb] rounded p-12 text-center awsui-shadow">
            <h3 className="text-[16px] font-bold text-[#16191f] mb-1">No services found</h3>
            <p className="text-[13px] text-[#545b64]">
              No service matching &quot;{searchQuery}&quot; found in category &quot;{selectedCategory}&quot;.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 px-4 py-1.5 bg-[#0073bb] text-white rounded text-[13px] font-medium hover:bg-[#005a92]"
            >
              Reset search & filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
