/**
 * src/app/secretsmanager/new/StoreSecretWizard.tsx – 4-Step Store Secret Wizard.
 * Strict Cloudscape enterprise styling, 32px standard button heights, zero emojis.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KmsKeyOption } from "../types";
import { createSecretAction } from "../actions";

interface KeyValueRow {
  id: string;
  key: string;
  val: string;
  masked: boolean;
}

interface TagRow {
  key: string;
  value: string;
}

interface StoreSecretWizardProps {
  kmsKeys: KmsKeyOption[];
}

export function StoreSecretWizard({ kmsKeys }: StoreSecretWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Secret Value & Encryption
  const [secretFormat, setSecretFormat] = useState<"KEY_VALUE" | "PLAINTEXT">("KEY_VALUE");
  const [kvRows, setKvRows] = useState<KeyValueRow[]>([
    { id: "1", key: "", val: "", masked: true },
  ]);
  const [plaintextValue, setPlaintextValue] = useState("");
  const [kmsChoice, setKmsChoice] = useState<"DEFAULT" | "CUSTOM">("DEFAULT");
  const [selectedKmsKeyId, setSelectedKmsKeyId] = useState<string>(
    kmsKeys[0]?.keyId || ""
  );

  // Step 2: Configure Secret
  const [secretName, setSecretName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<TagRow[]>([]);
  const [tagKey, setTagKey] = useState("");
  const [tagVal, setTagVal] = useState("");

  // Step 3: Configure Rotation
  const [rotationEnabled, setRotationEnabled] = useState(false);
  const [rotationDays, setRotationDays] = useState(30);
  const [rotationLambdaArn, setRotationLambdaArn] = useState("");

  // Step 4 Code sample tab
  const [codeTab, setCodeTab] = useState<"NODE" | "PYTHON" | "CLI">("NODE");

  // Error feedback
  const [error, setError] = useState<string | null>(null);

  // KV Handlers
  const handleAddKvRow = () => {
    setKvRows([
      ...kvRows,
      { id: Date.now().toString(), key: "", val: "", masked: true },
    ]);
  };

  const handleUpdateKvRow = (id: string, field: "key" | "val", value: string) => {
    setKvRows(
      kvRows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleToggleMask = (id: string) => {
    setKvRows(
      kvRows.map((r) => (r.id === id ? { ...r, masked: !r.masked } : r))
    );
  };

  const handleDeleteKvRow = (id: string) => {
    if (kvRows.length > 1) {
      setKvRows(kvRows.filter((r) => r.id !== id));
    }
  };

  // Tag Handlers
  const handleAddTag = () => {
    if (!tagKey.trim()) return;
    setTags([...tags, { key: tagKey.trim(), value: tagVal.trim() }]);
    setTagKey("");
    setTagVal("");
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Compute final secretString
  const getComputedSecretString = (): string => {
    if (secretFormat === "PLAINTEXT") {
      return plaintextValue;
    }
    const obj: Record<string, string> = {};
    for (const r of kvRows) {
      if (r.key.trim()) {
        obj[r.key.trim()] = r.val;
      }
    }
    return JSON.stringify(obj);
  };

  // Navigation validations
  const handleNextStep1 = () => {
    setError(null);
    if (secretFormat === "PLAINTEXT" && !plaintextValue.trim()) {
      setError("Please provide a plaintext secret value.");
      return;
    }
    if (secretFormat === "KEY_VALUE") {
      const validRows = kvRows.filter((r) => r.key.trim().length > 0);
      if (validRows.length === 0) {
        setError("Please add at least one key/value pair.");
        return;
      }
    }
    if (kmsChoice === "CUSTOM" && !selectedKmsKeyId) {
      setError("Please select a customer managed KMS key.");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setError(null);
    const trimmed = secretName.trim();
    if (!trimmed) {
      setError("Secret name is required.");
      return;
    }
    const nameRegex = /^[a-zA-Z0-9/_+=.@-]+$/;
    if (!nameRegex.test(trimmed)) {
      setError(
        "Secret name can only contain letters, numbers, and the following characters: /_+=.@-"
      );
      return;
    }
    setStep(3);
  };

  const handleNextStep3 = () => {
    setError(null);
    setStep(4);
  };

  const handleSubmit = () => {
    setError(null);
    const finalString = getComputedSecretString();
    const targetKms = kmsChoice === "CUSTOM" ? selectedKmsKeyId : undefined;

    startTransition(async () => {
      const res = await createSecretAction({
        name: secretName.trim(),
        description: description.trim() || undefined,
        secretString: finalString,
        kmsKeyId: targetKms,
        tags,
        rotationEnabled,
        rotationDays: rotationEnabled ? rotationDays : undefined,
        rotationLambdaArn: rotationEnabled ? rotationLambdaArn.trim() : undefined,
      });

      if (res.success && res.name) {
        router.push(`/secretsmanager/${encodeURIComponent(res.name)}`);
      } else {
        setError(res.error || "Failed to store secret.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/secretsmanager" className="text-[#0972d3] hover:underline">
            Secrets
          </Link>{" "}
          &gt; Store a new secret
        </div>
        <h1 className="text-[20px] font-bold text-[#16191f]">Store a new secret</h1>
      </div>

      {/* Stepper Indicator */}
      <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2 text-[13px]">
          {[
            { num: 1, label: "Choose secret type" },
            { num: 2, label: "Configure secret" },
            { num: 3, label: "Configure rotation" },
            { num: 4, label: "Review" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                  step === s.num
                    ? "bg-[#ec7211] text-white"
                    : step > s.num
                    ? "bg-[#1d8102] text-white"
                    : "bg-[#eaeded] text-[#545b64]"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span
                className={`font-semibold hidden sm:inline ${
                  step === s.num ? "text-[#16191f]" : "text-[#545b64]"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded flex justify-between items-center text-[13px] text-[#900]">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-[12px] font-semibold text-[#545b64] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: Secret Type & Encryption */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Secret type</h2>
              <p className="text-[13px] text-[#545b64] mt-1">
                Choose the type of secret to store.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-[#ec7211] bg-[#fbf5ee] rounded p-4 cursor-pointer">
                <div className="flex items-center gap-2 font-bold text-[14px] text-[#16191f]">
                  <input type="radio" checked readOnly className="text-[#ec7211]" />
                  Other type of secret
                </div>
                <div className="text-[12px] text-[#545b64] mt-1.5 ml-5">
                  Store custom credentials, API keys, OAuth tokens, JSON, or key/value pairs.
                </div>
              </div>

              <div className="border border-[#eaeded] bg-[#fafafa] rounded p-4 opacity-70">
                <div className="flex items-center gap-2 font-semibold text-[14px] text-[#545b64]">
                  <input type="radio" disabled />
                  Amazon RDS database
                </div>
                <div className="text-[12px] text-[#545b64] mt-1.5 ml-5">
                  Pre-configured templates for Amazon RDS instances.
                </div>
              </div>
            </div>

            {/* Key/Value vs Plaintext Switcher */}
            <div className="border-t border-[#eaeded] pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[14px] font-bold text-[#16191f]">Key/value pairs or Plaintext</h3>
                <div className="flex border border-[#aab7b8] rounded overflow-hidden text-[12px]">
                  <button
                    type="button"
                    onClick={() => setSecretFormat("KEY_VALUE")}
                    className={`px-3 py-1 font-semibold ${
                      secretFormat === "KEY_VALUE"
                        ? "bg-[#0972d3] text-white"
                        : "bg-white text-[#16191f] hover:bg-[#fafafa]"
                    }`}
                  >
                    Key/value
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecretFormat("PLAINTEXT")}
                    className={`px-3 py-1 font-semibold border-l border-[#aab7b8] ${
                      secretFormat === "PLAINTEXT"
                        ? "bg-[#0972d3] text-white"
                        : "bg-white text-[#16191f] hover:bg-[#fafafa]"
                    }`}
                  >
                    Plaintext
                  </button>
                </div>
              </div>

              {secretFormat === "KEY_VALUE" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-[12px] font-semibold text-[#545b64]">
                    <div className="col-span-5">Key</div>
                    <div className="col-span-6">Value</div>
                    <div className="col-span-1"></div>
                  </div>

                  {kvRows.map((r) => (
                    <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="e.g. username"
                          value={r.key}
                          onChange={(e) => handleUpdateKvRow(r.id, "key", e.target.value)}
                          className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                        />
                      </div>
                      <div className="col-span-6 relative flex items-center">
                        <input
                          type={r.masked ? "password" : "text"}
                          placeholder="Secret value"
                          value={r.val}
                          onChange={(e) => handleUpdateKvRow(r.id, "val", e.target.value)}
                          className="w-full text-[13px] px-3 py-1.5 pr-16 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                        />
                        <button
                          type="button"
                          onClick={() => handleToggleMask(r.id)}
                          className="absolute right-2 text-[11px] font-semibold text-[#0972d3] hover:underline"
                        >
                          {r.masked ? "Show" : "Hide"}
                        </button>
                      </div>
                      <div className="col-span-1 text-center">
                        {kvRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteKvRow(r.id)}
                            className="text-[#ba270b] hover:underline text-[12px] font-semibold"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAddKvRow}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="px-3 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
                    >
                      Add row
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    placeholder='{"key": "value"}'
                    value={plaintextValue}
                    onChange={(e) => setPlaintextValue(e.target.value)}
                    className="w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(plaintextValue);
                          setPlaintextValue(JSON.stringify(parsed, null, 2));
                        } catch {
                          setError("Invalid JSON format in plaintext area.");
                        }
                      }}
                      className="text-[12px] font-semibold text-[#0972d3] hover:underline"
                    >
                      Format JSON
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Encryption Key Configuration */}
            <div className="border-t border-[#eaeded] pt-6 space-y-4">
              <div>
                <h3 className="text-[14px] font-bold text-[#16191f]">Encryption key</h3>
                <p className="text-[13px] text-[#545b64] mt-0.5">
                  Secrets Manager encrypts the secret value using an AWS KMS key.
                </p>
              </div>

              <div className="space-y-3 text-[13px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="kms_choice"
                    checked={kmsChoice === "DEFAULT"}
                    onChange={() => setKmsChoice("DEFAULT")}
                  />
                  <span className="font-semibold text-[#16191f]">
                    aws/secretsmanager (Default AWS managed key)
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="kms_choice"
                    checked={kmsChoice === "CUSTOM"}
                    onChange={() => setKmsChoice("CUSTOM")}
                    className="mt-1"
                  />
                  <div className="space-y-2 flex-1">
                    <span className="font-semibold text-[#16191f]">
                      Customer managed key (choose an existing key from AWS KMS)
                    </span>
                    {kmsChoice === "CUSTOM" && (
                      <div className="max-w-md pt-1">
                        {kmsKeys.length === 0 ? (
                          <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded text-[12px] text-[#545b64]">
                            No customer managed KMS keys found.{" "}
                            <Link href="/kms/keys/create" className="text-[#0972d3] hover:underline font-semibold">
                              Create a KMS key in KMS
                            </Link>
                          </div>
                        ) : (
                          <select
                            value={selectedKmsKeyId}
                            onChange={(e) => setSelectedKmsKeyId(e.target.value)}
                            className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                          >
                            {kmsKeys.map((k) => (
                              <option key={k.keyId} value={k.keyId}>
                                {k.alias ? `${k.alias} (${k.keyId})` : k.keyId}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between items-center">
            <Link
              href="/secretsmanager"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center px-4 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleNextStep1}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-5 rounded font-bold text-[13px] text-white bg-[#ec7211] hover:bg-[#eb5f07]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Configure Secret */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Secret name and description</h2>
              <p className="text-[13px] text-[#545b64] mt-1">
                Provide a unique identifier for this secret in your account and Region.
              </p>
            </div>

            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Secret name <span className="text-[#ba270b]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. production/db/credentials"
                  value={secretName}
                  onChange={(e) => setSecretName(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
                <p className="text-[11px] text-[#545b64] mt-1">
                  Must be unique. Can include letters, numbers, and /_+=.@-
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Description - optional
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the purpose of this secret"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-[13px] p-2.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>
            </div>

            {/* Tags Section */}
            <div className="border-t border-[#eaeded] pt-6 space-y-4">
              <div>
                <h3 className="text-[14px] font-bold text-[#16191f]">Tags - optional</h3>
                <p className="text-[13px] text-[#545b64] mt-0.5">
                  A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
                </p>
              </div>

              <div className="space-y-3 max-w-xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={tagKey}
                    onChange={(e) => setTagKey(e.target.value)}
                    className="flex-1 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={tagVal}
                    onChange={(e) => setTagVal(e.target.value)}
                    className="flex-1 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="px-3 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
                  >
                    Add tag
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="border border-[#eaeded] rounded divide-y divide-[#eaeded] text-[13px]">
                    {tags.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5">
                        <div>
                          <span className="font-semibold text-[#16191f]">{t.key}</span>:{" "}
                          <span className="text-[#545b64]">{t.value || "-"}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(idx)}
                          className="text-[12px] text-[#ba270b] hover:underline font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-4 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNextStep2}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-5 rounded font-bold text-[13px] text-white bg-[#ec7211] hover:bg-[#eb5f07]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Configure Rotation */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Automatic rotation</h2>
              <p className="text-[13px] text-[#545b64] mt-1">
                You can configure Secrets Manager to automatically rotate the secret on a scheduled basis using an AWS Lambda rotation function.
              </p>
            </div>

            <div className="space-y-4 text-[13px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rotation_toggle"
                  checked={!rotationEnabled}
                  onChange={() => setRotationEnabled(false)}
                />
                <span className="font-semibold text-[#16191f]">Disable automatic rotation</span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rotation_toggle"
                  checked={rotationEnabled}
                  onChange={() => setRotationEnabled(true)}
                  className="mt-1"
                />
                <div className="space-y-3 flex-1">
                  <span className="font-semibold text-[#16191f]">Enable automatic rotation</span>

                  {rotationEnabled && (
                    <div className="space-y-4 bg-[#fafafa] p-4 border border-[#eaeded] rounded max-w-lg">
                      <div>
                        <label className="block text-[12px] font-semibold text-[#16191f] mb-1">
                          Rotation schedule (in days)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={rotationDays}
                          onChange={(e) => setRotationDays(Math.max(1, parseInt(e.target.value) || 30))}
                          className="w-32 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-semibold text-[#16191f] mb-1">
                          Rotation Lambda function ARN (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="arn:aws:lambda:us-east-1:000000000000:function:my-rotation-func"
                          value={rotationLambdaArn}
                          onChange={(e) => setRotationLambdaArn(e.target.value)}
                          className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded"
                        />
                        <p className="text-[11px] text-[#545b64] mt-1">
                          Note: In the local emulator, automated rotation requires a configured Lambda function.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-4 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNextStep3}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-5 rounded font-bold text-[13px] text-white bg-[#ec7211] hover:bg-[#eb5f07]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Review and store</h2>
              <p className="text-[13px] text-[#545b64] mt-1">
                Review your secret parameters before storing it in Secrets Manager.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-2">
                <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                  Secret details
                </div>
                <div>
                  <span className="font-semibold text-[#16191f]">Name:</span> {secretName}
                </div>
                <div>
                  <span className="font-semibold text-[#16191f]">Description:</span>{" "}
                  {description || "-"}
                </div>
                <div>
                  <span className="font-semibold text-[#16191f]">Type:</span> Other type of secret (
                  {secretFormat === "KEY_VALUE" ? "Key/value pairs" : "Plaintext"})
                </div>
                <div>
                  <span className="font-semibold text-[#16191f]">KMS Key:</span>{" "}
                  {kmsChoice === "DEFAULT" ? "aws/secretsmanager" : selectedKmsKeyId}
                </div>
              </div>

              <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-2">
                <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                  Rotation & Metadata
                </div>
                <div>
                  <span className="font-semibold text-[#16191f]">Automatic rotation:</span>{" "}
                  {rotationEnabled ? `Enabled (${rotationDays} days)` : "Disabled"}
                </div>
                <div>
                  <span className="font-semibold text-[#16191f]">Tags:</span>{" "}
                  {tags.length > 0
                    ? tags.map((t) => `${t.key}=${t.value}`).join(", ")
                    : "No tags"}
                </div>
              </div>
            </div>

            {/* Code Snippet Generator */}
            <div className="border-t border-[#eaeded] pt-6 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[14px] font-bold text-[#16191f]">Sample code to retrieve this secret</h3>
                <div className="flex border border-[#aab7b8] rounded overflow-hidden text-[12px]">
                  <button
                    type="button"
                    onClick={() => setCodeTab("NODE")}
                    className={`px-2.5 py-1 font-semibold ${
                      codeTab === "NODE"
                        ? "bg-[#0972d3] text-white"
                        : "bg-white text-[#16191f] hover:bg-[#fafafa]"
                    }`}
                  >
                    Node.js
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeTab("PYTHON")}
                    className={`px-2.5 py-1 font-semibold border-l border-[#aab7b8] ${
                      codeTab === "PYTHON"
                        ? "bg-[#0972d3] text-white"
                        : "bg-white text-[#16191f] hover:bg-[#fafafa]"
                    }`}
                  >
                    Python
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeTab("CLI")}
                    className={`px-2.5 py-1 font-semibold border-l border-[#aab7b8] ${
                      codeTab === "CLI"
                        ? "bg-[#0972d3] text-white"
                        : "bg-white text-[#16191f] hover:bg-[#fafafa]"
                    }`}
                  >
                    AWS CLI
                  </button>
                </div>
              </div>

              <pre className="bg-[#16191f] text-[#d5dbdb] p-4 rounded text-[12px] font-mono overflow-x-auto leading-relaxed">
                {codeTab === "NODE" &&
`import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });
const response = await client.send(
  new GetSecretValueCommand({ SecretId: "${secretName}" })
);
const secret = response.SecretString;
console.log("Retrieved secret:", secret);`}

                {codeTab === "PYTHON" &&
`import boto3

client = boto3.client("secretsmanager", region_name="us-east-1")
response = client.get_secret_value(SecretId="${secretName}")
secret = response["SecretString"]
print("Retrieved secret:", secret)`}

                {codeTab === "CLI" &&
`aws secretsmanager get-secret-value \\
  --secret-id "${secretName}" \\
  --region us-east-1`}
              </pre>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(3)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-4 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmit}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-6 rounded font-bold text-[13px] text-white bg-[#ec7211] hover:bg-[#eb5f07]"
            >
              {isPending ? "Storing secret..." : "Store"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
