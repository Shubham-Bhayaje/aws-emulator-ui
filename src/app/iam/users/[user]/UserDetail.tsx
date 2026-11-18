/**
 * UserDetail – Client component for viewing user details, permissions,
 * and inspecting attached policy documents.
 * Enforces IAM permission boundaries with authentic AWS AccessDenied messaging.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  attachUserPolicy,
  detachUserPolicy,
  inspectPolicy,
} from "../../actions";

export interface AttachedPolicyInfo {
  name: string;
  arn: string;
}

export interface UserDetailMeta {
  userName: string;
  userId: string;
  arn: string;
  createDate: string;
  attachedPolicies: AttachedPolicyInfo[];
}

interface UserDetailProps {
  user: UserDetailMeta;
  allPolicies: { name: string; arn: string }[];
  canAttachPolicy?: boolean;
  canDetachPolicy?: boolean;
  activeIdentityName?: string;
  activeIdentityType?: string;
}

export function UserDetail({
  user,
  allPolicies,
  canAttachPolicy = true,
  canDetachPolicy = true,
  activeIdentityName = "Administrator",
  activeIdentityType = "admin",
}: UserDetailProps) {
  const [activeTab, setActiveTab] = useState<"permissions" | "details">("permissions");
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedPolicyArn, setSelectedPolicyArn] = useState("");
  const [searchPolicy, setSearchPolicy] = useState("");

  // Policy inspect modal
  const [inspectedPolicy, setInspectedPolicy] = useState<{
    name: string;
    arn: string;
    document: any;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Inspect policy document
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

  // Attach policy
  function handleAttach() {
    if (!selectedPolicyArn) return;
    setError(null);
    startTransition(async () => {
      const res = await attachUserPolicy(user.userName, selectedPolicyArn);
      if (res.error) {
        setError(res.error);
      } else {
        setShowAttachModal(false);
        setSelectedPolicyArn("");
        router.refresh();
      }
    });
  }

  // Detach policy
  function handleDetach(policyArn: string) {
    setError(null);
    startTransition(async () => {
      const res = await detachUserPolicy(user.userName, policyArn);
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  }

  // Filter available policies for attaching
  const attachedArns = new Set(user.attachedPolicies.map((p) => p.arn));
  const availablePolicies = allPolicies.filter(
    (p) =>
      !attachedArns.has(p.arn) &&
      p.name.toLowerCase().includes(searchPolicy.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] mb-1">{user.userName}</h1>
          <p className="text-[12px] text-[#545b64] font-mono">{user.arn}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/iam/users"
            className="px-3 py-1.5 text-[13px] border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded-sm font-normal"
          >
            Back to users
          </Link>
        </div>
      </div>

      {/* Permission Boundary Alert Banner */}
      {!canAttachPolicy && activeIdentityType !== "admin" && (
        <div className="p-3.5 bg-[#f2f8fd] border border-[#0073bb] rounded text-[13px] text-[#16191f] flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0073bb"
              strokeWidth="2"
              className="shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <span className="font-semibold text-[#0073bb]">Read-only permission boundary active:</span>
              <span className="ml-1 text-[#545b64]">
                Active identity <strong>{activeIdentityName}</strong> has read-only access. Attempting to attach or detach policies will be denied by IAM.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#0073bb] bg-white px-2 py-0.5 rounded border border-[#0073bb]/30 shrink-0">
            iam:AttachUserPolicy denied
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212] flex items-start gap-2.5">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d13212"
            strokeWidth="2"
            className="shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <div className="font-bold">Access Denied</div>
            <div className="text-[12px] text-[#545b64] mt-0.5 leading-relaxed">{error}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#eaeded] flex gap-8 text-[14px]">
        <button
          onClick={() => setActiveTab("permissions")}
          className={`pb-2.5 font-medium border-b-2 transition-colors ${
            activeTab === "permissions"
              ? "border-[#0073bb] text-[#0073bb]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Permissions ({user.attachedPolicies.length})
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`pb-2.5 font-medium border-b-2 transition-colors ${
            activeTab === "details"
              ? "border-[#0073bb] text-[#0073bb]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          User details
        </button>
      </div>

      {/* Tab 1: Permissions */}
      {activeTab === "permissions" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
            <div className="px-5 py-3 border-b border-[#eaeded] flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-[#16191f]">
                Attached policies ({user.attachedPolicies.length})
              </h2>
              <button
                onClick={() => {
                  setError(null);
                  setShowAttachModal(true);
                }}
                className="px-3 py-1.5 text-[12px] bg-[#ec7211] text-white rounded-sm font-medium hover:bg-[#eb5f07]"
              >
                + Add permissions
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
                  <tr>
                    <th className="px-4 py-2.5">Policy name</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Policy ARN</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {user.attachedPolicies.map((p) => {
                    const isAWSManaged = p.arn.includes(":aws:policy");
                    return (
                      <tr key={p.arn} className="hover:bg-[#f2f8fd]">
                        <td className="px-4 py-3 font-medium">
                          <button
                            type="button"
                            onClick={() => handleInspect(p.arn, p.name)}
                            className="text-[#0073bb] hover:text-[#ec7211] hover:underline text-left font-medium"
                          >
                            {p.name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64]">
                            {isAWSManaged ? "AWS managed" : "Customer managed"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[#545b64]">
                          {p.arn}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleInspect(p.arn, p.name)}
                            className="text-[12px] text-[#0073bb] hover:underline"
                          >
                            Inspect policy
                          </button>
                          <button
                            onClick={() => handleDetach(p.arn)}
                            disabled={isPending || !canDetachPolicy}
                            title={!canDetachPolicy ? "Missing iam:DetachUserPolicy permission" : undefined}
                            className={`text-[12px] font-normal ${
                              canDetachPolicy && !isPending
                                ? "text-[#d13212] hover:underline"
                                : "text-[#aab7b8] cursor-not-allowed opacity-50"
                            }`}
                          >
                            Detach
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {user.attachedPolicies.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#545b64]">
                        No policies attached to this user yet. Click &quot;Add permissions&quot; to attach one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User details */}
      {activeTab === "details" && (
        <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
          <h2 className="text-[15px] font-bold text-[#16191f]">General summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
            <div>
              <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
                User Name
              </div>
              <div className="text-[#16191f] font-medium">{user.userName}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
                User ID
              </div>
              <div className="font-mono text-[#16191f]">{user.userId}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
                ARN
              </div>
              <div className="font-mono text-[#545b64] text-[12px]">{user.arn}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
                Creation Time
              </div>
              <div className="text-[#16191f]">{user.createDate}</div>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Policy Modal */}
      {inspectedPolicy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[700px] w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">
                  Policy: {inspectedPolicy.name}
                </h3>
                <p className="text-[11px] font-mono text-[#545b64]">
                  {inspectedPolicy.arn}
                </p>
              </div>
              <button
                onClick={() => setInspectedPolicy(null)}
                className="text-[#879596] hover:text-[#16191f] p-1"
                title="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Policy Document (JSON)
                </label>
                <pre className="bg-[#000716] text-[#69f0ae] font-mono text-[12px] p-4 rounded overflow-x-auto leading-relaxed">
                  {JSON.stringify(inspectedPolicy.document, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#eaeded] flex justify-end bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setInspectedPolicy(null)}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attach Policy Modal */}
      {showAttachModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[650px] w-full max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#16191f]">
                Attach policy to {user.userName}
              </h3>
              <button
                onClick={() => {
                  setShowAttachModal(false);
                  setError(null);
                }}
                className="text-[#879596] hover:text-[#16191f] p-1"
                title="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Inside Modal Error Alert */}
              {error && (
                <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212] flex items-start gap-2.5">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#d13212"
                    strokeWidth="2"
                    className="shrink-0 mt-0.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div>
                    <div className="font-bold">Access Denied</div>
                    <div className="text-[12px] text-[#545b64] mt-0.5 leading-relaxed">{error}</div>
                  </div>
                </div>
              )}

              {/* Inside Modal Permission Denied Notice */}
              {!canAttachPolicy && !error && (
                <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212] flex items-start gap-2.5">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#d13212"
                    strokeWidth="2"
                    className="shrink-0 mt-0.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div>
                    <div className="font-bold">Access Denied</div>
                    <div className="text-[12px] text-[#545b64] mt-0.5 leading-relaxed">
                      User <strong>{activeIdentityName}</strong> is not authorized to perform: <code>iam:AttachUserPolicy</code> on resource: <code>{user.arn}</code>.
                    </div>
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Search policies..."
                value={searchPolicy}
                onChange={(e) => setSearchPolicy(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#0073bb]"
              />

              <div className="max-h-[300px] overflow-y-auto border border-[#eaeded] rounded divide-y divide-[#eaeded]">
                {availablePolicies.map((policy) => (
                  <label
                    key={policy.arn}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#f2f8fd] cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="attachPolicy"
                      checked={selectedPolicyArn === policy.arn}
                      onChange={() => setSelectedPolicyArn(policy.arn)}
                      className="text-[#0073bb] focus:ring-[#0073bb]"
                    />
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[#0073bb]">
                        {policy.name}
                      </div>
                      <div className="text-[11px] text-[#545b64] font-mono truncate">
                        {policy.arn}
                      </div>
                    </div>
                  </label>
                ))}

                {availablePolicies.length === 0 && (
                  <div className="p-4 text-center text-[12px] text-[#545b64]">
                    No available policies match &quot;{searchPolicy}&quot;.
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#eaeded] flex justify-end gap-2 bg-[#fafafa]">
              <button
                type="button"
                onClick={() => {
                  setShowAttachModal(false);
                  setError(null);
                }}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAttach}
                disabled={!selectedPolicyArn || isPending || !canAttachPolicy}
                title={!canAttachPolicy ? "Missing iam:AttachUserPolicy permission" : undefined}
                className="px-5 py-1.5 text-[13px] bg-[#ec7211] text-white rounded-sm font-medium hover:bg-[#eb5f07] disabled:opacity-50 disabled:cursor-not-allowed"
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
