/**
 * src/app/s3/create/CreateBucketForm.tsx – AWS S3 Create Bucket Form.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import type { KmsKeyOption } from "../types";

interface CreateBucketFormProps {
  action: (formData: FormData) => Promise<{ error: string } | undefined>;
  kmsKeys?: KmsKeyOption[];
}

export function CreateBucketForm({ action, kmsKeys = [] }: CreateBucketFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [bucketName, setBucketName] = useState("");
  const [versioning, setVersioning] = useState<"disabled" | "enabled">("disabled");
  const [blockAllPab, setBlockAllPab] = useState(true);
  const [blockNewAcls, setBlockNewAcls] = useState(true);
  const [ignoreAcls, setIgnoreAcls] = useState(true);
  const [blockNewPolicies, setBlockNewPolicies] = useState(true);
  const [restrictBuckets, setRestrictBuckets] = useState(true);
  const [sseAlgo, setSseAlgo] = useState<"AES256" | "aws:kms">("AES256");
  const [kmsType, setKmsType] = useState<"default" | "custom">("default");
  const [kmsKeyId, setKmsKeyId] = useState("");
  const [bucketKey, setBucketKey] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bucketName.trim()) {
      setError("Bucket name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("bucketName", bucketName.trim().toLowerCase());
    formData.set("versioning", versioning);
    formData.set("sseAlgorithm", sseAlgo);
    if (sseAlgo === "aws:kms" && kmsKeyId.trim()) {
      formData.set("kmsKeyId", kmsKeyId.trim());
    }
    if (blockAllPab || blockNewAcls) formData.set("blockPublicAcls", "on");
    if (blockAllPab || ignoreAcls) formData.set("ignorePublicAcls", "on");
    if (blockAllPab || blockNewPolicies) formData.set("blockPublicPolicy", "on");
    if (blockAllPab || restrictBuckets) formData.set("restrictPublicBuckets", "on");

    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-[#fbeeed] border-l-4 border-[#d13212] p-4 text-[13px] text-[#d13212]">
          <div className="font-bold mb-0.5">Error creating bucket</div>
          <div>{error}</div>
        </div>
      )}

      {/* General configuration */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
          General configuration
        </h2>

        <div>
          <label className="block text-[13px] font-bold text-[#16191f] mb-1">Bucket name</label>
          <input
            type="text"
            required
            placeholder="my-s3-bucket-unique-name"
            value={bucketName}
            onChange={(e) => setBucketName(e.target.value.toLowerCase())}
            className="w-full max-w-lg text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] font-mono"
          />
          <p className="text-[12px] text-[#545b64] mt-1">
            Bucket name must be globally unique across all AWS accounts and contain only lowercase
            letters, numbers, dots, and hyphens.
          </p>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#16191f] mb-1">AWS Region</label>
          <div className="text-[13px] text-[#545b64] bg-[#f2f3f3] border border-[#d5dbdb] rounded px-3 py-1.5 max-w-md select-none">
            US East (N. Virginia) us-east-1
          </div>
        </div>
      </div>

      {/* Object Ownership */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-3">
        <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
          Object Ownership
        </h2>
        <div className="p-3 bg-[#f2f8fd] border border-[#d0e6f9] rounded text-[13px]">
          <div className="font-bold text-[#0972d3]">ACLs disabled (recommended)</div>
          <p className="text-[#16191f] text-[12px] mt-0.5">
            All objects in this bucket are owned by this account. Access to this bucket and its
            objects is specified using only policies.
          </p>
        </div>
      </div>

      {/* Block Public Access settings */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
          Block Public Access settings for this bucket
        </h2>
        <p className="text-[13px] text-[#545b64]">
          Block Public Access provides settings for access points, buckets, and accounts to help you
          manage public access to Amazon S3 resources.
        </p>

        <div className="space-y-3 pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={blockAllPab}
              onChange={(e) => {
                setBlockAllPab(e.target.checked);
                if (e.target.checked) {
                  setBlockNewAcls(true);
                  setIgnoreAcls(true);
                  setBlockNewPolicies(true);
                  setRestrictBuckets(true);
                }
              }}
              className="mt-0.5 text-[#0972d3] rounded"
            />
            <div>
              <div className="font-bold text-[13px] text-[#16191f]">Block all public access</div>
              <div className="text-[12px] text-[#545b64]">
                Turning on this setting enables all four settings below. We recommend that you keep
                this enabled.
              </div>
            </div>
          </label>

          <div className="border-t border-[#eaeded] pt-3 space-y-2 ml-5">
            <label className="flex items-center gap-2 cursor-pointer text-[12px]">
              <input
                type="checkbox"
                checked={blockNewAcls}
                onChange={(e) => setBlockNewAcls(e.target.checked)}
                disabled={blockAllPab}
                className="text-[#0972d3] rounded"
              />
              <span>Block public access to buckets and objects granted through new ACLs</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[12px]">
              <input
                type="checkbox"
                checked={ignoreAcls}
                onChange={(e) => setIgnoreAcls(e.target.checked)}
                disabled={blockAllPab}
                className="text-[#0972d3] rounded"
              />
              <span>Block public access to buckets and objects granted through any ACLs</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[12px]">
              <input
                type="checkbox"
                checked={blockNewPolicies}
                onChange={(e) => setBlockNewPolicies(e.target.checked)}
                disabled={blockAllPab}
                className="text-[#0972d3] rounded"
              />
              <span>
                Block public access to buckets and objects granted through new public policies
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[12px]">
              <input
                type="checkbox"
                checked={restrictBuckets}
                onChange={(e) => setRestrictBuckets(e.target.checked)}
                disabled={blockAllPab}
                className="text-[#0972d3] rounded"
              />
              <span>
                Block public and cross-account access to buckets and objects with public policies
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Bucket Versioning */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
          Bucket Versioning
        </h2>
        <div className="space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="radio"
              name="versioning"
              checked={versioning === "disabled"}
              onChange={() => setVersioning("disabled")}
              className="mt-0.5 text-[#0972d3]"
            />
            <div>
              <div className="font-bold text-[13px] text-[#16191f]">Disable</div>
              <div className="text-[12px] text-[#545b64]">
                Never preserve older versions of overwritten or deleted objects.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="radio"
              name="versioning"
              checked={versioning === "enabled"}
              onChange={() => setVersioning("enabled")}
              className="mt-0.5 text-[#0972d3]"
            />
            <div>
              <div className="font-bold text-[13px] text-[#16191f]">Enable</div>
              <div className="text-[12px] text-[#545b64]">
                Preserve, retrieve, and restore every version of every object stored in your bucket.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Default encryption */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
          Default encryption
        </h2>
        <div className="space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="radio"
              name="encryption"
              checked={sseAlgo === "AES256"}
              onChange={() => setSseAlgo("AES256")}
              className="mt-0.5 text-[#0972d3]"
            />
            <div>
              <div className="font-bold text-[13px] text-[#16191f]">
                Server-side encryption with Amazon S3 managed keys (SSE-S3)
              </div>
              <div className="text-[12px] text-[#545b64]">
                Base encryption using 256-bit Advanced Encryption Standard (AES-256).
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="radio"
              name="encryption"
              checked={sseAlgo === "aws:kms"}
              onChange={() => setSseAlgo("aws:kms")}
              className="mt-0.5 text-[#0972d3]"
            />
            <div>
              <div className="font-bold text-[13px] text-[#16191f]">
                Server-side encryption with AWS Key Management Service keys (SSE-KMS)
              </div>
              <div className="text-[12px] text-[#545b64]">
                Uses KMS keys for encryption. Provides audit trails of key usage.
              </div>
            </div>
          </label>

          {sseAlgo === "aws:kms" && (
            <div className="ml-6 pt-2 space-y-3">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  AWS KMS key selection
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                    <input
                      type="radio"
                      name="kmsType"
                      checked={kmsType === "default"}
                      onChange={() => {
                        setKmsType("default");
                        setKmsKeyId("alias/aws/s3");
                      }}
                      className="text-[#0972d3]"
                    />
                    <span>AWS managed key (aws/s3)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                    <input
                      type="radio"
                      name="kmsType"
                      checked={kmsType === "custom"}
                      onChange={() => {
                        setKmsType("custom");
                        if (kmsKeys.length > 0) {
                          setKmsKeyId(kmsKeys[0].keyArn || kmsKeys[0].keyId);
                        }
                      }}
                      className="text-[#0972d3]"
                    />
                    <span>Choose from your AWS KMS keys</span>
                  </label>
                </div>
              </div>

              {kmsType === "custom" && (
                <div>
                  {kmsKeys.length > 0 ? (
                    <div>
                      <select
                        value={kmsKeyId}
                        onChange={(e) => setKmsKeyId(e.target.value)}
                        className="w-full max-w-md text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
                      >
                        {kmsKeys.map((k) => (
                          <option key={k.keyId} value={k.keyArn || k.keyId}>
                            {k.alias ? `${k.alias} (${k.keyId})` : k.keyId}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#f2f8fd] border border-[#d0e6f9] rounded text-[12px] text-[#545b64] max-w-md">
                      <div>No customer managed KMS keys found in this AWS Region.</div>
                      <Link
                        href="/kms/keys/create"
                        className="text-[#0972d3] hover:underline font-semibold mt-1 inline-block"
                      >
                        Create a KMS key in AWS KMS
                      </Link>
                    </div>
                  )}
                  <div className="mt-2">
                    <label className="block text-[11px] text-[#545b64] mb-0.5">Or enter custom KMS key ARN</label>
                    <input
                      type="text"
                      placeholder="arn:aws:kms:us-east-1:000000000000:key/..."
                      value={kmsKeyId}
                      onChange={(e) => setKmsKeyId(e.target.value)}
                      className="w-full max-w-md text-[12px] px-2.5 py-1 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-[13px]">
              <input
                type="checkbox"
                checked={bucketKey}
                onChange={(e) => setBucketKey(e.target.checked)}
                className="text-[#0972d3] rounded"
              />
              <span className="font-semibold text-[#16191f]">Enable Bucket Key</span>
            </label>
            <p className="text-[12px] text-[#545b64] ml-6">
              Reduces encryption costs by decreasing request traffic to AWS KMS.
            </p>
          </div>
        </div>
      </div>

      {/* Form Actions Footer */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
        <Link
          href="/s3"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? "Creating bucket..." : "Create bucket"}
        </button>
      </div>
    </form>
  );
}
