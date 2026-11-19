/**
 * src/app/organizations/accounts/[accountId]/AccountDetailClient.tsx – Account Details View.
 * Zero emojis, Cloudscape enterprise standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AccountRecord,
  SCPRecord,
  moveAccountAction,
  closeAccountAction,
  attachPolicyAction,
  detachPolicyAction,
} from "../../actions";

interface AccountDetailClientProps {
  account: AccountRecord;
  parentName: string;
  allParents: Array<{ id: string; name: string }>;
  attachedPolicies: SCPRecord[];
  availablePolicies: SCPRecord[];
}

export function AccountDetailClient({
  account,
  parentName,
  allParents,
  attachedPolicies,
  availablePolicies,
}: AccountDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"details" | "policies" | "tags">("details");

  // Modals
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAttachPolicyModal, setShowAttachPolicyModal] = useState(false);
  const [selectedPolicyToAttach, setSelectedPolicyToAttach] = useState(availablePolicies[0]?.id || "");
  const [destinationParent, setDestinationParent] = useState(account.parentId);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleMove = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await moveAccountAction(account.id, destinationParent);
      if (res.success) {
        setShowMoveModal(false);
        setSuccess(`Account moved to ${allParents.find((p) => p.id === destinationParent)?.name || destinationParent}.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to move account.");
      }
    });
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await closeAccountAction(account.id);
      if (res.success) {
        setShowCloseModal(false);
        setSuccess("Account has been closed.");
        router.refresh();
      } else {
        setError(res.error || "Failed to close account.");
      }
    });
  };

  const handleAttachPolicy = () => {
    if (!selectedPolicyToAttach) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const policy = availablePolicies.find((p) => p.id === selectedPolicyToAttach);
      const res = await attachPolicyAction(selectedPolicyToAttach, account.id, account.name, "ACCOUNT");
      if (res.success) {
        setShowAttachPolicyModal(false);
        setSuccess(`Policy ${policy?.name || selectedPolicyToAttach} attached successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to attach policy.");
      }
    });
  };

  const handleDetachPolicy = (policyId: string, policyName: string) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await detachPolicyAction(policyId, account.id);
      if (res.success) {
        setSuccess(`Policy ${policyName} detached.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to detach policy.");
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

      {/* Header Card */}
      <div className="bg-white border border-[#eaeded] rounded p-6 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#545b64] uppercase">[Account]</span>
              <h1 className="text-[22px] font-bold text-[#16191f]">{account.name}</h1>
              {account.isManagementAccount && (
                <span className="bg-[#f1faff] text-[#0073bb] border border-[#0073bb]/30 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                  Management account
                </span>
              )}
            </div>
            <div className="text-[13px] font-mono text-[#545b64] mt-1">ID: {account.id}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setError(null);
                setShowMoveModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
            >
              Move account
            </button>

            {!account.isManagementAccount && account.status !== "PENDING_CLOSURE" && (
              <button
                onClick={() => {
                  setError(null);
                  setShowCloseModal(true);
                }}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#d13212] text-[#d13212] hover:bg-[#fdf3f1] px-3 rounded transition-colors"
              >
                Close account
              </button>
            )}
          </div>
        </div>

        {/* Quick Grid Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#eaeded] text-[13px]">
          <div>
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Status</div>
            <div className="mt-1">
              <span
                className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                  account.status === "ACTIVE"
                    ? "bg-[#f2f8f0] text-[#1d8102]"
                    : account.status === "SUSPENDED"
                    ? "bg-[#fff8e1] text-[#b7791f]"
                    : "bg-[#f2f3f3] text-[#545b64]"
                }`}
              >
                {account.status}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Owner Email</div>
            <div className="text-[#16191f] font-medium mt-1">{account.email}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Parent Container</div>
            <div className="mt-1">
              {account.parentId.startsWith("ou-") ? (
                <Link href={`/organizations/ou/${account.parentId}`} className="text-[#0972d3] font-medium hover:underline">
                  {parentName}
                </Link>
              ) : (
                <span className="text-[#16191f] font-medium">{parentName}</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Joined Date</div>
            <div className="text-[#16191f] font-medium mt-1">
              {account.joinedTimestamp ? new Date(account.joinedTimestamp).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#eaeded] flex mb-6">
        <button
          onClick={() => setActiveTab("details")}
          className={`py-2.5 px-4 font-semibold text-[13px] border-b-2 transition-colors ${
            activeTab === "details"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab("policies")}
          className={`py-2.5 px-4 font-semibold text-[13px] border-b-2 transition-colors ${
            activeTab === "policies"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Policies ({attachedPolicies.length})
        </button>
        <button
          onClick={() => setActiveTab("tags")}
          className={`py-2.5 px-4 font-semibold text-[13px] border-b-2 transition-colors ${
            activeTab === "tags"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Tags ({Object.keys(account.tags || {}).length})
        </button>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] mb-4">Account information</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
            <div>
              <dt className="text-[12px] font-semibold text-[#545b64]">Account ARN</dt>
              <dd className="font-mono text-[12px] text-[#16191f] mt-1 break-all">{account.arn}</dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold text-[#545b64]">Joined Method</dt>
              <dd className="text-[#16191f] mt-1">
                {account.isManagementAccount ? "Management Account" : account.joinedMethod === "CREATED" ? "Created" : "Invited"}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold text-[#545b64]">IAM Role Name</dt>
              <dd className="font-mono text-[12px] text-[#16191f] mt-1">{account.roleName}</dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold text-[#545b64]">Parent ID</dt>
              <dd className="font-mono text-[12px] text-[#16191f] mt-1">{account.parentId}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Tab: Policies */}
      {activeTab === "policies" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Service control policies (SCPs)</h2>
              <p className="text-[12px] text-[#545b64]">
                Policies directly attached to this account that govern maximum available permissions.
              </p>
            </div>
            <button
              onClick={() => {
                setError(null);
                setShowAttachPolicyModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-3 rounded shadow-sm transition-colors"
            >
              Attach policy
            </button>
          </div>

          <div className="bg-white border border-[#eaeded] rounded overflow-hidden shadow-sm">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Policy name</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {attachedPolicies.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f2f8fc]">
                    <td className="py-3 px-4 font-medium">
                      <Link href={`/organizations/policies/${p.id}`} className="text-[#0972d3] hover:underline">
                        {p.name}
                      </Link>
                      {p.awsManaged && (
                        <span className="ml-2 text-[10px] uppercase font-bold bg-[#f2f3f3] text-[#545b64] px-1.5 py-0.5 rounded">
                          AWS Managed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">{p.description}</td>
                    <td className="py-3 px-4 text-[#545b64]">{p.type}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDetachPolicy(p.id, p.name)}
                        className="text-[#d13212] hover:underline font-medium text-[12px]"
                      >
                        Detach
                      </button>
                    </td>
                  </tr>
                ))}
                {attachedPolicies.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#545b64]">
                      No policies directly attached to this account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] mb-4">Tags</h2>
          {Object.keys(account.tags || {}).length > 0 ? (
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-4">Key</th>
                  <th className="py-2.5 px-4">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {Object.entries(account.tags || {}).map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-2.5 px-4 font-mono text-[12px] font-semibold text-[#16191f]">{k}</td>
                    <td className="py-2.5 px-4 text-[#545b64]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-[13px] text-[#545b64]">No tags applied to this account.</div>
          )}
        </div>
      )}

      {/* MODAL: Move Account */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Move account</h2>
              <button onClick={() => setShowMoveModal(false)} className="text-[#545b64] font-bold text-lg">
                X
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Select a new parent Root or Organizational Unit for <strong>{account.name}</strong>.
              </p>
              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Destination container</label>
                <select
                  value={destinationParent}
                  onChange={(e) => setDestinationParent(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                >
                  {allParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowMoveModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={handleMove}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm"
              >
                {isPending ? "Moving..." : "Move"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Attach Policy */}
      {showAttachPolicyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Attach policy</h2>
              <button onClick={() => setShowAttachPolicyModal(false)} className="text-[#545b64] font-bold text-lg">
                X
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Select policy to attach</label>
                <select
                  value={selectedPolicyToAttach}
                  onChange={(e) => setSelectedPolicyToAttach(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                >
                  {availablePolicies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.awsManaged ? "AWS managed" : "Customer managed"})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAttachPolicyModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending || !selectedPolicyToAttach}
                onClick={handleAttachPolicy}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm"
              >
                {isPending ? "Attaching..." : "Attach policy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Close Account */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#d13212]">Close account</h2>
              <button onClick={() => setShowCloseModal(false)} className="text-[#545b64] font-bold text-lg">
                X
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Are you sure you want to close account <strong>{account.name}</strong> ({account.id})?
              </p>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={handleClose}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#d13212] hover:bg-[#b02a0f] text-white px-4 rounded shadow-sm"
              >
                {isPending ? "Closing..." : "Close account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
