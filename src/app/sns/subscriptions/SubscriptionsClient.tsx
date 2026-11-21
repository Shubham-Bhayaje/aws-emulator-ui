"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubscriptionSummary } from "../types";
import { unsubscribeAction } from "../actions";

interface SubscriptionsClientProps {
  initialSubscriptions: SubscriptionSummary[];
}

export default function SubscriptionsClient({ initialSubscriptions }: SubscriptionsClientProps) {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>(initialSubscriptions);
  const [search, setSearch] = useState("");
  const [selectedArn, setSelectedArn] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectedSub = subscriptions.find((s) => s.arn === selectedArn);

  const filteredSubs = subscriptions.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.arn.toLowerCase().includes(q) ||
      s.protocol.toLowerCase().includes(q) ||
      s.endpoint.toLowerCase().includes(q) ||
      s.topicName.toLowerCase().includes(q) ||
      s.topicArn.toLowerCase().includes(q)
    );
  });

  async function handleUnsubscribe() {
    if (!selectedSub) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await unsubscribeAction(selectedSub.arn);
    setIsDeleting(false);

    if (res.success) {
      setSubscriptions((prev) => prev.filter((s) => s.arn !== selectedSub.arn));
      setSelectedArn(null);
      setShowDeleteModal(false);
    } else {
      setDeleteError(res.error || "Failed to unsubscribe");
    }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Subscriptions</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            Subscriptions receive messages published to Amazon SNS topics and deliver them to subscribing endpoints.
          </p>
        </div>
        <div>
          <Link
            href="/sns/subscriptions/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center px-4 font-bold text-[13px] bg-[#ec7211] text-white rounded hover:bg-[#eb5f07] transition-colors"
          >
            Create subscription
          </Link>
        </div>
      </div>

      {/* Subscriptions Table Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Filter subscriptions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedSub && selectedSub.arn !== "PendingConfirmation") {
                  router.push(`/sns/subscriptions/${encodeURIComponent(selectedSub.arn)}`);
                }
              }}
              disabled={!selectedSub || selectedSub.arn === "PendingConfirmation"}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              View details
            </button>

            <button
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              disabled={!selectedSub}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#d13212] rounded text-[13px] font-medium text-[#d13212] hover:bg-[#fdf3f1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#f2f3f3] text-[11px] font-bold uppercase tracking-wider text-[#545b64] border-b border-[#eaeded]">
              <tr>
                <th className="w-10 px-4 py-2.5 text-center"></th>
                <th className="px-4 py-2.5">Subscription ARN</th>
                <th className="px-4 py-2.5">Protocol</th>
                <th className="px-4 py-2.5">Endpoint</th>
                <th className="px-4 py-2.5">Topic</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#545b64]">
                    <div className="max-w-md mx-auto space-y-3">
                      <p className="font-semibold text-[14px]">No subscriptions found</p>
                      <p className="text-[13px]">
                        You currently do not have any active subscriptions. Create a subscription to link an endpoint to an SNS topic.
                      </p>
                      <div className="pt-2">
                        <Link
                          href="/sns/subscriptions/create"
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          className="inline-flex items-center justify-center px-4 font-bold text-[13px] bg-[#ec7211] text-white rounded hover:bg-[#eb5f07] transition-colors"
                        >
                          Create subscription
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const isSelected = selectedArn === sub.arn;
                  const isPending = sub.arn === "PendingConfirmation";
                  return (
                    <tr
                      key={sub.arn}
                      onClick={() => setSelectedArn(sub.arn)}
                      className={`cursor-pointer hover:bg-[#f8f9fa] ${
                        isSelected ? "bg-[#f1faff]" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedSub"
                          checked={isSelected}
                          onChange={() => setSelectedArn(sub.arn)}
                          className="text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px]">
                        {isPending ? (
                          <span className="text-[#f57f17] font-semibold italic">
                            PendingConfirmation
                          </span>
                        ) : (
                          <Link
                            href={`/sns/subscriptions/${encodeURIComponent(sub.arn)}`}
                            className="text-[#0073bb] hover:underline truncate max-w-[240px] block"
                            title={sub.arn}
                          >
                            {sub.arn}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold border bg-[#f2f3f3] text-[#16191f] border-[#d5dbdb] uppercase">
                          {sub.protocol}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] truncate max-w-xs" title={sub.endpoint}>
                        {sub.endpoint}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/sns/topics/${encodeURIComponent(sub.topicArn)}`}
                          className="text-[#0073bb] hover:underline"
                        >
                          {sub.topicName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            sub.status === "Confirmed"
                              ? "bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]"
                              : "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]"
                          }`}
                        >
                          {sub.status === "Confirmed" ? "Confirmed" : "Pending confirmation"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#eaeded] bg-[#fafafa] text-[12px] text-[#545b64]">
          Showing {filteredSubs.length} of {subscriptions.length} subscriptions
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete subscription?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this subscription? The endpoint <code className="font-mono font-bold text-[#16191f]">{selectedSub.endpoint}</code> will no longer receive notifications from topic <code className="font-mono font-bold text-[#16191f]">{selectedSub.topicName}</code>.
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
