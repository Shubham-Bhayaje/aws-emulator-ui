"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopicDetail, MessageAttribute } from "../../../types";
import { publishMessageAction } from "../../../actions";

interface PublishMessageClientProps {
  topic: TopicDetail;
}

export default function PublishMessageClient({ topic }: PublishMessageClientProps) {
  const [subject, setSubject] = useState("");
  const [messageStructure, setMessageStructure] = useState<"raw" | "json">("raw");
  const [messageBody, setMessageBody] = useState("");

  // FIFO parameters
  const [messageGroupId, setMessageGroupId] = useState("");
  const [messageDeduplicationId, setMessageDeduplicationId] = useState("");

  // Message Attributes
  const [attributes, setAttributes] = useState<MessageAttribute[]>([]);
  const [attrName, setAttrName] = useState("");
  const [attrType, setAttrType] = useState<"String" | "Number" | "Binary">("String");
  const [attrValue, setAttrValue] = useState("");

  // Submission Status
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    messageId: string;
    sequenceNumber?: string;
  } | null>(null);

  function handleAddAttribute() {
    if (!attrName.trim() || !attrValue.trim()) return;
    setAttributes((prev) => [
      ...prev,
      { name: attrName.trim(), type: attrType, value: attrValue.trim() },
    ]);
    setAttrName("");
    setAttrValue("");
  }

  function handleRemoveAttribute(index: number) {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    if (!messageBody.trim()) {
      setError("Message body cannot be empty.");
      return;
    }

    if (topic.type === "FIFO" && !messageGroupId.trim()) {
      setError("Message group ID is required for FIFO topics.");
      return;
    }

    if (messageStructure === "json") {
      try {
        JSON.parse(messageBody);
      } catch {
        setError("Invalid JSON format for custom payload structure.");
        return;
      }
    }

    setIsPublishing(true);
    const res = await publishMessageAction({
      topicArn: topic.arn,
      message: messageBody,
      subject: subject.trim() || undefined,
      messageStructure: messageStructure === "json" ? "json" : undefined,
      messageGroupId: topic.type === "FIFO" ? messageGroupId.trim() : undefined,
      messageDeduplicationId:
        topic.type === "FIFO" && messageDeduplicationId.trim()
          ? messageDeduplicationId.trim()
          : undefined,
      messageAttributes: attributes.length > 0 ? attributes : undefined,
    });
    setIsPublishing(false);

    if (res.success && res.messageId) {
      setSuccessInfo({
        messageId: res.messageId,
        sequenceNumber: res.sequenceNumber,
      });
      // Clear inputs
      setMessageBody("");
      setSubject("");
      setMessageGroupId("");
      setMessageDeduplicationId("");
      setAttributes([]);
    } else {
      setError(res.error || "Failed to publish message");
    }
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-6">
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
        <Link
          href={`/sns/topics/${encodeURIComponent(topic.arn)}`}
          className="text-[#0073bb] hover:underline"
        >
          {topic.name}
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-medium">Publish message</span>
      </div>

      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Publish message to topic</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          Publish a notification to all confirmed endpoints subscribed to this topic.
        </p>
      </div>

      {/* Success Banner */}
      {successInfo && (
        <div className="p-4 rounded bg-[#f2fcf3] border border-[#1d8102] text-[13px] text-[#1d8102] space-y-1">
          <div className="font-bold text-[14px]">Message published successfully</div>
          <div>
            <span className="font-semibold">Message ID:</span>{" "}
            <code className="font-mono">{successInfo.messageId}</code>
          </div>
          {successInfo.sequenceNumber && (
            <div>
              <span className="font-semibold">Sequence Number:</span>{" "}
              <code className="font-mono">{successInfo.sequenceNumber}</code>
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded bg-[#fdf3f1] border border-[#d13212] text-[13px] text-[#d13212] flex items-start gap-2">
          <span className="font-bold">Error:</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePublish} className="space-y-6">
        {/* Topic Context Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-3 shadow-sm">
          <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#545b64]">
            Target Topic
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
            <div>
              <span className="text-[11px] font-bold text-[#545b64] uppercase block">Name</span>
              <span className="font-semibold text-[#16191f]">{topic.name}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#545b64] uppercase block">Type</span>
              <span className="font-semibold text-[#16191f]">{topic.type}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#545b64] uppercase block">Subscribers</span>
              <span className="font-semibold text-[#16191f]">{topic.subscriptionsConfirmed} confirmed</span>
            </div>
          </div>
        </div>

        {/* Message Details */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-5 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Message details
          </h2>

          <div className="space-y-1">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Subject <span className="text-[11px] font-normal text-[#545b64]">(Optional, used for email and SMS notifications)</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Production Alert: High CPU"
              maxLength={100}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-bold text-[#16191f]">Message structure</label>
            <div className="flex items-center gap-6 text-[13px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="structure"
                  value="raw"
                  checked={messageStructure === "raw"}
                  onChange={() => setMessageStructure("raw")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span>Identical payload for all delivery protocols</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="structure"
                  value="json"
                  checked={messageStructure === "json"}
                  onChange={() => {
                    setMessageStructure("json");
                    if (!messageBody) {
                      setMessageBody(
                        JSON.stringify(
                          {
                            default: "Default message for all protocols",
                            email: "Email specific message",
                            sqs: "SQS specific JSON payload",
                            lambda: "Lambda specific payload",
                          },
                          null,
                          2
                        )
                      );
                    }
                  }}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span>Custom payload for each delivery protocol (JSON)</span>
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-bold text-[#16191f]">
                Message body <span className="text-[#d13212]">*</span>
              </label>
              <span className="text-[11px] text-[#545b64]">{messageBody.length} characters</span>
            </div>
            <textarea
              rows={8}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder={
                messageStructure === "raw"
                  ? "Enter message payload here..."
                  : '{"default": "Default payload", "email": "Email payload"}'
              }
              className="w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>
        </div>

        {/* FIFO Specific Message Parameters */}
        {topic.type === "FIFO" && (
          <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              FIFO message parameters
            </h2>

            <div className="space-y-1">
              <label className="block text-[13px] font-bold text-[#16191f]">
                Message group ID <span className="text-[#d13212]">*</span>
              </label>
              <p className="text-[12px] text-[#545b64]">
                Tag that specifies that a message belongs to a specific message group. Messages belonging to the same message group are always processed in strict FIFO order.
              </p>
              <input
                type="text"
                value={messageGroupId}
                onChange={(e) => setMessageGroupId(e.target.value)}
                placeholder="e.g. order-processing-group-1"
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[13px] font-bold text-[#16191f]">
                Message deduplication ID <span className="text-[11px] font-normal text-[#545b64]">(Optional if content-based deduplication is enabled)</span>
              </label>
              <p className="text-[12px] text-[#545b64]">
                Token used for deduplication of sent messages within a 5-minute deduplication interval.
              </p>
              <input
                type="text"
                value={messageDeduplicationId}
                onChange={(e) => setMessageDeduplicationId(e.target.value)}
                placeholder="e.g. dedup-token-12345"
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              />
            </div>
          </div>
        )}

        {/* Message Attributes */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Message attributes
          </h2>
          <p className="text-[12px] text-[#545b64]">
            Message attributes enable subscribers to handle messages more specifically using subscription filter policies.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
            <input
              type="text"
              placeholder="Name (e.g. event_type)"
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
            <select
              value={attrType}
              onChange={(e) => setAttrType(e.target.value as "String" | "Number" | "Binary")}
              className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            >
              <option value="String">String</option>
              <option value="Number">Number</option>
              <option value="Binary">Binary</option>
            </select>
            <input
              type="text"
              placeholder="Value (e.g. order_created)"
              value={attrValue}
              onChange={(e) => setAttrValue(e.target.value)}
              className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
            <button
              type="button"
              onClick={handleAddAttribute}
              disabled={!attrName.trim() || !attrValue.trim()}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-4 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] disabled:opacity-40 transition-colors"
            >
              Add attribute
            </button>
          </div>

          {attributes.length > 0 && (
            <div className="border border-[#eaeded] rounded divide-y divide-[#eaeded] mt-3">
              {attributes.map((a, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#16191f]">{a.name}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#f2f3f3] text-[#545b64]">
                      {a.type}
                    </span>
                    <span className="font-mono text-[12px] text-[#545b64]">{a.value}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(idx)}
                    className="text-[#d13212] hover:underline text-[12px]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href={`/sns/topics/${encodeURIComponent(topic.arn)}`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-4 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPublishing || !messageBody.trim()}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-5 bg-[#ec7211] text-white rounded text-[13px] font-bold hover:bg-[#eb5f07] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPublishing ? "Publishing..." : "Publish message"}
          </button>
        </div>
      </form>
    </div>
  );
}
