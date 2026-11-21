"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KmsKeyOption } from "../../types";
import { createDatabaseAction } from "../../actions";

interface CreateDatabaseClientProps {
  kmsKeys: KmsKeyOption[];
}

export default function CreateDatabaseClient({ kmsKeys }: CreateDatabaseClientProps) {
  const router = useRouter();
  const [databaseType, setDatabaseType] = useState<"standard" | "sample">("standard");
  const [sampleDataset, setSampleDataset] = useState<"iot" | "devops">("iot");
  const [databaseName, setDatabaseName] = useState("");
  const [kmsOption, setKmsOption] = useState<"default" | "custom">("default");
  const [selectedKmsKeyId, setSelectedKmsKeyId] = useState<string>(
    kmsKeys[0]?.KeyArn || ""
  );
  const [tags, setTags] = useState<{ Key: string; Value: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAddTag() {
    setTags([...tags, { Key: "", Value: "" }]);
  }

  function handleRemoveTag(index: number) {
    setTags(tags.filter((_, i) => i !== index));
  }

  function handleTagChange(index: number, field: "Key" | "Value", val: string) {
    const updated = [...tags];
    updated[index][field] = val;
    setTags(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = databaseName.trim();
    if (!name) {
      setError("Database name is required.");
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
      setError(
        "Database name can only contain alphanumeric characters, underscores (_), hyphens (-), and periods (.)."
      );
      return;
    }

    const kmsKeyId =
      kmsOption === "custom" && selectedKmsKeyId ? selectedKmsKeyId : undefined;

    startTransition(async () => {
      const res = await createDatabaseAction({
        databaseName: name,
        kmsKeyId,
        tags: tags.filter((t) => t.Key.trim() && t.Value.trim()),
      });

      if (res.success) {
        router.push(`/timestream/databases/${encodeURIComponent(name)}`);
      } else {
        setError(res.error || "Failed to create database.");
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Create database</h1>
        <p className="text-[14px] text-[#545b64] mt-0.5">
          A database is a top-level container for tables in Amazon Timestream.
        </p>
      </div>

      {error && (
        <div className="bg-[#fdf3f2] border-l-4 border-[#d13212] p-4 text-[13px] text-[#d13212] rounded shadow-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Database Configuration Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-5">
          <h2 className="text-[18px] font-bold text-[#16191f] border-b border-[#eaeded] pb-3">
            Configuration
          </h2>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="databaseType"
                value="standard"
                checked={databaseType === "standard"}
                onChange={() => setDatabaseType("standard")}
                className="mt-1 accent-[#ec7211]"
              />
              <div>
                <span className="text-[14px] font-bold text-[#16191f]">Standard database</span>
                <p className="text-[12px] text-[#545b64]">
                  Create an empty database and define your own tables and time-series schemas.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="databaseType"
                value="sample"
                checked={databaseType === "sample"}
                onChange={() => {
                  setDatabaseType("sample");
                  if (!databaseName) setDatabaseName("sample_iot_db");
                }}
                className="mt-1 accent-[#ec7211]"
              />
              <div>
                <span className="text-[14px] font-bold text-[#16191f]">Sample database</span>
                <p className="text-[12px] text-[#545b64]">
                  Populate with sample telemetry data to quickly explore Timestream queries.
                </p>
              </div>
            </label>
          </div>

          {databaseType === "sample" && (
            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-3">
              <div className="text-[13px] font-bold text-[#16191f]">Select sample dataset:</div>
              <div className="grid grid-cols-2 gap-3">
                <label className="border border-[#eaeded] bg-white rounded p-3 cursor-pointer hover:border-[#ec7211]">
                  <input
                    type="radio"
                    name="sampleDataset"
                    value="iot"
                    checked={sampleDataset === "iot"}
                    onChange={() => {
                      setSampleDataset("iot");
                      setDatabaseName("sample_iot_db");
                    }}
                    className="accent-[#ec7211] mr-2"
                  />
                  <span className="font-bold text-[13px] text-[#16191f]">IoT Telemetry</span>
                  <p className="text-[11px] text-[#545b64] mt-1">
                    Simulates smart meter readings (voltage, power factor, electricity load).
                  </p>
                </label>
                <label className="border border-[#eaeded] bg-white rounded p-3 cursor-pointer hover:border-[#ec7211]">
                  <input
                    type="radio"
                    name="sampleDataset"
                    value="devops"
                    checked={sampleDataset === "devops"}
                    onChange={() => {
                      setSampleDataset("devops");
                      setDatabaseName("sample_devops_db");
                    }}
                    className="accent-[#ec7211] mr-2"
                  />
                  <span className="font-bold text-[13px] text-[#16191f]">DevOps Monitoring</span>
                  <p className="text-[11px] text-[#545b64] mt-1">
                    Host metrics (CPU, memory, disk I/O, network throughput).
                  </p>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. telemetry_db"
              value={databaseName}
              onChange={(e) => setDatabaseName(e.target.value)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
              required
            />
            <p className="text-[12px] text-[#545b64] mt-1">
              Must be between 1 and 64 characters long and can contain alphanumeric characters, underscores (_), hyphens (-), and periods (.).
            </p>
          </div>
        </div>

        {/* Encryption Configuration Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-5">
          <h2 className="text-[18px] font-bold text-[#16191f] border-b border-[#eaeded] pb-3">
            Encryption
          </h2>
          <p className="text-[13px] text-[#545b64]">
            Data in Timestream is encrypted at rest by default using KMS encryption keys.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="kmsOption"
                value="default"
                checked={kmsOption === "default"}
                onChange={() => setKmsOption("default")}
                className="mt-1 accent-[#ec7211]"
              />
              <div>
                <span className="text-[14px] font-bold text-[#16191f]">
                  (default) aws/timestream
                </span>
                <p className="text-[12px] text-[#545b64]">
                  Use the AWS owned master key. There is no additional charge for this key.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="kmsOption"
                value="custom"
                checked={kmsOption === "custom"}
                onChange={() => setKmsOption("custom")}
                className="mt-1 accent-[#ec7211]"
              />
              <div>
                <span className="text-[14px] font-bold text-[#16191f]">
                  Customer managed key (KMS)
                </span>
                <p className="text-[12px] text-[#545b64]">
                  Select a symmetric KMS customer managed key for audit logging and key rotation.
                </p>
              </div>
            </label>
          </div>

          {kmsOption === "custom" && (
            <div className="pl-6 pt-2">
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                KMS key
              </label>
              {kmsKeys.length === 0 ? (
                <div className="text-[13px] text-[#545b64] bg-[#fafafa] border border-[#eaeded] p-3 rounded">
                  No Customer managed KMS keys found in this Region.{" "}
                  <Link href="/kms" className="text-[#0073bb] hover:underline font-bold">
                    Create a KMS key in AWS KMS
                  </Link>{" "}
                  or use the default key.
                </div>
              ) : (
                <select
                  value={selectedKmsKeyId}
                  onChange={(e) => setSelectedKmsKeyId(e.target.value)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  className="w-full max-w-md px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                >
                  {kmsKeys.map((k) => (
                    <option key={k.KeyId} value={k.KeyArn}>
                      {k.AliasName || k.KeyId} {k.Description ? `(${k.Description})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Tags Card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
            <div>
              <h2 className="text-[18px] font-bold text-[#16191f]">Tags - optional</h2>
              <p className="text-[12px] text-[#545b64]">
                A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[13px] font-bold text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
            >
              Add new tag
            </button>
          </div>

          {tags.length === 0 ? (
            <p className="text-[13px] text-[#545b64]">No tags applied.</p>
          ) : (
            <div className="space-y-3">
              {tags.map((t, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Key"
                    value={t.Key}
                    onChange={(e) => handleTagChange(idx, "Key", e.target.value)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="flex-1 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={t.Value}
                    onChange={(e) => handleTagChange(idx, "Value", e.target.value)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="flex-1 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="px-3 text-[13px] font-bold text-[#d13212] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/timestream/databases"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create database"}
          </button>
        </div>
      </form>
    </div>
  );
}
