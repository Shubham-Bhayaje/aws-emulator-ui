/**
 * src/app/systems-manager/parameter-store/edit/[...parameterPath]/EditParameterClient.tsx – Edit Parameter Form.
 * Exact replica of AWS Systems Manager Parameter Store Edit console.
 * Zero emojis, Cloudscape design system, strict 32px button height standard.
 */

"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SSMParameterDetail, KmsKeyOption, SSMParameterTag } from "../../types";
import {
  putParameterAction,
  fetchKmsKeysAction,
  getParameterValueAction,
} from "../../actions";

interface EditParameterClientProps {
  initialParameter: SSMParameterDetail;
}

export function EditParameterClient({ initialParameter }: EditParameterClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [description, setDescription] = useState(initialParameter.description || "");
  const [tier, setTier] = useState<"Standard" | "Advanced">(
    initialParameter.tier === "Advanced" ? "Advanced" : "Standard"
  );
  const [type, setType] = useState<"String" | "StringList" | "SecureString">(
    initialParameter.type
  );
  const [dataType, setDataType] = useState<"text" | "aws:ec2:image">(
    (initialParameter.dataType as any) || "text"
  );

  // KMS options
  const [kmsKeys, setKmsKeys] = useState<KmsKeyOption[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState(
    initialParameter.keyId || "alias/aws/ssm"
  );

  // Value
  const [value, setValue] = useState(initialParameter.value);
  const [masked, setMasked] = useState(false);
  const [decryptedLoaded, setDecryptedLoaded] = useState(
    initialParameter.type !== "SecureString"
  );

  // Tags
  const [tags, setTags] = useState<SSMParameterTag[]>(initialParameter.tags);
  const [tagKey, setTagKey] = useState("");
  const [tagVal, setTagVal] = useState("");

  const [error, setError] = useState<string | null>(null);

  // Fetch KMS keys and plaintext if SecureString
  useEffect(() => {
    fetchKmsKeysAction().then((res) => {
      if (res.success) setKmsKeys(res.keys);
    });

    if (initialParameter.type === "SecureString" && !decryptedLoaded) {
      getParameterValueAction(initialParameter.name, true).then((res) => {
        if (res.success && res.value !== undefined) {
          setValue(res.value);
          setDecryptedLoaded(true);
        }
      });
    }
  }, [initialParameter.name, initialParameter.type, decryptedLoaded]);

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

    if (!value.trim()) {
      setError("Parameter value is required.");
      return;
    }

    startTransition(async () => {
      const res = await putParameterAction({
        name: initialParameter.name,
        description: description.trim() || undefined,
        value,
        type,
        tier,
        dataType,
        keyId: type === "SecureString" ? selectedKeyId : undefined,
        overwrite: true,
        tags: tags.length > 0 ? tags : undefined,
      });

      if (res.success) {
        const clean = initialParameter.name.startsWith("/")
          ? initialParameter.name
          : `/${initialParameter.name}`;
        router.push(`/systems-manager/parameter-store${clean}`);
        router.refresh();
      } else {
        setError(res.error || "Failed to update parameter.");
      }
    });
  };

  const cleanPath = initialParameter.name.startsWith("/")
    ? initialParameter.name
    : `/${initialParameter.name}`;
  const maxChars = tier === "Standard" ? 4096 : 8192;

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Breadcrumb */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/systems-manager/parameter-store" className="text-[#0972d3] hover:underline">
            Parameter Store
          </Link>{" "}
          &gt;{" "}
          <Link
            href={`/systems-manager/parameter-store${cleanPath}`}
            className="text-[#0972d3] hover:underline"
          >
            {initialParameter.name}
          </Link>{" "}
          &gt; Edit
        </div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Edit parameter</h1>
        <p className="text-[14px] text-[#545b64] mt-1">
          Updating this parameter will create a new immutable revision (version{" "}
          {initialParameter.version + 1}).
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
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Parameter details
          </h2>

          {/* Name (Read-only) */}
          <div className="space-y-1">
            <label className="block text-[13px] font-bold text-[#16191f]">Name</label>
            <input
              type="text"
              disabled
              value={initialParameter.name}
              className="w-full border border-[#d5dbdb] bg-[#fafafa] text-[#545b64] rounded px-3 py-1.5 text-[13px] font-mono cursor-not-allowed"
            />
            <p className="text-[12px] text-[#545b64]">
              Parameter name cannot be modified after creation.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Description - optional
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Tier */}
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
                    Store up to 10,000 parameters per region. 4 KB maximum size. Free.
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
                    Store up to 100,000 parameters per region. 8 KB maximum size.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Type */}
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
                  <p className="text-[12px] text-[#545b64]">Plain text string.</p>
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
                  <p className="text-[12px] text-[#545b64]">Comma-separated list of strings.</p>
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
                    Encrypted with AWS Key Management Service (KMS).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* KMS key if SecureString */}
          {type === "SecureString" && (
            <div className="border border-[#d8b4fe] bg-[#fbf8ff] rounded p-4 space-y-2">
              <label className="block text-[13px] font-bold text-[#16191f]">KMS Key</label>
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

          {/* Value */}
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
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={`w-full border border-[#aab7b8] rounded px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-[#ec7211] ${
                masked ? "bg-[#f2f3f3] select-none text-transparent" : "bg-white"
              }`}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href={`/systems-manager/parameter-store${cleanPath}`}
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
            {isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
