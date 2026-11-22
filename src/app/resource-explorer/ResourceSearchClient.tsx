"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ResourceItem,
  ViewItem,
  IndexItem,
  searchResourcesAction,
  quickSetupAction,
} from "./actions";

interface Props {
  indexInfo: {
    success: boolean;
    hasIndex: boolean;
    index?: IndexItem;
    error?: string;
  };
  views: ViewItem[];
  defaultViewArn?: string;
  initialActiveViewArn?: string;
  initialQuery: string;
  initialSearchRes: {
    success: boolean;
    resources: ResourceItem[];
    count: number;
    complete: boolean;
    viewArn?: string;
    error?: string;
  };
}

export default function ResourceSearchClient({
  indexInfo,
  views,
  defaultViewArn,
  initialActiveViewArn,
  initialQuery,
  initialSearchRes,
}: Props) {
  const router = useRouter();

  const [hasIndex, setHasIndex] = useState(indexInfo.hasIndex);
  const [activeViewArn, setActiveViewArn] = useState<string>(
    initialActiveViewArn || views[0]?.ViewArn || ""
  );
  const [queryString, setQueryString] = useState(initialQuery);
  const [resources, setResources] = useState<ResourceItem[]>(initialSearchRes.resources);
  const [count, setCount] = useState<number>(initialSearchRes.count);
  const [isComplete, setIsComplete] = useState<boolean>(initialSearchRes.complete);
  const [selectedArn, setSelectedArn] = useState<string | null>(null);

  const [searching, setSearching] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialSearchRes.error || null
  );
  const [copiedArn, setCopiedArn] = useState<string | null>(null);

  const handleSearch = async (queryToRun?: string, viewToUse?: string) => {
    const q = queryToRun !== undefined ? queryToRun : queryString;
    const v = viewToUse !== undefined ? viewToUse : activeViewArn;

    setSearching(true);
    setErrorMessage(null);
    try {
      const res = await searchResourcesAction(q, v);
      if (res.success) {
        setResources(res.resources);
        setCount(res.count ?? res.resources.length);
        setIsComplete(res.complete ?? true);
        if (selectedArn && !res.resources.find((r) => r.Arn === selectedArn)) {
          setSelectedArn(null);
        }
      } else {
        setErrorMessage(res.error || "Search operation failed.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  };

  const handleQuickSetup = async () => {
    setSetupLoading(true);
    setErrorMessage(null);
    try {
      const res = await quickSetupAction();
      if (res.success) {
        setHasIndex(true);
        router.refresh();
      } else {
        setErrorMessage(res.error || "Quick setup failed.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setSetupLoading(false);
    }
  };

  const handleCopyArn = (arn: string) => {
    navigator.clipboard.writeText(arn);
    setCopiedArn(arn);
    setTimeout(() => setCopiedArn(null), 2000);
  };

  const extractResourceName = (arn: string): string => {
    if (!arn) return "-";
    const parts = arn.split(":");
    if (parts.length >= 6) {
      const resPart = parts.slice(5).join(":");
      if (resPart.includes("/")) {
        return resPart.split("/").pop() || resPart;
      }
      return resPart;
    }
    return arn;
  };

  const getServiceLink = (service?: string, arn?: string): string | null => {
    if (!service) return null;
    const s = service.toLowerCase();
    if (s === "s3") return "/s3";
    if (s === "sns") return "/sns";
    if (s === "sqs") return "/sqs";
    if (s === "dynamodb") return "/dynamodb";
    if (s === "kms") return "/kms";
    if (s === "secretsmanager") return "/secretsmanager";
    if (s === "ssm" || s === "systems-manager") return "/systems-manager/parameter-store";
    if (s === "logs" || s === "cloudwatch") return "/cloudwatch/logs";
    if (s === "ecr") return "/ecr";
    if (s === "ses") return "/ses";
    if (s === "appconfig") return "/appconfig";
    if (s === "geo" || s === "location") return "/location";
    if (s === "servicediscovery" || s === "cloudmap") return "/cloudmap";
    if (s === "kinesis") return "/kinesis";
    if (s === "keyspaces") return "/keyspaces";
    if (s === "timestream") return "/timestream";
    if (s === "glacier") return "/glacier";
    if (s === "iam") return "/iam";
    if (s === "resource-explorer-2" || s === "resourceexplorer") return "/resource-explorer/views";
    return null;
  };

  const quickFilterServices = [
    "s3",
    "sns",
    "sqs",
    "dynamodb",
    "kms",
    "cloudmap",
    "ecr",
    "location",
    "appconfig",
    "ses",
  ];

  const applyServiceFilter = (serviceName: string) => {
    let nextQuery = queryString.trim();
    if (serviceName === "all") {
      nextQuery = nextQuery.replace(/service:[^\s]+/g, "").trim();
    } else {
      if (nextQuery.includes("service:")) {
        nextQuery = nextQuery.replace(/service:[^\s]+/g, `service:${serviceName}`).trim();
      } else {
        nextQuery = `${nextQuery} service:${serviceName}`.trim();
      }
    }
    setQueryString(nextQuery);
    handleSearch(nextQuery);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <span>AWS Resource Explorer</span>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Resource search</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Resource search</h1>
          <p className="text-[14px] text-[#545b64] mt-1">
            Search for and discover resources across your AWS account and Regions using query filters, resource types, and tags.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/resource-explorer/views"
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Manage views
          </Link>
          <Link
            href="/resource-explorer/settings"
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Setup Required Banner if Resource Explorer is not turned on */}
      {!hasIndex && (
        <div className="p-5 bg-gradient-to-r from-purple-50 via-pink-50 to-white border border-purple-200 rounded shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">
                Turn on Resource Explorer in this Region
              </h2>
              <p className="text-[13px] text-[#545b64] mt-1 max-w-2xl">
                Resource Explorer is not yet turned on in this AWS Region. Quick setup creates an aggregator index in this Region, indexes your cloud resources, and provisions the default <code className="font-mono text-xs text-[#16191f]">all-resources</code> view.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickSetup}
                disabled={setupLoading}
                className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-60"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {setupLoading ? "Turning on..." : "Quick setup (Turn on)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Search Engine Panel */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 shadow-sm space-y-4">
        {/* View Selector and Search Bar Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* View Dropdown */}
          <div className="w-full md:w-64">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#545b64] mb-1">
              Search view
            </label>
            <select
              value={activeViewArn}
              onChange={(e) => {
                setActiveViewArn(e.target.value);
                handleSearch(queryString, e.target.value);
              }}
              className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded bg-white text-[#16191f] focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            >
              {views.length === 0 ? (
                <option value="">No views available</option>
              ) : (
                views.map((v) => (
                  <option key={v.ViewArn} value={v.ViewArn}>
                    {v.ViewName || v.ViewArn.split("/").pop()} {v.IsDefault ? "(Default)" : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#545b64] mb-1">
              Query expression
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filter by keywords, tags, resource types (e.g. service:s3, tag:env=prod)..."
                value={queryString}
                onChange={(e) => setQueryString(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              />
              {queryString && (
                <button
                  type="button"
                  onClick={() => {
                    setQueryString("");
                    handleSearch("");
                  }}
                  className="px-2.5 py-1 text-[12px] font-medium text-[#545b64] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={searching}
                className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-60"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </div>

        {/* Query Syntax Cheat Sheet and Quick Filter Chips */}
        <div className="pt-2 border-t border-[#eaeded] flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-[#545b64] mr-1">Filter by service:</span>
            <button
              onClick={() => applyServiceFilter("all")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                !queryString.includes("service:")
                  ? "bg-[#16191f] text-white"
                  : "bg-[#f2f3f3] text-[#16191f] hover:bg-[#e4e5e5]"
              }`}
            >
              All
            </button>
            {quickFilterServices.map((svc) => {
              const active = queryString.includes(`service:${svc}`);
              return (
                <button
                  key={svc}
                  onClick={() => applyServiceFilter(svc)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    active
                      ? "bg-[#ec7211] text-white"
                      : "bg-[#f2f3f3] text-[#16191f] hover:bg-[#e4e5e5]"
                  }`}
                >
                  {svc}
                </button>
              );
            })}
          </div>

          <div className="text-[#545b64] text-[11px]">
            <span>Supported operators: </span>
            <code className="text-[#16191f] font-mono bg-gray-100 px-1 py-0.5 rounded">service:</code>{" "}
            <code className="text-[#16191f] font-mono bg-gray-100 px-1 py-0.5 rounded">region:</code>{" "}
            <code className="text-[#16191f] font-mono bg-gray-100 px-1 py-0.5 rounded">resourcetype:</code>{" "}
            <code className="text-[#16191f] font-mono bg-gray-100 px-1 py-0.5 rounded">tag:key=val</code>
          </div>
        </div>
      </div>

      {/* Search Results Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-bold text-[#16191f]">
              Matching resources ({count})
            </h2>
            {isComplete && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Complete
              </span>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={searching}
            className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {searching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="bg-white border border-[#d5dbdb] rounded overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-4">Resource name / ID</th>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">Resource type</th>
                <th className="py-2.5 px-4">Region</th>
                <th className="py-2.5 px-4">Account ID</th>
                <th className="py-2.5 px-4">ARN</th>
                <th className="py-2.5 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {resources.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#545b64]">
                    {hasIndex
                      ? "No resources match your search criteria. Try modifying your query expression or switching to a broader view."
                      : "Resource Explorer is not turned on in this Region. Turn on Resource Explorer using the setup banner above to index your account resources."}
                  </td>
                </tr>
              ) : (
                resources.map((res) => {
                  const isSelected = selectedArn === res.Arn;
                  const serviceLink = getServiceLink(res.Service, res.Arn);
                  const shortName = extractResourceName(res.Arn);

                  return (
                    <tr
                      key={res.Arn}
                      onClick={() => setSelectedArn(res.Arn)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f1faff]" : "hover:bg-[#f9fafb]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => setSelectedArn(res.Arn)}
                          className="accent-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#16191f]">
                        {serviceLink ? (
                          <Link
                            href={serviceLink}
                            className="text-[#0073bb] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {shortName}
                          </Link>
                        ) : (
                          <span>{shortName}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-mono text-[12px] px-1.5 py-0.5 rounded bg-gray-100 text-[#16191f]">
                          {res.Service || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                        {res.ResourceType || res.CfnResourceType || "-"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                        {res.Region || "-"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                        {res.OwningAccountId || "-"}
                      </td>
                      <td className="py-2.5 px-4 max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-[#545b64] truncate" title={res.Arn}>
                            {res.Arn}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyArn(res.Arn);
                            }}
                            className="text-[11px] text-[#0073bb] hover:underline whitespace-nowrap"
                          >
                            {copiedArn === res.Arn ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {serviceLink ? (
                          <Link
                            href={serviceLink}
                            className="text-[12px] text-[#0073bb] hover:underline font-medium inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View &rarr;
                          </Link>
                        ) : (
                          <span className="text-[12px] text-[#879596]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
