/**
 * src/components/ec2/AMICatalogClient.tsx – Authentic AWS EC2 AMI Catalog Console.
 * Directly connected to live AWS Emulator with real image discovery, OS filters, architecture toggles, and launch actions.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AmiItem } from "@/app/ec2/actions";

interface Props {
  catalogAmis: AmiItem[];
  isLive: boolean;
}

export default function AMICatalogClient({ catalogAmis, isLive }: Props) {
  const [search, setSearch] = useState("");
  const [selectedOsFamily, setSelectedOsFamily] = useState<string>("all");
  const [selectedArch, setSelectedArch] = useState<string>("all");
  const [selectedAmiForDetails, setSelectedAmiForDetails] = useState<AmiItem | null>(null);

  // Group / filter images
  const filtered = catalogAmis.filter((ami) => {
    const text = `${ami.name} ${ami.id} ${ami.description} ${ami.platform}`.toLowerCase();
    const matchesSearch = !search || text.includes(search.toLowerCase());

    const matchesArch =
      selectedArch === "all" ||
      ami.architecture.toLowerCase() === selectedArch.toLowerCase();

    let matchesFamily = true;
    if (selectedOsFamily === "al2023") {
      matchesFamily = ami.name.toLowerCase().includes("al2023");
    } else if (selectedOsFamily === "amzn2") {
      matchesFamily = ami.name.toLowerCase().includes("amzn2") && !ami.name.toLowerCase().includes("al2023");
    } else if (selectedOsFamily === "windows") {
      matchesFamily = ami.platform.toLowerCase().includes("windows") || ami.name.toLowerCase().includes("win");
    } else if (selectedOsFamily === "bottlerocket") {
      matchesFamily = ami.name.toLowerCase().includes("bottlerocket");
    } else if (selectedOsFamily === "ecs") {
      matchesFamily = ami.name.toLowerCase().includes("ecs");
    }

    return matchesSearch && matchesArch && matchesFamily;
  });

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
              {isLive ? "AMI Catalog Connected (AWS Emulator)" : "Disconnected from AWS Emulator (127.0.0.1:9297)"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] text-[#545b64]">{catalogAmis.length} verified machine images</span>
        </div>
      </div>

      {/* Main Catalog Header Card */}
      <div className="bg-white border border-[#eaeded] rounded-sm p-6 awsui-shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-[20px] font-bold text-[#16191f]">AMI Catalog</h1>
            <p className="text-[13px] text-[#545b64] mt-1 max-w-3xl">
              Discover, explore, and launch verified Amazon Machine Images (AMIs) from Amazon Web Services and certified publishers. All images listed here are natively supported in the running AWS Emulator.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/ec2/amis"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[13px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              View My AMIs
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 pt-6 border-t border-[#eaeded] space-y-4">
          {/* OS Family Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Images" },
              { id: "al2023", label: "Amazon Linux 2023" },
              { id: "amzn2", label: "Amazon Linux 2" },
              { id: "windows", label: "Windows Server" },
              { id: "bottlerocket", label: "Bottlerocket OS" },
              { id: "ecs", label: "ECS-Optimized" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedOsFamily(tab.id)}
                style={{ height: "30px", minHeight: "30px", maxHeight: "30px", whiteSpace: "nowrap" }}
                className={`px-3.5 text-[12px] font-bold rounded-full transition-colors whitespace-nowrap inline-flex items-center justify-center cursor-pointer border ${
                  selectedOsFamily === tab.id
                    ? "bg-[#0073bb] text-white border-[#0073bb]"
                    : "bg-[#fafafa] text-[#545b64] border-[#d5dbdb] hover:border-[#16191f] hover:text-[#16191f]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Architecture Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="relative flex-1 max-w-lg">
              <input
                type="text"
                placeholder="Search verified AMIs by name, ID, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-3 pr-8 h-[32px] text-[13px] border border-[#aab7b8] rounded-sm focus:outline-none focus:border-[#ec7211] bg-white text-[#16191f]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[12px]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[12px] font-semibold text-[#545b64]">Architecture:</span>
              <select
                value={selectedArch}
                onChange={(e) => setSelectedArch(e.target.value)}
                className="h-[32px] border border-[#aab7b8] rounded-sm px-3 text-[12px] font-medium bg-white text-[#16191f] focus:outline-none focus:border-[#ec7211]"
              >
                <option value="all">All architectures</option>
                <option value="x86_64">x86_64 (64-bit)</option>
                <option value="arm64">arm64 (64-bit Arm / Graviton)</option>
              </select>
              <span className="text-[12px] text-[#545b64]">
                {filtered.length} of {catalogAmis.length} AMIs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AMI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white border border-[#eaeded] rounded-sm p-12 text-center text-[#545b64]">
            <p className="font-semibold text-[14px]">No AMIs found matching criteria</p>
            <p className="text-[12px] text-[#879596] mt-1">
              Try adjusting your search query, OS family, or architecture filter.
            </p>
          </div>
        ) : (
          filtered.map((ami) => {
            const isWindows = ami.platform.toLowerCase().includes("windows");
            const isBottlerocket = ami.name.toLowerCase().includes("bottlerocket");
            const isAl2023 = ami.name.toLowerCase().includes("al2023");

            const osBadge = isWindows
              ? "bg-[#e8f0fe] text-[#1a73e8] border-[#aecbfa]"
              : isBottlerocket
              ? "bg-[#e6f4ea] text-[#137333] border-[#ceead6]"
              : isAl2023
              ? "bg-[#fff3e0] text-[#b35900] border-[#ffe0b2]"
              : "bg-[#f1faff] text-[#0073bb] border-[#b0d9f5]";

            const osLabel = isWindows
              ? "Windows"
              : isBottlerocket
              ? "Bottlerocket"
              : isAl2023
              ? "Amazon Linux 2023"
              : "Amazon Linux 2";

            return (
              <div
                key={ami.id}
                className="bg-white border border-[#eaeded] rounded-sm p-5 flex flex-col justify-between awsui-shadow hover:border-[#aab7b8] transition-all"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${osBadge}`}>
                          {osLabel}
                        </span>
                        <span className="text-[11px] font-medium text-[#1d8102] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1d8102]" />
                          Verified Provider: Amazon Web Services
                        </span>
                      </div>
                      <h3 className="text-[14px] font-bold text-[#16191f] truncate" title={ami.name}>
                        {ami.name}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[12px] text-[#545b64] leading-relaxed line-clamp-2 mb-4">
                    {ami.description || "Amazon official machine image prepared with system utilities and cloud-init."}
                  </p>

                  {/* Specifications Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[12px] text-[#545b64] bg-[#fafafa] p-3 rounded-sm border border-[#eaeded] mb-4">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-[#879596]">AMI ID</span>
                      <span className="font-mono text-[#0073bb] font-semibold">{ami.id}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-[#879596]">Architecture</span>
                      <span className="font-mono text-[#16191f] font-medium">{ami.architecture}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-[#879596]">Platform</span>
                      <span className="text-[#16191f]">{ami.platform}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-[#879596]">Root Storage</span>
                      <span className="text-[#16191f] uppercase">{ami.rootDeviceType} ({ami.virtualizationType})</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-[#eaeded] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedAmiForDetails(ami)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3 border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] text-[12px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    View details
                  </button>

                  <Link
                    href={`/ec2/launch?amiId=${ami.id}`}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-[12px] font-bold rounded-sm whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                  >
                    Launch instance with AMI
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details Modal */}
      {selectedAmiForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">AMI Specifications</h3>
                <span className="font-mono text-[12px] text-[#0073bb] font-medium">
                  {selectedAmiForDetails.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedAmiForDetails(null)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              <div>
                <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                  AMI Name
                </span>
                <span className="font-medium text-[#16191f] mt-0.5 block">
                  {selectedAmiForDetails.name}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                  Description
                </span>
                <span className="text-[#545b64] mt-0.5 block">
                  {selectedAmiForDetails.description || "Official Amazon verified image."}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#eaeded]">
                <div>
                  <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    Architecture
                  </span>
                  <span className="font-mono text-[#16191f] mt-0.5 block">
                    {selectedAmiForDetails.architecture}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    Platform Details
                  </span>
                  <span className="text-[#16191f] mt-0.5 block">
                    {selectedAmiForDetails.platform}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    Root Device
                  </span>
                  <span className="font-mono text-[#16191f] mt-0.5 block">
                    {selectedAmiForDetails.rootDeviceName} ({selectedAmiForDetails.rootDeviceType})
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    Virtualization
                  </span>
                  <span className="uppercase text-[#16191f] mt-0.5 block">
                    {selectedAmiForDetails.virtualizationType}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    Owner Account
                  </span>
                  <span className="font-mono text-[#16191f] mt-0.5 block">
                    {selectedAmiForDetails.owner} (Amazon Web Services)
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    Status
                  </span>
                  <span className="font-medium text-[#1d8102] capitalize mt-0.5 block">
                    {selectedAmiForDetails.state}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setSelectedAmiForDetails(null)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-4 border border-[#aab7b8] text-[#16191f] font-bold rounded-sm hover:border-[#16191f] whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href={`/ec2/launch?amiId=${selectedAmiForDetails.id}`}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-4 bg-[#ec7211] text-white font-bold rounded-sm hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                >
                  Launch instance with this AMI
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
