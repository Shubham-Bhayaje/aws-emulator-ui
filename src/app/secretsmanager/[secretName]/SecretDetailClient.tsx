/**
 * src/app/secretsmanager/[secretName]/SecretDetailClient.tsx – Comprehensive Secret Details Client.
 * Strict Cloudscape enterprise styling, 32px standard button heights, zero emojis.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SecretDetail, SecretVersionItem, KmsKeyOption } from "../types";
import {
  getSecretValueAction,
  putSecretValueAction,
  updateSecretAction,
  deleteSecretAction,
  restoreSecretAction,
  addTagsAction,
  removeTagsAction,
  putResourcePolicyAction,
  deleteResourcePolicyAction,
} from "../actions";

interface SecretDetailClientProps {
  secret: SecretDetail;
  versions: SecretVersionItem[];
  kmsKeys: KmsKeyOption[];
}

export function SecretDetailClient({
  secret,
  versions,
  kmsKeys,
}: SecretDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Secret Value Retrieval State
  const [valueRetrieved, setValueRetrieved] = useState(false);
  const [secretString, setSecretString] = useState<string | null>(null);
  const [retrievalPending, setRetrievalPending] = useState(false);
  const [valViewTab, setValViewTab] = useState<"KEY_VALUE" | "PLAINTEXT">("KEY_VALUE");
  const [maskedKeys, setMaskedKeys] = useState<Record<string, boolean>>({});

  // Action Menu
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  // Modals
  const [showEditValueModal, setShowEditValueModal] = useState(false);
  const [editValMode, setEditValMode] = useState<"KEY_VALUE" | "PLAINTEXT">("KEY_VALUE");
  const [editKvRows, setEditKvRows] = useState<{ id: string; key: string; val: string }[]>([]);
  const [editPlaintext, setEditPlaintext] = useState("");

  const [showEditDescModal, setShowEditDescModal] = useState(false);
  const [editDesc, setEditDesc] = useState(secret.description || "");
  const [editKmsKey, setEditKmsKey] = useState(secret.kmsKeyId || "default");

  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyText, setPolicyText] = useState(secret.resourcePolicy || "");

  const [showTagsModal, setShowTagsModal] = useState(false);
  const [tagsList, setTagsList] = useState(secret.tags || []);
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagVal, setNewTagVal] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteForce, setDeleteForce] = useState(false);
  const [recoveryDays, setRecoveryDays] = useState(7);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Sample code tab
  const [sampleCodeTab, setSampleCodeTab] = useState<"NODE" | "PYTHON" | "CLI">("NODE");

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Retrieve Secret Value
  const handleRetrieveValue = async () => {
    setError(null);
    setRetrievalPending(true);
    const res = await getSecretValueAction(secret.name);
    setRetrievalPending(false);

    if (res.success && res.secretString !== undefined) {
      setSecretString(res.secretString);
      setValueRetrieved(true);

      // Parse JSON if possible to set default view
      try {
        const parsed = JSON.parse(res.secretString);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          setValViewTab("KEY_VALUE");
          const masks: Record<string, boolean> = {};
          Object.keys(parsed).forEach((k) => (masks[k] = true));
          setMaskedKeys(masks);
        } else {
          setValViewTab("PLAINTEXT");
        }
      } catch {
        setValViewTab("PLAINTEXT");
      }
    } else {
      setError(res.error || "Failed to retrieve secret value.");
    }
  };

  // Open Edit Secret Value Modal
  const handleOpenEditValue = () => {
    const currentVal = secretString || "";
    setEditPlaintext(currentVal);

    try {
      const parsed = JSON.parse(currentVal);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const rows = Object.entries(parsed).map(([k, v], idx) => ({
          id: String(idx + 1),
          key: k,
          val: String(v),
        }));
        setEditKvRows(rows.length > 0 ? rows : [{ id: "1", key: "", val: "" }]);
        setEditValMode("KEY_VALUE");
      } else {
        setEditValMode("PLAINTEXT");
      }
    } catch {
      setEditValMode("PLAINTEXT");
    }

    setShowEditValueModal(true);
  };

  // Save Secret Value (creates new version)
  const handleSaveValue = () => {
    setError(null);
    let finalStr = editPlaintext;
    if (editValMode === "KEY_VALUE") {
      const obj: Record<string, string> = {};
      for (const r of editKvRows) {
        if (r.key.trim()) obj[r.key.trim()] = r.val;
      }
      finalStr = JSON.stringify(obj);
    }

    startTransition(async () => {
      const res = await putSecretValueAction(secret.name, finalStr);
      if (res.success) {
        setShowEditValueModal(false);
        setSecretString(finalStr);
        setSuccess(`New secret version created (Version ID: ${res.versionId}).`);
        router.refresh();
      } else {
        setError(res.error || "Failed to update secret value.");
      }
    });
  };

  // Save Description & KMS key
  const handleSaveDescAndKms = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateSecretAction(secret.name, editDesc, editKmsKey);
      if (res.success) {
        setShowEditDescModal(false);
        setSuccess("Secret details updated.");
        router.refresh();
      } else {
        setError(res.error || "Failed to update secret.");
      }
    });
  };

  // Save Resource Policy
  const handleSavePolicy = () => {
    setError(null);
    startTransition(async () => {
      const res = await putResourcePolicyAction(secret.name, policyText.trim());
      if (res.success) {
        setShowPolicyModal(false);
        setSuccess("Resource policy attached.");
        router.refresh();
      } else {
        setError(res.error || "Failed to attach resource policy.");
      }
    });
  };

  const handleDeletePolicy = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteResourcePolicyAction(secret.name);
      if (res.success) {
        setSuccess("Resource policy removed.");
        router.refresh();
      } else {
        setError(res.error || "Failed to remove resource policy.");
      }
    });
  };

  // Save Tags
  const handleSaveTags = () => {
    setError(null);
    const existingKeys = (secret.tags || []).map((t) => t.key);
    const updatedKeys = tagsList.map((t) => t.key);
    const keysToRemove = existingKeys.filter((k) => !updatedKeys.includes(k));

    startTransition(async () => {
      if (keysToRemove.length > 0) {
        await removeTagsAction(secret.name, keysToRemove);
      }
      if (tagsList.length > 0) {
        await addTagsAction(secret.name, tagsList);
      }
      setShowTagsModal(false);
      setSuccess("Tags updated.");
      router.refresh();
    });
  };

  // Delete Confirm
  const handleDeleteConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteSecretAction(secret.name, recoveryDays, deleteForce);
      if (res.success) {
        setShowDeleteModal(false);
        if (deleteForce) {
          router.push("/secretsmanager");
        } else {
          setSuccess(`Secret is scheduled for deletion on ${res.deletionDate}.`);
          router.refresh();
        }
      } else {
        setError(res.error || "Failed to delete secret.");
      }
    });
  };

  // Restore Confirm
  const handleRestoreConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await restoreSecretAction(secret.name);
      if (res.success) {
        setShowRestoreModal(false);
        setSuccess("Secret restored to active status.");
        router.refresh();
      } else {
        setError(res.error || "Failed to restore secret.");
      }
    });
  };

  // Helper to parse key/value object
  let parsedKvObject: Record<string, string> | null = null;
  if (valueRetrieved && secretString) {
    try {
      const parsed = JSON.parse(secretString);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        parsedKvObject = parsed;
      }
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/secretsmanager" className="text-[#0972d3] hover:underline">
            Secrets
          </Link>{" "}
          &gt; {secret.name}
        </div>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-bold text-[#16191f]">{secret.name}</h1>
            {secret.status === "ScheduledForDeletion" ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fdf2f2] text-[#d13212] border border-[#f5c6cb]">
                Scheduled for deletion ({secret.daysUntilDeletion ?? 0} days remaining)
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f8f2] text-[#1d8102] border border-[#c3e6cb]">
                Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 relative">
            {secret.status === "ScheduledForDeletion" ? (
              <button
                onClick={() => setShowRestoreModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 rounded font-bold text-[13px] text-white bg-[#1d8102] hover:bg-[#186a02]"
              >
                Restore secret
              </button>
            ) : (
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#ba270b] rounded text-[13px] font-semibold text-[#ba270b] hover:bg-[#fdf2f2]"
              >
                Delete secret
              </button>
            )}

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setActionMenuOpen(!actionMenuOpen)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-3 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa] flex items-center gap-1"
              >
                Actions
                <span className="text-[10px]">▼</span>
              </button>

              {actionMenuOpen && (
                <div
                  className="absolute right-0 mt-1 w-56 bg-white border border-[#eaeded] rounded shadow-lg py-1 z-30 text-[13px]"
                  onMouseLeave={() => setActionMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      setActionMenuOpen(false);
                      setShowEditDescModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-[#16191f] hover:bg-[#f2f8fd]"
                  >
                    Edit name and description
                  </button>
                  <button
                    onClick={() => {
                      setActionMenuOpen(false);
                      setShowPolicyModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-[#16191f] hover:bg-[#f2f8fd]"
                  >
                    Edit permissions (resource policy)
                  </button>
                  <button
                    onClick={() => {
                      setActionMenuOpen(false);
                      setShowTagsModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-[#16191f] hover:bg-[#f2f8fd]"
                  >
                    Edit tags
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded flex justify-between items-center text-[13px] text-[#900]">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[12px] font-semibold text-[#545b64] hover:underline">
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-[#f2f8f2] border border-[#1d8102] rounded flex justify-between items-center text-[13px] text-[#1d8102]">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-[12px] font-semibold text-[#545b64] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1: Secret Details */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-[#eaeded] pb-3">
          <h2 className="text-[16px] font-bold text-[#16191f]">Secret details</h2>
          <button
            onClick={() => setShowEditDescModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
          >
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-[13px]">
          <div>
            <div className="font-semibold text-[#545b64]">Secret ARN</div>
            <div className="mt-1 flex items-center gap-2 font-mono text-[12px] text-[#16191f] break-all bg-[#fafafa] p-2 border border-[#eaeded] rounded">
              <span>{secret.arn}</span>
              <button
                onClick={() => handleCopy(secret.arn, "arn")}
                className="text-[#0972d3] font-sans font-semibold hover:underline whitespace-nowrap ml-auto"
              >
                {copiedKey === "arn" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <div className="font-semibold text-[#545b64]">Description</div>
            <div className="mt-1 text-[#16191f]">{secret.description || "-"}</div>
          </div>

          <div>
            <div className="font-semibold text-[#545b64]">Encryption key</div>
            <div className="mt-1 text-[#16191f]">
              {secret.kmsKeyId ? (
                <span className="font-mono text-[12px]">{secret.kmsKeyId}</span>
              ) : (
                "aws/secretsmanager (Default AWS managed key)"
              )}
            </div>
          </div>

          <div>
            <div className="font-semibold text-[#545b64]">Created date</div>
            <div className="mt-1 text-[#16191f]">{secret.createdDate || "-"}</div>
          </div>

          <div>
            <div className="font-semibold text-[#545b64]">Last changed</div>
            <div className="mt-1 text-[#16191f]">{secret.lastChangedDate || "-"}</div>
          </div>

          <div>
            <div className="font-semibold text-[#545b64]">Last accessed</div>
            <div className="mt-1 text-[#16191f]">{secret.lastAccessedDate || "-"}</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Secret Value */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-[#eaeded] pb-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Secret value</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Secret values are encrypted at rest using your KMS key and masked from unauthorized display.
            </p>
          </div>
          {valueRetrieved && (
            <button
              onClick={handleOpenEditValue}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
            >
              Edit secret value
            </button>
          )}
        </div>

        {!valueRetrieved ? (
          <div className="bg-[#fafafa] border border-dashed border-[#d5dbdb] rounded p-8 text-center space-y-3">
            <div className="text-[14px] font-semibold text-[#16191f]">
              Secret value is hidden for security
            </div>
            <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
              Click the button below to decrypt and view the current secret value.
            </p>
            <div className="pt-1">
              <button
                onClick={handleRetrieveValue}
                disabled={retrievalPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 rounded font-bold text-[13px] text-white bg-[#ec7211] hover:bg-[#eb5f07]"
              >
                {retrievalPending ? "Decrypting..." : "Retrieve secret value"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex border border-[#aab7b8] rounded overflow-hidden text-[12px]">
                <button
                  onClick={() => setValViewTab("KEY_VALUE")}
                  disabled={!parsedKvObject}
                  className={`px-3 py-1 font-semibold ${
                    valViewTab === "KEY_VALUE"
                      ? "bg-[#0972d3] text-white"
                      : "bg-white text-[#16191f] hover:bg-[#fafafa] disabled:opacity-50"
                  }`}
                >
                  Key/value
                </button>
                <button
                  onClick={() => setValViewTab("PLAINTEXT")}
                  className={`px-3 py-1 font-semibold border-l border-[#aab7b8] ${
                    valViewTab === "PLAINTEXT"
                      ? "bg-[#0972d3] text-white"
                      : "bg-white text-[#16191f] hover:bg-[#fafafa]"
                  }`}
                >
                  Plaintext
                </button>
              </div>

              <button
                onClick={() => setValueRetrieved(false)}
                className="text-[12px] font-semibold text-[#545b64] hover:underline"
              >
                Hide secret value
              </button>
            </div>

            {valViewTab === "KEY_VALUE" && parsedKvObject ? (
              <div className="border border-[#eaeded] rounded overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                      <th className="py-2.5 px-4 font-semibold w-1/3">Key</th>
                      <th className="py-2.5 px-4 font-semibold">Value</th>
                      <th className="py-2.5 px-4 font-semibold w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {Object.entries(parsedKvObject).map(([k, v]) => {
                      const isMasked = maskedKeys[k] ?? true;
                      return (
                        <tr key={k} className="hover:bg-[#fbfbfb]">
                          <td className="py-2.5 px-4 font-semibold text-[#16191f]">{k}</td>
                          <td className="py-2.5 px-4 font-mono text-[12px] text-[#16191f]">
                            {isMasked ? "••••••••••••" : v}
                          </td>
                          <td className="py-2.5 px-4 text-right space-x-2">
                            <button
                              onClick={() =>
                                setMaskedKeys({ ...maskedKeys, [k]: !isMasked })
                              }
                              className="text-[11px] font-semibold text-[#0972d3] hover:underline"
                            >
                              {isMasked ? "Show" : "Hide"}
                            </button>
                            <button
                              onClick={() => handleCopy(v, `val_${k}`)}
                              className="text-[11px] font-semibold text-[#0972d3] hover:underline"
                            >
                              {copiedKey === `val_${k}` ? "Copied" : "Copy"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="relative">
                <pre className="bg-[#16191f] text-[#d5dbdb] p-4 rounded text-[12px] font-mono overflow-x-auto leading-relaxed">
                  {secretString}
                </pre>
                <button
                  onClick={() => handleCopy(secretString || "", "raw_val")}
                  className="absolute top-2 right-2 text-[11px] font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
                >
                  {copiedKey === "raw_val" ? "Copied" : "Copy"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: Rotation Configuration */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-[#eaeded] pb-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Rotation configuration</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Automated rotation uses an AWS Lambda function to update credentials on a recurring schedule.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
          <div>
            <div className="font-semibold text-[#545b64]">Rotation status</div>
            <div className="mt-1">
              {secret.rotationEnabled ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e7f4fb] text-[#0972d3] border border-[#b8daff]">
                  Enabled
                </span>
              ) : (
                <span className="text-[#545b64]">Disabled</span>
              )}
            </div>
          </div>

          <div>
            <div className="font-semibold text-[#545b64]">Schedule</div>
            <div className="mt-1 text-[#16191f]">
              {secret.rotationRules?.automaticallyAfterDays
                ? `Every ${secret.rotationRules.automaticallyAfterDays} days`
                : "-"}
            </div>
          </div>

          <div>
            <div className="font-semibold text-[#545b64]">Rotation Lambda function</div>
            <div className="mt-1 font-mono text-[12px] text-[#16191f] break-all">
              {secret.rotationLambdaArn || "-"}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Resource Policy */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-[#eaeded] pb-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Resource permissions</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Control which AWS IAM principals have access to this secret across accounts.
            </p>
          </div>
          <div className="flex gap-2">
            {secret.resourcePolicy && (
              <button
                onClick={handleDeletePolicy}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-3 border border-[#ba270b] rounded text-[13px] font-semibold text-[#ba270b] hover:bg-[#fdf2f2]"
              >
                Delete permissions
              </button>
            )}
            <button
              onClick={() => setShowPolicyModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
            >
              Edit permissions
            </button>
          </div>
        </div>

        {secret.resourcePolicy ? (
          <pre className="bg-[#16191f] text-[#d5dbdb] p-4 rounded text-[12px] font-mono overflow-x-auto leading-relaxed">
            {secret.resourcePolicy}
          </pre>
        ) : (
          <div className="text-[13px] text-[#545b64] italic">
            No resource policy attached. Secret access is controlled by IAM identity policies.
          </div>
        )}
      </div>

      {/* SECTION 5: Tags */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-[#eaeded] pb-3">
          <h2 className="text-[16px] font-bold text-[#16191f]">Tags ({secret.tags.length})</h2>
          <button
            onClick={() => {
              setTagsList(secret.tags || []);
              setShowTagsModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
          >
            Edit tags
          </button>
        </div>

        {secret.tags.length === 0 ? (
          <div className="text-[13px] text-[#545b64] italic">No tags attached to this secret.</div>
        ) : (
          <div className="border border-[#eaeded] rounded overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <th className="py-2.5 px-4 font-semibold w-1/2">Tag key</th>
                  <th className="py-2.5 px-4 font-semibold w-1/2">Tag value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {secret.tags.map((t) => (
                  <tr key={t.key} className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-4 font-semibold text-[#16191f]">{t.key}</td>
                    <td className="py-2.5 px-4 text-[#545b64]">{t.value || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 6: Version History */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <div className="border-b border-[#eaeded] pb-3">
          <h2 className="text-[16px] font-bold text-[#16191f]">
            Secret versions ({versions.length})
          </h2>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Every secret update creates a new immutable version with staging labels.
          </p>
        </div>

        <div className="border border-[#eaeded] rounded overflow-hidden">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <th className="py-2.5 px-4 font-semibold">Version ID</th>
                <th className="py-2.5 px-4 font-semibold">Staging labels</th>
                <th className="py-2.5 px-4 font-semibold">Created date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {versions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-[#545b64]">
                    No versions found.
                  </td>
                </tr>
              ) : (
                versions.map((v) => (
                  <tr key={v.versionId} className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-4 font-mono text-[12px] text-[#16191f]">
                      {v.versionId}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {v.versionStages.map((stg) => (
                          <span
                            key={stg}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              stg === "AWSCURRENT"
                                ? "bg-[#f2f8f2] text-[#1d8102] border border-[#c3e6cb]"
                                : "bg-[#f4f5f5] text-[#545b64] border border-[#eaeded]"
                            }`}
                          >
                            {stg}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-[#545b64] whitespace-nowrap">
                      {v.createdDate || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 7: Sample Code */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-[#eaeded] pb-3">
          <h2 className="text-[16px] font-bold text-[#16191f]">Sample code</h2>
          <div className="flex border border-[#aab7b8] rounded overflow-hidden text-[12px]">
            <button
              onClick={() => setSampleCodeTab("NODE")}
              className={`px-3 py-1 font-semibold ${
                sampleCodeTab === "NODE"
                  ? "bg-[#0972d3] text-white"
                  : "bg-white text-[#16191f] hover:bg-[#fafafa]"
              }`}
            >
              JavaScript (AWS SDK v3)
            </button>
            <button
              onClick={() => setSampleCodeTab("PYTHON")}
              className={`px-3 py-1 font-semibold border-l border-[#aab7b8] ${
                sampleCodeTab === "PYTHON"
                  ? "bg-[#0972d3] text-white"
                  : "bg-white text-[#16191f] hover:bg-[#fafafa]"
              }`}
            >
              Python (boto3)
            </button>
            <button
              onClick={() => setSampleCodeTab("CLI")}
              className={`px-3 py-1 font-semibold border-l border-[#aab7b8] ${
                sampleCodeTab === "CLI"
                  ? "bg-[#0972d3] text-white"
                  : "bg-white text-[#16191f] hover:bg-[#fafafa]"
              }`}
            >
              AWS CLI
            </button>
          </div>
        </div>

        <pre className="bg-[#16191f] text-[#d5dbdb] p-4 rounded text-[12px] font-mono overflow-x-auto leading-relaxed">
          {sampleCodeTab === "NODE" &&
`import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });
const response = await client.send(
  new GetSecretValueCommand({ SecretId: "${secret.name}" })
);
const secret = response.SecretString;
console.log("Secret value:", secret);`}

          {sampleCodeTab === "PYTHON" &&
`import boto3

client = boto3.client("secretsmanager", region_name="us-east-1")
response = client.get_secret_value(SecretId="${secret.name}")
secret = response["SecretString"]
print("Secret value:", secret)`}

          {sampleCodeTab === "CLI" &&
`aws secretsmanager get-secret-value \\
  --secret-id "${secret.name}" \\
  --region us-east-1`}
        </pre>
      </div>

      {/* MODAL 1: Edit Secret Value */}
      {showEditValueModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-xl w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit secret value</h3>
            <p className="text-[13px] text-[#545b64]">
              Updating this value will create a new secret version and assign the AWSCURRENT staging label to it.
            </p>

            <div className="flex border border-[#aab7b8] rounded overflow-hidden text-[12px] w-fit">
              <button
                type="button"
                onClick={() => setEditValMode("KEY_VALUE")}
                className={`px-3 py-1 font-semibold ${
                  editValMode === "KEY_VALUE" ? "bg-[#0972d3] text-white" : "bg-white text-[#16191f]"
                }`}
              >
                Key/value
              </button>
              <button
                type="button"
                onClick={() => setEditValMode("PLAINTEXT")}
                className={`px-3 py-1 font-semibold border-l border-[#aab7b8] ${
                  editValMode === "PLAINTEXT" ? "bg-[#0972d3] text-white" : "bg-white text-[#16191f]"
                }`}
              >
                Plaintext
              </button>
            </div>

            {editValMode === "KEY_VALUE" ? (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {editKvRows.map((r, idx) => (
                  <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Key"
                      value={r.key}
                      onChange={(e) => {
                        const copy = [...editKvRows];
                        copy[idx].key = e.target.value;
                        setEditKvRows(copy);
                      }}
                      className="col-span-5 text-[13px] px-2.5 py-1.5 border border-[#aab7b8] rounded"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={r.val}
                      onChange={(e) => {
                        const copy = [...editKvRows];
                        copy[idx].val = e.target.value;
                        setEditKvRows(copy);
                      }}
                      className="col-span-6 text-[13px] px-2.5 py-1.5 border border-[#aab7b8] rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setEditKvRows(editKvRows.filter((_, i) => i !== idx))}
                      className="col-span-1 text-[12px] font-semibold text-[#ba270b] hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setEditKvRows([...editKvRows, { id: Date.now().toString(), key: "", val: "" }])
                  }
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-3 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
                >
                  Add row
                </button>
              </div>
            ) : (
              <textarea
                rows={6}
                value={editPlaintext}
                onChange={(e) => setEditPlaintext(e.target.value)}
                className="w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded"
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEditValueModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveValue}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 rounded font-bold text-[13px] text-white bg-[#ec7211] hover:bg-[#eb5f07]"
              >
                {isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Name & Description & KMS Key */}
      {showEditDescModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Edit description and encryption key
            </h3>

            <div className="space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-2.5 border border-[#aab7b8] rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Encryption key</label>
                <select
                  value={editKmsKey}
                  onChange={(e) => setEditKmsKey(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded"
                >
                  <option value="default">aws/secretsmanager (Default managed key)</option>
                  {kmsKeys.map((k) => (
                    <option key={k.keyId} value={k.keyId}>
                      {k.alias ? `${k.alias} (${k.keyId})` : k.keyId}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEditDescModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDescAndKms}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 rounded font-bold text-[13px] text-white bg-[#ec7211] hover:bg-[#eb5f07]"
              >
                {isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Permissions (Resource Policy) */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Edit permissions (resource policy)
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Enter a valid IAM policy document in JSON format to grant cross-account or resource-level access.
            </p>

            <textarea
              rows={10}
              placeholder='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::000000000000:root" },
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "*"
    }
  ]
}'
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              className="w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPolicyModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePolicy}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 rounded font-bold text-[13px] text-white bg-[#ec7211] hover:bg-[#eb5f07]"
              >
                {isPending ? "Attaching..." : "Save policy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Tags */}
      {showTagsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit tags</h3>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={newTagKey}
                  onChange={(e) => setNewTagKey(e.target.value)}
                  className="flex-1 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newTagVal}
                  onChange={(e) => setNewTagVal(e.target.value)}
                  className="flex-1 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTagKey.trim()) {
                      setTagsList([...tagsList, { key: newTagKey.trim(), value: newTagVal.trim() }]);
                      setNewTagKey("");
                      setNewTagVal("");
                    }
                  }}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-3 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
                >
                  Add
                </button>
              </div>

              <div className="border border-[#eaeded] rounded divide-y divide-[#eaeded] max-h-48 overflow-y-auto text-[13px]">
                {tagsList.length === 0 ? (
                  <div className="p-3 text-center text-[#545b64] italic">No tags</div>
                ) : (
                  tagsList.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5">
                      <div>
                        <span className="font-semibold text-[#16191f]">{t.key}</span>:{" "}
                        <span className="text-[#545b64]">{t.value || "-"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTagsList(tagsList.filter((_, i) => i !== idx))}
                        className="text-[12px] font-semibold text-[#ba270b] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTagsModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTags}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-5 rounded font-bold text-[13px] text-white bg-[#ec7211] hover:bg-[#eb5f07]"
              >
                {isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Delete Secret */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete secret: {secret.name}
            </h3>

            <p className="text-[13px] text-[#545b64] leading-relaxed">
              When you delete a secret, Secrets Manager schedules it for deletion after a recovery window. You can restore a secret at any time before the recovery window expires.
            </p>

            <div className="space-y-3 bg-[#fafafa] p-4 border border-[#eaeded] rounded text-[13px]">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="delete_mode"
                  checked={!deleteForce}
                  onChange={() => setDeleteForce(false)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-semibold text-[#16191f]">Schedule deletion with recovery window</span>
                  <div className="text-[#545b64] text-[12px] mt-0.5">
                    Waiting period before permanent destruction (7 to 30 days):
                  </div>
                  {!deleteForce && (
                    <input
                      type="number"
                      min={7}
                      max={30}
                      value={recoveryDays}
                      onChange={(e) => setRecoveryDays(Math.max(7, Math.min(30, parseInt(e.target.value) || 7)))}
                      className="mt-2 w-24 text-[13px] px-2 py-1 border border-[#aab7b8] rounded"
                    />
                  )}
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer pt-2 border-t border-[#eaeded]">
                <input
                  type="radio"
                  name="delete_mode"
                  checked={deleteForce}
                  onChange={() => setDeleteForce(true)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-semibold text-[#ba270b]">Delete immediately without recovery</span>
                  <div className="text-[#545b64] text-[12px] mt-0.5">
                    Irreversible. Secret value and all version history will be permanently destroyed.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 rounded text-[13px] font-bold text-white bg-[#ba270b] hover:bg-[#a02209]"
              >
                {isPending ? "Deleting..." : "Delete secret"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Restore Secret */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Restore secret: {secret.name}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              This will cancel the scheduled deletion for secret &quot;{secret.name}&quot; and immediately return it to active status.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRestoreModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreConfirm}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 rounded text-[13px] font-bold text-white bg-[#1d8102] hover:bg-[#186a02]"
              >
                {isPending ? "Restoring..." : "Restore secret"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
