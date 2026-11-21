"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RegionInfo } from "../types";
import { enableRegionAction, disableRegionAction } from "../actions";

interface RegionsClientProps {
  initialRegions: RegionInfo[];
}

export function RegionsClient({ initialRegions }: RegionsClientProps) {
  const [regions, setRegions] = useState<RegionInfo[]>(initialRegions);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");

  const [regionToEnable, setRegionToEnable] = useState<RegionInfo | null>(null);
  const [regionToDisable, setRegionToDisable] = useState<RegionInfo | null>(null);
  const [disableAcknowledged, setDisableAcknowledged] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleEnable = async () => {
    if (!regionToEnable) return;
    setMutating(true);
    setBanner(null);
    try {
      const res = await enableRegionAction(regionToEnable.regionName);
      if (res.success) {
        setRegions((prev) =>
          prev.map((r) =>
            r.regionName === regionToEnable.regionName ? { ...r, regionOptStatus: "ENABLED" } : r
          )
        );
        setBanner({
          type: "success",
          message: `Region ${regionToEnable.regionName} enabled successfully.`,
        });
        setRegionToEnable(null);
      } else {
        setBanner({ type: "error", message: res.error || "Failed to enable region." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred." });
    } finally {
      setMutating(false);
    }
  };

  const handleDisable = async () => {
    if (!regionToDisable) return;
    setMutating(true);
    setBanner(null);
    try {
      const res = await disableRegionAction(regionToDisable.regionName);
      if (res.success) {
        setRegions((prev) =>
          prev.map((r) =>
            r.regionName === regionToDisable.regionName ? { ...r, regionOptStatus: "DISABLED" } : r
          )
        );
        setBanner({
          type: "success",
          message: `Region ${regionToDisable.regionName} disabled successfully.`,
        });
        setRegionToDisable(null);
        setDisableAcknowledged(false);
      } else {
        setBanner({ type: "error", message: res.error || "Failed to disable region." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred." });
    } finally {
      setMutating(false);
    }
  };

  const filtered = regions.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = r.regionName.toLowerCase().includes(term);
    if (statusFilter === "ENABLED") {
      return (
        matchesSearch &&
        (r.regionOptStatus === "ENABLED" || r.regionOptStatus === "ENABLED_BY_DEFAULT")
      );
    }
    if (statusFilter === "DISABLED") {
      return matchesSearch && r.regionOptStatus === "DISABLED";
    }
    return matchesSearch;
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto text-[#16191f]">
      {/* Breadcrumb */}
      <div className="text-xs text-[#545b64] mb-3">
        <Link href="/account" className="text-[#0073bb] hover:underline">
          Account settings
        </Link>{" "}
        / AWS Regions
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`mb-5 p-4 rounded text-sm flex items-start justify-between border ${
            banner.type === "success"
              ? "bg-[#f2fcf3] border-[#037f0c] text-[#037f0c]"
              : "bg-[#fdf3f2] border-[#d13212] text-[#d13212]"
          }`}
        >
          <div>{banner.message}</div>
          <button
            onClick={() => setBanner(null)}
            className="text-xs font-bold hover:opacity-80 ml-4"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-[#eaeded] mb-6">
        <h1 className="text-xl font-bold text-[#16191f]">AWS Regions</h1>
        <p className="text-xs text-[#545b64] mt-1">
          Enable or disable opt-in AWS Regions for your account. Regions enabled by default cannot be disabled.
        </p>
      </div>

      {/* Regions Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3 bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 text-xs font-semibold rounded border ${
                statusFilter === "ALL"
                  ? "bg-[#16191f] text-white border-[#16191f]"
                  : "bg-white text-[#16191f] border-[#aab7b8] hover:bg-[#f2f3f3]"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              All regions ({regions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ENABLED")}
              className={`px-3 text-xs font-semibold rounded border ${
                statusFilter === "ENABLED"
                  ? "bg-[#16191f] text-white border-[#16191f]"
                  : "bg-white text-[#16191f] border-[#aab7b8] hover:bg-[#f2f3f3]"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Enabled (
              {
                regions.filter(
                  (r) =>
                    r.regionOptStatus === "ENABLED" ||
                    r.regionOptStatus === "ENABLED_BY_DEFAULT"
                ).length
              }
              )
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("DISABLED")}
              className={`px-3 text-xs font-semibold rounded border ${
                statusFilter === "DISABLED"
                  ? "bg-[#16191f] text-white border-[#16191f]"
                  : "bg-white text-[#16191f] border-[#aab7b8] hover:bg-[#f2f3f3]"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Disabled ({regions.filter((r) => r.regionOptStatus === "DISABLED").length})
            </button>
          </div>

          <input
            type="text"
            placeholder="Search regions"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-[#aab7b8] rounded px-3 text-xs w-72 focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#f8f9fa] text-[#545b64] font-semibold">
                <th className="py-2.5 px-4">Region name</th>
                <th className="py-2.5 px-4">Region code</th>
                <th className="py-2.5 px-4">Opt-in status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.map((reg) => {
                const isEnabledByDefault = reg.regionOptStatus === "ENABLED_BY_DEFAULT";
                const isEnabled = reg.regionOptStatus === "ENABLED";
                const isDisabled = reg.regionOptStatus === "DISABLED";

                return (
                  <tr key={reg.regionName} className="hover:bg-[#fbfbfb]">
                    <td className="py-2.5 px-4 font-semibold text-[#16191f]">{reg.regionName}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[#545b64]">{reg.regionName}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border ${
                          isEnabledByDefault
                            ? "bg-[#f2f3f3] text-[#545b64] border-[#eaeded]"
                            : isEnabled
                            ? "bg-[#f2fcf3] text-[#037f0c] border-[#a1dfa5]"
                            : "bg-[#fdf3f2] text-[#d13212] border-[#f3b5a8]"
                        }`}
                      >
                        {isEnabledByDefault
                          ? "Enabled by default"
                          : isEnabled
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {isEnabledByDefault ? (
                        <span className="text-[#aab7b8] text-[11px] italic">Not configurable</span>
                      ) : isEnabled ? (
                        <button
                          type="button"
                          onClick={() => {
                            setRegionToDisable(reg);
                            setDisableAcknowledged(false);
                          }}
                          className="px-3 text-xs font-semibold rounded border border-[#d13212] text-[#d13212] bg-white hover:bg-[#fdf3f2]"
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRegionToEnable(reg)}
                          className="px-3 text-xs font-semibold rounded text-white bg-[#ec7211] hover:bg-[#eb5f07]"
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                        >
                          Enable
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enable Modal */}
      {regionToEnable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 text-[#16191f]">
            <h2 className="text-base font-bold mb-2">
              Enable region: {regionToEnable.regionName}
            </h2>
            <p className="text-xs text-[#545b64] mb-4">
              Enabling this Region allows resources to be created and managed in{" "}
              <strong>{regionToEnable.regionName}</strong>. Data stored in this Region remains in this Region unless
              explicitly transferred.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRegionToEnable(null)}
                disabled={mutating}
                className="px-3 text-xs font-semibold border border-[#aab7b8] rounded bg-white hover:bg-[#f2f3f3]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEnable}
                disabled={mutating}
                className="px-4 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {mutating ? "Enabling..." : "Enable region"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable Modal */}
      {regionToDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 text-[#16191f]">
            <h2 className="text-base font-bold mb-2 text-[#d13212]">
              Disable region: {regionToDisable.regionName}
            </h2>
            <p className="text-xs text-[#545b64] mb-4">
              Disabling this Region will prevent access to any existing resources in this Region. Make sure all resources have been deleted or migrated before disabling.
            </p>

            <label className="flex items-start gap-2 mb-4 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={disableAcknowledged}
                onChange={(e) => setDisableAcknowledged(e.target.checked)}
                className="mt-0.5 accent-[#d13212]"
              />
              <span>I acknowledge that resources in this Region will become inaccessible.</span>
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRegionToDisable(null)}
                disabled={mutating}
                className="px-3 text-xs font-semibold border border-[#aab7b8] rounded bg-white hover:bg-[#f2f3f3]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!disableAcknowledged || mutating}
                onClick={handleDisable}
                className={`px-4 text-xs font-semibold text-white rounded ${
                  disableAcknowledged
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-[#aab7b8] cursor-not-allowed"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {mutating ? "Disabling..." : "Disable region"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
