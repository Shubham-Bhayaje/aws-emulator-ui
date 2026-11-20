"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ServiceQuotaItem } from "../../types";
import {
  requestQuotaIncreaseAction,
  addQuotaToTemplateAction,
} from "../../actions";

interface ServiceQuotasClientProps {
  serviceCode: string;
  serviceName: string;
  initialQuotas: ServiceQuotaItem[];
}

export default function ServiceQuotasClient({
  serviceCode,
  serviceName,
  initialQuotas,
}: ServiceQuotasClientProps) {
  const router = useRouter();
  const [quotas, setQuotas] = useState<ServiceQuotaItem[]>(initialQuotas);
  const [selectedQuotaCode, setSelectedQuotaCode] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [adjustableFilter, setAdjustableFilter] = useState<"ALL" | "ADJUSTABLE" | "NON_ADJUSTABLE">("ALL");

  // Request Increase Modal
  const [showIncreaseModal, setShowIncreaseModal] = useState(false);
  const [desiredValue, setDesiredValue] = useState<string>("");
  const [increaseError, setIncreaseError] = useState("");
  const [isSubmittingIncrease, setIsSubmittingIncrease] = useState(false);

  // Add to Template Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateRegion, setTemplateRegion] = useState("us-east-1");
  const [templateDesiredValue, setTemplateDesiredValue] = useState<string>("");
  const [templateError, setTemplateError] = useState("");
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);

  // Banner
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
    link?: { href: string; label: string };
  } | null>(null);

  const selectedQuota = quotas.find((q) => q.quotaCode === selectedQuotaCode);

  const filtered = quotas.filter((q) => {
    const matchesSearch =
      q.quotaName.toLowerCase().includes(search.toLowerCase()) ||
      q.quotaCode.toLowerCase().includes(search.toLowerCase());
    const matchesAdjustable =
      adjustableFilter === "ALL" ||
      (adjustableFilter === "ADJUSTABLE" && q.adjustable) ||
      (adjustableFilter === "NON_ADJUSTABLE" && !q.adjustable);
    return matchesSearch && matchesAdjustable;
  });

  const adjustableCount = quotas.filter((q) => q.adjustable).length;

  // Open Increase Modal
  const handleOpenIncreaseModal = () => {
    if (!selectedQuota || !selectedQuota.adjustable) return;
    setDesiredValue(String(selectedQuota.value + 5));
    setIncreaseError("");
    setShowIncreaseModal(true);
  };

  // Submit Increase Request
  const handleSubmitIncrease = async () => {
    if (!selectedQuota) return;
    const val = parseFloat(desiredValue);
    if (isNaN(val) || val <= 0) {
      setIncreaseError("Please enter a valid positive number.");
      return;
    }
    if (val <= selectedQuota.value) {
      setIncreaseError(
        `The desired quota value must be greater than the current value (${selectedQuota.value}).`
      );
      return;
    }

    setIsSubmittingIncrease(true);
    setIncreaseError("");
    try {
      const res = await requestQuotaIncreaseAction(
        serviceCode,
        selectedQuota.quotaCode,
        val
      );
      if (res.success && res.data) {
        setShowIncreaseModal(false);
        setBanner({
          type: "success",
          message: `Successfully requested quota increase for "${selectedQuota.quotaName}". Request ID: ${res.data.id}. Status: ${res.data.status}.`,
          link: { href: "/service-quotas/history", label: "View in Quota request history" },
        });
      } else {
        setIncreaseError(res.error || "Failed to request quota increase.");
      }
    } catch (e: any) {
      setIncreaseError(e.message || "An unexpected error occurred.");
    } finally {
      setIsSubmittingIncrease(false);
    }
  };

  // Open Add to Template Modal
  const handleOpenTemplateModal = () => {
    if (!selectedQuota) return;
    setTemplateDesiredValue(String(selectedQuota.value + 5));
    setTemplateRegion("us-east-1");
    setTemplateError("");
    setShowTemplateModal(true);
  };

  // Submit Add to Template
  const handleSubmitTemplate = async () => {
    if (!selectedQuota) return;
    const val = parseFloat(templateDesiredValue);
    if (isNaN(val) || val <= 0) {
      setTemplateError("Please enter a valid positive number.");
      return;
    }

    setIsSubmittingTemplate(true);
    setTemplateError("");
    try {
      const res = await addQuotaToTemplateAction(
        serviceCode,
        selectedQuota.quotaCode,
        templateRegion,
        val
      );
      if (res.success) {
        setShowTemplateModal(false);
        setBanner({
          type: "success",
          message: `Successfully added "${selectedQuota.quotaName}" (${templateRegion}) to the quota request template.`,
          link: { href: "/service-quotas/template", label: "View Quota request template" },
        });
      } else {
        setTemplateError(res.error || "Failed to add quota to template.");
      }
    } catch (e: any) {
      setTemplateError(e.message || "An unexpected error occurred.");
    } finally {
      setIsSubmittingTemplate(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#545b64]">
        <Link href="/service-quotas" className="hover:underline">
          Service Quotas
        </Link>
        <span>/</span>
        <Link href="/service-quotas" className="hover:underline">
          AWS services
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#16191f]">{serviceName}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16191f]">{serviceName} quotas</h1>
          <p className="text-sm text-[#545b64] mt-1">
            Service quotas applied to your account in US East (N. Virginia).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.refresh()}
            className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-3 rounded-[2px] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            title="Refresh"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
          <button
            onClick={handleOpenTemplateModal}
            disabled={!selectedQuota}
            className={`font-bold text-[13px] px-3 rounded-[2px] transition-colors border ${
              selectedQuota
                ? "bg-white border-[#879596] hover:bg-[#f2f3f3] text-[#16191f]"
                : "bg-[#f2f3f3] border-[#eaeded] text-[#959da5] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Add to quota request template
          </button>
          <button
            onClick={() => {
              if (selectedQuota) {
                router.push(
                  `/service-quotas/services/${encodeURIComponent(serviceCode)}/${encodeURIComponent(
                    selectedQuota.quotaCode
                  )}`
                );
              }
            }}
            disabled={!selectedQuota}
            className={`font-bold text-[13px] px-3 rounded-[2px] transition-colors border ${
              selectedQuota
                ? "bg-white border-[#879596] hover:bg-[#f2f3f3] text-[#16191f]"
                : "bg-[#f2f3f3] border-[#eaeded] text-[#959da5] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View details
          </button>
          <button
            onClick={handleOpenIncreaseModal}
            disabled={!selectedQuota || !selectedQuota.adjustable}
            className={`font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm ${
              selectedQuota && selectedQuota.adjustable
                ? "bg-[#ec7211] hover:bg-[#eb5f07] text-white"
                : "bg-[#f2f3f3] border border-[#eaeded] text-[#959da5] cursor-not-allowed"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Request increase at account level
          </button>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`p-4 rounded border text-sm flex items-start justify-between ${
            banner.type === "success"
              ? "bg-[#ecf7ed] border-[#a4e7a5] text-[#1d8102]"
              : "bg-[#fdf2f2] border-[#f8b4b4] text-[#d13212]"
          }`}
        >
          <div>
            <span>{banner.message}</span>
            {banner.link && (
              <Link href={banner.link.href} className="block mt-1 font-bold underline">
                {banner.link.label}
              </Link>
            )}
          </div>
          <button onClick={() => setBanner(null)} className="text-gray-500 hover:text-black font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
          <span className="text-xs text-[#545b64] block font-medium">Service name</span>
          <span className="text-sm font-bold text-[#16191f] mt-1 block truncate" title={serviceName}>
            {serviceName}
          </span>
        </div>
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
          <span className="text-xs text-[#545b64] block font-medium">Service code</span>
          <span className="text-sm font-mono font-bold text-[#16191f] mt-1 block">
            {serviceCode}
          </span>
        </div>
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
          <span className="text-xs text-[#545b64] block font-medium">Total quotas</span>
          <span className="text-xl font-bold text-[#16191f] mt-1 block">
            {quotas.length}
          </span>
        </div>
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
          <span className="text-xs text-[#545b64] block font-medium">Adjustable quotas</span>
          <span className="text-xl font-bold text-[#1d8102] mt-1 block">
            {adjustableCount}
          </span>
        </div>
      </div>

      {/* Table & Filters Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Filter by quota name or code"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 pl-8 border border-[#aab7b8] rounded-[2px] focus:outline-none focus:border-[#0073bb]"
              />
              <svg
                className="absolute left-2.5 top-2.5 text-[#545b64]"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <select
              value={adjustableFilter}
              onChange={(e) => setAdjustableFilter(e.target.value as any)}
              className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] bg-white focus:outline-none focus:border-[#0073bb]"
            >
              <option value="ALL">All quotas ({quotas.length})</option>
              <option value="ADJUSTABLE">Adjustable only ({adjustableCount})</option>
              <option value="NON_ADJUSTABLE">Non-adjustable only ({quotas.length - adjustableCount})</option>
            </select>
          </div>
          <div className="text-xs text-[#545b64]">
            Displaying {filtered.length} of {quotas.length} quotas
          </div>
        </div>

        {/* Quotas Table */}
        <div className="border border-[#eaeded] rounded overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
              <tr>
                <th className="p-3 w-10 text-center">Select</th>
                <th className="p-3">Quota Name</th>
                <th className="p-3">Applied Value</th>
                <th className="p-3">AWS Default</th>
                <th className="p-3">Adjustable</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Global</th>
                <th className="p-3">Quota Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#545b64]">
                    <p className="font-semibold text-sm text-[#16191f]">No quotas found</p>
                    <p className="text-xs mt-1">No quotas matched your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((q) => {
                  const isChecked = selectedQuotaCode === q.quotaCode;
                  return (
                    <tr
                      key={q.quotaCode}
                      className={`hover:bg-[#f9f9f9] transition-colors cursor-pointer ${
                        isChecked ? "bg-[#f2f8fd]" : ""
                      }`}
                      onClick={() => setSelectedQuotaCode(q.quotaCode)}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="quota_select"
                          checked={isChecked}
                          onChange={() => setSelectedQuotaCode(q.quotaCode)}
                          className="text-[#0073bb] focus:ring-0"
                        />
                      </td>
                      <td className="p-3 font-medium">
                        <Link
                          href={`/service-quotas/services/${encodeURIComponent(serviceCode)}/${encodeURIComponent(
                            q.quotaCode
                          )}`}
                          className="text-[#0073bb] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {q.quotaName}
                        </Link>
                      </td>
                      <td className="p-3 font-mono font-semibold">
                        {q.value.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-xs text-[#545b64]">
                        {q.defaultValue !== undefined ? q.defaultValue.toLocaleString() : "-"}
                      </td>
                      <td className="p-3">
                        {q.adjustable ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ecf7ed] text-[#1d8102]">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f2f3f3] text-[#545b64]">
                            No
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-[#545b64]">{q.unit || "None"}</td>
                      <td className="p-3 text-xs">{q.globalQuota ? "Yes" : "No"}</td>
                      <td className="p-3 font-mono text-xs text-[#545b64]">{q.quotaCode}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Quota Increase Modal */}
      {showIncreaseModal && selectedQuota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Request quota increase</h3>
            <p className="text-xs text-[#545b64]">
              Request an increase for this quota at the account level. Your request will be evaluated automatically or reviewed by AWS Support.
            </p>

            {/* Quota Context Info */}
            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-xs space-y-1.5">
              <div>
                <span className="text-[#545b64] font-medium">Service:</span>{" "}
                <span className="font-semibold text-[#16191f]">{serviceName}</span>
              </div>
              <div>
                <span className="text-[#545b64] font-medium">Quota name:</span>{" "}
                <span className="font-semibold text-[#16191f]">{selectedQuota.quotaName}</span>
              </div>
              <div>
                <span className="text-[#545b64] font-medium">Current quota value:</span>{" "}
                <span className="font-mono font-bold text-[#16191f]">
                  {selectedQuota.value.toLocaleString()} {selectedQuota.unit !== "None" ? selectedQuota.unit : ""}
                </span>
              </div>
            </div>

            {/* Form */}
            <div>
              <label className="block text-xs font-bold text-[#16191f] mb-1">
                Increase quota value <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="number"
                min={selectedQuota.value + 1}
                value={desiredValue}
                onChange={(e) => {
                  setDesiredValue(e.target.value);
                  if (increaseError) setIncreaseError("");
                }}
                className={`w-full text-[13px] px-3 py-1.5 border rounded-[2px] focus:outline-none ${
                  increaseError
                    ? "border-[#d13212] bg-[#fff5f5]"
                    : "border-[#aab7b8] focus:border-[#0073bb]"
                }`}
              />
              <p className="text-[11px] text-[#545b64] mt-1">
                Enter the total quota value you require, not the additional amount.
              </p>
              {increaseError && (
                <p className="text-xs text-[#d13212] mt-1 font-medium">{increaseError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowIncreaseModal(false)}
                disabled={isSubmittingIncrease}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitIncrease}
                disabled={isSubmittingIncrease}
                className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {isSubmittingIncrease ? "Submitting request..." : "Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Template Modal */}
      {showTemplateModal && selectedQuota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Add quota to template</h3>
            <p className="text-xs text-[#545b64]">
              Configure a quota increase to be automatically requested when new AWS accounts are created in your AWS Organization.
            </p>

            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-xs space-y-1.5">
              <div>
                <span className="text-[#545b64] font-medium">Service:</span>{" "}
                <span className="font-semibold text-[#16191f]">{serviceName}</span>
              </div>
              <div>
                <span className="text-[#545b64] font-medium">Quota name:</span>{" "}
                <span className="font-semibold text-[#16191f]">{selectedQuota.quotaName}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">
                  AWS Region
                </label>
                <select
                  value={templateRegion}
                  onChange={(e) => setTemplateRegion(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] bg-white focus:outline-none focus:border-[#0073bb]"
                >
                  <option value="us-east-1">US East (N. Virginia) us-east-1</option>
                  <option value="us-east-2">US East (Ohio) us-east-2</option>
                  <option value="us-west-1">US West (N. California) us-west-1</option>
                  <option value="us-west-2">US West (Oregon) us-west-2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">
                  Desired value <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="number"
                  value={templateDesiredValue}
                  onChange={(e) => {
                    setTemplateDesiredValue(e.target.value);
                    if (templateError) setTemplateError("");
                  }}
                  className={`w-full text-[13px] px-3 py-1.5 border rounded-[2px] focus:outline-none ${
                    templateError
                      ? "border-[#d13212] bg-[#fff5f5]"
                      : "border-[#aab7b8] focus:border-[#0073bb]"
                  }`}
                />
                {templateError && (
                  <p className="text-xs text-[#d13212] mt-1 font-medium">{templateError}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                disabled={isSubmittingTemplate}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitTemplate}
                disabled={isSubmittingTemplate}
                className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {isSubmittingTemplate ? "Adding to template..." : "Add to template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
