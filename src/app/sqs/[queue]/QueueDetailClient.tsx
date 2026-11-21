"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SQSMessageItem,
  SQSMessageAttribute,
  KmsKeyOption,
  LambdaFunctionOption,
  QueueSummary,
} from "../types";
import {
  sendMessageAction,
  receiveMessagesAction,
  deleteMessageAction,
  deleteQueuesAction,
  purgeQueuesAction,
  updateQueueAttributesAction,
  startMessageMoveTaskAction,
} from "../actions";
import { createSubscriptionAction } from "@/app/sns/actions";

interface QueueDetailClientProps {
  queueUrl: string;
  queueName: string;
  isFifo: boolean;
  attributes: Record<string, string>;
  initialTags: Record<string, string>;
  kmsKeys: KmsKeyOption[];
  lambdaFunctions: LambdaFunctionOption[];
  siblingQueues: QueueSummary[];
  snsTopics?: Array<{ arn: string; name: string }>;
}

export default function QueueDetailClient({
  queueUrl,
  queueName,
  isFifo,
  attributes,
  initialTags,
  kmsKeys,
  lambdaFunctions,
  siblingQueues,
  snsTopics = [],
}: QueueDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State
  const initialTab =
    searchParams.get("tab") === "send-receive"
      ? "send-receive"
      : searchParams.get("tab") === "monitoring"
      ? "monitoring"
      : "details";

  const [activeTab, setActiveTab] = useState<
    | "details"
    | "send-receive"
    | "monitoring"
    | "encryption"
    | "policy"
    | "redrive"
    | "dlq-redrive"
    | "tags"
    | "sns"
    | "lambda"
  >(initialTab as any);

  // Status Banners
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Send Message State
  const [messageBody, setMessageBody] = useState("");
  const [sendDelaySeconds, setSendDelaySeconds] = useState(0);
  const [messageGroupId, setMessageGroupId] = useState("default-group");
  const [messageDeduplicationId, setMessageDeduplicationId] = useState("");
  const [messageAttributesList, setMessageAttributesList] = useState<SQSMessageAttribute[]>([]);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrType, setNewAttrType] = useState<"String" | "Number" | "Binary">("String");
  const [newAttrValue, setNewAttrValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Receive Message State
  const [pollDuration, setPollDuration] = useState(5);
  const [pollMaxMessages, setPollMaxMessages] = useState(10);
  const [isPolling, setIsPolling] = useState(false);
  const [receivedMessages, setReceivedMessages] = useState<SQSMessageItem[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<SQSMessageItem | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);

  // Modals
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgeConfirmInput, setPurgeConfirmInput] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Tags State
  const [tags, setTags] = useState<{ key: string; value: string }[]>(
    Object.entries(initialTags).map(([key, value]) => ({ key, value }))
  );
  const [manageTagsModalOpen, setManageTagsModalOpen] = useState(false);
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");

  // DLQ Redrive State
  const [dlqRedriveModalOpen, setDlqRedriveModalOpen] = useState(false);
  const [dlqTargetArn, setDlqTargetArn] = useState("");
  const [isRedriving, setIsRedriving] = useState(false);

  // Lambda Trigger State
  const [lambdaModalOpen, setLambdaModalOpen] = useState(false);
  const [selectedLambdaArn, setSelectedLambdaArn] = useState("");

  // SNS Subscription State
  const [snsModalOpen, setSnsModalOpen] = useState(false);
  const [selectedSnsArn, setSelectedSnsArn] = useState("");
  const [isSubscribingSns, setIsSubscribingSns] = useState(false);
  const [subscribedSnsList, setSubscribedSnsList] = useState<
    Array<{ topicArn: string; subscriptionArn: string }>
  >([]);

  async function handleSubscribeSns() {
    if (!selectedSnsArn) return;
    setIsSubscribingSns(true);
    const res = await createSubscriptionAction({
      topicArn: selectedSnsArn,
      protocol: "sqs",
      endpoint: queueArn,
    });
    setIsSubscribingSns(false);

    if (res.success && res.subscriptionArn) {
      setSubscribedSnsList((prev) => [
        ...prev,
        { topicArn: selectedSnsArn, subscriptionArn: res.subscriptionArn || "" },
      ]);
      setSuccessMessage("Successfully subscribed queue to Amazon SNS topic.");
      setSnsModalOpen(false);
      setSelectedSnsArn("");
    } else {
      setErrorMessage(res.error || "Failed to subscribe to SNS topic.");
    }
  }

  // Formatting helpers
  const queueArn = attributes.QueueArn || `arn:aws:sqs:us-east-1:000000000000:${queueName}`;
  const messagesAvailable = parseInt(attributes.ApproximateNumberOfMessages || "0", 10);
  const messagesInFlight = parseInt(attributes.ApproximateNumberOfMessagesNotVisible || "0", 10);
  const messagesDelayed = parseInt(attributes.ApproximateNumberOfMessagesDelayed || "0", 10);

  function formatDate(timestamp?: string) {
    if (!timestamp) return "—";
    try {
      const d = new Date(parseInt(timestamp, 10) * 1000);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  }

  function formatBytes(bytesStr?: string) {
    if (!bytesStr) return "256 KB";
    const bytes = parseInt(bytesStr, 10);
    return Math.round(bytes / 1024) + " KB";
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  // Action: Add Message Attribute
  function handleAddMessageAttribute() {
    if (!newAttrName.trim()) return;
    setMessageAttributesList((prev) => [
      ...prev,
      { name: newAttrName.trim(), type: newAttrType, value: newAttrValue.trim() },
    ]);
    setNewAttrName("");
    setNewAttrValue("");
  }

  function handleRemoveMessageAttribute(idx: number) {
    setMessageAttributesList((prev) => prev.filter((_, i) => i !== idx));
  }

  // Action: Send Message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageBody.trim()) return;

    setIsSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const messageAttributesMap: Record<string, { DataType: string; StringValue: string }> = {};
    for (const a of messageAttributesList) {
      messageAttributesMap[a.name] = { DataType: a.type, StringValue: a.value };
    }

    const res = await sendMessageAction({
      queueUrl,
      messageBody,
      delaySeconds: sendDelaySeconds,
      messageGroupId: isFifo ? messageGroupId : undefined,
      messageDeduplicationId: isFifo && messageDeduplicationId ? messageDeduplicationId : undefined,
      messageAttributes:
        Object.keys(messageAttributesMap).length > 0 ? messageAttributesMap : undefined,
    });

    setIsSending(false);

    if (res.success && res.messageId) {
      setSuccessMessage(
        `Message sent successfully. Message ID: ${res.messageId}${
          res.sequenceNumber ? ` (Sequence: ${res.sequenceNumber})` : ""
        }`
      );
      setMessageBody("");
      setMessageDeduplicationId("");
      setMessageAttributesList([]);
    } else {
      setErrorMessage(res.error || "Failed to send message.");
    }
  }

  // Action: Poll for Messages
  async function handlePollMessages() {
    setIsPolling(true);
    setErrorMessage(null);

    const res = await receiveMessagesAction(queueUrl, pollMaxMessages, pollDuration);
    setIsPolling(false);

    if (res.success) {
      setReceivedMessages(res.messages);
      if (res.messages.length === 0) {
        setSuccessMessage("Polling finished. No messages were returned from the queue.");
      } else {
        setSuccessMessage(`Received ${res.messages.length} message(s).`);
      }
    } else {
      setErrorMessage(res.error || "Failed to poll messages.");
    }
  }

  // Action: Delete Message
  async function handleDeleteMessage(receiptHandle: string, messageId: string) {
    setIsDeletingMessage(true);
    setErrorMessage(null);

    const res = await deleteMessageAction(queueUrl, receiptHandle);
    setIsDeletingMessage(false);

    if (res.success) {
      setReceivedMessages((prev) => prev.filter((m) => m.messageId !== messageId));
      if (selectedMessage?.messageId === messageId) {
        setMessageModalOpen(false);
        setSelectedMessage(null);
      }
      setSuccessMessage(`Message ${messageId.slice(0, 8)}... deleted successfully.`);
    } else {
      setErrorMessage(res.error || "Failed to delete message.");
    }
  }

  // Action: Purge Queue
  async function handlePurgeConfirm() {
    if (purgeConfirmInput.toLowerCase() !== "purge") return;
    setIsProcessingAction(true);
    setErrorMessage(null);

    const res = await purgeQueuesAction([queueUrl]);
    setIsProcessingAction(false);

    if (res.success) {
      setSuccessMessage(`Queue ${queueName} was successfully purged.`);
      setPurgeModalOpen(false);
      setPurgeConfirmInput("");
      setReceivedMessages([]);
    } else {
      setErrorMessage(res.error || "Failed to purge queue.");
    }
  }

  // Action: Delete Queue
  async function handleDeleteConfirm() {
    if (deleteConfirmInput.toLowerCase() !== "delete") return;
    setIsProcessingAction(true);
    setErrorMessage(null);

    const res = await deleteQueuesAction([queueUrl]);
    setIsProcessingAction(false);

    if (res.success) {
      router.push("/sqs");
    } else {
      setErrorMessage(res.error || "Failed to delete queue.");
    }
  }

  // Action: Manage Tags
  async function handleSaveTags() {
    setIsProcessingAction(true);
    setErrorMessage(null);

    const tagsMap: Record<string, string> = {};
    for (const t of tags) {
      tagsMap[t.key] = t.value;
    }

    const removedKeys = Object.keys(initialTags).filter((k) => !tagsMap[k]);

    const res = await updateQueueAttributesAction(queueUrl, {}, tagsMap, removedKeys);
    setIsProcessingAction(false);

    if (res.success) {
      setSuccessMessage("Tags updated successfully.");
      setManageTagsModalOpen(false);
    } else {
      setErrorMessage(res.error || "Failed to update tags.");
    }
  }

  // Action: Start DLQ Redrive
  async function handleStartRedrive() {
    setIsRedriving(true);
    setErrorMessage(null);

    const res = await startMessageMoveTaskAction(queueArn, dlqTargetArn || undefined);
    setIsRedriving(false);

    if (res.success) {
      setSuccessMessage("Dead-letter queue redrive task initiated successfully.");
      setDlqRedriveModalOpen(false);
    } else {
      setErrorMessage(res.error || "Failed to start message move task.");
    }
  }

  const tabs = [
    { id: "details", label: "Details" },
    { id: "send-receive", label: "Send and receive messages" },
    { id: "monitoring", label: "Monitoring" },
    { id: "encryption", label: "Encryption" },
    { id: "policy", label: "Access policy" },
    { id: "redrive", label: "Redrive policy (DLQ)" },
    { id: "dlq-redrive", label: "Dead-letter queue redrive" },
    { id: "tags", label: `Tags (${tags.length})` },
    { id: "sns", label: "SNS subscriptions" },
    { id: "lambda", label: "Lambda triggers" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-[12px] text-[#545b64]">
        <Link href="/sqs" className="hover:text-[#0073bb]">
          Queues
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-medium">{queueName}</span>
      </div>

      {/* Header Summary Bar & Quick Actions */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-[#16191f]">{queueName}</h1>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  isFifo
                    ? "bg-[#e9f3f4] text-[#0073bb] border-[#0073bb]/30"
                    : "bg-[#f2f3f3] text-[#545b64] border-[#d5dbdb]"
                }`}
              >
                {isFifo ? "FIFO" : "Standard"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#545b64] mt-1 font-mono">
              <span className="flex items-center gap-1">
                ARN: <span className="select-all">{queueArn}</span>
                <button
                  onClick={() => copyToClipboard(queueArn, "arn")}
                  className="text-[#0073bb] hover:underline font-sans ml-1"
                >
                  {copiedKey === "arn" ? "Copied" : "Copy"}
                </button>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                URL: <span className="select-all">{queueUrl}</span>
                <button
                  onClick={() => copyToClipboard(queueUrl, "url")}
                  className="text-[#0073bb] hover:underline font-sans ml-1"
                >
                  {copiedKey === "url" ? "Copied" : "Copy"}
                </button>
              </span>
            </div>
          </div>

          {/* Quick Actions (Strict 32px height) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("send-receive")}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
            >
              Send and receive messages
            </button>

            <Link
              href={`/sqs/${encodeURIComponent(queueName)}/edit`}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
            >
              Edit
            </Link>

            <button
              onClick={() => {
                setPurgeConfirmInput("");
                setPurgeModalOpen(true);
              }}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
            >
              Purge
            </button>

            <button
              onClick={() => {
                setDeleteConfirmInput("");
                setDeleteModalOpen(true);
              }}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#d13212] text-[#d13212] bg-white hover:bg-[#fdf3f2] transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#eaeded]">
          <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
            <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
              Messages Available
            </div>
            <div className="text-[20px] font-bold text-[#16191f] mt-0.5">
              {messagesAvailable.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
            <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
              Messages in Flight
            </div>
            <div className="text-[20px] font-bold text-[#16191f] mt-0.5">
              {messagesInFlight.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
            <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
              Messages Delayed
            </div>
            <div className="text-[20px] font-bold text-[#16191f] mt-0.5">
              {messagesDelayed.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {successMessage && (
        <div className="bg-[#f2f8f0] border border-[#1d8102] rounded p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-[#1d8102] hover:underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#fdf3f2] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[#d13212] hover:underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-[#eaeded] flex overflow-x-auto bg-[#fafafa]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-[#ec7211] text-[#ec7211] bg-white"
                  : "border-transparent text-[#545b64] hover:text-[#16191f] hover:bg-[#f2f3f3]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB 1: Details */}
          {activeTab === "details" && (
            <div className="space-y-6">
              <h3 className="text-[16px] font-bold text-[#16191f]">Queue configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-[13px]">
                <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                  <div className="text-[12px] text-[#545b64]">Type</div>
                  <div className="font-semibold text-[#16191f] mt-0.5">
                    {isFifo ? "FIFO (First-In-First-Out)" : "Standard"}
                  </div>
                </div>
                <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                  <div className="text-[12px] text-[#545b64]">Created</div>
                  <div className="font-semibold text-[#16191f] mt-0.5">
                    {formatDate(attributes.CreatedTimestamp)}
                  </div>
                </div>
                <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                  <div className="text-[12px] text-[#545b64]">Last modified</div>
                  <div className="font-semibold text-[#16191f] mt-0.5">
                    {formatDate(attributes.LastModifiedTimestamp)}
                  </div>
                </div>
                <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                  <div className="text-[12px] text-[#545b64]">Visibility timeout</div>
                  <div className="font-semibold text-[#16191f] mt-0.5">
                    {attributes.VisibilityTimeout || "30"} seconds
                  </div>
                </div>
                <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                  <div className="text-[12px] text-[#545b64]">Delivery delay</div>
                  <div className="font-semibold text-[#16191f] mt-0.5">
                    {attributes.DelaySeconds || "0"} seconds
                  </div>
                </div>
                <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                  <div className="text-[12px] text-[#545b64]">Message retention period</div>
                  <div className="font-semibold text-[#16191f] mt-0.5">
                    {Math.round(parseInt(attributes.MessageRetentionPeriod || "345600", 10) / 86400)}{" "}
                    days ({attributes.MessageRetentionPeriod || "345600"} seconds)
                  </div>
                </div>
                <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                  <div className="text-[12px] text-[#545b64]">Maximum message size</div>
                  <div className="font-semibold text-[#16191f] mt-0.5">
                    {formatBytes(attributes.MaximumMessageSize)}
                  </div>
                </div>
                <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                  <div className="text-[12px] text-[#545b64]">Receive message wait time</div>
                  <div className="font-semibold text-[#16191f] mt-0.5">
                    {attributes.ReceiveMessageWaitTimeSeconds || "0"} seconds
                  </div>
                </div>
                {isFifo && (
                  <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                    <div className="text-[12px] text-[#545b64]">Content-based deduplication</div>
                    <div className="font-semibold text-[#16191f] mt-0.5">
                      {attributes.ContentBasedDeduplication === "true" ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Send and receive messages */}
          {activeTab === "send-receive" && (
            <div className="space-y-8">
              {/* Send message section */}
              <div className="bg-[#fafafa] border border-[#eaeded] rounded p-6 space-y-4">
                <div className="border-b border-[#eaeded] pb-2">
                  <h3 className="text-[16px] font-bold text-[#16191f]">Send a message</h3>
                  <p className="text-[13px] text-[#545b64] mt-0.5">
                    Publish a message to this queue with optional delivery delay, attributes, and
                    FIFO parameters.
                  </p>
                </div>

                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                      Message body <span className="text-[#d13212]">*</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Type or paste message payload (JSON, text, XML)..."
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      className="w-full border border-[#aab7b8] rounded p-3 font-mono text-[13px] focus:outline-none focus:border-[#ec7211]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                        Delivery delay (seconds)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="900"
                        value={sendDelaySeconds}
                        onChange={(e) => setSendDelaySeconds(Number(e.target.value))}
                        className="w-32 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                      />
                    </div>

                    {isFifo && (
                      <>
                        <div>
                          <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                            Message group ID <span className="text-[#d13212]">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. order-processing"
                            value={messageGroupId}
                            onChange={(e) => setMessageGroupId(e.target.value)}
                            className="w-full max-w-xs border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                            required={isFifo}
                          />
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                            Message deduplication ID
                          </label>
                          <input
                            type="text"
                            placeholder="Optional unique ID"
                            value={messageDeduplicationId}
                            onChange={(e) => setMessageDeduplicationId(e.target.value)}
                            className="w-full max-w-xs border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Message Attributes Sub-section */}
                  <div className="space-y-3 pt-2">
                    <div className="text-[13px] font-semibold text-[#16191f]">
                      Message attributes (Optional metadata)
                    </div>

                    {messageAttributesList.length > 0 && (
                      <div className="border border-[#eaeded] rounded overflow-hidden max-w-xl">
                        <table className="w-full text-left text-[12px]">
                          <thead>
                            <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                              <th className="py-2 px-3">Name</th>
                              <th className="py-2 px-3">Type</th>
                              <th className="py-2 px-3">Value</th>
                              <th className="py-2 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#eaeded]">
                            {messageAttributesList.map((a, idx) => (
                              <tr key={idx}>
                                <td className="py-2 px-3 font-medium text-[#16191f]">{a.name}</td>
                                <td className="py-2 px-3 text-[#545b64]">{a.type}</td>
                                <td className="py-2 px-3 text-[#16191f] font-mono">{a.value}</td>
                                <td className="py-2 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMessageAttribute(idx)}
                                    className="text-[#d13212] hover:underline font-semibold"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 max-w-xl">
                      <input
                        type="text"
                        placeholder="Attribute name"
                        value={newAttrName}
                        onChange={(e) => setNewAttrName(e.target.value)}
                        className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                      />
                      <select
                        value={newAttrType}
                        onChange={(e) => setNewAttrType(e.target.value as any)}
                        className="border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white"
                      >
                        <option value="String">String</option>
                        <option value="Number">Number</option>
                        <option value="Binary">Binary</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Value"
                        value={newAttrValue}
                        onChange={(e) => setNewAttrValue(e.target.value)}
                        className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                      />
                      <button
                        type="button"
                        onClick={handleAddMessageAttribute}
                        style={{
                          height: "32px",
                          minHeight: "32px",
                          maxHeight: "32px",
                          whiteSpace: "nowrap",
                        }}
                        className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
                      >
                        Add attribute
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSending || !messageBody.trim()}
                      style={{
                        height: "32px",
                        minHeight: "32px",
                        maxHeight: "32px",
                        whiteSpace: "nowrap",
                      }}
                      className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
                    >
                      {isSending ? "Sending message..." : "Send message"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Receive / Poll messages section */}
              <div className="bg-[#fafafa] border border-[#eaeded] rounded p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#eaeded] pb-3">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#16191f]">Receive messages</h3>
                    <p className="text-[13px] text-[#545b64] mt-0.5">
                      Poll this queue to retrieve messages currently available for processing.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[13px]">
                      <span className="text-[#545b64]">Poll duration:</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={pollDuration}
                        onChange={(e) => setPollDuration(Number(e.target.value))}
                        className="w-16 border border-[#aab7b8] rounded px-2 py-1 text-[13px]"
                      />
                      <span className="text-[#545b64]">sec</span>
                    </div>

                    <button
                      onClick={handlePollMessages}
                      disabled={isPolling}
                      style={{
                        height: "32px",
                        minHeight: "32px",
                        maxHeight: "32px",
                        whiteSpace: "nowrap",
                      }}
                      className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
                    >
                      {isPolling ? "Polling..." : "Poll for messages"}
                    </button>
                  </div>
                </div>

                {isPolling && (
                  <div className="space-y-2">
                    <div className="text-[12px] text-[#545b64] flex items-center justify-between">
                      <span>Polling queue for messages ({pollDuration}s)...</span>
                    </div>
                    <div className="w-full bg-[#eaeded] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#ec7211] h-full w-full animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Messages Table */}
                <div className="overflow-x-auto border border-[#eaeded] rounded bg-white">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                        <th className="py-2.5 px-4">Message ID</th>
                        <th className="py-2.5 px-4">Sent timestamp</th>
                        <th className="py-2.5 px-4">Size</th>
                        <th className="py-2.5 px-4 text-right">Receive count</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {receivedMessages.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 px-4 text-center text-[#545b64]">
                            No messages received. Click <strong>Poll for messages</strong> to check
                            for available messages.
                          </td>
                        </tr>
                      ) : (
                        receivedMessages.map((msg) => (
                          <tr key={msg.messageId} className="hover:bg-[#fafafa]">
                            <td className="py-2.5 px-4 font-mono text-[11px] text-[#0073bb]">
                              <button
                                onClick={() => {
                                  setSelectedMessage(msg);
                                  setMessageModalOpen(true);
                                }}
                                className="hover:underline font-semibold"
                              >
                                {msg.messageId}
                              </button>
                            </td>
                            <td className="py-2.5 px-4 text-[#16191f]">{msg.sentTimestamp}</td>
                            <td className="py-2.5 px-4 text-[#545b64]">{msg.body.length} B</td>
                            <td className="py-2.5 px-4 text-right font-medium text-[#16191f]">
                              {msg.approximateReceiveCount || 1}
                            </td>
                            <td className="py-2.5 px-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedMessage(msg);
                                  setMessageModalOpen(true);
                                }}
                                className="text-[#0073bb] hover:underline font-semibold text-[12px]"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(msg.receiptHandle, msg.messageId)}
                                className="text-[#d13212] hover:underline font-semibold text-[12px]"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Monitoring */}
          {activeTab === "monitoring" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#16191f]">CloudWatch metrics</h3>
                  <p className="text-[13px] text-[#545b64] mt-0.5">
                    Operational metrics for queue depth, traffic volume, and message throughput.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-2">
                  <div className="text-[12px] font-semibold text-[#545b64]">
                    ApproximateNumberOfMessagesVisible
                  </div>
                  <div className="text-[24px] font-bold text-[#16191f]">
                    {messagesAvailable.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#545b64]">Messages available for retrieval</div>
                </div>

                <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-2">
                  <div className="text-[12px] font-semibold text-[#545b64]">
                    ApproximateNumberOfMessagesNotVisible
                  </div>
                  <div className="text-[24px] font-bold text-[#16191f]">
                    {messagesInFlight.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#545b64]">Messages currently in flight</div>
                </div>

                <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-2">
                  <div className="text-[12px] font-semibold text-[#545b64]">
                    ApproximateNumberOfMessagesDelayed
                  </div>
                  <div className="text-[24px] font-bold text-[#16191f]">
                    {messagesDelayed.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#545b64]">Messages delayed from delivery</div>
                </div>

                <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-2">
                  <div className="text-[12px] font-semibold text-[#545b64]">
                    NumberOfMessagesSent
                  </div>
                  <div className="text-[24px] font-bold text-[#16191f]">Active</div>
                  <div className="text-[11px] text-[#545b64]">Cumulative message traffic</div>
                </div>

                <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-2">
                  <div className="text-[12px] font-semibold text-[#545b64]">
                    NumberOfMessagesReceived
                  </div>
                  <div className="text-[24px] font-bold text-[#16191f]">Active</div>
                  <div className="text-[11px] text-[#545b64]">Consumer polling throughput</div>
                </div>

                <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-2">
                  <div className="text-[12px] font-semibold text-[#545b64]">
                    ApproximateAgeOfOldestMessage
                  </div>
                  <div className="text-[24px] font-bold text-[#16191f]">0s</div>
                  <div className="text-[11px] text-[#545b64]">Age of oldest message in seconds</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Encryption */}
          {activeTab === "encryption" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#16191f]">Encryption configuration</h3>
                  <p className="text-[13px] text-[#545b64] mt-0.5">
                    Server-side encryption protects messages in transit and at rest.
                  </p>
                </div>
                <Link
                  href={`/sqs/${encodeURIComponent(queueName)}/edit`}
                  style={{
                    height: "32px",
                    minHeight: "32px",
                    maxHeight: "32px",
                    whiteSpace: "nowrap",
                  }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
                >
                  Edit encryption
                </Link>
              </div>

              <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-3 text-[13px]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[12px] text-[#545b64]">Server-side encryption</div>
                    <div className="font-semibold text-[#16191f] mt-0.5">
                      {attributes.KmsMasterKeyId
                        ? "Enabled (AWS KMS)"
                        : attributes.SqsManagedSseEnabled === "true"
                        ? "Enabled (SSE-SQS)"
                        : "Disabled"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-[#545b64]">Encryption key type</div>
                    <div className="font-semibold text-[#16191f] mt-0.5">
                      {attributes.KmsMasterKeyId ? "SSE-KMS" : "SSE-SQS"}
                    </div>
                  </div>
                  {attributes.KmsMasterKeyId && (
                    <>
                      <div>
                        <div className="text-[12px] text-[#545b64]">Customer master key (CMK)</div>
                        <div className="font-mono text-[12px] text-[#16191f] mt-0.5 select-all">
                          {attributes.KmsMasterKeyId}
                        </div>
                      </div>
                      <div>
                        <div className="text-[12px] text-[#545b64]">Data key reuse period</div>
                        <div className="font-semibold text-[#16191f] mt-0.5">
                          {attributes.KmsDataKeyReusePeriodSeconds || "300"} seconds
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Access policy */}
          {activeTab === "policy" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#16191f]">Access policy</h3>
                  <p className="text-[13px] text-[#545b64] mt-0.5">
                    Resource-based policy controlling IAM permissions for this queue.
                  </p>
                </div>
                <Link
                  href={`/sqs/${encodeURIComponent(queueName)}/edit`}
                  style={{
                    height: "32px",
                    minHeight: "32px",
                    maxHeight: "32px",
                    whiteSpace: "nowrap",
                  }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
                >
                  Edit policy
                </Link>
              </div>

              <div className="bg-[#1e1e1e] text-[#d4d4d4] rounded p-4 font-mono text-[12px] overflow-x-auto">
                <pre>
                  {attributes.Policy
                    ? JSON.stringify(JSON.parse(attributes.Policy), null, 2)
                    : JSON.stringify(
                        {
                          Version: "2012-10-17",
                          Statement: [
                            {
                              Effect: "Allow",
                              Principal: { AWS: "arn:aws:iam::000000000000:root" },
                              Action: "sqs:*",
                              Resource: queueArn,
                            },
                          ],
                        },
                        null,
                        2
                      )}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 6: Redrive policy (DLQ) */}
          {activeTab === "redrive" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#16191f]">Dead-letter queue (DLQ)</h3>
                  <p className="text-[13px] text-[#545b64] mt-0.5">
                    Messages that fail delivery are routed to a dead-letter queue after maximum receives.
                  </p>
                </div>
                <Link
                  href={`/sqs/${encodeURIComponent(queueName)}/edit`}
                  style={{
                    height: "32px",
                    minHeight: "32px",
                    maxHeight: "32px",
                    whiteSpace: "nowrap",
                  }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
                >
                  Edit dead-letter queue
                </Link>
              </div>

              <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 text-[13px] space-y-3">
                {attributes.RedrivePolicy ? (
                  (() => {
                    try {
                      const redrive = JSON.parse(attributes.RedrivePolicy);
                      return (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[12px] text-[#545b64]">Status</div>
                            <div className="font-semibold text-[#1d8102] mt-0.5">Enabled</div>
                          </div>
                          <div>
                            <div className="text-[12px] text-[#545b64]">Maximum receives</div>
                            <div className="font-semibold text-[#16191f] mt-0.5">
                              {redrive.maxReceiveCount}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-[12px] text-[#545b64]">Dead-letter queue ARN</div>
                            <div className="font-mono text-[12px] text-[#16191f] mt-0.5 select-all">
                              {redrive.deadLetterTargetArn}
                            </div>
                          </div>
                        </div>
                      );
                    } catch {
                      return <div>Custom redrive policy configured.</div>;
                    }
                  })()
                ) : (
                  <div>
                    <div className="text-[12px] text-[#545b64]">Status</div>
                    <div className="font-semibold text-[#545b64] mt-0.5">Disabled</div>
                    <p className="text-[12px] text-[#545b64] mt-2">
                      A dead-letter queue is not currently configured for this queue.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: Dead-letter queue redrive */}
          {activeTab === "dlq-redrive" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#16191f]">Dead-letter queue redrive</h3>
                  <p className="text-[13px] text-[#545b64] mt-0.5">
                    Move messages from this dead-letter queue back to the source queue or a custom
                    destination.
                  </p>
                </div>
                <button
                  onClick={() => setDlqRedriveModalOpen(true)}
                  style={{
                    height: "32px",
                    minHeight: "32px",
                    maxHeight: "32px",
                    whiteSpace: "nowrap",
                  }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Start DLQ redrive
                </button>
              </div>

              <div className="bg-[#fafafa] border border-[#eaeded] rounded p-6 text-center space-y-3">
                <div className="text-[14px] font-bold text-[#16191f]">Message redrive management</div>
                <p className="text-[13px] text-[#545b64] max-w-xl mx-auto">
                  If this queue serves as a dead-letter queue, you can redrive messages to their source
                  queue after fixing consumer application issues.
                </p>
              </div>
            </div>
          )}

          {/* TAB 8: Tags */}
          {activeTab === "tags" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#16191f]">Tags</h3>
                  <p className="text-[13px] text-[#545b64] mt-0.5">
                    Key-value metadata assigned to this queue.
                  </p>
                </div>
                <button
                  onClick={() => setManageTagsModalOpen(true)}
                  style={{
                    height: "32px",
                    minHeight: "32px",
                    maxHeight: "32px",
                    whiteSpace: "nowrap",
                  }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
                >
                  Manage tags
                </button>
              </div>

              <div className="border border-[#eaeded] rounded overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                      <th className="py-2.5 px-4">Key</th>
                      <th className="py-2.5 px-4">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {tags.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-6 px-4 text-center text-[#545b64]">
                          No tags associated with this queue.
                        </td>
                      </tr>
                    ) : (
                      tags.map((t) => (
                        <tr key={t.key}>
                          <td className="py-2.5 px-4 font-medium text-[#16191f]">{t.key}</td>
                          <td className="py-2.5 px-4 text-[#545b64]">{t.value}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: SNS subscriptions */}
          {activeTab === "sns" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#16191f]">Amazon SNS subscriptions</h3>
                  <p className="text-[13px] text-[#545b64] mt-0.5">
                    Subscribe this queue to Amazon SNS topics to receive notifications.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setSnsModalOpen(true);
                    }}
                    style={{
                      height: "32px",
                      minHeight: "32px",
                      maxHeight: "32px",
                      whiteSpace: "nowrap",
                    }}
                    className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
                  >
                    Subscribe to Amazon SNS topic
                  </button>
                </div>
              </div>

              <div className="border border-[#eaeded] rounded overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                      <th className="py-2.5 px-4">Topic ARN</th>
                      <th className="py-2.5 px-4">Protocol</th>
                      <th className="py-2.5 px-4">Subscription ARN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribedSnsList.length > 0 ? (
                      subscribedSnsList.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#eaeded]">
                          <td className="py-2.5 px-4 font-mono text-[12px] text-[#0073bb]">
                            <Link href={`/sns/topics/${encodeURIComponent(item.topicArn)}`} className="hover:underline">
                              {item.topicArn}
                            </Link>
                          </td>
                          <td className="py-2.5 px-4 uppercase font-semibold">sqs</td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#545b64] truncate max-w-xs">
                            {item.subscriptionArn}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 px-4 text-center text-[#545b64]">
                          No SNS topics are currently configured to publish to this queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: Lambda triggers */}
          {activeTab === "lambda" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#16191f]">AWS Lambda triggers</h3>
                  <p className="text-[13px] text-[#545b64] mt-0.5">
                    Invoke a Lambda function when new messages arrive in this queue.
                  </p>
                </div>
                <button
                  onClick={() => setLambdaModalOpen(true)}
                  style={{
                    height: "32px",
                    minHeight: "32px",
                    maxHeight: "32px",
                    whiteSpace: "nowrap",
                  }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Configure Lambda function trigger
                </button>
              </div>

              <div className="border border-[#eaeded] rounded overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                      <th className="py-2.5 px-4">Function name</th>
                      <th className="py-2.5 px-4">Function ARN</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLambdaArn ? (
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                          {selectedLambdaArn.split(":").pop()}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[#545b64]">
                          {selectedLambdaArn}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f8f0] text-[#1d8102] border border-[#1d8102]/30">
                            Active
                          </span>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 px-4 text-center text-[#545b64]">
                          No Lambda function triggers are configured for this queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Message Details */}
      {messageModalOpen && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[18px] font-bold text-[#16191f]">Message details</h2>
                <p className="font-mono text-[11px] text-[#545b64] mt-0.5 select-all">
                  ID: {selectedMessage.messageId}
                </p>
              </div>
              <button
                onClick={() => setMessageModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[12px] font-semibold text-[#545b64] mb-1">Body</div>
                <div className="bg-[#1e1e1e] text-[#d4d4d4] rounded p-3 font-mono text-[12px] max-h-60 overflow-y-auto">
                  <pre>{selectedMessage.body}</pre>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[12px] bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                <div>
                  <span className="text-[#545b64]">Sent:</span>{" "}
                  <span className="font-medium text-[#16191f]">{selectedMessage.sentTimestamp}</span>
                </div>
                <div>
                  <span className="text-[#545b64]">MD5:</span>{" "}
                  <span className="font-mono text-[11px] text-[#16191f]">
                    {selectedMessage.md5OfBody || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[#545b64]">Receive count:</span>{" "}
                  <span className="font-medium text-[#16191f]">
                    {selectedMessage.approximateReceiveCount || 1}
                  </span>
                </div>
                {selectedMessage.messageGroupId && (
                  <div>
                    <span className="text-[#545b64]">Message group ID:</span>{" "}
                    <span className="font-mono text-[11px] text-[#16191f]">
                      {selectedMessage.messageGroupId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#eaeded]">
              <button
                onClick={() =>
                  handleDeleteMessage(selectedMessage.receiptHandle, selectedMessage.messageId)
                }
                disabled={isDeletingMessage}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded bg-[#d13212] text-white hover:bg-[#a82a0f]"
              >
                {isDeletingMessage ? "Deleting..." : "Delete message"}
              </button>
              <button
                onClick={() => setMessageModalOpen(false)}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Purge Queue */}
      {purgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">Purge queue</h2>
              <button
                onClick={() => setPurgeModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-[#545b64]">
              Purging deletes all messages in queue <strong className="text-[#16191f]">{queueName}</strong>{" "}
              without deleting the queue itself. This action cannot be undone.
            </p>

            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#16191f]">
                To confirm purging, type <code className="bg-[#f2f3f3] px-1 py-0.5 rounded font-mono font-normal text-[#16191f]">purge</code> below:
              </label>
              <input
                type="text"
                placeholder="purge"
                value={purgeConfirmInput}
                onChange={(e) => setPurgeConfirmInput(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setPurgeModalOpen(false)}
                disabled={isProcessingAction}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeConfirm}
                disabled={isProcessingAction || purgeConfirmInput.toLowerCase() !== "purge"}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white ${
                  purgeConfirmInput.toLowerCase() === "purge" && !isProcessingAction
                    ? "bg-[#ec7211] hover:bg-[#eb5f07]"
                    : "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                }`}
              >
                {isProcessingAction ? "Purging..." : "Purge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Queue */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">Delete queue</h2>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-[#545b64]">
              Deleting queue <strong className="text-[#16191f]">{queueName}</strong> will permanently
              delete the queue and all its messages. This action cannot be undone.
            </p>

            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#16191f]">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1 py-0.5 rounded font-mono font-normal text-[#16191f]">delete</code> below:
              </label>
              <input
                type="text"
                placeholder="delete"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={isProcessingAction}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isProcessingAction || deleteConfirmInput.toLowerCase() !== "delete"}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white ${
                  deleteConfirmInput.toLowerCase() === "delete" && !isProcessingAction
                    ? "bg-[#d13212] hover:bg-[#a82a0f]"
                    : "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                }`}
              >
                {isProcessingAction ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Manage Tags */}
      {manageTagsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">Manage tags</h2>
              <button
                onClick={() => setManageTagsModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              {tags.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={t.key}
                    disabled
                    className="flex-1 bg-[#f2f3f3] border border-[#eaeded] rounded px-3 py-1.5 text-[13px]"
                  />
                  <input
                    type="text"
                    value={t.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTags((prev) => prev.map((x, i) => (i === idx ? { ...x, value: val } : x)));
                    }}
                    className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                  />
                  <button
                    onClick={() => setTags((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-[#d13212] hover:underline font-semibold text-[13px] px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-2 border-t border-[#eaeded]">
                <input
                  type="text"
                  placeholder="Key"
                  value={newTagKey}
                  onChange={(e) => setNewTagKey(e.target.value)}
                  className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTagKey.trim()) {
                      setTags((prev) => [
                        ...prev,
                        { key: newTagKey.trim(), value: newTagValue.trim() },
                      ]);
                      setNewTagKey("");
                      setNewTagValue("");
                    }
                  }}
                  style={{
                    height: "32px",
                    minHeight: "32px",
                    maxHeight: "32px",
                    whiteSpace: "nowrap",
                  }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setManageTagsModalOpen(false)}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTags}
                disabled={isProcessingAction}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                {isProcessingAction ? "Saving..." : "Save tags"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DLQ Redrive */}
      {dlqRedriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">Start DLQ redrive</h2>
              <button
                onClick={() => setDlqRedriveModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-[#545b64]">
              Start an asynchronous message move task to redrive messages from this dead-letter queue.
            </p>

            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Destination queue ARN (Optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank to redrive back to original source queue"
                value={dlqTargetArn}
                onChange={(e) => setDlqTargetArn(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setDlqRedriveModalOpen(false)}
                disabled={isRedriving}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={handleStartRedrive}
                disabled={isRedriving}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                {isRedriving ? "Starting..." : "Start redrive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Lambda Trigger */}
      {lambdaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">
                Configure Lambda function trigger
              </h2>
              <button
                onClick={() => setLambdaModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-[#545b64]">
              Select an AWS Lambda function from your account to invoke automatically when messages
              arrive.
            </p>

            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Lambda function
              </label>
              {lambdaFunctions.length === 0 ? (
                <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-[12px] text-[#545b64] space-y-2">
                  <p>No Lambda functions found in this account.</p>
                  <Link
                    href="/lambda"
                    className="text-[#0073bb] hover:underline font-semibold text-[12px]"
                  >
                    Go to AWS Lambda
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedLambdaArn}
                  onChange={(e) => setSelectedLambdaArn(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white font-mono"
                >
                  <option value="">-- Choose Lambda function --</option>
                  {lambdaFunctions.map((fn) => (
                    <option key={fn.functionArn} value={fn.functionArn}>
                      {fn.functionName} ({fn.functionArn})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setLambdaModalOpen(false)}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSuccessMessage("Lambda function trigger configured.");
                  setLambdaModalOpen(false);
                }}
                disabled={!selectedLambdaArn}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white ${
                  selectedLambdaArn
                    ? "bg-[#ec7211] hover:bg-[#eb5f07]"
                    : "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                }`}
              >
                Save trigger
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 7: Subscribe to Amazon SNS Topic */}
      {snsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">
                Subscribe to Amazon SNS topic
              </h2>
              <button
                onClick={() => setSnsModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-[#545b64]">
              Select an Amazon SNS topic from your account to publish messages directly to this queue.
            </p>

            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                SNS topic
              </label>
              {snsTopics.length === 0 ? (
                <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-[12px] text-[#545b64] space-y-2">
                  <p>No SNS topics found in this account.</p>
                  <Link
                    href="/sns/topics/create"
                    className="text-[#0073bb] hover:underline font-semibold text-[12px]"
                  >
                    Go to Amazon SNS
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedSnsArn}
                  onChange={(e) => setSelectedSnsArn(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white font-mono"
                >
                  <option value="">-- Choose SNS topic --</option>
                  {snsTopics.map((t) => (
                    <option key={t.arn} value={t.arn}>
                      {t.name} ({t.arn})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setSnsModalOpen(false)}
                disabled={isSubscribingSns}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubscribeSns}
                disabled={!selectedSnsArn || isSubscribingSns}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white ${
                  selectedSnsArn && !isSubscribingSns
                    ? "bg-[#ec7211] hover:bg-[#eb5f07]"
                    : "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                }`}
              >
                {isSubscribingSns ? "Subscribing..." : "Subscribe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
