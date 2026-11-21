/**
 * src/app/secretsmanager/SecretsClient.tsx – Secrets Manager Inventory Client.
 * Strict Cloudscape enterprise styling, 32px standard button heights, zero emojis.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SecretSummary } from "./types";
import { deleteSecretAction, restoreSecretAction } from "./actions";

interface SecretsClientProps {
  initialSecrets: SecretSummary[];
}

export function SecretsClient({ initialSecrets }: SecretsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  // Modals & Feedback
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteForce, setDeleteForce] = useState(false);
  const [recoveryDays, setRecoveryDays] = useState(7);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedSecret = initialSecrets.find((s) => s.name === selectedName);

  // Filtered secrets list
  const filteredSecrets = initialSecrets.filter((s) => {
    if (!showDeleted && s.status === "ScheduledForDeletion") {
      return false;
    }
    const term = search.toLowerCase();
    const nameMatch = s.name.toLowerCase().includes(term);
    const descMatch = (s.description || "").toLowerCase().includes(term);
    const tagMatch = s.tags.some(
      (t) => t.key.toLowerCase().includes(term) || t.value.toLowerCase().includes(term)
    );
    return !search || nameMatch || descMatch || tagMatch;
  });

  // Metrics
  const totalCount = initialSecrets.filter((s) => s.status === "Active").length;
  const deletedCount = initialSecrets.filter((s) => s.status === "ScheduledForDeletion").length;
  const rotatedCount = initialSecrets.filter((s) => s.rotationEnabled).length;

  const handleDeleteConfirm = () => {
    if (!selectedName) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteSecretAction(selectedName, recoveryDays, deleteForce);
      if (res.success) {
        setShowDeleteModal(false);
        setSelectedName(null);
        setSuccess(
          deleteForce
            ? `Secret "${selectedName}" was deleted permanently without recovery.`
            : `Secret "${selectedName}" is scheduled for deletion on ${res.deletionDate}.`
        );
        router.refresh();
      } else {
        setError(res.error || "Failed to delete secret.");
      }
    });
  };

  const handleRestoreConfirm = () => {
    if (!selectedName) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await restoreSecretAction(selectedName);
      if (res.success) {
        setShowRestoreModal(false);
        setSuccess(`Secret "${selectedName}" has been restored to active status.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to restore secret.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Secrets</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            AWS Secrets Manager helps you manage, retrieve, and rotate database credentials, application credentials, OAuth tokens, and API keys.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/secretsmanager/new"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
          >
            Store a new secret
          </Link>
        </div>
      </div>

      {/* Notifications */}
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
      {success && (
        <div className="p-3 bg-[#f2f8f2] border border-[#1d8102] rounded flex justify-between items-center text-[13px] text-[#1d8102]">
          <span>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="text-[12px] font-semibold text-[#545b64] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Total active secrets
          </div>
          <div className="text-[28px] font-light text-[#16191f] mt-1">{totalCount}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Scheduled for deletion
          </div>
          <div className="text-[28px] font-light text-[#ba270b] mt-1">{deletedCount}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wider">
            Rotation enabled
          </div>
          <div className="text-[28px] font-light text-[#1d8102] mt-1">{rotatedCount}</div>
        </div>
      </div>

      {/* Secrets Table Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Search secrets by name, description, or tag"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
            />
            <label className="flex items-center gap-2 text-[13px] text-[#16191f] whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="rounded border-[#aab7b8]"
              />
              Show secrets scheduled for deletion
            </label>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => router.refresh()}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#aab7b8] rounded text-[13px] font-semibold text-[#16191f] hover:bg-[#fafafa]"
            >
              Refresh
            </button>

            {/* Actions Menu */}
            <div className="relative">
              <button
                disabled={!selectedName}
                onClick={() => setActionMenuOpen(!actionMenuOpen)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`px-3 border rounded text-[13px] font-semibold flex items-center gap-1 ${
                  selectedName
                    ? "border-[#aab7b8] text-[#16191f] hover:bg-[#fafafa]"
                    : "border-[#eaeded] text-[#9ba7b6] cursor-not-allowed bg-[#fafafa]"
                }`}
              >
                Actions
                <span className="text-[10px]">▼</span>
              </button>

              {actionMenuOpen && selectedSecret && (
                <div
                  className="absolute right-0 mt-1 w-48 bg-white border border-[#eaeded] rounded shadow-lg py-1 z-30 text-[13px]"
                  onMouseLeave={() => setActionMenuOpen(false)}
                >
                  <Link
                    href={`/secretsmanager/${encodeURIComponent(selectedSecret.name)}`}
                    className="block px-4 py-2 text-[#16191f] hover:bg-[#f2f8fd] hover:text-[#0972d3]"
                    onClick={() => setActionMenuOpen(false)}
                  >
                    View details
                  </Link>

                  {selectedSecret.status === "ScheduledForDeletion" ? (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        setShowRestoreModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-[#1d8102] hover:bg-[#f2f8fd]"
                    >
                      Restore secret
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-[#ba270b] hover:bg-[#f2f8fd]"
                    >
                      Delete secret
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <th className="py-2.5 px-4 w-10"></th>
                <th className="py-2.5 px-4 font-semibold">Secret name</th>
                <th className="py-2.5 px-4 font-semibold">Description</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Rotation</th>
                <th className="py-2.5 px-4 font-semibold">Last changed</th>
                <th className="py-2.5 px-4 font-semibold">Last accessed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredSecrets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#545b64]">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="font-semibold text-[#16191f] text-[15px]">No secrets</div>
                      <p className="text-[13px]">
                        {search
                          ? "No secrets matched your search criteria."
                          : "You do not have any secrets in this Region."}
                      </p>
                      {!search && (
                        <div className="pt-1">
                          <Link
                            href="/secretsmanager/new"
                            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                          >
                            Store a new secret
                          </Link>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSecrets.map((s) => {
                  const isSelected = selectedName === s.name;
                  return (
                    <tr
                      key={s.arn}
                      onClick={() => setSelectedName(s.name)}
                      className={`cursor-pointer hover:bg-[#f8f9fa] transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : ""
                      }`}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="secret_select"
                          checked={isSelected}
                          onChange={() => setSelectedName(s.name)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        <Link
                          href={`/secretsmanager/${encodeURIComponent(s.name)}`}
                          className="text-[#0972d3] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {s.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-[#545b64] max-w-xs truncate">
                        {s.description || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {s.status === "ScheduledForDeletion" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fdf2f2] text-[#d13212] border border-[#f5c6cb]">
                            Scheduled for deletion ({s.daysUntilDeletion ?? 0} days)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f8f2] text-[#1d8102] border border-[#c3e6cb]">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#545b64]">
                        {s.rotationEnabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e7f4fb] text-[#0972d3] border border-[#b8daff]">
                            Enabled ({s.rotationRules?.automaticallyAfterDays ?? 30} days)
                          </span>
                        ) : (
                          <span className="text-[#545b64]">Disabled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#545b64] whitespace-nowrap">
                        {s.lastChangedDate || "-"}
                      </td>
                      <td className="py-3 px-4 text-[#545b64] whitespace-nowrap">
                        {s.lastAccessedDate || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Secret Modal */}
      {showDeleteModal && selectedSecret && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete secret: {selectedSecret.name}
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

      {/* Restore Secret Modal */}
      {showRestoreModal && selectedSecret && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Restore secret: {selectedSecret.name}
            </h3>
            <p className="text-[13px] text-[#545b64]">
              This will cancel the scheduled deletion for secret &quot;{selectedSecret.name}&quot; and immediately return it to active status.
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
