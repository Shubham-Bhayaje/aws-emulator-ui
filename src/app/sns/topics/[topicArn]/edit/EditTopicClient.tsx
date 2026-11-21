"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopicDetail, KmsKeyOption } from "../../../types";
import { updateTopicAttributesAction } from "../../../actions";

interface EditTopicClientProps {
  topic: TopicDetail;
  kmsKeys: KmsKeyOption[];
}

export default function EditTopicClient({ topic, kmsKeys }: EditTopicClientProps) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(topic.displayName || "");
  const [contentBasedDeduplication, setContentBasedDeduplication] = useState(
    !!topic.contentBasedDeduplication
  );

  // Encryption
  const [encryptionEnabled, setEncryptionEnabled] = useState(!!topic.kmsMasterKeyId);
  const [selectedKmsKey, setSelectedKmsKey] = useState(
    topic.kmsMasterKeyId || "alias/aws/sns"
  );

  // Access Policy
  const [policyJson, setPolicyJson] = useState(
    topic.policy ? JSON.stringify(JSON.parse(topic.policy), null, 2) : ""
  );

  // Delivery Retry Policy (HTTP/S)
  const [deliveryPolicyJson, setDeliveryPolicyJson] = useState(
    topic.deliveryPolicy
      ? JSON.stringify(JSON.parse(topic.deliveryPolicy), null, 2)
      : ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const attributes: Record<string, string> = {};

    // DisplayName
    if (displayName.trim() !== (topic.displayName || "")) {
      attributes.DisplayName = displayName.trim();
    }

    // FIFO Deduplication
    if (topic.type === "FIFO") {
      attributes.ContentBasedDeduplication = contentBasedDeduplication ? "true" : "false";
    }

    // Encryption
    if (encryptionEnabled) {
      attributes.KmsMasterKeyId = selectedKmsKey;
    } else if (topic.kmsMasterKeyId) {
      attributes.KmsMasterKeyId = "";
    }

    // Policy
    if (policyJson.trim()) {
      try {
        JSON.parse(policyJson);
        attributes.Policy = policyJson.trim();
      } catch {
        setError("Invalid JSON format in access policy.");
        return;
      }
    }

    // Delivery policy
    if (deliveryPolicyJson.trim()) {
      try {
        JSON.parse(deliveryPolicyJson);
        attributes.DeliveryPolicy = deliveryPolicyJson.trim();
      } catch {
        setError("Invalid JSON format in delivery retry policy.");
        return;
      }
    }

    setIsSubmitting(true);
    const res = await updateTopicAttributesAction(topic.arn, attributes);
    setIsSubmitting(false);

    if (res.success) {
      router.push(`/sns/topics/${encodeURIComponent(topic.arn)}`);
    } else {
      setError(res.error || "Failed to update topic attributes");
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
        <span className="text-[#16191f] font-medium">Edit</span>
      </div>

      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Edit topic: {topic.name}</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          Update display name, server-side encryption, and access control policies.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded bg-[#fdf3f1] border border-[#d13212] text-[13px] text-[#d13212] flex items-start gap-2">
          <span className="font-bold">Error:</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Details */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
            <div>
              <label className="block text-[13px] font-bold text-[#16191f]">Topic name</label>
              <input
                type="text"
                disabled
                value={topic.name}
                className="w-full text-[13px] px-3 py-1.5 bg-[#f2f3f3] border border-[#d5dbdb] rounded text-[#545b64] mt-1"
              />
              <p className="text-[11px] text-[#545b64] mt-1">Topic names cannot be changed after creation.</p>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f]">Topic type</label>
              <input
                type="text"
                disabled
                value={topic.type}
                className="w-full text-[13px] px-3 py-1.5 bg-[#f2f3f3] border border-[#d5dbdb] rounded text-[#545b64] mt-1"
              />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <label className="block text-[13px] font-bold text-[#16191f]">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="SystemAlerts"
              maxLength={100}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {topic.type === "FIFO" && (
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#16191f]">
                <input
                  type="checkbox"
                  checked={contentBasedDeduplication}
                  onChange={(e) => setContentBasedDeduplication(e.target.checked)}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="font-bold">Content-based message deduplication</span>
              </label>
            </div>
          )}
        </div>

        {/* Section 2: Encryption */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Encryption</h2>
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#16191f]">
              <input
                type="checkbox"
                checked={encryptionEnabled}
                onChange={(e) => setEncryptionEnabled(e.target.checked)}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="font-medium">Enable server-side encryption</span>
            </label>
          </div>

          {encryptionEnabled && (
            <div className="space-y-1">
              <label className="block text-[13px] font-bold text-[#16191f]">AWS KMS key</label>
              <select
                value={selectedKmsKey}
                onChange={(e) => setSelectedKmsKey(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              >
                <option value="alias/aws/sns">alias/aws/sns (AWS managed key)</option>
                {kmsKeys.map((k) => (
                  <option key={k.keyId} value={k.keyArn}>
                    {k.alias ? `${k.alias} (${k.keyId.slice(0, 8)}...)` : k.keyArn}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Section 3: Access Policy */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Access policy
          </h2>
          <textarea
            rows={10}
            value={policyJson}
            onChange={(e) => setPolicyJson(e.target.value)}
            className="w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
          />
        </div>

        {/* Actions */}
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
            disabled={isSubmitting}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-5 bg-[#ec7211] text-white rounded text-[13px] font-bold hover:bg-[#eb5f07] disabled:opacity-40 transition-colors"
          >
            {isSubmitting ? "Saving changes..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
