/**
 * src/app/organizations/ou/[ouId]/OUDetailClient.tsx – Organizational Unit Detail Client.
 * Zero emojis, Cloudscape enterprise standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AccountRecord,
  SCPRecord,
  createOrganizationalUnitAction,
  deleteOrganizationalUnitAction,
  attachPolicyAction,
  detachPolicyAction,
} from "../../actions";

interface OUDetailClientProps {
  ou: {
    id: string;
    name: string;
    arn: string;
    parentId: string;
    path?: string;
  };
  parentName: string;
  accounts: AccountRecord[];
  childOUs: Array<{ id: string; name: string; arn: string }>;
  attachedPolicies: SCPRecord[];
  availablePolicies: SCPRecord[];
}

export function OUDetailClient({
  ou,
  parentName,
  accounts,
  childOUs,
  attachedPolicies,
  availablePolicies,
}: OUDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"accounts" | "ous" | "policies" | "details">("accounts");

  // Modals
  const [showCreateSubOUModal, setShowCreateSubOUModal] = useState(false);
  const [subOUName, setSubOUName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAttachPolicyModal, setShowAttachPolicyModal] = useState(false);
  const [selectedPolicyToAttach, setSelectedPolicyToAttach] = useState(availablePolicies[0]?.id || "");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateSubOU = () => {
    if (!subOUName.trim()) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("parentId", ou.id);
      formData.set("name", subOUName.trim());
      const res = await createOrganizationalUnitAction(formData);
      if (res.success) {
        setShowCreateSubOUModal(false);
        setSubOUName("");
        setSuccess(`Sub-OU "${res.ou?.Name}" (${res.ou?.Id}) created successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create organizational unit.");
      }
    });
  };

  const handleDeleteOU = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteOrganizationalUnitAction(ou.id);
      if (res.success) {
        router.push("/organizations");
      } else {
        setError(res.error || "Failed to delete organizational unit.");
        setShowDeleteModal(false);
      }
    });
  };

  const handleAttachPolicy = () => {
    if (!selectedPolicyToAttach) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const policy = availablePolicies.find((p) => p.id === selectedPolicyToAttach);
      const res = await attachPolicyAction(selectedPolicyToAttach, ou.id, ou.name, "ORGANIZATIONAL_UNIT");
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
      const res = await detachPolicyAction(policyId, ou.id);
      if (res.success) {
        setSuccess(`Policy ${policyName} detached from OU.`);
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
              <span className="text-[12px] font-bold text-[#545b64] uppercase">[Organizational unit]</span>
              <h1 className="text-[22px] font-bold text-[#16191f]">{ou.name}</h1>
            </div>
            <div className="text-[13px] font-mono text-[#545b64] mt-1">ID: {ou.id}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setError(null);
                setShowCreateSubOUModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
            >
              Create sub-OU
            </button>

            <button
              onClick={() => {
                setError(null);
                setShowDeleteModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#d13212] text-[#d13212] hover:bg-[#fdf3f1] px-3 rounded transition-colors"
            >
              Delete OU
            </button>
          </div>
        </div>

        {/* Quick Grid Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#eaeded] text-[13px]">
          <div>
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Status</div>
            <div className="mt-1">
              <span className="inline-block bg-[#f2f8f0] text-[#1d8102] text-[11px] font-semibold px-2 py-0.5 rounded">
                Active
              </span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Parent Container</div>
            <div className="text-[#16191f] font-medium mt-1">{parentName}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Member Accounts</div>
            <div className="text-[#16191f] font-medium mt-1">{accounts.length}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#545b64] uppercase">Child OUs</div>
            <div className="text-[#16191f] font-medium mt-1">{childOUs.length}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#eaeded] flex mb-6">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`py-2.5 px-4 font-semibold text-[13px] border-b-2 transition-colors ${
            activeTab === "accounts"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          AWS accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab("ous")}
          className={`py-2.5 px-4 font-semibold text-[13px] border-b-2 transition-colors ${
            activeTab === "ous"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Child OUs ({childOUs.length})
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
          onClick={() => setActiveTab("details")}
          className={`py-2.5 px-4 font-semibold text-[13px] border-b-2 transition-colors ${
            activeTab === "details"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Details
        </button>
      </div>

      {/* Tab: Accounts */}
      {activeTab === "accounts" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Account name</th>
                <th className="py-2.5 px-4">Account ID</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-[#f2f8fc]">
                  <td className="py-3 px-4 font-medium">
                    <Link href={`/organizations/accounts/${acc.id}`} className="text-[#0972d3] hover:underline">
                      {acc.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-mono text-[12px]">{acc.id}</td>
                  <td className="py-3 px-4 text-[#545b64]">{acc.email}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block bg-[#f2f8f0] text-[#1d8102] text-[11px] font-semibold px-2 py-0.5 rounded">
                      {acc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/organizations/accounts/${acc.id}`}
                      className="text-[#0972d3] hover:underline font-medium text-[12px]"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#545b64]">
                    No accounts currently in this organizational unit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Child OUs */}
      {activeTab === "ous" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">OU Name</th>
                <th className="py-2.5 px-4">OU ID</th>
                <th className="py-2.5 px-4">ARN</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {childOUs.map((child) => (
                <tr key={child.id} className="hover:bg-[#f2f8fc]">
                  <td className="py-3 px-4 font-medium">
                    <Link href={`/organizations/ou/${child.id}`} className="text-[#0972d3] hover:underline">
                      {child.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-mono text-[12px]">{child.id}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#545b64] truncate max-w-xs">{child.arn}</td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/organizations/ou/${child.id}`}
                      className="text-[#0972d3] hover:underline font-medium text-[12px]"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {childOUs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#545b64]">
                    No child organizational units inside this OU.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Policies */}
      {activeTab === "policies" && (
        <div>
          {/* IAM Connection Banner */}
          <div className="bg-[#f1faff] border border-[#0073bb]/30 rounded p-4 mb-4 text-[13px]">
            <div className="font-bold text-[#0073bb] mb-1 flex items-center justify-between">
              <span>IAM Permissions Boundary Connection</span>
              <Link href="/iam" className="text-[#0972d3] font-semibold text-xs hover:underline">
                Open IAM Console
              </Link>
            </div>
            <p className="text-[#16191f] text-[12px] leading-relaxed">
              Service Control Policies (SCPs) attached to this Organizational Unit act as the maximum <strong>permissions boundary</strong> for every IAM user, IAM role, and account root user in all member accounts within this OU. Even if an IAM policy grants full administrator access (<code className="bg-white/80 px-1 py-0.5 rounded border border-[#eaeded] font-mono text-[11px]">* : *</code>), any action denied by this OU's SCP is strictly blocked.
            </p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Attached policies</h2>
              <p className="text-[12px] text-[#545b64]">
                Policies attached to this OU apply to all member accounts and child OUs inside it.
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
                      No policies directly attached to this organizational unit.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] mb-4">Organizational unit details</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
            <div>
              <dt className="text-[12px] font-semibold text-[#545b64]">OU ARN</dt>
              <dd className="font-mono text-[12px] text-[#16191f] mt-1 break-all">{ou.arn}</dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold text-[#545b64]">Parent ID</dt>
              <dd className="font-mono text-[12px] text-[#16191f] mt-1">{ou.parentId}</dd>
            </div>
            {ou.path && (
              <div>
                <dt className="text-[12px] font-semibold text-[#545b64]">Hierarchy Path</dt>
                <dd className="font-mono text-[12px] text-[#16191f] mt-1">{ou.path}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* MODAL: Create Sub-OU */}
      {showCreateSubOUModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Create sub-OU</h2>
              <button onClick={() => setShowCreateSubOUModal(false)} className="text-[#545b64] font-bold text-lg">
                X
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Create a new Organizational Unit nested inside <strong>{ou.name}</strong> ({ou.id}).
              </p>
              <div>
                <label className="block font-semibold text-[#16191f] mb-1">Sub-OU name</label>
                <input
                  type="text"
                  placeholder="e.g. Infrastructure, Database, Testing"
                  value={subOUName}
                  onChange={(e) => setSubOUName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                />
              </div>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateSubOUModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending || !subOUName.trim()}
                onClick={handleCreateSubOU}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm"
              >
                {isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete OU */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#d13212]">Delete organizational unit</h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-[#545b64] font-bold text-lg">
                X
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Are you sure you want to delete organizational unit <strong>{ou.name}</strong> ({ou.id})? This action
                cannot be undone.
              </p>
              {accounts.length > 0 && (
                <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 text-[12px] text-[#d13212]">
                  Warning: This OU contains {accounts.length} member account(s). You must move all accounts before you can
                  delete this OU.
                </div>
              )}
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
                disabled={isPending || accounts.length > 0}
                onClick={handleDeleteOU}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#d13212] hover:bg-[#b02a0f] text-white px-4 rounded shadow-sm disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete OU"}
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
              <h2 className="text-[16px] font-bold text-[#16191f]">Attach policy to OU</h2>
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
    </div>
  );
}
