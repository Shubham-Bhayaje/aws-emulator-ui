"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IndexItem,
  ViewItem,
  getIndexAction,
  listIndexesAction,
  createIndexAction,
  deleteIndexAction,
  updateIndexTypeAction,
  associateDefaultViewAction,
  disassociateDefaultViewAction,
} from "../actions";

interface Props {
  currentIndexInfo: {
    success: boolean;
    hasIndex: boolean;
    index?: IndexItem;
    error?: string;
  };
  indexes: IndexItem[];
  views: ViewItem[];
  defaultViewArn?: string;
}

export default function SettingsClient({
  currentIndexInfo,
  indexes: initialIndexes,
  views,
  defaultViewArn: initialDefaultViewArn,
}: Props) {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState<IndexItem | undefined>(
    currentIndexInfo.index
  );
  const [hasIndex, setHasIndex] = useState<boolean>(currentIndexInfo.hasIndex);
  const [indexes, setIndexes] = useState<IndexItem[]>(initialIndexes);
  const [defaultArn, setDefaultArn] = useState<string>(initialDefaultViewArn || "");

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(
    null
  );

  const refreshSettings = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [idxRes, listRes] = await Promise.all([
        getIndexAction(),
        listIndexesAction(),
      ]);
      setHasIndex(idxRes.hasIndex);
      setCurrentIndex(idxRes.index);
      setIndexes(listRes.indexes);
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTurnOnIndex = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await createIndexAction();
      if (res.success) {
        setMessage({
          text: "Resource Explorer has been turned on in Region us-east-1.",
          type: "success",
        });
        await refreshSettings();
        router.refresh();
      } else {
        setMessage({
          text: res.error || "Failed to turn on Resource Explorer.",
          type: "error",
        });
      }
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTurnOffIndex = async () => {
    if (!currentIndex?.Arn) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await deleteIndexAction(currentIndex.Arn);
      if (res.success) {
        setMessage({
          text: "Resource Explorer index deleted in Region us-east-1.",
          type: "success",
        });
        await refreshSettings();
        router.refresh();
      } else {
        setMessage({
          text: res.error || "Failed to turn off Resource Explorer.",
          type: "error",
        });
      }
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetAggregator = async () => {
    if (!currentIndex?.Arn) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await updateIndexTypeAction(currentIndex.Arn, "AGGREGATOR");
      if (res.success) {
        setMessage({
          text: "Region us-east-1 index promoted to Aggregator index.",
          type: "success",
        });
        await refreshSettings();
        router.refresh();
      } else {
        setMessage({
          text: res.error || "Failed to set aggregator index.",
          type: "error",
        });
      }
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetLocal = async () => {
    if (!currentIndex?.Arn) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await updateIndexTypeAction(currentIndex.Arn, "LOCAL");
      if (res.success) {
        setMessage({
          text: "Region us-east-1 index switched to Local index.",
          type: "success",
        });
        await refreshSettings();
        router.refresh();
      } else {
        setMessage({
          text: res.error || "Failed to set local index.",
          type: "error",
        });
      }
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDefaultView = async () => {
    if (!defaultArn) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await associateDefaultViewAction(defaultArn);
      if (res.success) {
        setMessage({
          text: "Default view successfully updated.",
          type: "success",
        });
        router.refresh();
      } else {
        setMessage({
          text: res.error || "Failed to update default view.",
          type: "error",
        });
      }
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearDefaultView = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await disassociateDefaultViewAction();
      if (res.success) {
        setDefaultArn("");
        setMessage({
          text: "Default view association cleared.",
          type: "success",
        });
        router.refresh();
      } else {
        setMessage({
          text: res.error || "Failed to clear default view.",
          type: "error",
        });
      }
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Standard regions table representation
  const allRegions = [
    { id: "us-east-1", name: "US East (N. Virginia)", isCurrent: true },
    { id: "us-east-2", name: "US East (Ohio)", isCurrent: false },
    { id: "us-west-1", name: "US West (N. California)", isCurrent: false },
    { id: "us-west-2", name: "US West (Oregon)", isCurrent: false },
    { id: "eu-west-1", name: "Europe (Ireland)", isCurrent: false },
    { id: "ap-southeast-1", name: "Asia Pacific (Singapore)", isCurrent: false },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/resource-explorer" className="hover:underline">
          AWS Resource Explorer
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Settings</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Settings</h1>
          <p className="text-[14px] text-[#545b64] mt-1">
            Manage regional indexes, designate the aggregator index Region, and configure default search views.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshSettings}
            disabled={loading}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-[13px] border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Section 1: Regional Indexes */}
      <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Indexes by Region</h2>
          <p className="text-[13px] text-[#545b64] mt-1">
            Resource Explorer creates an index in each Region where you turn on the service. An account can have one <strong>Aggregator index</strong> that collects resource metadata from all other indexed Regions, allowing cross-Region search queries.
          </p>
        </div>

        {/* Current Region Status Card */}
        <div className="p-4 bg-[#f8f9fa] border border-[#eaeded] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#16191f]">Current Region: us-east-1</span>
              {hasIndex ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentIndex?.State || "ACTIVE"}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-[#545b64] border border-gray-200">
                  Not turned on
                </span>
              )}
              {hasIndex && currentIndex?.Type && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  {currentIndex.Type} index
                </span>
              )}
            </div>
            {hasIndex && currentIndex?.Arn && (
              <p className="text-[11px] font-mono text-[#545b64] mt-1 break-all">
                {currentIndex.Arn}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!hasIndex ? (
              <button
                onClick={handleTurnOnIndex}
                disabled={actionLoading}
                className="px-3 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-60"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Turn on in this Region
              </button>
            ) : (
              <>
                {currentIndex?.Type === "LOCAL" ? (
                  <button
                    onClick={handleSetAggregator}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Promote to Aggregator
                  </button>
                ) : (
                  <button
                    onClick={handleSetLocal}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Switch to Local index
                  </button>
                )}

                <button
                  onClick={handleTurnOffIndex}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-[13px] font-medium text-red-600 border border-[#d5dbdb] rounded hover:bg-red-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Turn off index
                </button>
              </>
            )}
          </div>
        </div>

        {/* Regions Table */}
        <div className="border border-[#d5dbdb] rounded overflow-hidden">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                <th className="py-2.5 px-4">Region</th>
                <th className="py-2.5 px-4">Index status</th>
                <th className="py-2.5 px-4">Index type</th>
                <th className="py-2.5 px-4">ARN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {allRegions.map((r) => {
                const isUsEast1 = r.id === "us-east-1";
                const active = isUsEast1 && hasIndex;
                const type = isUsEast1 && hasIndex ? currentIndex?.Type : "-";
                const arn = isUsEast1 && hasIndex ? currentIndex?.Arn : "-";

                return (
                  <tr key={r.id} className="hover:bg-[#f9fafb]">
                    <td className="py-2.5 px-4 font-medium text-[#16191f]">
                      {r.name} <span className="text-[#545b64] font-mono text-[12px]">({r.id})</span>
                      {r.isCurrent && (
                        <span className="ml-2 text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-[#879596] text-[12px]">Not turned on</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {type !== "-" ? (
                        <span className="font-semibold text-[#16191f] text-[12px]">{type}</span>
                      ) : (
                        <span className="text-[#879596]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[#545b64] max-w-xs truncate">
                      {arn}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Default View Configuration */}
      <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Default view</h2>
          <p className="text-[13px] text-[#545b64] mt-1">
            Choose the view that Resource Explorer opens automatically on the Resource search page when no specific view is selected.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
          <select
            value={defaultArn}
            onChange={(e) => setDefaultArn(e.target.value)}
            className="flex-1 px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded bg-white text-[#16191f] focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          >
            <option value="">-- No default view assigned --</option>
            {views.map((v) => (
              <option key={v.ViewArn} value={v.ViewArn}>
                {v.ViewName || v.ViewArn.split("/").pop()}
              </option>
            ))}
          </select>

          <button
            onClick={handleSaveDefaultView}
            disabled={!defaultArn || actionLoading}
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-60"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Save default view
          </button>

          {initialDefaultViewArn && (
            <button
              onClick={handleClearDefaultView}
              disabled={actionLoading}
              className="px-3 py-1.5 text-[13px] font-medium text-[#545b64] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Clear default
            </button>
          )}
        </div>
      </div>

      {/* Section 3: Multi-Account Search (AWS Organizations) */}
      <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-3">
        <h2 className="text-[16px] font-bold text-[#16191f]">
          Multi-account search (AWS Organizations)
        </h2>
        <p className="text-[13px] text-[#545b64]">
          You can enable Resource Explorer across all accounts in your AWS Organization. With multi-account search enabled, your aggregator index can aggregate resource metadata across all member accounts into an organizational view.
        </p>
        <div className="p-3 bg-gray-50 border border-[#eaeded] rounded text-[12px] text-[#545b64]">
          <strong>Notice:</strong> Multi-account search is enabled from the AWS Organizations management account or a delegated administrator account.
        </div>
      </div>
    </div>
  );
}
