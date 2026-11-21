"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubscriptionDetail } from "../../types";
import { unsubscribeAction } from "../../actions";

interface SubscriptionDetailClientProps {
  subscription: SubscriptionDetail;
}

export default function SubscriptionDetailClient({
  subscription,
}: SubscriptionDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "filter-policy" | "dlq">("details");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  }

  async function handleUnsubscribe() {
    setIsDeleting(true);
    setDeleteError(null);

    const res = await unsubscribeAction(subscription.arn);
    setIsDeleting(false);

    if (res.success) {
      router.push("/sns/subscriptions");
    } else {
      setDeleteError(res.error || "Failed to unsubscribe");
    }
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Breadcrumbs */}
      <div className="text-[13px] text-[#545b64] flex items-center gap-2">
        <Link href="/sns" className="text-[#0073bb] hover:underline">
          Amazon SNS
        </Link>
        <span>/</span>
        <Link href="/sns/subscriptions" className="text-[#0073bb] hover:underline">
          Subscriptions
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-medium truncate max-w-xs">{subscription.arn}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div className="flex items-center gap-3">
          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border bg-[#f2f3f3] text-[#16191f] border-[#d5dbdb] uppercase">
            {subscription.protocol}
          </span>
          <h1 className="text-[20px] font-bold text-[#16191f] truncate max-w-md" title={subscription.endpoint}>
            {subscription.endpoint}
          </h1>
        </div>

        <div>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 border border-[#d13212] rounded text-[13px] font-medium text-[#d13212] hover:bg-[#fdf3f1] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#eaeded] text-[13px] font-semibold">
        {[
          { id: "details", label: "Details" },
          { id: "filter-policy", label: "Subscription filter policy" },
          { id: "dlq", label: "Redrive policy (dead-letter queue)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-6 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Subscription details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
                Subscription ARN
              </div>
              <div className="mt-1 flex items-center gap-2 font-mono text-[12px] text-[#16191f]">
                <span className="truncate" title={subscription.arn}>{subscription.arn}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(subscription.arn, "arn")}
                  className="text-[#0073bb] hover:underline text-[11px]"
                >
                  {copiedText === "arn" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
                Topic ARN
              </div>
              <div className="mt-1 flex items-center gap-2 font-mono text-[12px]">
                <Link
                  href={`/sns/topics/${encodeURIComponent(subscription.topicArn)}`}
                  className="text-[#0073bb] hover:underline truncate"
                  title={subscription.topicArn}
                >
                  {subscription.topicArn}
                </Link>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
                Protocol
              </div>
              <div className="mt-1 font-semibold text-[#16191f] uppercase">{subscription.protocol}</div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
                Endpoint
              </div>
              <div className="mt-1 font-mono text-[12px] text-[#16191f] truncate" title={subscription.endpoint}>
                {subscription.endpoint}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
                Status
              </div>
              <div className="mt-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                    subscription.status === "Confirmed"
                      ? "bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]"
                      : "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]"
                  }`}
                >
                  {subscription.status}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
                Raw message delivery
              </div>
              <div className="mt-1 text-[#16191f]">
                {subscription.rawMessageDelivery ? "Enabled" : "Disabled"}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
                Subscription owner
              </div>
              <div className="mt-1 font-mono text-[12px] text-[#16191f]">
                {subscription.owner || "000000000000"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Subscription filter policy */}
      {activeTab === "filter-policy" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Subscription filter policy
          </h2>
          {subscription.filterPolicy ? (
            <div className="space-y-3">
              <div className="text-[12px] text-[#545b64]">
                Scope: <span className="font-semibold text-[#16191f]">{subscription.filterPolicyScope || "MessageAttributes"}</span>
              </div>
              <pre className="p-4 bg-[#f8f9fa] border border-[#eaeded] rounded font-mono text-[12px] text-[#16191f] overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(JSON.parse(subscription.filterPolicy), null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-[13px] text-[#545b64]">
              No filter policy configured. This subscription receives all messages published to the topic.
            </p>
          )}
        </div>
      )}

      {/* Tab 3: Redrive policy (dead-letter queue) */}
      {activeTab === "dlq" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Redrive policy (dead-letter queue)
          </h2>
          {subscription.redrivePolicy?.deadLetterTargetArn ? (
            <div className="space-y-2 text-[13px]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
                Dead-letter queue ARN
              </div>
              <div className="font-mono text-[12px] text-[#16191f]">
                {subscription.redrivePolicy.deadLetterTargetArn}
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-[#545b64]">
              No dead-letter queue configured. Undeliverable messages will not be isolated into a DLQ.
            </p>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete subscription?</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this subscription? The endpoint will stop receiving notifications.
            </p>

            {deleteError && (
              <div className="p-3 rounded bg-[#fdf3f1] border border-[#d13212] text-[13px] text-[#d13212]">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#d13212] text-white rounded text-[13px] font-bold hover:bg-[#b02a0f] disabled:opacity-40 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
