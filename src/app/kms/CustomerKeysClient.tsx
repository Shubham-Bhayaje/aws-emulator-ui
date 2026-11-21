/**
 * src/app/kms/CustomerKeysClient.tsx – Customer Managed Keys Client Component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KMSKeySummary,
  enableKeyAction,
  disableKeyAction,
  scheduleKeyDeletionAction,
  cancelKeyDeletionAction,
  createAliasAction,
} from "./actions";

interface CustomerKeysClientProps {
  keys: KMSKeySummary[];
}

export function CustomerKeysClient({ keys }: CustomerKeysClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  // Modals
  const [showScheduleDeletionModal, setShowScheduleDeletionModal] = useState(false);
  const [deletionDays, setDeletionDays] = useState(7);
  const [confirmDeletionCheck, setConfirmDeletionCheck] = useState(false);

  const [showCancelDeletionModal, setShowCancelDeletionModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showCreateAliasModal, setShowCreateAliasModal] = useState(false);
  const [newAliasName, setNewAliasName] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedKey = keys.find((k) => k.keyId === selectedKeyId);

  const filteredKeys = keys.filter((k) => {
    const term = search.toLowerCase();
    const aliasMatch = k.aliases.some((a) => a.toLowerCase().includes(term));
    const idMatch = k.keyId.toLowerCase().includes(term);
    const descMatch = k.description.toLowerCase().includes(term);
    const specMatch = k.keySpec.toLowerCase().includes(term);
    const usageMatch = k.keyUsage.toLowerCase().includes(term);
    const stateMatch = k.keyState.toLowerCase().includes(term);
    return !search || aliasMatch || idMatch || descMatch || specMatch || usageMatch || stateMatch;
  });

  const enabledCount = keys.filter((k) => k.keyState === "Enabled").length;
  const disabledCount = keys.filter((k) => k.keyState === "Disabled").length;
  const pendingDeletionCount = keys.filter((k) => k.keyState === "PendingDeletion").length;

  const handleEnableConfirm = () => {
    if (!selectedKeyId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await enableKeyAction(selectedKeyId);
      if (res.success) {
        setShowEnableModal(false);
        setSuccess(`Key ${selectedKeyId} enabled successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to enable key.");
      }
    });
  };

  const handleDisableConfirm = () => {
    if (!selectedKeyId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await disableKeyAction(selectedKeyId);
      if (res.success) {
        setShowDisableModal(false);
        setSuccess(`Key ${selectedKeyId} disabled.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to disable key.");
      }
    });
  };

  const handleScheduleDeletion = () => {
    if (!selectedKeyId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await scheduleKeyDeletionAction(selectedKeyId, deletionDays);
      if (res.success) {
        setShowScheduleDeletionModal(false);
        setConfirmDeletionCheck(false);
        setSuccess(`Key ${selectedKeyId} scheduled for deletion in ${deletionDays} days.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to schedule key deletion.");
      }
    });
  };

  const handleCancelDeletionConfirm = () => {
    if (!selectedKeyId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await cancelKeyDeletionAction(selectedKeyId);
      if (res.success) {
        setShowCancelDeletionModal(false);
        setSuccess(`Scheduled deletion canceled for key ${selectedKeyId}. State changed to Disabled.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to cancel key deletion.");
      }
    });
  };

  const handleCreateAlias = () => {
    if (!selectedKeyId || !newAliasName.trim()) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await createAliasAction(selectedKeyId, newAliasName);
      if (res.success) {
        setShowCreateAliasModal(false);
        setNewAliasName("");
        setSuccess(`Alias created successfully for key ${selectedKeyId}.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create alias.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">
            Customer managed keys ({keys.length})
          </h1>
          <p className="text-[13px] text-[#545b64] mt-1 max-w-4xl">
            Customer managed keys are KMS keys in your AWS account that you create, own, and manage. You have full control over these KMS keys, including establishing and maintaining their key policies, IAM policies, and grants, enabling and disabling them, rotating their cryptographic material, adding tags, creating aliases that refer to the KMS keys, and scheduling the keys for deletion.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-[#f2f8f0] border border-[#1d8102] rounded p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">Customer Managed Keys</div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{keys.length}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Total in this AWS Region</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">Enabled Keys</div>
          <div className="text-[24px] font-bold text-[#1d8102] mt-1">{enabledCount}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Active and ready for crypto operations</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">Disabled Keys</div>
          <div className="text-[24px] font-bold text-[#545b64] mt-1">{disabledCount}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Blocked from cryptographic use</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">Pending Deletion</div>
          <div className="text-[24px] font-bold text-[#d13212] mt-1">{pendingDeletionCount}</div>
          <div className="text-[12px] text-[#545b64] mt-1">In 7 to 30 day waiting period</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Find keys by alias, key ID, or spec"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[320px] border border-[#aab7b8] rounded px-3 py-1 text-[13px] text-[#16191f] focus:outline-none focus:border-[#ec7211]"
            />
            <button
              onClick={() => router.refresh()}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
            >
              Refresh
            </button>
            {selectedKey && (
              <span className="text-[12px] text-[#545b64] bg-[#f2f3f3] px-2.5 py-1 rounded border border-[#eaeded]">
                Selected: <span className="font-bold text-[#16191f]">{selectedKey.aliases[0] || selectedKey.keyId}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Key actions dropdown */}
            <div className="relative">
              <button
                disabled={!selectedKey}
                onClick={() => setActionMenuOpen(!actionMenuOpen)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Key actions
                <span className="ml-1 text-[10px]">▼</span>
              </button>

              {actionMenuOpen && selectedKey && (
                <div
                  className="absolute right-0 mt-1 w-56 bg-white border border-[#eaeded] rounded shadow-lg py-1 z-30 text-[13px]"
                  onMouseLeave={() => setActionMenuOpen(false)}
                >
                  {selectedKey.keyState === "Disabled" && (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        setShowEnableModal(true);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f2f8fc] text-[#16191f]"
                    >
                      Enable
                    </button>
                  )}

                  {selectedKey.keyState === "Enabled" && (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        setShowDisableModal(true);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f2f8fc] text-[#16191f]"
                    >
                      Disable
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActionMenuOpen(false);
                      setShowCreateAliasModal(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f2f8fc] text-[#16191f]"
                  >
                    Create alias
                  </button>

                  {selectedKey.keyState !== "PendingDeletion" ? (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        setShowScheduleDeletionModal(true);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#fdf3f1] text-[#d13212]"
                    >
                      Schedule key deletion
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        setShowCancelDeletionModal(true);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f2f8f0] text-[#1d8102]"
                    >
                      Cancel key deletion
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Create Key */}
            <Link
              href="/kms/keys/create"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
            >
              Create key
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-[40px]"></th>
                <th className="py-2.5 px-4">Aliases</th>
                <th className="py-2.5 px-4">Key ID</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Key type</th>
                <th className="py-2.5 px-4">Key spec</th>
                <th className="py-2.5 px-4">Key usage</th>
                <th className="py-2.5 px-4">Deletion date</th>
                <th className="py-2.5 px-4">Creation date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredKeys.map((k) => {
                const isSelected = selectedKeyId === k.keyId;

                return (
                  <tr
                    key={k.keyId}
                    onClick={() => setSelectedKeyId(isSelected ? null : k.keyId)}
                    className={`hover:bg-[#f2f8fc] cursor-pointer transition-colors ${
                      isSelected ? "bg-[#ebf4fa]" : ""
                    }`}
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="selectedKey"
                        checked={isSelected}
                        onChange={() => setSelectedKeyId(isSelected ? null : k.keyId)}
                        className="text-[#ec7211] focus:ring-0"
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {k.aliases.length > 0 ? (
                        <div className="space-y-0.5">
                          {k.aliases.map((a) => (
                            <Link
                              key={a}
                              href={`/kms/keys/${k.keyId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#0972d3] hover:underline block"
                            >
                              {a}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <Link
                          href={`/kms/keys/${k.keyId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#0972d3] hover:underline font-mono text-[12px]"
                        >
                          (No alias)
                        </Link>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px]">
                      <Link
                        href={`/kms/keys/${k.keyId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#545b64] hover:text-[#16191f] hover:underline"
                      >
                        {k.keyId}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                          k.keyState === "Enabled"
                            ? "bg-[#f2f8f0] text-[#1d8102]"
                            : k.keyState === "Disabled"
                            ? "bg-[#f2f3f3] text-[#545b64]"
                            : "bg-[#fdf3f1] text-[#d13212]"
                        }`}
                      >
                        {k.keyState === "PendingDeletion" ? "Pending deletion" : k.keyState}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">
                      {k.keySpec.includes("SYMMETRIC")
                        ? "Symmetric"
                        : k.keySpec.startsWith("HMAC")
                        ? "HMAC"
                        : "Asymmetric"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">{k.keySpec}</td>
                    <td className="py-3 px-4 text-[#545b64]">
                      {k.keyUsage === "ENCRYPT_DECRYPT"
                        ? "Encrypt and decrypt"
                        : k.keyUsage === "SIGN_VERIFY"
                        ? "Sign and verify"
                        : "Generate and verify MAC"}
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">{k.deletionDate || "-"}</td>
                    <td className="py-3 px-4 text-[#545b64]">{k.creationDate}</td>
                  </tr>
                );
              })}
              {filteredKeys.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#545b64]">
                    No customer managed keys found. Choose &quot;Create key&quot; to generate an encryption key.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Disable Key */}
      {showDisableModal && selectedKey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Disable key</h2>
              <button onClick={() => setShowDisableModal(false)} className="text-[#545b64] font-bold text-lg">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Disabling a KMS key makes it unusable. Are you sure you want to disable key <strong className="text-[#16191f]">{selectedKey.aliases[0] || selectedKey.keyId}</strong>?
              </p>
              <div className="bg-[#fdf3f1] border border-[#d13212] p-3 rounded text-[#d13212]">
                Applications attempting to encrypt or decrypt data with this key will fail while it is disabled.
              </div>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDisableModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={handleDisableConfirm}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                {isPending ? "Disabling..." : "Disable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Enable Key */}
      {showEnableModal && selectedKey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Enable key</h2>
              <button onClick={() => setShowEnableModal(false)} className="text-[#545b64] font-bold text-lg">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Enabling key <strong className="text-[#16191f]">{selectedKey.aliases[0] || selectedKey.keyId}</strong> restores its availability for cryptographic operations.
              </p>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEnableModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={handleEnableConfirm}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm"
              >
                {isPending ? "Enabling..." : "Enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Schedule Key Deletion */}
      {showScheduleDeletionModal && selectedKey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#d13212]">Schedule key deletion</h2>
              <button onClick={() => setShowScheduleDeletionModal(false)} className="text-[#545b64] font-bold text-lg">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Deleting a KMS key is a destructive and potentially irreversible operation. Cryptographic data encrypted under this key cannot be recovered after deletion.
              </p>
              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Waiting period (days)</label>
                <input
                  type="number"
                  min={7}
                  max={30}
                  value={deletionDays}
                  onChange={(e) => setDeletionDays(Math.max(7, Math.min(30, parseInt(e.target.value) || 7)))}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                />
                <p className="text-[11px] text-[#545b64] mt-1">AWS requires a waiting period between 7 and 30 days.</p>
              </div>
              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="confirmDelete"
                  checked={confirmDeletionCheck}
                  onChange={(e) => setConfirmDeletionCheck(e.target.checked)}
                  className="mt-0.5 text-[#ec7211] focus:ring-0"
                />
                <label htmlFor="confirmDelete" className="text-[12px] text-[#16191f] cursor-pointer">
                  Confirm that you want to delete this key at the end of the waiting period.
                </label>
              </div>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowScheduleDeletionModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending || !confirmDeletionCheck}
                onClick={handleScheduleDeletion}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-[#d13212] hover:bg-[#b02a0f] text-white px-4 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Scheduling..." : "Schedule deletion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cancel Key Deletion */}
      {showCancelDeletionModal && selectedKey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Cancel key deletion</h2>
              <button onClick={() => setShowCancelDeletionModal(false)} className="text-[#545b64] font-bold text-lg">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Canceling deletion restores the KMS key to the <em>Disabled</em> state. You can enable it after deletion is canceled.
              </p>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCancelDeletionModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={handleCancelDeletionConfirm}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm"
              >
                {isPending ? "Canceling..." : "Cancel deletion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Alias */}
      {showCreateAliasModal && selectedKey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Create alias</h2>
              <button onClick={() => setShowCreateAliasModal(false)} className="text-[#545b64] font-bold text-lg">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Alias name</label>
                <input
                  type="text"
                  placeholder="alias/my-application-key"
                  value={newAliasName}
                  onChange={(e) => setNewAliasName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                />
                <p className="text-[11px] text-[#545b64] mt-1">
                  Prefix &quot;alias/&quot; will be automatically added if omitted.
                </p>
              </div>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateAliasModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending || !newAliasName.trim()}
                onClick={handleCreateAlias}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create alias"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
