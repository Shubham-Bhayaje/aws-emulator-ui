/**
 * src/app/organizations/policies/[policyId]/PolicyDetailClient.tsx – Policy Detail View.
 * Zero emojis, Cloudscape enterprise standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SCPRecord,
  deleteSCPAction,
  attachPolicyAction,
  detachPolicyAction,
} from "../../actions";

interface PolicyDetailClientProps {
  policy: SCPRecord;
  availableTargets: Array<{ id: string; name: string; type: "ROOT" | "OU" | "ACCOUNT" }>;
}

export function PolicyDetailClient({ policy, availableTargets }: PolicyDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"statement" | "targets">("statement");
  const [copied, setCopied] = useState(false);

  // Modals
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState(availableTargets[0]?.id || "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(policy.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAttach = () => {
    if (!selectedTargetId) return;
    const target = availableTargets.find((t) => t.id === selectedTargetId);
    if (!target) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await attachPolicyAction(policy.id, target.id, target.name, target.type);
      if (res.success) {
        setShowAttachModal(false);
        setSuccess(`Policy attached to ${target.name} (${target.id}).`);
        router.refresh();
      } else {
        setError(res.error || "Failed to attach policy.");
      }
    });
  };

  const handleDetach = (targetId: string, targetName: string) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await detachPolicyAction(policy.id, targetId);
      if (res.success) {
        setSuccess(`Policy detached from ${targetName}.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to detach policy.");
      }
    });
  };

  const handleDelete = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteSCPAction(policy.id);
      if (res.success) {
        router.push("/organizations/policies");
      } else {
        setError(res.error || "Failed to delete policy.");
      }
    });
  };

  let parsedStatements: any[] = [];
  try {
    const parsed = JSON.parse(policy.content);
    parsedStatements = Array.isArray(parsed.Statement) ? parsed.Statement : [parsed.Statement];
  } catch {
    // Ignore parse errors
  }

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
              <span className="text-[12px] font-bold text-[#545b64] uppercase">[Policy]</span>
              <h1 className="text-[22px] font-bold text-[#16191f]">{policy.name}</h1>
              {policy.awsManaged && (
                <span className="bg-[#f2f3f3] text-[#545b64] text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                  AWS Managed
                </span>
              )}
            </div>
            <div className="text-[13px] text-[#545b64] mt-1">{policy.description}</div>
          </div>

          {!policy.awsManaged && (
            <button
              onClick={() => {
                setError(null);
                setShowDeleteModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#d13212] text-[#d13212] hover:bg-[#fdf3f1] px-3 rounded transition-colors"
            >
              Delete policy
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#eaeded] text-[13px]">
          <div>
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Policy ID</div>
            <div className="font-mono text-[#16191f] font-medium mt-1">{policy.id}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Policy Type</div>
            <div className="text-[#16191f] font-medium mt-1">{policy.type}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Targets Attached</div>
            <div className="text-[#16191f] font-medium mt-1">{policy.attachedTargets.length} target(s)</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Created Date</div>
            <div className="text-[#16191f] font-medium mt-1">
              {policy.createdDate ? new Date(policy.createdDate).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded] flex mb-6">
        <button
          onClick={() => setActiveTab("statement")}
          className={`py-2.5 px-4 font-semibold text-[13px] border-b-2 transition-colors ${
            activeTab === "statement"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Policy statement
        </button>
        <button
          onClick={() => setActiveTab("targets")}
          className={`py-2.5 px-4 font-semibold text-[13px] border-b-2 transition-colors ${
            activeTab === "targets"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Targets attached ({policy.attachedTargets.length})
        </button>
      </div>

      {/* Tab: Statement */}
      {activeTab === "statement" && (
        <div className="space-y-6">
          {/* Visual statement cards */}
          {parsedStatements.length > 0 && (
            <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#16191f] mb-4">Statement summary</h2>
              <div className="space-y-3">
                {parsedStatements.map((stmt, idx) => (
                  <div key={idx} className="border border-[#eaeded] rounded p-3 bg-[#f8f9fa] text-[13px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                          stmt.Effect === "Allow"
                            ? "bg-[#f2f8f0] text-[#1d8102]"
                            : "bg-[#fdf3f1] text-[#d13212]"
                        }`}
                      >
                        {stmt.Effect}
                      </span>
                      {stmt.Sid && <span className="font-semibold text-[#16191f]">Sid: {stmt.Sid}</span>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px]">
                      <div>
                        <span className="font-semibold text-[#545b64]">Action:</span>{" "}
                        <span className="font-mono text-[#16191f]">
                          {Array.isArray(stmt.Action) ? stmt.Action.join(", ") : stmt.Action || "All"}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-[#545b64]">Resource:</span>{" "}
                        <span className="font-mono text-[#16191f]">
                          {Array.isArray(stmt.Resource) ? stmt.Resource.join(", ") : stmt.Resource || "*"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-[#16191f]">Policy document (JSON)</h2>
              <button
                onClick={handleCopy}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
              >
                {copied ? "Copied" : "Copy JSON"}
              </button>
            </div>
            <pre className="font-mono text-[12px] bg-[#f8f9fa] border border-[#eaeded] rounded p-4 text-[#16191f] overflow-x-auto">
              {policy.content}
            </pre>
          </div>
        </div>
      )}

      {/* Tab: Targets */}
      {activeTab === "targets" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Attached targets</h2>
              <p className="text-[12px] text-[#545b64]">
                Roots, organizational units, and accounts where this policy is currently applied.
              </p>
            </div>
            <button
              onClick={() => {
                setError(null);
                setShowAttachModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-3 rounded shadow-sm transition-colors"
            >
              Attach target
            </button>
          </div>

          <div className="bg-white border border-[#eaeded] rounded overflow-hidden shadow-sm">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Target name</th>
                  <th className="py-2.5 px-4">Target ID</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {policy.attachedTargets.map((t) => (
                  <tr key={t.id} className="hover:bg-[#f2f8fc]">
                    <td className="py-3 px-4 font-medium text-[#16191f]">
                      {t.type === "ACCOUNT" ? (
                        <Link href={`/organizations/accounts/${t.id}`} className="text-[#0972d3] hover:underline">
                          {t.name}
                        </Link>
                      ) : t.type === "ORGANIZATIONAL_UNIT" ? (
                        <Link href={`/organizations/ou/${t.id}`} className="text-[#0972d3] hover:underline">
                          {t.name}
                        </Link>
                      ) : (
                        <span>{t.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">{t.id}</td>
                    <td className="py-3 px-4 text-[#545b64]">{t.type}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDetach(t.id, t.name)}
                        className="text-[#d13212] hover:underline font-medium text-[12px]"
                      >
                        Detach
                      </button>
                    </td>
                  </tr>
                ))}
                {policy.attachedTargets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#545b64]">
                      This policy is not attached to any targets.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attach Modal */}
      {showAttachModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Attach policy to target</h2>
              <button onClick={() => setShowAttachModal(false)} className="text-[#545b64] font-bold text-lg">
                X
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Select target</label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                >
                  {availableTargets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id}) [{t.type}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAttachModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending || !selectedTargetId}
                onClick={handleAttach}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm"
              >
                {isPending ? "Attaching..." : "Attach"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#d13212]">Delete policy</h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-[#545b64] font-bold text-lg">
                X
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Are you sure you want to delete policy <strong>{policy.name}</strong>?
              </p>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={handleDelete}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#d13212] hover:bg-[#b02a0f] text-white px-4 rounded shadow-sm"
              >
                {isPending ? "Deleting..." : "Delete policy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
