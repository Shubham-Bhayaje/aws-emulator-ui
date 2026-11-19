/**
 * src/app/kms/CustomerKeysClient.tsx – Customer Managed Keys Client Component.
 * Zero emojis, Cloudscape enterprise standard.
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

  // Modals
  const [showScheduleDeletionModal, setShowScheduleDeletionModal] = useState(false);
  const [deletionDays, setDeletionDays] = useState(7);
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
    return !search || aliasMatch || idMatch || descMatch;
  });

  const enabledCount = keys.filter((k) => k.keyState === "Enabled").length;
  const disabledCount = keys.filter((k) => k.keyState === "Disabled").length;
  const pendingDeletionCount = keys.filter((k) => k.keyState === "PendingDeletion").length;

  const handleEnable = () => {
    if (!selectedKeyId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await enableKeyAction(selectedKeyId);
      if (res.success) {
        setSuccess(`Key ${selectedKeyId} enabled successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to enable key.");
      }
    });
  };

  const handleDisable = () => {
    if (!selectedKeyId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await disableKeyAction(selectedKeyId);
      if (res.success) {
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
        setSuccess(`Key ${selectedKeyId} scheduled for deletion in ${deletionDays} days.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to schedule key deletion.");
      }
    });
  };

  const handleCancelDeletion = () => {
    if (!selectedKeyId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await cancelKeyDeletionAction(selectedKeyId);
      if (res.success) {
        setSuccess(`Scheduled deletion canceled for key ${selectedKeyId}.`);
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
    <div>
      {/* Alerts */}
      {success && (
        <div className="mb-4 bg-[#f2f8f0] border border-[#1d8102] rounded p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-[#fdf3f1] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">Customer Managed Keys</div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">{keys.length}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Keys created and managed in this account</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">Enabled Keys</div>
          <div className="text-[28px] font-bold text-[#1d8102] mt-1">{enabledCount}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Ready for cryptographic operations</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">Disabled Keys</div>
          <div className="text-[28px] font-bold text-[#545b64] mt-1">{disabledCount}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Temporarily blocked from usage</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">Pending Deletion</div>
          <div className="text-[28px] font-bold text-[#d13212] mt-1">{pendingDeletionCount}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Scheduled for permanent removal</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-[#eaeded] rounded-t p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by alias, key ID, or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[320px] border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#ec7211]"
          />
          {selectedKey && (
            <div className="text-[12px] text-[#545b64] font-medium bg-[#f2f3f3] px-2.5 py-1 rounded border border-[#eaeded]">
              Selected: <span className="font-bold text-[#16191f]">{selectedKey.aliases[0] || selectedKey.keyId}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Create Key */}
          <Link
            href="/kms/keys/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
          >
            Create key
          </Link>

          {/* Key Actions */}
          {selectedKey && (
            <>
              {selectedKey.keyState === "Disabled" && (
                <button
                  disabled={isPending}
                  onClick={handleEnable}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
                >
                  Enable
                </button>
              )}

              {selectedKey.keyState === "Enabled" && (
                <button
                  disabled={isPending}
                  onClick={handleDisable}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
                >
                  Disable
                </button>
              )}

              {selectedKey.keyState !== "PendingDeletion" ? (
                <button
                  disabled={isPending}
                  onClick={() => setShowScheduleDeletionModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#d13212] text-[#d13212] hover:bg-[#fdf3f1] px-3 rounded transition-colors"
                >
                  Schedule key deletion
                </button>
              ) : (
                <button
                  disabled={isPending}
                  onClick={handleCancelDeletion}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#1d8102] text-[#1d8102] hover:bg-[#f2f8f0] px-3 rounded transition-colors"
                >
                  Cancel key deletion
                </button>
              )}

              <button
                onClick={() => setShowCreateAliasModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
              >
                Create alias
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-t-0 border-[#eaeded] rounded-b overflow-x-auto shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4 w-[40px]"></th>
              <th className="py-2.5 px-4">Aliases</th>
              <th className="py-2.5 px-4">Key ID</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Key type</th>
              <th className="py-2.5 px-4">Key spec</th>
              <th className="py-2.5 px-4">Creation date</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
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
                    {k.keySpec.includes("SYMMETRIC") ? "Symmetric" : "Asymmetric"}
                  </td>
                  <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">{k.keySpec}</td>
                  <td className="py-3 px-4 text-[#545b64]">{k.creationDate}</td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/kms/keys/${k.keyId}`}
                      className="text-[#0972d3] hover:underline font-medium text-[12px]"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filteredKeys.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#545b64]">
                  No customer managed keys found. Click &quot;Create key&quot; to generate an encryption key.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Schedule Key Deletion */}
      {showScheduleDeletionModal && selectedKey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#d13212]">Schedule key deletion</h2>
              <button onClick={() => setShowScheduleDeletionModal(false)} className="text-[#545b64] font-bold text-lg">
                X
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Schedule key <strong className="text-[#16191f]">{selectedKey.aliases[0] || selectedKey.keyId}</strong> for
                deletion. The key will immediately transition to <em>Pending deletion</em> state and cannot be used to
                encrypt or decrypt data.
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
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowScheduleDeletionModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={handleScheduleDeletion}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#d13212] hover:bg-[#b02a0f] text-white px-4 rounded shadow-sm"
              >
                {isPending ? "Scheduling..." : "Schedule deletion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Alias */}
      {showCreateAliasModal && selectedKey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Create alias</h2>
              <button onClick={() => setShowCreateAliasModal(false)} className="text-[#545b64] font-bold text-lg">
                X
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
                  Alias names must be unique within the account and region. Prefix &quot;alias/&quot; will be added if
                  omitted.
                </p>
              </div>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateAliasModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending || !newAliasName.trim()}
                onClick={handleCreateAlias}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm disabled:opacity-50"
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
