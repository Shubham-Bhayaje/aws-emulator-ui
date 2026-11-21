"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KmsKeyOption } from "../../types";
import { createTopicAction } from "../../actions";

interface CreateTopicClientProps {
  kmsKeys: KmsKeyOption[];
}

export default function CreateTopicClient({ kmsKeys }: CreateTopicClientProps) {
  const router = useRouter();

  // Form State
  const [type, setType] = useState<"Standard" | "FIFO">("Standard");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contentBasedDeduplication, setContentBasedDeduplication] = useState(false);

  // Encryption
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [selectedKmsKey, setSelectedKmsKey] = useState("alias/aws/sns");

  // Access Policy
  const [policyMode, setPolicyMode] = useState<"basic" | "advanced">("basic");
  const [publishers, setPublishers] = useState<"owner" | "everyone">("owner");
  const [subscribers, setSubscribers] = useState<"owner" | "everyone">("owner");
  const [advancedPolicyJson, setAdvancedPolicyJson] = useState("");

  // Delivery Retry Policy (HTTP/S)
  const [retryPolicyEnabled, setRetryPolicyEnabled] = useState(false);
  const [numRetries, setNumRetries] = useState(3);
  const [minDelay, setMinDelay] = useState(20);
  const [maxDelay, setMaxDelay] = useState(20);

  // Tags
  const [tags, setTags] = useState<Array<{ key: string; value: string }>>([]);
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");

  // Submission & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(newType: "Standard" | "FIFO") {
    setType(newType);
    if (newType === "FIFO") {
      if (name && !name.endsWith(".fifo")) {
        setName(`${name}.fifo`);
      }
    } else {
      if (name.endsWith(".fifo")) {
        setName(name.replace(/\.fifo$/, ""));
      }
    }
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value;
    if (type === "FIFO" && val && !val.endsWith(".fifo") && !val.endsWith(".")) {
      // Allow typing, but will validate on submit
    }
    setName(val);
  }

  function handleAddTag() {
    if (!newTagKey.trim()) return;
    setTags((prev) => [...prev, { key: newTagKey.trim(), value: newTagValue.trim() }]);
    setNewTagKey("");
    setNewTagValue("");
  }

  function handleRemoveTag(idx: number) {
    setTags((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Topic name is required.");
      return;
    }

    if (type === "FIFO" && !trimmedName.endsWith(".fifo")) {
      setError("FIFO topic name must end with the .fifo suffix.");
      return;
    }

    // Build Access Policy
    let finalPolicy: string | undefined = undefined;
    if (policyMode === "advanced" && advancedPolicyJson.trim()) {
      try {
        JSON.parse(advancedPolicyJson);
        finalPolicy = advancedPolicyJson.trim();
      } catch {
        setError("Invalid JSON format for Advanced access policy.");
        return;
      }
    } else if (policyMode === "basic") {
      finalPolicy = JSON.stringify({
        Version: "2008-10-17",
        Id: "__default_policy_ID",
        Statement: [
          {
            Sid: "__default_statement_ID",
            Effect: "Allow",
            Principal: { AWS: publishers === "everyone" ? "*" : "000000000000" },
            Action: [
              "SNS:GetTopicAttributes",
              "SNS:SetTopicAttributes",
              "SNS:AddPermission",
              "SNS:RemovePermission",
              "SNS:DeleteTopic",
              "SNS:Subscribe",
              "SNS:ListSubscriptionsByTopic",
              "SNS:Publish",
            ],
            Resource: `arn:aws:sns:us-east-1:000000000000:${trimmedName}`,
            Condition:
              publishers === "owner"
                ? { StringEquals: { "AWS:SourceOwner": "000000000000" } }
                : undefined,
          },
        ],
      });
    }

    // Build Delivery Policy
    let finalDeliveryPolicy: string | undefined = undefined;
    if (retryPolicyEnabled) {
      finalDeliveryPolicy = JSON.stringify({
        http: {
          defaultHealthyRetryPolicy: {
            minDelayTarget: minDelay,
            maxDelayTarget: maxDelay,
            numRetries: numRetries,
            backoffFunction: "linear",
          },
          disableSubscriptionOverrides: false,
        },
      });
    }

    const tagsObj: Record<string, string> = {};
    for (const t of tags) {
      if (t.key) tagsObj[t.key] = t.value;
    }

    setIsSubmitting(true);
    const res = await createTopicAction({
      name: trimmedName,
      type,
      displayName: displayName.trim() || undefined,
      kmsMasterKeyId: encryptionEnabled ? selectedKmsKey : undefined,
      contentBasedDeduplication: type === "FIFO" ? contentBasedDeduplication : undefined,
      policy: finalPolicy,
      deliveryPolicy: finalDeliveryPolicy,
      tags: Object.keys(tagsObj).length > 0 ? tagsObj : undefined,
    });
    setIsSubmitting(false);

    if (res.success && res.topicArn) {
      router.push(`/sns/topics/${encodeURIComponent(res.topicArn)}`);
    } else {
      setError(res.error || "Failed to create topic");
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
        <span className="text-[#16191f] font-medium">Create topic</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Create topic</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            Configure topic details, encryption, access policies, and optional delivery retry parameters.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded bg-[#fdf3f1] border border-[#d13212] text-[13px] text-[#d13212] flex items-start gap-2">
          <span className="font-bold">Error:</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Details */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-5 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Details
          </h2>

          {/* Type Selection */}
          <div className="space-y-3">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Type <span className="text-[#d13212]">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FIFO Card */}
              <div
                onClick={() => handleTypeChange("FIFO")}
                className={`p-4 rounded border-2 cursor-pointer transition-colors ${
                  type === "FIFO"
                    ? "border-[#ec7211] bg-[#fffaf5]"
                    : "border-[#eaeded] hover:border-[#aab7b8]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="topicType"
                    checked={type === "FIFO"}
                    onChange={() => handleTypeChange("FIFO")}
                    className="text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <span className="text-[14px] font-bold text-[#16191f]">FIFO</span>
                </div>
                <p className="text-[12px] text-[#545b64] mt-2">
                  Strictly preserved message ordering and deduplication. High throughput for critical transactions. Topic name must end with <code className="text-[#16191f] font-bold">.fifo</code>.
                </p>
              </div>

              {/* Standard Card */}
              <div
                onClick={() => handleTypeChange("Standard")}
                className={`p-4 rounded border-2 cursor-pointer transition-colors ${
                  type === "Standard"
                    ? "border-[#ec7211] bg-[#fffaf5]"
                    : "border-[#eaeded] hover:border-[#aab7b8]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="topicType"
                    checked={type === "Standard"}
                    onChange={() => handleTypeChange("Standard")}
                    className="text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <span className="text-[14px] font-bold text-[#16191f]">Standard</span>
                </div>
                <p className="text-[12px] text-[#545b64] mt-2">
                  Highest throughput, at-least-once message delivery, best-effort message ordering. Suitable for mass notifications and broad fanout.
                </p>
              </div>
            </div>
          </div>

          {/* Topic Name */}
          <div className="space-y-1">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Name <span className="text-[#d13212]">*</span>
            </label>
            <p className="text-[12px] text-[#545b64]">
              {type === "FIFO"
                ? "FIFO topic names can be up to 256 characters long and must end with the .fifo suffix."
                : "Standard topic names can be up to 256 alphanumeric characters, hyphens, and underscores."}
            </p>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder={type === "FIFO" ? "my-alerts.fifo" : "my-alerts"}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-1">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Display name <span className="text-[11px] font-normal text-[#545b64]">(Optional)</span>
            </label>
            <p className="text-[12px] text-[#545b64]">
              Prefix added to SMS and email notifications (up to 100 characters).
            </p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="SystemAlerts"
              maxLength={100}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* FIFO Settings */}
          {type === "FIFO" && (
            <div className="pt-3 border-t border-[#eaeded] space-y-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="cbDeduplication"
                  checked={contentBasedDeduplication}
                  onChange={(e) => setContentBasedDeduplication(e.target.checked)}
                  className="mt-1 text-[#ec7211] focus:ring-[#ec7211]"
                />
                <label htmlFor="cbDeduplication" className="text-[13px] text-[#16191f] cursor-pointer">
                  <span className="font-bold">Content-based message deduplication</span>
                  <p className="text-[12px] text-[#545b64] mt-0.5">
                    Automatically computes a SHA-256 hash of the message body to generate the message deduplication ID.
                  </p>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Encryption */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-5 shadow-sm">
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

          {encryptionEnabled ? (
            <div className="space-y-4">
              <p className="text-[12px] text-[#545b64]">
                Server-side encryption protects the message payload using AWS Key Management Service (KMS).
              </p>
              <div className="space-y-1">
                <label className="block text-[13px] font-bold text-[#16191f]">
                  AWS KMS key <span className="text-[#d13212]">*</span>
                </label>
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
            </div>
          ) : (
            <p className="text-[12px] text-[#545b64]">
              Server-side encryption is disabled. Messages published to this topic will not be encrypted at rest with KMS.
            </p>
          )}
        </div>

        {/* Section 3: Access Policy */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-5 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Access policy
          </h2>

          <div className="flex items-center gap-4 text-[13px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="policyMode"
                value="basic"
                checked={policyMode === "basic"}
                onChange={() => setPolicyMode("basic")}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="font-medium">Basic</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="policyMode"
                value="advanced"
                checked={policyMode === "advanced"}
                onChange={() => setPolicyMode("advanced")}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="font-medium">Advanced (JSON)</span>
            </label>
          </div>

          {policyMode === "basic" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="block text-[13px] font-bold text-[#16191f]">
                  Define who can publish messages to the topic
                </label>
                <select
                  value={publishers}
                  onChange={(e) => setPublishers(e.target.value as "owner" | "everyone")}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                >
                  <option value="owner">Only the topic owner</option>
                  <option value="everyone">Everyone</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[13px] font-bold text-[#16191f]">
                  Define who can subscribe to this topic
                </label>
                <select
                  value={subscribers}
                  onChange={(e) => setSubscribers(e.target.value as "owner" | "everyone")}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                >
                  <option value="owner">Only the topic owner</option>
                  <option value="everyone">Everyone</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <label className="block text-[13px] font-bold text-[#16191f]">
                JSON policy document
              </label>
              <textarea
                rows={8}
                value={advancedPolicyJson}
                onChange={(e) => setAdvancedPolicyJson(e.target.value)}
                placeholder='{"Version":"2008-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"*"},"Action":"SNS:Publish","Resource":"*"}]}'
                className="w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              />
            </div>
          )}
        </div>

        {/* Section 4: Delivery Retry Policy (HTTP/S) */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Delivery retry policy (HTTP/S)</h2>
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#16191f]">
              <input
                type="checkbox"
                checked={retryPolicyEnabled}
                onChange={(e) => setRetryPolicyEnabled(e.target.checked)}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="font-medium">Configure custom retry policy</span>
            </label>
          </div>

          {retryPolicyEnabled ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[13px] font-bold text-[#16191f]">
                  Number of retries
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={numRetries}
                  onChange={(e) => setNumRetries(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[13px] font-bold text-[#16191f]">
                  Min delay target (seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={3600}
                  value={minDelay}
                  onChange={(e) => setMinDelay(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[13px] font-bold text-[#16191f]">
                  Max delay target (seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={3600}
                  value={maxDelay}
                  onChange={(e) => setMaxDelay(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                />
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-[#545b64]">
              Default linear backoff retry policy applies to all HTTP and HTTPS endpoints.
            </p>
          )}
        </div>

        {/* Section 5: Tags */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Tags
          </h2>
          <p className="text-[12px] text-[#545b64]">
            A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Tag key"
              value={newTagKey}
              onChange={(e) => setNewTagKey(e.target.value)}
              className="w-full sm:w-1/3 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
            <input
              type="text"
              placeholder="Tag value (optional)"
              value={newTagValue}
              onChange={(e) => setNewTagValue(e.target.value)}
              className="w-full sm:w-1/3 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!newTagKey.trim()}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-4 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] disabled:opacity-40 transition-colors"
            >
              Add tag
            </button>
          </div>

          {tags.length > 0 && (
            <div className="border border-[#eaeded] rounded divide-y divide-[#eaeded] mt-3">
              {tags.map((t, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-[13px]">
                  <div>
                    <span className="font-semibold text-[#16191f]">{t.key}</span>
                    {t.value && <span className="text-[#545b64]"> : {t.value}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
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
            href="/sns/topics"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-4 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-5 bg-[#ec7211] text-white rounded text-[13px] font-bold hover:bg-[#eb5f07] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Creating topic..." : "Create topic"}
          </button>
        </div>
      </form>
    </div>
  );
}
