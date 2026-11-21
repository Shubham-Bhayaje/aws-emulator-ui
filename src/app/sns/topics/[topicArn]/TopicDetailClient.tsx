"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TopicDetail,
  SubscriptionSummary,
  SqsQueueOption,
  LambdaFunctionOption,
} from "../../types";
import {
  deleteTopicAction,
  createSubscriptionAction,
  unsubscribeAction,
  tagTopicAction,
  untagTopicAction,
} from "../../actions";

interface TopicDetailClientProps {
  topic: TopicDetail;
  initialSubscriptions: SubscriptionSummary[];
  sqsQueues: SqsQueueOption[];
  lambdaFunctions: LambdaFunctionOption[];
}

export default function TopicDetailClient({
  topic,
  initialSubscriptions,
  sqsQueues,
  lambdaFunctions,
}: TopicDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "details" | "subscriptions" | "encryption" | "access-policy" | "delivery-policy" | "logging" | "tags"
  >("details");

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>(initialSubscriptions);
  const [selectedSubArn, setSelectedSubArn] = useState<string | null>(null);
  const [showCreateSubModal, setShowCreateSubModal] = useState(false);
  const [subProtocol, setSubProtocol] = useState("sqs");
  const [subEndpoint, setSubEndpoint] = useState("");
  const [subRawDelivery, setSubRawDelivery] = useState(false);
  const [isCreatingSub, setIsCreatingSub] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  // Tags State
  const [tags, setTags] = useState<Record<string, string>>(topic.tags || {});
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);

  // Delete Topic Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [copiedArn, setCopiedArn] = useState(false);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedArn(true);
    setTimeout(() => setCopiedArn(false), 2000);
  }

  async function handleDeleteTopic() {
    setIsDeleting(true);
    setDeleteError(null);
    const res = await deleteTopicAction(topic.arn);
    setIsDeleting(false);

    if (res.success) {
      router.push("/sns/topics");
    } else {
      setDeleteError(res.error || "Failed to delete topic");
    }
  }

  async function handleCreateSubscription(e: React.FormEvent) {
    e.preventDefault();
    setSubError(null);

    let finalEndpoint = subEndpoint.trim();
    if (!finalEndpoint) {
      setSubError("Endpoint is required.");
      return;
    }

    setIsCreatingSub(true);
    const res = await createSubscriptionAction({
      topicArn: topic.arn,
      protocol: subProtocol,
      endpoint: finalEndpoint,
      rawMessageDelivery: subRawDelivery,
    });
    setIsCreatingSub(false);

    if (res.success && res.subscriptionArn) {
      setSubscriptions((prev) => [
        ...prev,
        {
          arn: res.subscriptionArn || "PendingConfirmation",
          protocol: subProtocol,
          endpoint: finalEndpoint,
          topicArn: topic.arn,
          topicName: topic.name,
          status: res.subscriptionArn === "PendingConfirmation" ? "PendingConfirmation" : "Confirmed",
          owner: topic.owner,
        },
      ]);
      setShowCreateSubModal(false);
      setSubEndpoint("");
    } else {
      setSubError(res.error || "Failed to create subscription");
    }
  }

  async function handleUnsubscribe() {
    if (!selectedSubArn) return;
    const res = await unsubscribeAction(selectedSubArn);
    if (res.success) {
      setSubscriptions((prev) => prev.filter((s) => s.arn !== selectedSubArn));
      setSelectedSubArn(null);
    }
  }

  async function handleSaveTag() {
    if (!tagKey.trim()) return;
    setIsUpdatingTags(true);
    const newTags = { ...tags, [tagKey.trim()]: tagValue.trim() };
    const res = await tagTopicAction(topic.arn, newTags);
    setIsUpdatingTags(false);
    if (res.success) {
      setTags(newTags);
      setTagKey("");
      setTagValue("");
      setShowTagModal(false);
    }
  }

  async function handleRemoveTag(k: string) {
    setIsUpdatingTags(true);
    const res = await untagTopicAction(topic.arn, [k]);
    setIsUpdatingTags(false);
    if (res.success) {
      const updated = { ...tags };
      delete updated[k];
      setTags(updated);
    }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Breadcrumbs */}
      <div className="text-[13px] text-[#545b64] flex items-center gap-2">
        <Link href="/sns" className="text-[#0073bb] hover:underline">
          Amazon SNS
        </Link>
        <span>/</span>
        <Link href="/sns/topics" className="text-[#0073bb] hover:underline">
          Topics
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-medium">{topic.name}</span>
      </div>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-[#16191f]">{topic.name}</h1>
          <span
            className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
              topic.type === "FIFO"
                ? "bg-[#ede7f6] text-[#512da8] border-[#d1c4e9]"
                : "bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]"
            }`}
          >
            {topic.type}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/sns/topics/${encodeURIComponent(topic.arn)}/publish`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-4 font-bold text-[13px] bg-[#ec7211] text-white rounded hover:bg-[#eb5f07] transition-colors"
          >
            Publish message
          </Link>
          <Link
            href={`/sns/topics/${encodeURIComponent(topic.arn)}/edit`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-4 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setDeleteConfirmText("");
              setShowDeleteModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 border border-[#d13212] rounded text-[13px] font-medium text-[#d13212] hover:bg-[#fdf3f1] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-6 border-b border-[#eaeded] text-[13px] font-semibold">
        {[
          { id: "details", label: "Details" },
          { id: "subscriptions", label: `Subscriptions (${subscriptions.length})` },
          { id: "encryption", label: "Encryption" },
          { id: "access-policy", label: "Access policy" },
          { id: "delivery-policy", label: "Delivery policy (HTTP/S)" },
          { id: "logging", label: "Delivery status logging" },
          { id: "tags", label: `Tags (${Object.keys(tags).length})` },
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
            Topic details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Name</div>
              <div className="font-semibold text-[#16191f] mt-1">{topic.name}</div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Type</div>
              <div className="mt-1 font-semibold text-[#16191f]">{topic.type}</div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Topic ARN</div>
              <div className="mt-1 flex items-center gap-2 font-mono text-[12px] text-[#16191f]">
                <span className="truncate" title={topic.arn}>{topic.arn}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(topic.arn)}
                  className="text-[#0073bb] hover:underline text-[11px]"
                >
                  {copiedArn ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Display name</div>
              <div className="mt-1 text-[#16191f]">{topic.displayName || "-"}</div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Topic owner</div>
              <div className="mt-1 font-mono text-[12px] text-[#16191f]">{topic.owner || "000000000000"}</div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Subscriptions confirmed</div>
              <div className="mt-1 text-[#16191f] font-semibold">{topic.subscriptionsConfirmed}</div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">Subscriptions pending</div>
              <div className="mt-1 text-[#16191f]">{topic.subscriptionsPending}</div>
            </div>

            {topic.type === "FIFO" && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
                  Content-based message deduplication
                </div>
                <div className="mt-1 text-[#16191f]">
                  {topic.contentBasedDeduplication ? "Enabled" : "Disabled"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Subscriptions */}
      {activeTab === "subscriptions" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm">
          <div className="p-4 border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Subscriptions</h2>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Subscriptions receive messages published to this topic.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={!selectedSubArn}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-3 border border-[#d13212] rounded text-[13px] font-medium text-[#d13212] hover:bg-[#fdf3f1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Delete subscription
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubError(null);
                  setSubEndpoint("");
                  setShowCreateSubModal(true);
                }}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 font-bold text-[13px] bg-[#ec7211] text-white rounded hover:bg-[#eb5f07] transition-colors"
              >
                Create subscription
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#16191f]">
              <thead className="bg-[#f2f3f3] text-[11px] font-bold uppercase tracking-wider text-[#545b64] border-b border-[#eaeded]">
                <tr>
                  <th className="w-10 px-4 py-2.5 text-center"></th>
                  <th className="px-4 py-2.5">Protocol</th>
                  <th className="px-4 py-2.5">Endpoint</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Subscription ARN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[#545b64]">
                      No subscriptions found for this topic. Create a subscription to begin fanout.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const isSelected = selectedSubArn === sub.arn;
                    return (
                      <tr
                        key={sub.arn}
                        onClick={() => setSelectedSubArn(sub.arn)}
                        className={`cursor-pointer hover:bg-[#f8f9fa] ${
                          isSelected ? "bg-[#f1faff]" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            name="selectedSub"
                            checked={isSelected}
                            onChange={() => setSelectedSubArn(sub.arn)}
                            className="text-[#ec7211] focus:ring-[#ec7211]"
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold uppercase">{sub.protocol}</td>
                        <td className="px-4 py-3 font-mono text-[12px] truncate max-w-xs" title={sub.endpoint}>
                          {sub.endpoint}
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
                        <td className="px-4 py-3 text-[#545b64] font-mono text-[12px] truncate max-w-[280px]" title={sub.arn}>
                          {sub.arn}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Encryption */}
      {activeTab === "encryption" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Server-side encryption (SSE)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
                Encryption status
              </div>
              <div className="mt-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                    topic.kmsMasterKeyId
                      ? "bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]"
                      : "bg-[#f2f3f3] text-[#545b64] border-[#d5dbdb]"
                  }`}
                >
                  {topic.kmsMasterKeyId ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
                AWS KMS key
              </div>
              <div className="mt-1 font-mono text-[12px] text-[#16191f]">
                {topic.kmsMasterKeyId || "None (messages stored in plaintext)"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Access Policy */}
      {activeTab === "access-policy" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Access policy</h2>
            <Link
              href={`/sns/topics/${encodeURIComponent(topic.arn)}/edit`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center px-3 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
            >
              Edit policy
            </Link>
          </div>
          <pre className="p-4 bg-[#f8f9fa] border border-[#eaeded] rounded font-mono text-[12px] text-[#16191f] overflow-x-auto whitespace-pre-wrap">
            {topic.policy
              ? JSON.stringify(JSON.parse(topic.policy), null, 2)
              : "No access policy configured."}
          </pre>
        </div>
      )}

      {/* Tab 5: Delivery Policy (HTTP/S) */}
      {activeTab === "delivery-policy" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Delivery policy (HTTP/S)
          </h2>
          <pre className="p-4 bg-[#f8f9fa] border border-[#eaeded] rounded font-mono text-[12px] text-[#16191f] overflow-x-auto whitespace-pre-wrap">
            {topic.effectiveDeliveryPolicy
              ? JSON.stringify(JSON.parse(topic.effectiveDeliveryPolicy), null, 2)
              : topic.deliveryPolicy
              ? JSON.stringify(JSON.parse(topic.deliveryPolicy), null, 2)
              : "Default retry policy active."}
          </pre>
        </div>
      )}

      {/* Tab 6: Delivery Status Logging */}
      {activeTab === "logging" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Delivery status logging
          </h2>
          <p className="text-[13px] text-[#545b64]">
            Send notification delivery logs to Amazon CloudWatch Logs for message troubleshooting and delivery auditing.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa]">
              <div className="text-[13px] font-bold text-[#16191f]">Amazon SQS</div>
              <div className="text-[12px] text-[#545b64] mt-1">Delivery logging: Disabled</div>
            </div>
            <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa]">
              <div className="text-[13px] font-bold text-[#16191f]">AWS Lambda</div>
              <div className="text-[12px] text-[#545b64] mt-1">Delivery logging: Disabled</div>
            </div>
            <div className="p-4 border border-[#eaeded] rounded bg-[#fafafa]">
              <div className="text-[13px] font-bold text-[#16191f]">HTTP/HTTPS</div>
              <div className="text-[12px] text-[#545b64] mt-1">Delivery logging: Disabled</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
              <p className="text-[12px] text-[#545b64]">
                A tag is a label that you assign to an AWS resource.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTagModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
            >
              Add tag
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#16191f]">
              <thead className="bg-[#f2f3f3] text-[11px] font-bold uppercase tracking-wider text-[#545b64] border-b border-[#eaeded]">
                <tr>
                  <th className="px-4 py-2.5">Key</th>
                  <th className="px-4 py-2.5">Value</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {Object.keys(tags).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-[#545b64]">
                      No tags attached to this topic.
                    </td>
                  </tr>
                ) : (
                  Object.entries(tags).map(([k, v]) => (
                    <tr key={k} className="hover:bg-[#f8f9fa]">
                      <td className="px-4 py-3 font-semibold">{k}</td>
                      <td className="px-4 py-3 text-[#545b64]">{v || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(k)}
                          disabled={isUpdatingTags}
                          className="text-[#d13212] hover:underline text-[12px]"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Subscription Modal */}
      {showCreateSubModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create subscription</h3>

            {subError && (
              <div className="p-3 rounded bg-[#fdf3f1] border border-[#d13212] text-[13px] text-[#d13212]">
                {subError}
              </div>
            )}

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[13px] font-bold text-[#16191f]">Topic ARN</label>
                <input
                  type="text"
                  disabled
                  value={topic.arn}
                  className="w-full text-[12px] font-mono px-3 py-1.5 bg-[#f2f3f3] border border-[#d5dbdb] rounded text-[#545b64]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[13px] font-bold text-[#16191f]">
                  Protocol <span className="text-[#d13212]">*</span>
                </label>
                <select
                  value={subProtocol}
                  onChange={(e) => {
                    setSubProtocol(e.target.value);
                    setSubEndpoint("");
                  }}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                >
                  <option value="sqs">Amazon SQS</option>
                  <option value="lambda">AWS Lambda</option>
                  <option value="email">Email</option>
                  <option value="email-json">Email-JSON</option>
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              {/* Dynamic Endpoint Input based on Protocol */}
              <div className="space-y-1">
                <label className="block text-[13px] font-bold text-[#16191f]">
                  Endpoint <span className="text-[#d13212]">*</span>
                </label>

                {subProtocol === "sqs" ? (
                  sqsQueues.length > 0 ? (
                    <select
                      value={subEndpoint}
                      onChange={(e) => setSubEndpoint(e.target.value)}
                      className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                    >
                      <option value="">-- Select an SQS Queue --</option>
                      {sqsQueues.map((q) => (
                        <option key={q.url} value={q.arn}>
                          {q.name} ({q.isFifo ? "FIFO" : "Standard"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="arn:aws:sqs:us-east-1:000000000000:my-queue"
                        value={subEndpoint}
                        onChange={(e) => setSubEndpoint(e.target.value)}
                        className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                      />
                      <p className="text-[11px] text-[#545b64]">
                        No SQS queues detected. Create one at{" "}
                        <Link href="/sqs/create" className="text-[#0073bb] underline">
                          SQS console
                        </Link>{" "}
                        or enter ARN manually.
                      </p>
                    </div>
                  )
                ) : subProtocol === "lambda" ? (
                  lambdaFunctions.length > 0 ? (
                    <select
                      value={subEndpoint}
                      onChange={(e) => setSubEndpoint(e.target.value)}
                      className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                    >
                      <option value="">-- Select a Lambda Function --</option>
                      {lambdaFunctions.map((f) => (
                        <option key={f.functionArn} value={f.functionArn}>
                          {f.functionName} ({f.runtime || "Custom"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="arn:aws:lambda:us-east-1:000000000000:function:my-func"
                        value={subEndpoint}
                        onChange={(e) => setSubEndpoint(e.target.value)}
                        className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                      />
                      <p className="text-[11px] text-[#545b64]">
                        No Lambda functions detected. Create one at{" "}
                        <Link href="/lambda" className="text-[#0073bb] underline">
                          Lambda console
                        </Link>{" "}
                        or enter ARN manually.
                      </p>
                    </div>
                  )
                ) : (
                  <input
                    type={
                      subProtocol === "email" || subProtocol === "email-json"
                        ? "email"
                        : subProtocol === "http" || subProtocol === "https"
                        ? "url"
                        : "text"
                    }
                    placeholder={
                      subProtocol === "email" || subProtocol === "email-json"
                        ? "user@example.com"
                        : subProtocol === "http"
                        ? "http://api.example.com/webhook"
                        : subProtocol === "https"
                        ? "https://api.example.com/webhook"
                        : "+15551234567"
                    }
                    value={subEndpoint}
                    onChange={(e) => setSubEndpoint(e.target.value)}
                    className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                  />
                )}
              </div>

              {(subProtocol === "sqs" || subProtocol === "http" || subProtocol === "https") && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="modalRawDelivery"
                    checked={subRawDelivery}
                    onChange={(e) => setSubRawDelivery(e.target.checked)}
                    className="text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <label htmlFor="modalRawDelivery" className="text-[13px] text-[#16191f] cursor-pointer">
                    Enable raw message delivery
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateSubModal(false)}
                  disabled={isCreatingSub}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSub || !subEndpoint.trim()}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 bg-[#ec7211] text-white rounded text-[13px] font-bold hover:bg-[#eb5f07] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreatingSub ? "Creating..." : "Create subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-[18px] font-bold text-[#16191f]">Add tag</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[13px] font-bold text-[#16191f]">Key</label>
                <input
                  type="text"
                  placeholder="e.g. Environment"
                  value={tagKey}
                  onChange={(e) => setTagKey(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] mt-1"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#16191f]">Value</label>
                <input
                  type="text"
                  placeholder="e.g. Production"
                  value={tagValue}
                  onChange={(e) => setTagValue(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] mt-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTagModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTag}
                disabled={isUpdatingTags || !tagKey.trim()}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#ec7211] text-white rounded text-[13px] font-bold hover:bg-[#eb5f07] disabled:opacity-40 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Topic Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete topic &ldquo;{topic.name}&rdquo;?
            </h3>

            <div className="p-3 rounded bg-[#fdf3f1] border border-[#d13212] text-[13px] text-[#d13212] space-y-1">
              <p className="font-bold">Permanent deletion warning</p>
              <p>
                Deleting this topic is irreversible. All subscribers will stop receiving messages published to this topic.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded bg-[#fdf3f1] border border-[#d13212] text-[13px] text-[#d13212]">
                {deleteError}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-[#16191f]">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1.5 py-0.5 rounded font-mono font-bold text-[#16191f]">{topic.name}</code> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={topic.name}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#d13212]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTopic}
                disabled={deleteConfirmText !== topic.name || isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#d13212] text-white rounded text-[13px] font-bold hover:bg-[#b02a0f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
