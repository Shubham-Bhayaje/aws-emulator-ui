/**
 * src/app/iam/roles/[role]/RoleDetail.tsx – Role Details with Permissions and Trust Relationships.
 * Allows inspecting attached policies, detaching/attaching policies, and editing trust policies.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  attachRolePolicy,
  detachRolePolicy,
  inspectPolicy,
  updateRoleTrustPolicy,
} from "../../actions";

export interface AttachedPolicyInfo {
  name: string;
  arn: string;
}

export interface RoleDetailMeta {
  roleName: string;
  roleId: string;
  arn: string;
  description: string;
  createDate: string;
  assumeRolePolicyDocument: any;
  attachedPolicies: AttachedPolicyInfo[];
}

interface RoleDetailProps {
  role: RoleDetailMeta;
  allPolicies: { name: string; arn: string }[];
  canAttachPolicy?: boolean;
  canDetachPolicy?: boolean;
  activeIdentityName?: string;
  activeIdentityType?: string;
}

export function RoleDetail({
  role,
  allPolicies,
  canAttachPolicy = true,
  canDetachPolicy = true,
  activeIdentityName = "Administrator",
  activeIdentityType = "admin",
}: RoleDetailProps) {
  const [activeTab, setActiveTab] = useState<"permissions" | "trust" | "details">("permissions");
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedPolicyArn, setSelectedPolicyArn] = useState("");
  const [searchPolicy, setSearchPolicy] = useState("");

  // Trust policy edit modal
  const [showEditTrustModal, setShowEditTrustModal] = useState(false);
  const [trustJsonInput, setTrustJsonInput] = useState(
    JSON.stringify(role.assumeRolePolicyDocument, null, 2)
  );

  // Inspect policy modal
  const [inspectedPolicy, setInspectedPolicy] = useState<{
    name: string;
    arn: string;
    document: any;
  } | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleInspect(policyArn: string, policyName: string) {
    setError(null);
    const res = await inspectPolicy(policyArn);
    if (res.error) {
      setError(res.error);
    } else {
      setInspectedPolicy({
        name: policyName,
        arn: policyArn,
        document: res.document,
      });
    }
  }

  function handleAttach() {
    if (!selectedPolicyArn) return;
    setError(null);
    startTransition(async () => {
      const res = await attachRolePolicy(role.roleName, selectedPolicyArn);
      if (res.error) {
        setError(res.error);
      } else {
        setShowAttachModal(false);
        setSelectedPolicyArn("");
        router.refresh();
        setFeedback("Policy attached to role successfully.");
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDetach(policyArn: string) {
    setError(null);
    startTransition(async () => {
      const res = await detachRolePolicy(role.roleName, policyArn);
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
        setFeedback("Policy detached from role.");
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleUpdateTrustPolicy(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      JSON.parse(trustJsonInput);
    } catch {
      setError("Trust policy must be valid JSON.");
      return;
    }

    startTransition(async () => {
      const res = await updateRoleTrustPolicy(role.roleName, trustJsonInput);
      if (res.success) {
        setShowEditTrustModal(false);
        router.refresh();
        setFeedback("Trust policy updated successfully.");
      } else {
        setError(res.error || "Failed to update trust policy.");
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  const attachedArns = new Set(role.attachedPolicies.map((p) => p.arn));
  const availablePolicies = allPolicies.filter(
    (p) =>
      !attachedArns.has(p.arn) &&
      p.name.toLowerCase().includes(searchPolicy.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-[#16191f]">{role.roleName}</h1>
            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-[#f2f3f3] text-[#545b64]">
              IAM role
            </span>
          </div>
          <p className="text-[12px] text-[#545b64] font-mono mt-0.5">{role.arn}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/iam/roles"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
          >
            Roles
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-[#f2f8fd] border border-[#0073bb] text-[#0073bb] rounded-sm text-[13px] flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-[12px] font-bold hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#fdf3f1] border border-[#d13212] text-[#d13212] rounded-sm text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[12px] font-bold hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Box */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-6 text-[13px]">
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">Role ID</div>
          <div className="font-mono text-[#16191f] mt-1">{role.roleId}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">Creation time</div>
          <div className="text-[#16191f] mt-1">{role.createDate}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">Attached policies</div>
          <div className="text-[#0073bb] font-bold mt-1">{role.attachedPolicies.length}</div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs">
        <div className="border-b border-[#eaeded] flex items-center px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("permissions")}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "permissions"
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Permissions ({role.attachedPolicies.length})
          </button>
          <button
            onClick={() => setActiveTab("trust")}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "trust"
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Trust relationships
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "details"
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Details
          </button>
        </div>

        <div className="p-6">
          {/* Permissions Tab */}
          {activeTab === "permissions" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaeded]">
                <div>
                  <h3 className="text-[14px] font-bold text-[#16191f]">
                    Permissions policies ({role.attachedPolicies.length})
                  </h3>
                  <p className="text-[12px] text-[#545b64]">
                    Policies attached to this role dictate what actions principals assuming this role can perform.
                  </p>
                </div>
                {canAttachPolicy && (
                  <button
                    onClick={() => setShowAttachModal(true)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                  >
                    Attach policies
                  </button>
                )}
              </div>

              {role.attachedPolicies.length === 0 ? (
                <div className="p-8 text-center bg-[#fafafa] border border-[#eaeded] rounded-sm">
                  <p className="text-[13px] font-bold text-[#16191f]">No policies attached</p>
                  <p className="text-[12px] text-[#545b64] mt-1 mb-4">
                    Attach IAM policies to define permissions for this role.
                  </p>
                  {canAttachPolicy && (
                    <button
                      onClick={() => setShowAttachModal(true)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                    >
                      Attach policies
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-[#eaeded] rounded-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Policy name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Policy ARN</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                      {role.attachedPolicies.map((p) => {
                        const isAWSManaged = p.arn.includes(":aws:policy");
                        return (
                          <tr key={p.arn} className="hover:bg-[#fafafa]">
                            <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                              <button
                                onClick={() => handleInspect(p.arn, p.name)}
                                className="hover:underline text-left"
                              >
                                {p.name}
                              </button>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#16191f]">
                                {isAWSManaged ? "AWS managed" : "Customer managed"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64] max-w-[280px] truncate">
                              {p.arn}
                            </td>
                            <td className="py-2.5 px-3 text-right space-x-3">
                              <button
                                onClick={() => handleInspect(p.arn, p.name)}
                                className="text-[12px] font-bold text-[#0073bb] hover:underline"
                              >
                                View policy
                              </button>
                              {canDetachPolicy && (
                                <button
                                  onClick={() => handleDetach(p.arn)}
                                  disabled={isPending}
                                  className="text-[12px] font-bold text-[#d13212] hover:underline"
                                >
                                  Detach
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Trust Relationships Tab */}
          {activeTab === "trust" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaeded]">
                <div>
                  <h3 className="text-[14px] font-bold text-[#16191f]">Trust policy</h3>
                  <p className="text-[12px] text-[#545b64]">
                    The trust policy document defines which trusted entities (services or accounts) can assume this role.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTrustJsonInput(JSON.stringify(role.assumeRolePolicyDocument, null, 2));
                    setShowEditTrustModal(true);
                  }}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                >
                  Edit trust policy
                </button>
              </div>

              <div className="bg-[#16191f] p-4 rounded-sm border border-[#eaeded]">
                <pre className="text-[12px] font-mono text-[#59cbe8] overflow-x-auto leading-relaxed">
                  {JSON.stringify(role.assumeRolePolicyDocument, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
              <div>
                <div className="text-[12px] text-[#545b64] font-medium">Role name</div>
                <div className="font-bold text-[#16191f] mt-1">{role.roleName}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-medium">Role ID</div>
                <div className="font-mono text-[#16191f] mt-1">{role.roleId}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-medium">Description</div>
                <div className="text-[#16191f] mt-1">{role.description || "—"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-medium">Creation time</div>
                <div className="text-[#16191f] mt-1">{role.createDate}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-[#545b64] font-medium">ARN</div>
                <div className="font-mono text-[12px] text-[#16191f] mt-1 break-all">{role.arn}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Trust Policy Modal */}
      {showEditTrustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleUpdateTrustPolicy}
            className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
          >
            <div className="p-5 border-b border-[#eaeded] flex items-center justify-between flex-shrink-0">
              <h3 className="text-[17px] font-bold text-[#16191f]">
                Edit trust policy for {role.roleName}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditTrustModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              <label className="block text-[12px] font-bold text-[#16191f]">
                AssumeRolePolicyDocument (JSON):
              </label>
              <textarea
                rows={14}
                required
                value={trustJsonInput}
                onChange={(e) => setTrustJsonInput(e.target.value)}
                className="w-full p-3 font-mono text-[12px] bg-[#16191f] text-[#59cbe8] rounded-sm border border-[#aab7b8] focus:outline-hidden"
              />
            </div>

            <div className="p-4 border-t border-[#eaeded] flex items-center justify-end gap-2 flex-shrink-0 bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setShowEditTrustModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
              >
                {isPending ? "Updating..." : "Update trust policy"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Attach Policy Modal */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Attach policy to {role.roleName}</h3>
              <button
                type="button"
                onClick={() => setShowAttachModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Select an IAM managed policy:
              </label>
              <select
                value={selectedPolicyArn}
                onChange={(e) => setSelectedPolicyArn(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
              >
                <option value="">-- Choose a policy --</option>
                {availablePolicies.map((p) => (
                  <option key={p.arn} value={p.arn}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAttachModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAttach}
                disabled={!selectedPolicyArn || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
              >
                {isPending ? "Attaching..." : "Attach policy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Policy Document Modal */}
      {inspectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-[#eaeded] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-[17px] font-bold text-[#16191f]">{inspectedPolicy.name}</h3>
                <p className="text-[11px] font-mono text-[#545b64] mt-0.5">{inspectedPolicy.arn}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedPolicy(null)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-[#16191f]">
              <pre className="text-[12px] font-mono text-[#59cbe8] whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(inspectedPolicy.document, null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t border-[#eaeded] flex items-center justify-end flex-shrink-0 bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setInspectedPolicy(null)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
