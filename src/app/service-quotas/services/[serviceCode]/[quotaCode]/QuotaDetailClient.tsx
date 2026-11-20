"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ServiceQuotaItem,
  RequestedServiceQuotaChange,
  QuotaTag,
} from "../../../types";
import { formatQuotaDate } from "../../../dateUtils";
import {
  requestQuotaIncreaseAction,
  addQuotaToTemplateAction,
  tagQuotaAction,
} from "../../../actions";

interface QuotaDetailClientProps {
  quota: ServiceQuotaItem;
  initialHistory: RequestedServiceQuotaChange[];
  initialTags: QuotaTag[];
}

export default function QuotaDetailClient({
  quota,
  initialHistory,
  initialTags,
}: QuotaDetailClientProps) {
  const router = useRouter();
  const [history, setHistory] = useState<RequestedServiceQuotaChange[]>(initialHistory);
  const [tags, setTags] = useState<QuotaTag[]>(initialTags);
  const [activeTab, setActiveTab] = useState<"history" | "metrics" | "tags">("history");

  // Request Increase Modal
  const [showIncreaseModal, setShowIncreaseModal] = useState(false);
  const [desiredValue, setDesiredValue] = useState<string>(String(quota.value + 5));
  const [increaseError, setIncreaseError] = useState("");
  const [isSubmittingIncrease, setIsSubmittingIncrease] = useState(false);

  // Add to Template Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateRegion, setTemplateRegion] = useState("us-east-1");
  const [templateDesiredValue, setTemplateDesiredValue] = useState<string>(String(quota.value + 5));
  const [templateError, setTemplateError] = useState("");
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);

  // Manage Tags Modal
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [editableTags, setEditableTags] = useState<QuotaTag[]>(initialTags);
  const [isSavingTags, setIsSavingTags] = useState(false);

  // Banner
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
    link?: { href: string; label: string };
  } | null>(null);

  const handleSubmitIncrease = async () => {
    const val = parseFloat(desiredValue);
    if (isNaN(val) || val <= 0) {
      setIncreaseError("Please enter a valid positive number.");
      return;
    }
    if (val <= quota.value) {
      setIncreaseError(
        `The desired quota value must be greater than the current value (${quota.value}).`
      );
      return;
    }

    setIsSubmittingIncrease(true);
    setIncreaseError("");
    try {
      const res = await requestQuotaIncreaseAction(
        quota.serviceCode,
        quota.quotaCode,
        val
      );
      if (res.success && res.data) {
        setHistory((prev) => [res.data!, ...prev]);
        setShowIncreaseModal(false);
        setBanner({
          type: "success",
          message: `Successfully requested quota increase. Request ID: ${res.data.id}. Status: ${res.data.status}.`,
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

  const handleSubmitTemplate = async () => {
    const val = parseFloat(templateDesiredValue);
    if (isNaN(val) || val <= 0) {
      setTemplateError("Please enter a valid positive number.");
      return;
    }

    setIsSubmittingTemplate(true);
    setTemplateError("");
    try {
      const res = await addQuotaToTemplateAction(
        quota.serviceCode,
        quota.quotaCode,
        templateRegion,
        val
      );
      if (res.success) {
        setShowTemplateModal(false);
        setBanner({
          type: "success",
          message: `Successfully added to quota request template for ${templateRegion}.`,
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

  const handleSaveTags = async () => {
    if (!quota.quotaArn) return;
    setIsSavingTags(true);
    setBanner(null);
    try {
      const cleanTags = editableTags.filter((t) => t.key.trim() !== "");
      const res = await tagQuotaAction(quota.quotaArn, cleanTags);
      if (res.success) {
        setTags(cleanTags);
        setShowTagsModal(false);
        setBanner({ type: "success", message: "Tags updated successfully." });
      } else {
        setBanner({ type: "error", message: res.error || "Failed to update tags." });
      }
    } catch (e: any) {
      setBanner({ type: "error", message: e.message || "An error occurred." });
    } finally {
      setIsSavingTags(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "APPROVED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ecf7ed] text-[#1d8102] border border-[#a4e7a5]">
          Approved
        </span>
      );
    }
    if (s === "PENDING" || s === "CASE_OPENED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f1faff] text-[#0073bb] border border-[#9fd8f6]">
          {s === "CASE_OPENED" ? "Case opened" : "Pending"}
        </span>
      );
    }
    if (s === "DENIED" || s === "NOT_APPROVED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#fdf2f2] text-[#d13212] border border-[#f8b4b4]">
          Denied
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
        {status}
      </span>
    );
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
        <Link
          href={`/service-quotas/services/${encodeURIComponent(quota.serviceCode)}`}
          className="hover:underline"
        >
          {quota.serviceName}
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#16191f] truncate max-w-sm">{quota.quotaName}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16191f]">{quota.quotaName}</h1>
          <p className="text-sm text-[#545b64] mt-1 font-mono">
            Quota code: {quota.quotaCode}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setTemplateDesiredValue(String(quota.value + 5));
              setTemplateRegion("us-east-1");
              setShowTemplateModal(true);
            }}
            className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-3 rounded-[2px] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Add to quota request template
          </button>
          <button
            onClick={() => {
              setDesiredValue(String(quota.value + 5));
              setIncreaseError("");
              setShowIncreaseModal(true);
            }}
            disabled={!quota.adjustable}
            className={`font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm ${
              quota.adjustable
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

      {/* Quota Overview Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#16191f] mb-3">Quota details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
          <div>
            <span className="text-[#545b64] block font-medium mb-1">Applied quota value</span>
            <span className="text-xl font-bold font-mono text-[#16191f]">
              {quota.value.toLocaleString()} {quota.unit !== "None" ? quota.unit : ""}
            </span>
          </div>
          <div>
            <span className="text-[#545b64] block font-medium mb-1">AWS default value</span>
            <span className="text-xl font-mono text-[#545b64]">
              {quota.defaultValue !== undefined ? quota.defaultValue.toLocaleString() : "-"}
            </span>
          </div>
          <div>
            <span className="text-[#545b64] block font-medium mb-1">Adjustable</span>
            <span className="text-sm font-semibold">
              {quota.adjustable ? (
                <span className="text-[#1d8102]">Yes</span>
              ) : (
                <span className="text-[#545b64]">No</span>
              )}
            </span>
          </div>
          <div>
            <span className="text-[#545b64] block font-medium mb-1">Global quota</span>
            <span className="text-sm font-semibold text-[#16191f]">
              {quota.globalQuota ? "Yes" : "No"}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#eaeded] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#545b64] block font-medium mb-1">Quota ARN</span>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#16191f] break-all bg-[#fafafa] p-1.5 border border-[#eaeded] rounded">
              <span>{quota.quotaArn || `arn:aws:servicequotas:us-east-1:000000000000:${quota.serviceCode}/${quota.quotaCode}`}</span>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    quota.quotaArn || `arn:aws:servicequotas:us-east-1:000000000000:${quota.serviceCode}/${quota.quotaCode}`
                  )
                }
                title="Copy ARN"
                className="text-[#0073bb] hover:text-[#005580] shrink-0 font-sans"
              >
                Copy
              </button>
            </div>
          </div>
          <div>
            <span className="text-[#545b64] block font-medium mb-1">Applied level</span>
            <span className="font-mono text-[13px] text-[#16191f]">
              {quota.quotaAppliedAtLevel || "ACCOUNT"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        <div className="flex border-b border-[#eaeded] px-4 gap-6 text-[13px]">
          {[
            { id: "history", label: `Request history (${history.length})` },
            { id: "metrics", label: "CloudWatch usage metrics" },
            { id: "tags", label: `Tags (${tags.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 font-bold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Request History */}
        {activeTab === "history" && (
          <div className="p-6 space-y-4">
            <p className="text-xs text-[#545b64]">
              History of quota increase requests submitted for this specific quota.
            </p>
            <div className="border border-[#eaeded] rounded overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
                  <tr>
                    <th className="p-3">Request ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Desired Value</th>
                    <th className="p-3">Case ID</th>
                    <th className="p-3">Submitted</th>
                    <th className="p-3">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-[#545b64]">
                        No quota increase requests submitted for this quota. Click &quot;Request increase at account level&quot; above to request a higher limit.
                      </td>
                    </tr>
                  ) : (
                    history.map((req) => (
                      <tr key={req.id} className="hover:bg-[#f9f9f9]">
                        <td className="p-3 font-mono text-xs font-semibold text-[#0073bb]">
                          {req.id}
                        </td>
                        <td className="p-3">{getStatusBadge(req.status)}</td>
                        <td className="p-3 font-mono font-bold">{req.desiredValue.toLocaleString()}</td>
                        <td className="p-3 font-mono text-xs text-[#545b64]">
                          {req.caseId || "-"}
                        </td>
                        <td className="p-3 text-xs text-[#545b64]">
                          <span suppressHydrationWarning>{formatQuotaDate(req.created)}</span>
                        </td>
                        <td className="p-3 text-xs text-[#545b64]">
                          <span suppressHydrationWarning>{formatQuotaDate(req.lastUpdated)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Metrics */}
        {activeTab === "metrics" && (
          <div className="p-6 space-y-4">
            <p className="text-xs text-[#545b64]">
              CloudWatch usage metric parameters configured for monitoring this quota limit.
            </p>
            {quota.usageMetric ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                    <span className="text-[#545b64] block">Metric namespace</span>
                    <span className="font-mono font-bold text-[#16191f]">
                      {quota.usageMetric.metricNamespace || "AWS/Usage"}
                    </span>
                  </div>
                  <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                    <span className="text-[#545b64] block">Metric name</span>
                    <span className="font-mono font-bold text-[#16191f]">
                      {quota.usageMetric.metricName || "ResourceCount"}
                    </span>
                  </div>
                  <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                    <span className="text-[#545b64] block">Statistic recommendation</span>
                    <span className="font-semibold text-[#16191f]">
                      {quota.usageMetric.metricStatisticRecommendation || "Maximum"}
                    </span>
                  </div>
                </div>

                {quota.usageMetric.metricDimensions && (
                  <div>
                    <h4 className="text-xs font-bold text-[#16191f] mb-2">Metric dimensions:</h4>
                    <div className="border border-[#eaeded] rounded overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#fafafa] text-[#545b64] font-bold border-b border-[#eaeded]">
                          <tr>
                            <th className="p-2.5">Dimension Name</th>
                            <th className="p-2.5">Dimension Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eaeded]">
                          {Object.entries(quota.usageMetric.metricDimensions).map(([dim, val]) => (
                            <tr key={dim} className="hover:bg-[#f9f9f9]">
                              <td className="p-2.5 font-semibold text-[#16191f]">{dim}</td>
                              <td className="p-2.5 font-mono text-[#545b64]">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#545b64] border border-dashed border-[#eaeded] rounded">
                CloudWatch usage metrics are not configured for this quota.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Tags */}
        {activeTab === "tags" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#545b64]">
                Tags attached to this quota resource in AWS Service Quotas.
              </p>
              <button
                onClick={() => {
                  setEditableTags([...tags]);
                  setShowTagsModal(true);
                }}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-3 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Manage tags
              </button>
            </div>
            <div className="border border-[#eaeded] rounded overflow-hidden">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
                  <tr>
                    <th className="p-3">Key</th>
                    <th className="p-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {tags.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-xs text-[#545b64]">
                        No tags attached to this quota.
                      </td>
                    </tr>
                  ) : (
                    tags.map((t) => (
                      <tr key={t.key} className="hover:bg-[#f9f9f9]">
                        <td className="p-3 font-semibold">{t.key}</td>
                        <td className="p-3 text-[#545b64]">{t.value || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Request Quota Increase Modal */}
      {showIncreaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Request quota increase</h3>
            <p className="text-xs text-[#545b64]">
              Request an increase for this quota at the account level. Your request will be evaluated automatically or reviewed by AWS Support.
            </p>

            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-xs space-y-1.5">
              <div>
                <span className="text-[#545b64] font-medium">Service:</span>{" "}
                <span className="font-semibold text-[#16191f]">{quota.serviceName}</span>
              </div>
              <div>
                <span className="text-[#545b64] font-medium">Quota name:</span>{" "}
                <span className="font-semibold text-[#16191f]">{quota.quotaName}</span>
              </div>
              <div>
                <span className="text-[#545b64] font-medium">Current quota value:</span>{" "}
                <span className="font-mono font-bold text-[#16191f]">
                  {quota.value.toLocaleString()} {quota.unit !== "None" ? quota.unit : ""}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16191f] mb-1">
                Increase quota value <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="number"
                min={quota.value + 1}
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
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Add quota to template</h3>
            <p className="text-xs text-[#545b64]">
              Configure a quota increase to be automatically requested when new AWS accounts are created in your organization.
            </p>

            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-xs space-y-1.5">
              <div>
                <span className="text-[#545b64] font-medium">Service:</span>{" "}
                <span className="font-semibold text-[#16191f]">{quota.serviceName}</span>
              </div>
              <div>
                <span className="text-[#545b64] font-medium">Quota name:</span>{" "}
                <span className="font-semibold text-[#16191f]">{quota.quotaName}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">AWS Region</label>
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

      {/* Manage Tags Modal */}
      {showTagsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Manage tags</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {editableTags.map((t, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Key"
                    value={t.key}
                    onChange={(e) => {
                      const updated = [...editableTags];
                      updated[idx].key = e.target.value;
                      setEditableTags(updated);
                    }}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-[#aab7b8] rounded-[2px]"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={t.value}
                    onChange={(e) => {
                      const updated = [...editableTags];
                      updated[idx].value = e.target.value;
                      setEditableTags(updated);
                    }}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-[#aab7b8] rounded-[2px]"
                  />
                  <button
                    onClick={() => setEditableTags(editableTags.filter((_, i) => i !== idx))}
                    className="text-xs text-[#d13212] font-bold px-2 py-1 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => setEditableTags([...editableTags, { key: "", value: "" }])}
                className="text-xs text-[#0073bb] font-bold hover:underline"
              >
                + Add new tag
              </button>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setShowTagsModal(false)}
                disabled={isSavingTags}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTags}
                disabled={isSavingTags}
                className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {isSavingTags ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
