"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createQueueAction } from "../actions";
import { KmsKeyOption, QueueSummary } from "../types";

interface CreateQueueClientProps {
  existingQueues: QueueSummary[];
  kmsKeys: KmsKeyOption[];
}

export default function CreateQueueClient({
  existingQueues,
  kmsKeys,
}: CreateQueueClientProps) {
  const router = useRouter();

  // Form State
  const [isFifo, setIsFifo] = useState<boolean>(false);
  const [queueName, setQueueName] = useState<string>("");

  // Configuration settings (stored in base seconds / bytes)
  const [visibilityTimeout, setVisibilityTimeout] = useState<number>(30);
  const [visibilityUnit, setVisibilityUnit] = useState<"seconds" | "minutes" | "hours">("seconds");
  const [retentionPeriod, setRetentionPeriod] = useState<number>(4);
  const [retentionUnit, setRetentionUnit] = useState<"days" | "hours" | "minutes" | "seconds">("days");
  const [delaySeconds, setDelaySeconds] = useState<number>(0);
  const [maxMessageSize, setMaxMessageSize] = useState<number>(256);
  const [receiveWaitTime, setReceiveWaitTime] = useState<number>(0);

  // FIFO settings
  const [contentBasedDeduplication, setContentBasedDeduplication] = useState<boolean>(false);
  const [deduplicationScope, setDeduplicationScope] = useState<"queue" | "messageGroup">("queue");
  const [fifoThroughputLimit, setFifoThroughputLimit] = useState<"perQueue" | "perMessageGroupId">("perQueue");

  // Encryption
  const [encryptionType, setEncryptionType] = useState<"SSE-SQS" | "SSE-KMS">("SSE-SQS");
  const [kmsMasterKeyId, setKmsMasterKeyId] = useState<string>("alias/aws/sqs");
  const [kmsDataKeyReusePeriod, setKmsDataKeyReusePeriod] = useState<number>(300);

  // Access policy
  const [accessPolicyMethod, setAccessPolicyMethod] = useState<"Basic" | "Advanced">("Basic");
  const [accessPolicyJson, setAccessPolicyJson] = useState<string>(
    JSON.stringify(
      {
        Version: "2012-10-17",
        Id: "Queue1_Policy",
        Statement: [
          {
            Sid: "Queue1_SendReceive",
            Effect: "Allow",
            Principal: {
              AWS: "arn:aws:iam::000000000000:root",
            },
            Action: "sqs:*",
            Resource: "*",
          },
        ],
      },
      null,
      2
    )
  );

  // Dead-letter queue
  const [enableDlq, setEnableDlq] = useState<boolean>(false);
  const [selectedDlqArn, setSelectedDlqArn] = useState<string>("");
  const [maxReceiveCount, setMaxReceiveCount] = useState<number>(5);

  // Tags
  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);
  const [newTagKey, setNewTagKey] = useState<string>("");
  const [newTagValue, setNewTagValue] = useState<string>("");

  // Submission & validation
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute final visibility timeout in seconds
  const totalVisibilityTimeout =
    visibilityUnit === "hours"
      ? visibilityTimeout * 3600
      : visibilityUnit === "minutes"
      ? visibilityTimeout * 60
      : visibilityTimeout;

  // Compute final retention period in seconds
  const totalRetentionPeriod =
    retentionUnit === "days"
      ? retentionPeriod * 86400
      : retentionUnit === "hours"
      ? retentionPeriod * 3600
      : retentionUnit === "minutes"
      ? retentionPeriod * 60
      : retentionPeriod;

  // Compute maximum message size in bytes
  const totalMaxMessageSize = maxMessageSize * 1024;

  // Eligible DLQs: matching type (Standard can only use Standard DLQ, FIFO only FIFO)
  const eligibleDlqs = existingQueues.filter((q) => (isFifo ? q.type === "FIFO" : q.type === "Standard"));

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
    if (!queueName.trim()) {
      setErrorMessage("Queue name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const tagsMap: Record<string, string> = {};
    for (const t of tags) {
      tagsMap[t.key] = t.value;
    }

    const res = await createQueueAction({
      queueName: queueName.trim(),
      isFifo,
      visibilityTimeout: totalVisibilityTimeout,
      messageRetentionPeriod: totalRetentionPeriod,
      delaySeconds,
      maximumMessageSize: totalMaxMessageSize,
      receiveMessageWaitTimeSeconds: receiveWaitTime,
      contentBasedDeduplication: isFifo ? contentBasedDeduplication : undefined,
      deduplicationScope: isFifo ? deduplicationScope : undefined,
      fifoThroughputLimit: isFifo ? fifoThroughputLimit : undefined,
      encryptionType,
      kmsMasterKeyId: encryptionType === "SSE-KMS" ? kmsMasterKeyId : undefined,
      kmsDataKeyReusePeriodSeconds: encryptionType === "SSE-KMS" ? kmsDataKeyReusePeriod : undefined,
      accessPolicyJson: accessPolicyMethod === "Advanced" ? accessPolicyJson : undefined,
      deadLetterQueueArn: enableDlq ? selectedDlqArn : undefined,
      maxReceiveCount: enableDlq ? maxReceiveCount : undefined,
      tags: Object.keys(tagsMap).length > 0 ? tagsMap : undefined,
    });

    setIsSubmitting(false);

    if (res.success && res.queueUrl) {
      const createdName = res.queueUrl.split("/").pop();
      router.push(`/sqs/${encodeURIComponent(createdName || queueName)}`);
    } else {
      setErrorMessage(res.error || "Failed to create queue.");
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
          <span className="text-[#16191f] font-medium">Create queue</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create queue</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Configure an Amazon SQS queue to decouple and scale microservices, distributed systems, and
          serverless applications.
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
        {/* SECTION 1: Type */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Type</h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Choose how messages are ordered and delivered. Type cannot be changed after queue
              creation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`p-4 border rounded cursor-pointer transition-colors ${
                !isFifo
                  ? "border-[#ec7211] bg-[#fbf6f2]"
                  : "border-[#d5dbdb] hover:border-[#aab7b8]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="queueType"
                  checked={!isFifo}
                  onChange={() => setIsFifo(false)}
                  className="text-[#ec7211] focus:ring-[#ec7211] mt-0.5"
                />
                <div>
                  <div className="font-bold text-[14px] text-[#16191f]">Standard</div>
                  <div className="text-[12px] text-[#545b64] mt-1 space-y-1">
                    <div>Unlimited throughput in transactions per second.</div>
                    <div>At-least-once delivery (a message might be delivered more than once).</div>
                    <div>Best-effort ordering (messages might be delivered out of order).</div>
                  </div>
                </div>
              </div>
            </label>

            <label
              className={`p-4 border rounded cursor-pointer transition-colors ${
                isFifo
                  ? "border-[#ec7211] bg-[#fbf6f2]"
                  : "border-[#d5dbdb] hover:border-[#aab7b8]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="queueType"
                  checked={isFifo}
                  onChange={() => setIsFifo(true)}
                  className="text-[#ec7211] focus:ring-[#ec7211] mt-0.5"
                />
                <div>
                  <div className="font-bold text-[14px] text-[#16191f]">FIFO</div>
                  <div className="text-[12px] text-[#545b64] mt-1 space-y-1">
                    <div>High throughput (up to 3000 msgs/sec with batching).</div>
                    <div>Exactly-once processing (no duplicate messages delivered).</div>
                    <div>First-in-first-out delivery (order is strictly preserved).</div>
                    <div className="text-[#ec7211] font-semibold text-[11px]">
                      Queue name must end with .fifo
                    </div>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 2: Configuration */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Configuration</h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Specify queue parameters, message size, and retention settings.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Name <span className="text-[#d13212]">*</span>
              </label>
              <div className="flex items-center gap-2 max-w-lg">
                <input
                  type="text"
                  placeholder={isFifo ? "my-queue" : "my-queue"}
                  value={queueName}
                  onChange={(e) => setQueueName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                  required
                />
                {isFifo && (
                  <span className="text-[13px] font-mono text-[#545b64] bg-[#f2f3f3] px-2 py-1.5 rounded border border-[#eaeded]">
                    .fifo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#545b64] mt-1">
                Up to 80 characters. Allowed characters include alphanumeric characters, hyphens (-),
                and underscores (_).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Visibility timeout
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={visibilityUnit === "hours" ? 12 : visibilityUnit === "minutes" ? 720 : 43200}
                    value={visibilityTimeout}
                    onChange={(e) => setVisibilityTimeout(Number(e.target.value))}
                    className="w-32 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                  />
                  <select
                    value={visibilityUnit}
                    onChange={(e) => setVisibilityUnit(e.target.value as any)}
                    className="border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white"
                  >
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
                <p className="text-[11px] text-[#545b64] mt-1">Default: 30 seconds. Max: 12 hours.</p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Message retention period
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={retentionUnit === "days" ? 14 : retentionUnit === "hours" ? 336 : 20160}
                    value={retentionPeriod}
                    onChange={(e) => setRetentionPeriod(Number(e.target.value))}
                    className="w-32 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                  />
                  <select
                    value={retentionUnit}
                    onChange={(e) => setRetentionUnit(e.target.value as any)}
                    className="border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white"
                  >
                    <option value="days">Days</option>
                    <option value="hours">Hours</option>
                    <option value="minutes">Minutes</option>
                    <option value="seconds">Seconds</option>
                  </select>
                </div>
                <p className="text-[11px] text-[#545b64] mt-1">Default: 4 days. Max: 14 days.</p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Delivery delay
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="900"
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Number(e.target.value))}
                    className="w-32 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                  />
                  <span className="text-[13px] text-[#545b64]">Seconds</span>
                </div>
                <p className="text-[11px] text-[#545b64] mt-1">Default: 0 seconds. Max: 15 minutes.</p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Maximum message size
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="260"
                    value={maxMessageSize}
                    onChange={(e) => setMaxMessageSize(Number(e.target.value))}
                    className="w-32 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                  />
                  <span className="text-[13px] text-[#545b64]">KB</span>
                </div>
                <p className="text-[11px] text-[#545b64] mt-1">Default: 256 KB. Max: 260 KB.</p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Receive message wait time
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={receiveWaitTime}
                    onChange={(e) => setReceiveWaitTime(Number(e.target.value))}
                    className="w-32 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                  />
                  <span className="text-[13px] text-[#545b64]">Seconds</span>
                </div>
                <p className="text-[11px] text-[#545b64] mt-1">
                  0 enables short polling; 1-20 enables long polling. Default: 0 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: FIFO settings (if FIFO selected) */}
        {isFifo && (
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <div className="border-b border-[#eaeded] pb-2">
              <h2 className="text-[16px] font-bold text-[#16191f]">FIFO settings</h2>
              <p className="text-[13px] text-[#545b64] mt-0.5">
                Deduplication and throughput settings for First-In-First-Out queues.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentBasedDeduplication}
                  onChange={(e) => setContentBasedDeduplication(e.target.checked)}
                  className="text-[#ec7211] focus:ring-[#ec7211] rounded mt-0.5"
                />
                <div>
                  <div className="text-[13px] font-semibold text-[#16191f]">
                    Content-based deduplication
                  </div>
                  <div className="text-[12px] text-[#545b64]">
                    Automatically generates a SHA-256 hash of the message body as the deduplication ID
                    when one is not provided.
                  </div>
                </div>
              </label>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Deduplication scope
                </label>
                <div className="space-x-4 text-[13px]">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dedupScope"
                      checked={deduplicationScope === "queue"}
                      onChange={() => setDeduplicationScope("queue")}
                      className="text-[#ec7211] focus:ring-[#ec7211]"
                    />
                    <span>Queue (Default)</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dedupScope"
                      checked={deduplicationScope === "messageGroup"}
                      onChange={() => setDeduplicationScope("messageGroup")}
                      className="text-[#ec7211] focus:ring-[#ec7211]"
                    />
                    <span>Message group</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  FIFO throughput limit
                </label>
                <div className="space-x-4 text-[13px]">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="fifoThroughput"
                      checked={fifoThroughputLimit === "perQueue"}
                      onChange={() => setFifoThroughputLimit("perQueue")}
                      className="text-[#ec7211] focus:ring-[#ec7211]"
                    />
                    <span>Per queue</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="fifoThroughput"
                      checked={fifoThroughputLimit === "perMessageGroupId"}
                      onChange={() => setFifoThroughputLimit("perMessageGroupId")}
                      className="text-[#ec7211] focus:ring-[#ec7211]"
                    />
                    <span>Per message group ID</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Encryption */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Encryption</h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Server-side encryption protects messages in transit and at rest using keys managed by SQS
              or AWS KMS.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
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
                  <div className="text-[13px] font-semibold text-[#16191f]">
                    Amazon SQS key (SSE-SQS) (Default)
                  </div>
                  <div className="text-[12px] text-[#545b64]">
                    Free 256-bit AES encryption managed automatically by SQS.
                  </div>
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
                  <div className="text-[13px] font-semibold text-[#16191f]">
                    AWS Key Management Service key (SSE-KMS)
                  </div>
                  <div className="text-[12px] text-[#545b64]">
                    Use an AWS managed KMS key (alias/aws/sqs) or a Customer Managed Key (CMK) for
                    fine-grained access control and auditing.
                  </div>

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
                        {kmsKeys.length === 0 && (
                          <div className="text-[11px] text-[#545b64] mt-1">
                            No Customer Managed Keys found in KMS. You can create one in{" "}
                            <Link href="/kms/create" className="text-[#0073bb] hover:underline">
                              AWS KMS
                            </Link>
                            .
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                          Data key reuse period
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="60"
                            max="86400"
                            value={kmsDataKeyReusePeriod}
                            onChange={(e) => setKmsDataKeyReusePeriod(Number(e.target.value))}
                            className="w-32 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                          />
                          <span className="text-[13px] text-[#545b64]">Seconds</span>
                        </div>
                        <p className="text-[11px] text-[#545b64] mt-1">Default: 300 seconds (5 minutes).</p>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 5: Access policy */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Access policy</h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Defines who can send messages to and receive messages from this queue.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-x-4 text-[13px]">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="policyMethod"
                  checked={accessPolicyMethod === "Basic"}
                  onChange={() => setAccessPolicyMethod("Basic")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="font-semibold text-[#16191f]">Basic (Default policy)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="policyMethod"
                  checked={accessPolicyMethod === "Advanced"}
                  onChange={() => setAccessPolicyMethod("Advanced")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="font-semibold text-[#16191f]">Advanced (JSON policy editor)</span>
              </label>
            </div>

            {accessPolicyMethod === "Advanced" ? (
              <div>
                <label className="block text-[12px] font-semibold text-[#545b64] mb-1">
                  Policy document (JSON)
                </label>
                <textarea
                  rows={8}
                  value={accessPolicyJson}
                  onChange={(e) => setAccessPolicyJson(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded p-3 font-mono text-[12px] focus:outline-none focus:border-[#ec7211]"
                />
              </div>
            ) : (
              <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-[12px] text-[#545b64]">
                The default access policy grants full queue access (Send, Receive, Delete, Purge) to
                the AWS account root principal and IAM users within this account.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: Dead-letter queue */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Dead-letter queue (DLQ)</h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Send messages that fail to be processed after a specified number of attempts to a
              designated dead-letter queue for isolation and debugging.
            </p>
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
                  {eligibleDlqs.length === 0 ? (
                    <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-[12px] text-[#545b64] space-y-2">
                      <p>
                        No eligible {isFifo ? "FIFO" : "Standard"} dead-letter queues available in this
                        Region.
                      </p>
                      <Link
                        href="/sqs/create"
                        className="text-[#0073bb] hover:underline font-semibold text-[12px]"
                      >
                        Create a dead-letter queue
                      </Link>
                    </div>
                  ) : (
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
                  )}
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
                  <p className="text-[11px] text-[#545b64] mt-1">
                    The number of times a message is delivered to the source queue before being moved
                    to the dead-letter queue (1 to 1000). Default: 5.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 7: Tags */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Tags are key-value pairs that help you categorize and track SQS queues.
            </p>
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
                placeholder="Key (e.g. Environment)"
                value={newTagKey}
                onChange={(e) => setNewTagKey(e.target.value)}
                className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
              <input
                type="text"
                placeholder="Value (e.g. Production)"
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
            href="/sqs"
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
            disabled={isSubmitting || !queueName.trim()}
            style={{
              height: "32px",
              minHeight: "32px",
              maxHeight: "32px",
              whiteSpace: "nowrap",
            }}
            className={`inline-flex items-center justify-center font-bold text-[13px] px-5 rounded text-white transition-colors ${
              isSubmitting || !queueName.trim()
                ? "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                : "bg-[#ec7211] hover:bg-[#eb5f07]"
            }`}
          >
            {isSubmitting ? "Creating queue..." : "Create queue"}
          </button>
        </div>
      </form>
    </div>
  );
}
