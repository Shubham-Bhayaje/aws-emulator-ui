/**
 * src/app/systems-manager/parameter-store/create/CreateParameterClient.tsx – Create Parameter Form.
 * Exact replica of AWS Systems Manager Parameter Store Create parameter console.
 * Zero emojis, Cloudscape design system, strict 32px button height standard.
 */

"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { putParameterAction, fetchKmsKeysAction } from "../actions";
import { KmsKeyOption, SSMParameterTag } from "../types";

export function CreateParameterClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<"Standard" | "Advanced">("Standard");
  const [type, setType] = useState<"String" | "StringList" | "SecureString">("String");
  const [dataType, setDataType] = useState<"text" | "aws:ec2:image">("text");

  // KMS options for SecureString
  const [kmsKeys, setKmsKeys] = useState<KmsKeyOption[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState("alias/aws/ssm");
  const [customKeyArn, setCustomKeyArn] = useState("");
  const [kmsSource, setKmsSource] = useState<"DEFAULT_OR_DROPDOWN" | "CUSTOM_ARN">(
    "DEFAULT_OR_DROPDOWN"
  );

  // Value
  const [value, setValue] = useState("");
  const [masked, setMasked] = useState(false);

  // Tags
  const [tags, setTags] = useState<SSMParameterTag[]>([]);
  const [tagKey, setTagKey] = useState("");
  const [tagVal, setTagVal] = useState("");

  const [error, setError] = useState<string | null>(null);

  // Load available KMS keys on mount
  useEffect(() => {
    fetchKmsKeysAction().then((res) => {
      if (res.success) {
        setKmsKeys(res.keys);
      }
    });
  }, []);

  const handleAddTag = () => {
    if (!tagKey.trim()) return;
    setTags([...tags, { key: tagKey.trim(), value: tagVal.trim() }]);
    setTagKey("");
    setTagVal("");
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Parameter name is required.");
      return;
    }

    if (!value.trim()) {
      setError("Parameter value is required.");
      return;
    }

    let finalKeyId: string | undefined = undefined;
    if (type === "SecureString") {
      finalKeyId =
        kmsSource === "CUSTOM_ARN" ? customKeyArn.trim() : selectedKeyId.trim();
      if (!finalKeyId) {
        finalKeyId = "alias/aws/ssm";
      }
    }

    startTransition(async () => {
      const res = await putParameterAction({
        name: trimmedName,
        description: description.trim() || undefined,
        value,
        type,
        tier,
        dataType,
        keyId: finalKeyId,
        overwrite: false,
        tags: tags.length > 0 ? tags : undefined,
      });

      if (res.success) {
        const clean = trimmedName.startsWith("/") ? trimmedName : `/${trimmedName}`;
        router.push(`/systems-manager/parameter-store${clean}`);
      } else {
        setError(res.error || "Failed to create parameter.");
      }
    });
  };

  const maxChars = tier === "Standard" ? 4096 : 8192;

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Breadcrumb & Title */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/systems-manager/parameter-store" className="text-[#0972d3] hover:underline">
            Parameter Store
          </Link>{" "}
          &gt; Create parameter
        </div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create parameter</h1>
        <p className="text-[14px] text-[#545b64] mt-1">
          Store sensitive and configuration data as a parameter with optional versioning and encryption.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-[#fdf3f2] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-[12px] font-bold text-[#545b64] hover:text-[#16191f] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parameter Details Section */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Parameter details
          </h2>

          {/* Name */}
          <div className="space-y-1">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Name <span className="text-[#d13212]">*</span>
            </label>
            <p className="text-[12px] text-[#545b64]">
              Parameter names can use forward slashes to define hierarchies (e.g.,{" "}
              <code className="bg-[#f2f3f3] px-1 rounded">/my-app/dev/db_password</code>).
            </p>
            <input
              type="text"
              required
              placeholder="/corporate/production/database/master_password"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Description - optional
            </label>
            <input
              type="text"
              placeholder="e.g. Master password for MySQL production cluster"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Tier Selection */}
          <div className="space-y-2">
            <label className="block text-[13px] font-bold text-[#16191f]">Tier</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${
                  tier === "Standard"
                    ? "border-[#ec7211] bg-[#fffaf5]"
                    : "border-[#eaeded] bg-white hover:bg-[#fafafa]"
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  checked={tier === "Standard"}
                  onChange={() => setTier("Standard")}
                  className="mt-0.5 text-[#ec7211] focus:ring-0"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">Standard</div>
                  <div className="text-[12px] text-[#545b64] mt-0.5">
                    Store up to 10,000 parameters per region. 4 KB maximum parameter size. Free of charge.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${
                  tier === "Advanced"
                    ? "border-[#ec7211] bg-[#fffaf5]"
                    : "border-[#eaeded] bg-white hover:bg-[#fafafa]"
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  checked={tier === "Advanced"}
                  onChange={() => setTier("Advanced")}
                  className="mt-0.5 text-[#ec7211] focus:ring-0"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">Advanced</div>
                  <div className="text-[12px] text-[#545b64] mt-0.5">
                    Store up to 100,000 parameters per region. 8 KB maximum parameter size. Supports policies.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <label className="block text-[13px] font-bold text-[#16191f]">Type</label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === "String"}
                  onChange={() => setType("String")}
                  className="mt-0.5 text-[#ec7211] focus:ring-0"
                />
                <div>
                  <span className="text-[13px] font-semibold text-[#16191f]">String</span>
                  <p className="text-[12px] text-[#545b64]">
                    The value is any text string block (URLs, hostnames, JSON, YAML).
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === "StringList"}
                  onChange={() => setType("StringList")}
                  className="mt-0.5 text-[#ec7211] focus:ring-0"
                />
                <div>
                  <span className="text-[13px] font-semibold text-[#16191f]">StringList</span>
                  <p className="text-[12px] text-[#545b64]">
                    The value contains a comma-delimited list of values (e.g. subnet IDs, IP ranges).
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === "SecureString"}
                  onChange={() => setType("SecureString")}
                  className="mt-0.5 text-[#ec7211] focus:ring-0"
                />
                <div>
                  <span className="text-[13px] font-semibold text-[#16191f]">SecureString</span>
                  <p className="text-[12px] text-[#545b64]">
                    The value is securely encrypted using an AWS KMS key before storage.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Data type (only if String) */}
          {type === "String" && (
            <div className="space-y-1">
              <label className="block text-[13px] font-bold text-[#16191f]">Data type</label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value as any)}
                className="w-full max-w-xs border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#ec7211]"
              >
                <option value="text">text</option>
                <option value="aws:ec2:image">aws:ec2:image</option>
              </select>
            </div>
          )}

          {/* KMS Key Selection (only if SecureString) */}
          {type === "SecureString" && (
            <div className="border border-[#d8b4fe] bg-[#fbf8ff] rounded p-4 space-y-4">
              <h3 className="text-[14px] font-bold text-[#16191f]">
                KMS key encryption settings
              </h3>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="kmsSource"
                    checked={kmsSource === "DEFAULT_OR_DROPDOWN"}
                    onChange={() => setKmsSource("DEFAULT_OR_DROPDOWN")}
                    className="text-[#ec7211] focus:ring-0"
                  />
                  <span>Choose from my KMS keys (or use default AWS managed key)</span>
                </label>

                {kmsSource === "DEFAULT_OR_DROPDOWN" && (
                  <div className="ml-6 mt-1">
                    <select
                      value={selectedKeyId}
                      onChange={(e) => setSelectedKeyId(e.target.value)}
                      className="w-full max-w-md border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#ec7211]"
                    >
                      <option value="alias/aws/ssm">alias/aws/ssm (Default AWS managed key)</option>
                      {kmsKeys.map((k) => (
                        <option key={k.keyId} value={k.keyId}>
                          {k.alias ? `${k.alias} (${k.keyId.substring(0, 8)}...)` : k.keyId}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-[13px] mt-2">
                  <input
                    type="radio"
                    name="kmsSource"
                    checked={kmsSource === "CUSTOM_ARN"}
                    onChange={() => setKmsSource("CUSTOM_ARN")}
                    className="text-[#ec7211] focus:ring-0"
                  />
                  <span>Enter a KMS key ARN</span>
                </label>

                {kmsSource === "CUSTOM_ARN" && (
                  <div className="ml-6 mt-1">
                    <input
                      type="text"
                      placeholder="arn:aws:kms:us-east-1:000000000000:key/..."
                      value={customKeyArn}
                      onChange={(e) => setCustomKeyArn(e.target.value)}
                      className="w-full max-w-md border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Value Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-bold text-[#16191f]">
                Value <span className="text-[#d13212]">*</span>
              </label>
              <div className="flex items-center gap-3">
                {type === "SecureString" && (
                  <button
                    type="button"
                    onClick={() => setMasked(!masked)}
                    className="text-[12px] text-[#0972d3] hover:underline"
                  >
                    {masked ? "Show plain text" : "Mask text"}
                  </button>
                )}
                <span className="text-[12px] text-[#545b64]">
                  {value.length} / {maxChars} characters
                </span>
              </div>
            </div>
            <textarea
              required
              rows={8}
              placeholder={
                type === "StringList"
                  ? "value1,value2,value3"
                  : type === "SecureString"
                  ? "Enter confidential password, token, or secret key"
                  : "Enter parameter value"
              }
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={`w-full border border-[#aab7b8] rounded px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-[#ec7211] ${
                masked ? "bg-[#f2f3f3] select-none text-transparent" : "bg-white"
              }`}
            />
          </div>
        </div>

        {/* Tags Section */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Tags - optional
          </h2>
          <p className="text-[12px] text-[#545b64]">
            A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
          </p>

          <div className="flex flex-wrap gap-2 max-w-lg">
            <input
              type="text"
              placeholder="Key (e.g. Environment)"
              value={tagKey}
              onChange={(e) => setTagKey(e.target.value)}
              className="flex-1 min-w-[140px] border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
            <input
              type="text"
              placeholder="Value (e.g. Production)"
              value={tagVal}
              onChange={(e) => setTagVal(e.target.value)}
              className="flex-1 min-w-[140px] border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
            <button
              type="button"
              onClick={handleAddTag}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded"
            >
              Add tag
            </button>
          </div>

          {tags.length > 0 && (
            <div className="border border-[#eaeded] rounded max-w-lg divide-y divide-[#eaeded] overflow-hidden">
              {tags.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white text-[13px]">
                  <span className="font-mono text-[12px]">
                    <strong>{t.key}</strong>: {t.value || "—"}
                  </span>
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

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href="/systems-manager/parameter-store"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-6 rounded shadow-sm transition-colors disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create parameter"}
          </button>
        </div>
      </form>
    </div>
  );
}
