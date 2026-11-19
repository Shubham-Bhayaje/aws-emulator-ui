/**
 * src/app/kms/keys/[keyId]/KeyDetailClient.tsx – KMS Key Detail Client Component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KMSKeyDetail,
  enableKeyAction,
  disableKeyAction,
  scheduleKeyDeletionAction,
  cancelKeyDeletionAction,
  createAliasAction,
  deleteAliasAction,
  updateKeyPolicyAction,
  updateKeyRotationAction,
  encryptDataAction,
  decryptDataAction,
  generateDataKeyAction,
} from "../../actions";

interface KeyDetailClientProps {
  keyData: KMSKeyDetail;
}

export function KeyDetailClient({ keyData }: KeyDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "configuration" | "policy" | "rotation" | "crypto" | "tags"
  >("configuration");

  // Status feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [showScheduleDeletionModal, setShowScheduleDeletionModal] = useState(false);
  const [deletionDays, setDeletionDays] = useState(7);
  const [showCreateAliasModal, setShowCreateAliasModal] = useState(false);
  const [newAliasName, setNewAliasName] = useState("");

  // Key Policy Editing
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [policyText, setPolicyText] = useState(keyData.keyPolicy || "");

  // Crypto Playground States
  const [encryptPlaintext, setEncryptPlaintext] = useState("Hello from AWS Key Management Service");
  const [encryptedOutput, setEncryptedOutput] = useState<string | null>(null);
  const [decryptInput, setDecryptInput] = useState("");
  const [decryptedOutput, setDecryptedOutput] = useState<string | null>(null);
  const [dataKeySpec, setDataKeySpec] = useState<"AES_256" | "AES_128">("AES_256");
  const [generatedPlaintextKey, setGeneratedPlaintextKey] = useState<string | null>(null);
  const [generatedCiphertextBlob, setGeneratedCiphertextBlob] = useState<string | null>(null);

  // Copy helper
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Actions
  const handleEnable = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await enableKeyAction(keyData.keyId);
      if (res.success) {
        setSuccess(`Key ${keyData.keyId} enabled.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to enable key.");
      }
    });
  };

  const handleDisable = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await disableKeyAction(keyData.keyId);
      if (res.success) {
        setSuccess(`Key ${keyData.keyId} disabled.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to disable key.");
      }
    });
  };

  const handleScheduleDeletion = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await scheduleKeyDeletionAction(keyData.keyId, deletionDays);
      setShowScheduleDeletionModal(false);
      if (res.success) {
        setSuccess(`Key scheduled for deletion in ${deletionDays} days.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to schedule key deletion.");
      }
    });
  };

  const handleCancelDeletion = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await cancelKeyDeletionAction(keyData.keyId);
      if (res.success) {
        setSuccess(`Deletion canceled for key ${keyData.keyId}.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to cancel key deletion.");
      }
    });
  };

  const handleCreateAlias = () => {
    if (!newAliasName.trim()) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await createAliasAction(keyData.keyId, newAliasName.trim());
      setShowCreateAliasModal(false);
      setNewAliasName("");
      if (res.success) {
        setSuccess("Alias created successfully.");
        router.refresh();
      } else {
        setError(res.error || "Failed to create alias.");
      }
    });
  };

  const handleDeleteAlias = (aliasToDelete: string) => {
    if (!confirm(`Are you sure you want to delete alias "${aliasToDelete}"?`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteAliasAction(aliasToDelete, keyData.keyId);
      if (res.success) {
        setSuccess(`Alias "${aliasToDelete}" deleted.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete alias.");
      }
    });
  };

  const handleSavePolicy = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateKeyPolicyAction(keyData.keyId, policyText);
      if (res.success) {
        setIsEditingPolicy(false);
        setSuccess("Key policy updated successfully.");
        router.refresh();
      } else {
        setError(res.error || "Failed to update key policy.");
      }
    });
  };

  const handleToggleRotation = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const newStatus = !keyData.keyRotationEnabled;
      const res = await updateKeyRotationAction(keyData.keyId, newStatus);
      if (res.success) {
        setSuccess(`Key rotation ${newStatus ? "enabled" : "disabled"}.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to update key rotation.");
      }
    });
  };

  // Crypto handlers
  const handleEncrypt = () => {
    setError(null);
    startTransition(async () => {
      const res = await encryptDataAction(keyData.keyId, encryptPlaintext);
      if (res.success && res.ciphertextBase64) {
        setEncryptedOutput(res.ciphertextBase64);
        setDecryptInput(res.ciphertextBase64);
      } else {
        setError(res.error || "Encryption failed.");
      }
    });
  };

  const handleDecrypt = () => {
    setError(null);
    startTransition(async () => {
      const res = await decryptDataAction(decryptInput);
      if (res.success && res.plaintext !== undefined) {
        setDecryptedOutput(res.plaintext);
      } else {
        setError(res.error || "Decryption failed.");
      }
    });
  };

  const handleGenerateDataKey = () => {
    setError(null);
    startTransition(async () => {
      const res = await generateDataKeyAction(keyData.keyId, dataKeySpec);
      if (res.success) {
        setGeneratedPlaintextKey(res.plaintextKeyBase64 || "");
        setGeneratedCiphertextBlob(res.ciphertextBlobBase64 || "");
      } else {
        setError(res.error || "Data key generation failed.");
      }
    });
  };

  const primaryTitle = keyData.aliases[0] || keyData.keyId;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5 font-medium">
          <Link
            href={keyData.keyManager === "AWS" ? "/kms/default-keys" : "/kms"}
            className="hover:underline text-[#0972d3]"
          >
            {keyData.keyManager === "AWS" ? "AWS managed keys" : "Customer managed keys"}
          </Link>
          <span>/</span>
          <span className="font-mono text-[#16191f]">{primaryTitle}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight font-mono">
              {primaryTitle}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                keyData.keyState === "Enabled"
                  ? "bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]"
                  : keyData.keyState === "PendingDeletion"
                  ? "bg-[#fbeeed] text-[#d13212] border border-[#f5b8ad]"
                  : "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
              }`}
            >
              {keyData.keyState}
            </span>
            <span className="text-[12px] px-2 py-0.5 rounded bg-[#f2f8fd] text-[#0972d3] border border-[#d0e6f9] font-mono">
              {keyData.keySpec}
            </span>
          </div>

          {/* Key Actions Toolbar */}
          {keyData.keyManager !== "AWS" && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowCreateAliasModal(true)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm disabled:opacity-50"
              >
                Create alias
              </button>

              {keyData.keyState === "Enabled" ? (
                <button
                  onClick={handleDisable}
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm disabled:opacity-50"
                >
                  Disable
                </button>
              ) : keyData.keyState === "Disabled" ? (
                <button
                  onClick={handleEnable}
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm disabled:opacity-50"
                >
                  Enable
                </button>
              ) : null}

              {keyData.keyState === "PendingDeletion" ? (
                <button
                  onClick={handleCancelDeletion}
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm disabled:opacity-50"
                >
                  Cancel deletion
                </button>
              ) : (
                <button
                  onClick={() => setShowScheduleDeletionModal(true)}
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#d13212] bg-white text-[#d13212] hover:bg-[#fbeeed] transition-colors shadow-sm disabled:opacity-50"
                >
                  Schedule key deletion
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {keyData.keyManager === "AWS" && (
        <div className="bg-[#f2f8fd] border-l-4 border-[#0972d3] p-4 rounded-r text-[13px] text-[#16191f]">
          <div className="font-bold text-[#0972d3] mb-1">About this AWS managed key</div>
          <div>
            AWS managed keys are KMS keys created, managed, and used on your behalf by an AWS service.
            You cannot manage, rotate, or delete AWS managed keys, or change their key policies.
            However, you can view them and test cryptographic requests.
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-[#fbeeed] border-l-4 border-[#d13212] p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline text-[12px] ml-4">
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="bg-[#edfbf0] border-l-4 border-[#1d8102] p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="underline text-[12px] ml-4">
            Dismiss
          </button>
        </div>
      )}

      {keyData.keyState === "PendingDeletion" && (
        <div className="bg-[#fbeeed] border border-[#f5b8ad] rounded p-4 text-[13px] text-[#931f08] flex items-start justify-between">
          <div>
            <div className="font-bold mb-1">Key is scheduled for deletion</div>
            <div>
              This key is scheduled to be permanently deleted on{" "}
              <span className="font-semibold">{keyData.deletionDate || "7 days"}</span>. While
              pending deletion, the key cannot be used in cryptographic operations.
            </div>
          </div>
          <button
            onClick={handleCancelDeletion}
            disabled={isPending}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-white border border-[#aab7b8] text-[#16191f] hover:bg-[#fafafa]"
          >
            Cancel deletion
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#eaeded] space-x-6 text-[13px] font-medium">
        <button
          onClick={() => setActiveTab("configuration")}
          className={`pb-2 transition-colors ${
            activeTab === "configuration"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          General configuration
        </button>
        <button
          onClick={() => setActiveTab("policy")}
          className={`pb-2 transition-colors ${
            activeTab === "policy"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Key policy
        </button>
        <button
          onClick={() => setActiveTab("rotation")}
          className={`pb-2 transition-colors ${
            activeTab === "rotation"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Key rotation
        </button>
        <button
          onClick={() => setActiveTab("crypto")}
          className={`pb-2 transition-colors ${
            activeTab === "crypto"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Cryptographic operations (Playground)
        </button>
        <button
          onClick={() => setActiveTab("tags")}
          className={`pb-2 transition-colors ${
            activeTab === "tags"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Tags ({keyData.tags?.length || 0})
        </button>
      </div>

      {/* TAB 1: GENERAL CONFIGURATION */}
      {activeTab === "configuration" && (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Key summary
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
              <div>
                <dt className="text-[#545b64] mb-1">Key ID</dt>
                <dd className="font-mono text-[#16191f] break-all select-all flex items-center gap-2">
                  <span>{keyData.keyId}</span>
                  <button
                    onClick={() => copyToClipboard(keyData.keyId, "keyId")}
                    className="text-[#0972d3] text-[11px] hover:underline"
                  >
                    {copiedField === "keyId" ? "Copied" : "Copy"}
                  </button>
                </dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">ARN</dt>
                <dd className="font-mono text-[#16191f] break-all select-all flex items-center gap-2">
                  <span>{keyData.arn}</span>
                  <button
                    onClick={() => copyToClipboard(keyData.arn, "arn")}
                    className="text-[#0972d3] text-[11px] hover:underline"
                  >
                    {copiedField === "arn" ? "Copied" : "Copy"}
                  </button>
                </dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Status</dt>
                <dd>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      keyData.keyState === "Enabled"
                        ? "bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]"
                        : "bg-[#fbeeed] text-[#d13212] border border-[#f5b8ad]"
                    }`}
                  >
                    {keyData.keyState}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Key spec</dt>
                <dd className="font-mono font-medium text-[#16191f]">{keyData.keySpec}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Key usage</dt>
                <dd className="font-medium text-[#16191f]">{keyData.keyUsage}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Key type</dt>
                <dd className="text-[#16191f]">
                  {keyData.keySpec.includes("RSA") || keyData.keySpec.includes("ECC")
                    ? "Asymmetric"
                    : "Symmetric"}
                </dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Origin</dt>
                <dd className="text-[#16191f]">{keyData.origin}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Key manager</dt>
                <dd className="text-[#16191f]">
                  {keyData.keyManager === "AWS" ? "AWS" : "Customer"}
                </dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Creation date</dt>
                <dd className="text-[#16191f]">{keyData.creationDate}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] mb-1">Multi-Region</dt>
                <dd className="text-[#16191f]">{keyData.multiRegion ? "Yes" : "No"}</dd>
              </div>

              <div className="md:col-span-2">
                <dt className="text-[#545b64] mb-1">Description</dt>
                <dd className="text-[#16191f]">{keyData.description || "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Aliases Section */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
              <h2 className="text-[16px] font-bold text-[#16191f]">
                Aliases ({keyData.aliases.length})
              </h2>
              {keyData.keyManager !== "AWS" && (
                <button
                  onClick={() => setShowCreateAliasModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                >
                  Create alias
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-semibold">
                    <th className="py-2 px-4">Alias name</th>
                    <th className="py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {keyData.aliases.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-6 text-center text-[#545b64]">
                        No aliases defined for this key.
                      </td>
                    </tr>
                  ) : (
                    keyData.aliases.map((al) => (
                      <tr key={al} className="hover:bg-[#f2f8fd]">
                        <td className="py-3 px-4 font-mono font-medium text-[#16191f]">{al}</td>
                        <td className="py-3 px-4">
                          {keyData.keyManager !== "AWS" && (
                            <button
                              onClick={() => handleDeleteAlias(al)}
                              className="text-[#d13212] hover:underline text-[12px] font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KEY POLICY */}
      {activeTab === "policy" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eaeded] pb-3">
              <div>
                <h2 className="text-[16px] font-bold text-[#16191f]">Key policy document</h2>
                <p className="text-[13px] text-[#545b64] mt-0.5">
                  The resource-based policy that controls access to this KMS key.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(policyText, "policy")}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                >
                  {copiedField === "policy" ? "Copied" : "Copy JSON"}
                </button>
                {keyData.keyManager !== "AWS" && !isEditingPolicy && (
                  <button
                    onClick={() => setIsEditingPolicy(true)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
                  >
                    Edit policy
                  </button>
                )}
              </div>
            </div>

            {isEditingPolicy ? (
              <div className="space-y-4">
                <textarea
                  rows={16}
                  value={policyText}
                  onChange={(e) => setPolicyText(e.target.value)}
                  className="w-full font-mono text-[12px] p-4 border border-[#aab7b8] rounded bg-[#1e293b] text-[#f8fafc] focus:outline-none focus:border-[#0972d3]"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsEditingPolicy(false);
                      setPolicyText(keyData.keyPolicy || "");
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePolicy}
                    disabled={isPending}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              <pre className="font-mono text-[12px] p-4 bg-[#f8f9fa] border border-[#eaeded] rounded overflow-x-auto text-[#16191f] max-h-[500px]">
                {keyData.keyPolicy || "// No key policy returned"}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: KEY ROTATION */}
      {activeTab === "rotation" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Automatic key rotation
            </h2>
            <p className="text-[13px] text-[#545b64] mt-2 max-w-3xl leading-relaxed">
              When automatic key rotation is enabled, AWS KMS generates new cryptographic material for
              the KMS key every year. It retains the older cryptographic material indefinitely so that
              it can decrypt data that was encrypted with that material.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#fafafa] border border-[#eaeded] rounded max-w-2xl">
            <div>
              <div className="font-semibold text-[13px] text-[#16191f]">
                Status:{" "}
                <span
                  className={
                    keyData.keyRotationEnabled ? "text-[#1d8102]" : "text-[#545b64]"
                  }
                >
                  {keyData.keyRotationEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="text-[12px] text-[#545b64] mt-0.5">
                {keyData.keyRotationEnabled
                  ? "This key rotates automatically once every 365 days."
                  : "Automatic key rotation is currently turned off."}
              </div>
            </div>

            {keyData.keyManager !== "AWS" && (
              <button
                onClick={handleToggleRotation}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded transition-colors shadow-sm ${
                  keyData.keyRotationEnabled
                    ? "border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                    : "bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                }`}
              >
                {keyData.keyRotationEnabled ? "Disable rotation" : "Enable rotation"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CRYPTOGRAPHIC PLAYGROUND */}
      {activeTab === "crypto" && (
        <div className="space-y-6">
          <div className="bg-[#f2f8fd] border-l-4 border-[#0972d3] p-4 rounded-r text-[13px] text-[#16191f]">
            <div className="font-bold text-[#0972d3] mb-1">
              Live Cryptographic Engine
            </div>
            <div>
              This playground connects directly to your AWS KMS client. You can run actual Encrypt,
              Decrypt, and GenerateDataKey operations against this key in real time.
            </div>
          </div>

          {/* Section 1: Encrypt Plaintext */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              1. Encrypt plaintext data
            </h2>
            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Plaintext string
              </label>
              <textarea
                rows={3}
                value={encryptPlaintext}
                onChange={(e) => setEncryptPlaintext(e.target.value)}
                placeholder="Enter plaintext to encrypt"
                className="w-full text-[13px] p-2.5 border border-[#aab7b8] rounded font-mono focus:outline-none focus:border-[#0972d3]"
              />
            </div>

            <button
              onClick={handleEncrypt}
              disabled={isPending || !encryptPlaintext.trim()}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm disabled:opacity-50"
            >
              {isPending ? "Encrypting..." : "Encrypt"}
            </button>

            {encryptedOutput && (
              <div className="mt-3 p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-2">
                <div className="flex items-center justify-between text-[12px] font-semibold text-[#545b64]">
                  <span>Ciphertext Blob (Base64 encoded)</span>
                  <button
                    onClick={() => copyToClipboard(encryptedOutput, "ciphertext")}
                    className="text-[#0972d3] hover:underline"
                  >
                    {copiedField === "ciphertext" ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="font-mono text-[12px] break-all bg-white p-3 border border-[#eaeded] rounded text-[#16191f]">
                  {encryptedOutput}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Decrypt Ciphertext */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              2. Decrypt ciphertext blob
            </h2>
            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Base64 Ciphertext
              </label>
              <textarea
                rows={3}
                value={decryptInput}
                onChange={(e) => setDecryptInput(e.target.value)}
                placeholder="Paste Base64 CiphertextBlob here"
                className="w-full text-[13px] p-2.5 border border-[#aab7b8] rounded font-mono focus:outline-none focus:border-[#0972d3]"
              />
            </div>

            <button
              onClick={handleDecrypt}
              disabled={isPending || !decryptInput.trim()}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#0972d3] text-white hover:bg-[#065b9e] transition-colors shadow-sm disabled:opacity-50"
            >
              {isPending ? "Decrypting..." : "Decrypt"}
            </button>

            {decryptedOutput !== null && (
              <div className="mt-3 p-4 bg-[#edfbf0] border border-[#a4e2b0] rounded space-y-1">
                <div className="text-[12px] font-bold text-[#1d8102]">
                  Decrypted plaintext:
                </div>
                <div className="font-mono text-[13px] text-[#16191f] break-all">
                  {decryptedOutput}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Generate Data Key */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              3. Generate Data Key (Envelope Encryption)
            </h2>
            <p className="text-[13px] text-[#545b64]">
              AWS KMS uses envelope encryption. GenerateDataKey returns a plaintext data key for your
              application to encrypt large datasets locally, plus an encrypted copy of the key
              (CiphertextBlob) to store alongside your encrypted payload.
            </p>

            <div className="flex items-center gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#545b64] mb-1">
                  Key spec
                </label>
                <select
                  value={dataKeySpec}
                  onChange={(e) => setDataKeySpec(e.target.value as any)}
                  className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
                >
                  <option value="AES_256">AES_256 (256-bit symmetric data key)</option>
                  <option value="AES_128">AES_128 (128-bit symmetric data key)</option>
                </select>
              </div>

              <div className="pt-5">
                <button
                  onClick={handleGenerateDataKey}
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm disabled:opacity-50"
                >
                  Generate data key
                </button>
              </div>
            </div>

            {generatedPlaintextKey && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                  <div className="text-[12px] font-semibold text-[#545b64] flex items-center justify-between">
                    <span>Plaintext Key (Base64)</span>
                    <button
                      onClick={() => copyToClipboard(generatedPlaintextKey, "ptk")}
                      className="text-[#0972d3] hover:underline"
                    >
                      {copiedField === "ptk" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-[12px] text-[#16191f] break-all bg-white p-2 border border-[#eaeded] rounded">
                    {generatedPlaintextKey}
                  </div>
                </div>

                <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                  <div className="text-[12px] font-semibold text-[#545b64] flex items-center justify-between">
                    <span>Encrypted Key Blob (Base64)</span>
                    <button
                      onClick={() => copyToClipboard(generatedCiphertextBlob || "", "ctb")}
                      className="text-[#0972d3] hover:underline"
                    >
                      {copiedField === "ctb" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-[12px] text-[#16191f] break-all bg-white p-2 border border-[#eaeded] rounded">
                    {generatedCiphertextBlob}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: TAGS */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#eaeded] bg-[#fafafa]">
            <h2 className="text-[16px] font-bold text-[#16191f]">
              Tags ({keyData.tags?.length || 0})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-semibold">
                  <th className="py-2.5 px-4">Key</th>
                  <th className="py-2.5 px-4">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {!keyData.tags || keyData.tags.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-[#545b64]">
                      No tags associated with this key.
                    </td>
                  </tr>
                ) : (
                  keyData.tags.map((t, i) => (
                    <tr key={i} className="hover:bg-[#f2f8fd]">
                      <td className="py-2.5 px-4 font-medium text-[#16191f]">{t.key}</td>
                      <td className="py-2.5 px-4 text-[#545b64]">{t.value}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Schedule Key Deletion */}
      {showScheduleDeletionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Schedule key deletion</h3>
            <p className="text-[13px] text-[#545b64]">
              Scheduling deletion puts the key in PendingDeletion state. It cannot be used to encrypt
              or decrypt during this waiting period.
            </p>

            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Waiting period (days)
              </label>
              <input
                type="number"
                min={7}
                max={30}
                value={deletionDays}
                onChange={(e) => setDeletionDays(parseInt(e.target.value) || 7)}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">Must be between 7 and 30 days.</p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowScheduleDeletionModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScheduleDeletion}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#d13212] text-white hover:bg-[#b02a0f]"
              >
                Schedule deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Alias */}
      {showCreateAliasModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create alias</h3>
            <p className="text-[13px] text-[#545b64]">
              Assign a new friendly alias name to key{" "}
              <span className="font-mono font-semibold">{keyData.keyId}</span>.
            </p>

            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Alias name
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#545b64] font-mono select-none">alias/</span>
                <input
                  type="text"
                  required
                  placeholder="secondary-alias"
                  value={newAliasName.replace(/^alias\//, "")}
                  onChange={(e) =>
                    setNewAliasName(`alias/${e.target.value.replace(/^alias\//, "")}`)
                  }
                  className="flex-1 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCreateAliasModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAlias}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Create alias
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
