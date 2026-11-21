"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KmsKeyOption } from "../../types";
import { createStreamAction } from "../../actions";

interface CreateStreamClientProps {
  kmsKeys: KmsKeyOption[];
}

export default function CreateStreamClient({ kmsKeys }: CreateStreamClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [streamName, setStreamName] = useState("");
  const [capacityMode, setCapacityMode] = useState<"ON_DEMAND" | "PROVISIONED">("ON_DEMAND");
  const [provisionedShards, setProvisionedShards] = useState(1);

  // Shard Calculator
  const [calcWriteMB, setCalcWriteMB] = useState(1);
  const [calcReadMB, setCalcReadMB] = useState(2);

  // Retention
  const [retentionHours, setRetentionHours] = useState(24);

  // Encryption
  const [encryptionType, setEncryptionType] = useState<"NONE" | "KMS">("NONE");
  const [kmsChoice, setKmsChoice] = useState<"DEFAULT" | "CUSTOM">("DEFAULT");
  const [selectedKmsKeyArn, setSelectedKmsKeyArn] = useState<string>(
    kmsKeys[0]?.Arn || ""
  );

  // Tags
  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);

  function handleAddTag() {
    if (tags.length < 50) {
      setTags([...tags, { key: "", value: "" }]);
    }
  }

  function handleRemoveTag(idx: number) {
    setTags(tags.filter((_, i) => i !== idx));
  }

  function handleTagChange(idx: number, field: "key" | "value", val: string) {
    const updated = [...tags];
    updated[idx][field] = val;
    setTags(updated);
  }

  // Calculator update
  function applyCalculator() {
    const shardsForWrite = Math.ceil(calcWriteMB / 1);
    const shardsForRead = Math.ceil(calcReadMB / 2);
    const needed = Math.max(1, Math.max(shardsForWrite, shardsForRead));
    setProvisionedShards(needed);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!streamName.trim()) {
      setError("Data stream name is required.");
      return;
    }

    const nameRegex = /^[a-zA-Z0-9_.-]{1,128}$/;
    if (!nameRegex.test(streamName.trim())) {
      setError(
        "Data stream name must be between 1 and 128 characters and can only contain letters, numbers, hyphens (-), underscores (_), and periods (.)."
      );
      return;
    }

    setError(null);
    startTransition(async () => {
      const activeKey =
        encryptionType === "KMS"
          ? kmsChoice === "DEFAULT"
            ? "alias/aws/kinesis"
            : selectedKmsKeyArn
          : undefined;

      const res = await createStreamAction({
        streamName: streamName.trim(),
        streamMode: capacityMode,
        shardCount: capacityMode === "PROVISIONED" ? provisionedShards : undefined,
        retentionPeriodHours: Number(retentionHours),
        encryptionType,
        kmsKeyId: activeKey,
        tags: tags.filter((t) => t.key.trim().length > 0),
      });

      if (res.success) {
        router.push(`/kinesis/streams/${encodeURIComponent(streamName.trim())}`);
      } else {
        setError(res.error || "Failed to create data stream.");
      }
    });
  }

  return (
    <div className="space-y-6 pb-20 max-w-4xl">
      {/* Breadcrumbs */}
      <div className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/kinesis/streams" className="text-[#0073bb] hover:underline">
          Data streams
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-semibold">Create data stream</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Create data stream</h1>
        <p className="text-[14px] text-[#545b64] mt-0.5">
          Configure your data stream capacity, encryption, retention, and tagging.
        </p>
      </div>

      {error && (
        <div className="bg-[#fdf2f2] border border-[#d13212] text-[#d13212] p-4 rounded text-[13px] flex items-center justify-between">
          <div>{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-[12px] font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Configuration */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Data stream configuration
          </h2>
          <div>
            <label className="block text-[13px] font-bold text-[#16191f]">
              Data stream name <span className="text-[#d13212]">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Must be unique within your account and Region. Letters, numbers, hyphens (-), underscores (_), and periods (.) allowed (1–128 characters).
            </p>
            <input
              type="text"
              required
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              placeholder="e.g. telemetry-events-stream"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              className="mt-2 w-full max-w-md px-3 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#0073bb]"
            />
          </div>
        </div>

        {/* Step 2: Capacity Mode */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Data stream capacity
          </h2>
          <p className="text-[13px] text-[#545b64]">
            Choose a capacity mode that matches your streaming throughput requirements and traffic predictability.
          </p>

          <div className="space-y-3">
            {/* On-Demand Mode */}
            <label
              className={`block border rounded p-4 cursor-pointer transition-colors ${
                capacityMode === "ON_DEMAND"
                  ? "border-[#0073bb] bg-[#f1faff]"
                  : "border-[#d5dbdb] hover:bg-[#fafafa]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="capacityMode"
                  value="ON_DEMAND"
                  checked={capacityMode === "ON_DEMAND"}
                  onChange={() => setCapacityMode("ON_DEMAND")}
                  className="mt-1 text-[#0073bb]"
                />
                <div>
                  <div className="text-[14px] font-bold text-[#16191f]">
                    On-demand <span className="text-[11px] font-semibold text-[#0073bb] bg-white px-2 py-0.5 rounded border border-[#0073bb]/30 ml-2">Recommended for unpredictable traffic</span>
                  </div>
                  <p className="text-[12px] text-[#545b64] mt-1 leading-relaxed">
                    Capacity automatically scales in response to your data traffic volume. You don&apos;t need to specify shard capacity. Billed per stream hour and per GB data ingested and read.
                  </p>
                </div>
              </div>
            </label>

            {/* Provisioned Mode */}
            <label
              className={`block border rounded p-4 cursor-pointer transition-colors ${
                capacityMode === "PROVISIONED"
                  ? "border-[#0073bb] bg-[#f1faff]"
                  : "border-[#d5dbdb] hover:bg-[#fafafa]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="capacityMode"
                  value="PROVISIONED"
                  checked={capacityMode === "PROVISIONED"}
                  onChange={() => setCapacityMode("PROVISIONED")}
                  className="mt-1 text-[#0073bb]"
                />
                <div className="w-full">
                  <div className="text-[14px] font-bold text-[#16191f]">
                    Provisioned <span className="text-[11px] text-[#545b64] font-normal ml-2">Recommended for predictable traffic</span>
                  </div>
                  <p className="text-[12px] text-[#545b64] mt-1 leading-relaxed">
                    You specify the number of shards for your data stream. A shard provides 1 MB/sec write capacity and 2 MB/sec read capacity.
                  </p>

                  {capacityMode === "PROVISIONED" && (
                    <div className="mt-4 pt-4 border-t border-[#d5dbdb] space-y-4">
                      <div>
                        <label className="block text-[13px] font-bold text-[#16191f]">
                          Provisioned shards <span className="text-[#d13212]">*</span>
                        </label>
                        <p className="text-[12px] text-[#545b64] mt-0.5">
                          Specify between 1 and 1000 open shards for this stream.
                        </p>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={provisionedShards}
                          onChange={(e) => setProvisionedShards(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                          className="mt-2 w-36 px-3 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#0073bb]"
                        />
                      </div>

                      {/* Shard Estimator */}
                      <div className="bg-white border border-[#eaeded] rounded p-4 space-y-3">
                        <div className="text-[13px] font-bold text-[#16191f]">
                          Shard capacity estimator
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#545b64]">
                              Expected write throughput (MB/s)
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={calcWriteMB}
                              onChange={(e) => setCalcWriteMB(Math.max(1, parseInt(e.target.value) || 1))}
                              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                              className="mt-1 w-full px-3 text-[13px] border border-[#d5dbdb] rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#545b64]">
                              Expected read throughput (MB/s)
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={calcReadMB}
                              onChange={(e) => setCalcReadMB(Math.max(1, parseInt(e.target.value) || 1))}
                              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                              className="mt-1 w-full px-3 text-[13px] border border-[#d5dbdb] rounded"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[12px] text-[#545b64]">
                            Estimated minimum shards: <strong className="text-[#16191f]">{Math.max(1, Math.max(Math.ceil(calcWriteMB / 1), Math.ceil(calcReadMB / 2)))}</strong>
                          </div>
                          <button
                            type="button"
                            onClick={applyCalculator}
                            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                            className="inline-flex items-center justify-center font-bold text-[12px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
                          >
                            Apply estimated shards
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Step 3: Stream Settings */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-6">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Data stream settings
          </h2>

          {/* Retention Period */}
          <div className="space-y-2">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Data retention period
            </label>
            <p className="text-[12px] text-[#545b64]">
              Data retention is the amount of time that records in the stream are accessible after being added (24 to 8760 hours / up to 365 days).
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={24}
                max={8760}
                value={retentionHours}
                onChange={(e) => setRetentionHours(Math.max(24, Math.min(8760, parseInt(e.target.value) || 24)))}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-36 px-3 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#0073bb]"
              />
              <span className="text-[13px] text-[#545b64]">
                hours ({Math.floor(retentionHours / 24)} day{Math.floor(retentionHours / 24) > 1 ? "s" : ""})
              </span>
            </div>
            <div className="text-[11px] text-[#545b64]">
              Default is 24 hours. Extended data retention beyond 24 hours is charged per shard-hour.
            </div>
          </div>

          <div className="border-t border-[#eaeded]" />

          {/* Server-Side Encryption */}
          <div className="space-y-3">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Server-side encryption
            </label>
            <p className="text-[12px] text-[#545b64]">
              Encrypt incoming records before storing them at rest using an AWS KMS key.
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="encryptionType"
                  value="NONE"
                  checked={encryptionType === "NONE"}
                  onChange={() => setEncryptionType("NONE")}
                  className="text-[#0073bb]"
                />
                <span className="text-[13px] text-[#16191f]">No server-side encryption</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="encryptionType"
                  value="KMS"
                  checked={encryptionType === "KMS"}
                  onChange={() => setEncryptionType("KMS")}
                  className="text-[#0073bb]"
                />
                <span className="text-[13px] text-[#16191f]">
                  Enable server-side encryption (AWS KMS)
                </span>
              </label>
            </div>

            {encryptionType === "KMS" && (
              <div className="mt-3 p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-3 max-w-lg">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kmsChoice"
                      value="DEFAULT"
                      checked={kmsChoice === "DEFAULT"}
                      onChange={() => setKmsChoice("DEFAULT")}
                      className="text-[#0073bb]"
                    />
                    <span className="text-[13px] font-medium text-[#16191f]">
                      (default) aws/kinesis (AWS managed key)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kmsChoice"
                      value="CUSTOM"
                      checked={kmsChoice === "CUSTOM"}
                      onChange={() => setKmsChoice("CUSTOM")}
                      className="text-[#0073bb]"
                    />
                    <span className="text-[13px] font-medium text-[#16191f]">
                      Choose from your AWS KMS keys (Customer managed key)
                    </span>
                  </label>
                </div>

                {kmsChoice === "CUSTOM" && (
                  <div className="pt-2">
                    {kmsKeys.length === 0 ? (
                      <div className="text-[12px] text-[#545b64]">
                        No Customer managed keys found.{" "}
                        <Link href="/kms" className="text-[#0073bb] hover:underline font-bold">
                          Create a KMS key
                        </Link>
                      </div>
                    ) : (
                      <select
                        value={selectedKmsKeyArn}
                        onChange={(e) => setSelectedKmsKeyArn(e.target.value)}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                        className="w-full px-3 text-[13px] border border-[#d5dbdb] rounded bg-white"
                      >
                        {kmsKeys.map((k) => (
                          <option key={k.Arn} value={k.Arn}>
                            {k.AliasName ? `${k.AliasName} (${k.KeyId})` : k.KeyId}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Tags */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags (optional)</h2>
              <p className="text-[12px] text-[#545b64]">
                A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
            >
              Add tag
            </button>
          </div>

          {tags.length === 0 ? (
            <div className="text-[13px] text-[#545b64] italic">No tags added yet.</div>
          ) : (
            <div className="space-y-2">
              {tags.map((t, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Key"
                    value={t.key}
                    onChange={(e) => handleTagChange(idx, "key", e.target.value)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="w-1/3 px-3 text-[13px] border border-[#d5dbdb] rounded"
                  />
                  <input
                    type="text"
                    placeholder="Value (optional)"
                    value={t.value}
                    onChange={(e) => handleTagChange(idx, "value", e.target.value)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="w-1/2 px-3 text-[13px] border border-[#d5dbdb] rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-[13px] font-bold text-[#d13212] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href="/kinesis/streams"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors disabled:opacity-50"
          >
            {isPending ? "Creating stream..." : "Create data stream"}
          </button>
        </div>
      </form>
    </div>
  );
}
