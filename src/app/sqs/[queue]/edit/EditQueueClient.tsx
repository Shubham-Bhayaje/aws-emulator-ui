"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateQueueAttributesAction } from "../../actions";
import { KmsKeyOption, QueueSummary } from "../../types";

interface EditQueueClientProps {
  queueUrl: string;
  queueName: string;
  isFifo: boolean;
  attributes: Record<string, string>;
  initialTags: Record<string, string>;
  existingQueues: QueueSummary[];
  kmsKeys: KmsKeyOption[];
}

export default function EditQueueClient({
  queueUrl,
  queueName,
  isFifo,
  attributes,
  initialTags,
  existingQueues,
  kmsKeys,
}: EditQueueClientProps) {
  const router = useRouter();

  // Configuration settings
  const [visibilityTimeout, setVisibilityTimeout] = useState<number>(
    parseInt(attributes.VisibilityTimeout || "30", 10)
  );
  const [retentionPeriodSeconds, setRetentionPeriodSeconds] = useState<number>(
    parseInt(attributes.MessageRetentionPeriod || "345600", 10)
  );
  const [delaySeconds, setDelaySeconds] = useState<number>(
    parseInt(attributes.DelaySeconds || "0", 10)
  );
  const [maxMessageSize, setMaxMessageSize] = useState<number>(
    Math.round(parseInt(attributes.MaximumMessageSize || "262144", 10) / 1024)
  );
  const [receiveWaitTime, setReceiveWaitTime] = useState<number>(
    parseInt(attributes.ReceiveMessageWaitTimeSeconds || "0", 10)
  );

  // FIFO settings
  const [contentBasedDeduplication, setContentBasedDeduplication] = useState<boolean>(
    attributes.ContentBasedDeduplication === "true"
  );

  // Encryption
  const [encryptionType, setEncryptionType] = useState<"SSE-SQS" | "SSE-KMS">(
    attributes.KmsMasterKeyId ? "SSE-KMS" : "SSE-SQS"
  );
  const [kmsMasterKeyId, setKmsMasterKeyId] = useState<string>(
    attributes.KmsMasterKeyId || "alias/aws/sqs"
  );
  const [kmsDataKeyReusePeriod, setKmsDataKeyReusePeriod] = useState<number>(
    parseInt(attributes.KmsDataKeyReusePeriodSeconds || "300", 10)
  );

  // Access policy
  const [accessPolicyJson, setAccessPolicyJson] = useState<string>(
    attributes.Policy
      ? JSON.stringify(JSON.parse(attributes.Policy), null, 2)
      : JSON.stringify(
          {
            Version: "2012-10-17",
            Statement: [
              {
                Sid: "Queue1_SendReceive",
                Effect: "Allow",
                Principal: { AWS: "arn:aws:iam::000000000000:root" },
                Action: "sqs:*",
                Resource: attributes.QueueArn || "*",
              },
            ],
          },
          null,
          2
        )
  );

  // Dead-letter queue
  let parsedDlqArn = "";
  let parsedMaxReceives = 5;
  if (attributes.RedrivePolicy) {
    try {
      const redrive = JSON.parse(attributes.RedrivePolicy);
      parsedDlqArn = redrive.deadLetterTargetArn || "";
      parsedMaxReceives = Number(redrive.maxReceiveCount || 5);
    } catch {}
  }
  const [enableDlq, setEnableDlq] = useState<boolean>(Boolean(parsedDlqArn));
  const [selectedDlqArn, setSelectedDlqArn] = useState<string>(parsedDlqArn);
  const [maxReceiveCount, setMaxReceiveCount] = useState<number>(parsedMaxReceives);

  // Tags
  const [tags, setTags] = useState<{ key: string; value: string }[]>(
    Object.entries(initialTags).map(([key, value]) => ({ key, value }))
  );
  const [newTagKey, setNewTagKey] = useState<string>("");
  const [newTagValue, setNewTagValue] = useState<string>("");
  const [removedTagKeys, setRemovedTagKeys] = useState<string[]>([]);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const eligibleDlqs = existingQueues.filter(
    (q) => q.name !== queueName && (isFifo ? q.type === "FIFO" : q.type === "Standard")
  );

  function handleAddTag() {
    if (!newTagKey.trim()) return;
    setTags((prev) => [...prev, { key: newTagKey.trim(), value: newTagValue.trim() }]);
    setNewTagKey("");
    setNewTagValue("");
  }

  function handleRemoveTag(idx: number) {
    const keyToRemove = tags[idx].key;
    if (initialTags[keyToRemove]) {
      setRemovedTagKeys((prev) => [...prev, keyToRemove]);
    }
    setTags((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const updatedAttrs: Record<string, string> = {
      VisibilityTimeout: String(visibilityTimeout),
      MessageRetentionPeriod: String(retentionPeriodSeconds),
      DelaySeconds: String(delaySeconds),
      MaximumMessageSize: String(maxMessageSize * 1024),
      ReceiveMessageWaitTimeSeconds: String(receiveWaitTime),
    };

    if (isFifo) {
      updatedAttrs.ContentBasedDeduplication = contentBasedDeduplication ? "true" : "false";
    }

    if (encryptionType === "SSE-KMS") {
      updatedAttrs.KmsMasterKeyId = kmsMasterKeyId;
      updatedAttrs.KmsDataKeyReusePeriodSeconds = String(kmsDataKeyReusePeriod);
      updatedAttrs.SqsManagedSseEnabled = "false";
    } else {
      updatedAttrs.SqsManagedSseEnabled = "true";
      updatedAttrs.KmsMasterKeyId = "";
    }

    if (accessPolicyJson.trim()) {
      updatedAttrs.Policy = accessPolicyJson.trim();
    }

    if (enableDlq && selectedDlqArn.trim()) {
      updatedAttrs.RedrivePolicy = JSON.stringify({
        deadLetterTargetArn: selectedDlqArn.trim(),
        maxReceiveCount: Number(maxReceiveCount),
      });
    } else {
      updatedAttrs.RedrivePolicy = "";
    }

    const tagsMap: Record<string, string> = {};
    for (const t of tags) {
      tagsMap[t.key] = t.value;
    }

    const res = await updateQueueAttributesAction(
      queueUrl,
      updatedAttrs,
      Object.keys(tagsMap).length > 0 ? tagsMap : undefined,
      removedTagKeys.length > 0 ? removedTagKeys : undefined
    );

    setIsSubmitting(false);

    if (res.success) {
      router.push(`/sqs/${encodeURIComponent(queueName)}`);
    } else {
      setErrorMessage(res.error || "Failed to update queue.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#545b64] mb-2">
          <Link href="/sqs" className="hover:text-[#0073bb]">
            Queues
          </Link>
          <span>/</span>
          <Link href={`/sqs/${encodeURIComponent(queueName)}`} className="hover:text-[#0073bb]">
            {queueName}
          </Link>
          <span>/</span>
          <span className="text-[#16191f] font-medium">Edit</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Edit {queueName}</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Modify queue parameters, server-side encryption, access policies, and dead-letter queue
          settings.
        </p>
      </div>

      {/* Error Banner */}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Details (Immutable) */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Queue details</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            <div>
              <div className="text-[12px] text-[#545b64]">Queue name</div>
              <div className="font-semibold text-[#16191f] mt-0.5">{queueName}</div>
            </div>
            <div>
              <div className="text-[12px] text-[#545b64]">Queue type</div>
              <div className="font-semibold text-[#16191f] mt-0.5">
                {isFifo ? "FIFO" : "Standard"}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Configuration */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Configuration</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Visibility timeout (seconds)
              </label>
              <input
                type="number"
                min="0"
                max="43200"
                value={visibilityTimeout}
                onChange={(e) => setVisibilityTimeout(Number(e.target.value))}
                className="w-full max-w-xs border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">Default: 30 seconds. Max: 12 hours.</p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Message retention period (seconds)
              </label>
              <input
                type="number"
                min="60"
                max="1209600"
                value={retentionPeriodSeconds}
                onChange={(e) => setRetentionPeriodSeconds(Number(e.target.value))}
                className="w-full max-w-xs border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">Default: 345,600 (4 days). Max: 14 days.</p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Delivery delay (seconds)
              </label>
              <input
                type="number"
                min="0"
                max="900"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
                className="w-full max-w-xs border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">Default: 0. Max: 900 seconds (15 minutes).</p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Maximum message size (KB)
              </label>
              <input
                type="number"
                min="1"
                max="260"
                value={maxMessageSize}
                onChange={(e) => setMaxMessageSize(Number(e.target.value))}
                className="w-full max-w-xs border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">Default: 256 KB. Max: 260 KB.</p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Receive message wait time (seconds)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={receiveWaitTime}
                onChange={(e) => setReceiveWaitTime(Number(e.target.value))}
                className="w-full max-w-xs border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">0 for short polling; 1-20 for long polling.</p>
            </div>

            {isFifo && (
              <div className="sm:col-span-2 pt-2 border-t border-[#eaeded]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contentBasedDeduplication}
                    onChange={(e) => setContentBasedDeduplication(e.target.checked)}
                    className="text-[#ec7211] focus:ring-[#ec7211] rounded"
                  />
                  <span className="text-[13px] font-semibold text-[#16191f]">
                    Content-based deduplication
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Encryption */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Encryption</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer p-3 border border-[#eaeded] rounded hover:bg-[#fafafa]">
              <input
                type="radio"
                name="encryptionType"
                value="SSE-SQS"
                checked={encryptionType === "SSE-SQS"}
                onChange={() => setEncryptionType("SSE-SQS")}
                className="text-[#ec7211] focus:ring-[#ec7211] mt-0.5"
              />
              <div>
                <div className="text-[13px] font-semibold text-[#16191f]">Amazon SQS key (SSE-SQS)</div>
                <div className="text-[12px] text-[#545b64]">Free 256-bit AES encryption managed by SQS.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 border border-[#eaeded] rounded hover:bg-[#fafafa]">
              <input
                type="radio"
                name="encryptionType"
                value="SSE-KMS"
                checked={encryptionType === "SSE-KMS"}
                onChange={() => setEncryptionType("SSE-KMS")}
                className="text-[#ec7211] focus:ring-[#ec7211] mt-0.5"
              />
              <div className="w-full">
                <div className="text-[13px] font-semibold text-[#16191f]">AWS Key Management Service key (SSE-KMS)</div>
                {encryptionType === "SSE-KMS" && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-[#eaeded]">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                        Customer master key (CMK)
                      </label>
                      <select
                        value={kmsMasterKeyId}
                        onChange={(e) => setKmsMasterKeyId(e.target.value)}
                        className="w-full max-w-lg border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white font-mono"
                      >
                        <option value="alias/aws/sqs">alias/aws/sqs (AWS managed key)</option>
                        {kmsKeys.map((k) => (
                          <option key={k.keyId} value={k.keyArn}>
                            {k.alias ? `${k.alias} (${k.keyId.slice(0, 8)}...)` : k.keyArn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                        Data key reuse period (seconds)
                      </label>
                      <input
                        type="number"
                        min="60"
                        max="86400"
                        value={kmsDataKeyReusePeriod}
                        onChange={(e) => setKmsDataKeyReusePeriod(Number(e.target.value))}
                        className="w-32 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 4: Access policy */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Access policy</h2>
          </div>
          <div>
            <textarea
              rows={8}
              value={accessPolicyJson}
              onChange={(e) => setAccessPolicyJson(e.target.value)}
              className="w-full border border-[#aab7b8] rounded p-3 font-mono text-[12px] focus:outline-none focus:border-[#ec7211]"
            />
          </div>
        </div>

        {/* SECTION 5: Dead-letter queue */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Dead-letter queue (DLQ)</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableDlq}
                onChange={(e) => setEnableDlq(e.target.checked)}
                className="text-[#ec7211] focus:ring-[#ec7211] rounded"
              />
              <span className="text-[13px] font-semibold text-[#16191f]">
                Enable dead-letter queue
              </span>
            </label>

            {enableDlq && (
              <div className="pl-6 space-y-4 border-l-2 border-[#eaeded] max-w-lg">
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    Select dead-letter queue
                  </label>
                  <select
                    value={selectedDlqArn}
                    onChange={(e) => setSelectedDlqArn(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white font-mono"
                    required={enableDlq}
                  >
                    <option value="">-- Choose queue ARN --</option>
                    {eligibleDlqs.map((q) => (
                      <option key={q.url} value={q.arn}>
                        {q.name} ({q.arn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    Maximum receives
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={maxReceiveCount}
                    onChange={(e) => setMaxReceiveCount(Number(e.target.value))}
                    className="w-32 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: Tags */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
          </div>

          <div className="space-y-3">
            {tags.length > 0 && (
              <div className="border border-[#eaeded] rounded overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                      <th className="py-2 px-3">Key</th>
                      <th className="py-2 px-3">Value</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {tags.map((t, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-[#16191f]">{t.key}</td>
                        <td className="py-2 px-3 text-[#545b64]">{t.value}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(idx)}
                            className="text-[#d13212] hover:underline font-semibold text-[12px]"
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

            <div className="flex items-center gap-2 max-w-lg">
              <input
                type="text"
                placeholder="Key"
                value={newTagKey}
                onChange={(e) => setNewTagKey(e.target.value)}
                className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
              <input
                type="text"
                placeholder="Value"
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
                className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
              >
                Add tag
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href={`/sqs/${encodeURIComponent(queueName)}`}
            style={{
              height: "32px",
              minHeight: "32px",
              maxHeight: "32px",
              whiteSpace: "nowrap",
            }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              height: "32px",
              minHeight: "32px",
              maxHeight: "32px",
              whiteSpace: "nowrap",
            }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            {isSubmitting ? "Saving changes..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
