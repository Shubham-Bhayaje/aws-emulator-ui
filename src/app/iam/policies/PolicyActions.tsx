/**
 * PolicyActions – Client component for IAM Policies list.
 * Filter by AWS Managed / Customer Managed, search, create policy,
 * delete policy, and inspect policy modal.
 * Enforces IAM permission boundaries with authentic AWS AccessDenied messaging.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deletePolicy, inspectPolicy } from "../actions";

export interface PolicySummary {
  policyName: string;
  policyId: string;
  arn: string;
  isAWSManaged: boolean;
  attachmentCount: number;
  description: string;
  updateDate: string;
}

interface PolicyActionsProps {
  policies: PolicySummary[];
  canCreatePolicy?: boolean;
  canDeletePolicy?: boolean;
  activeIdentityName?: string;
  activeIdentityType?: string;
}

export function PolicyActions({
  policies,
  canCreatePolicy = true,
  canDeletePolicy = true,
  activeIdentityName = "Administrator",
  activeIdentityType = "admin",
}: PolicyActionsProps) {
  const [filterType, setFilterType] = useState<"all" | "customer" | "aws">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPolicyArn, setSelectedPolicyArn] = useState<string | null>(null);

  // Inspect policy modal
  const [inspectedPolicy, setInspectedPolicy] = useState<{
    name: string;
    arn: string;
    document: any;
  } | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const selectedPolicy = policies.find((p) => p.arn === selectedPolicyArn);

  const filteredPolicies = policies.filter((p) => {
    if (filterType === "customer" && p.isAWSManaged) return false;
    if (filterType === "aws" && !p.isAWSManaged) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.policyName.toLowerCase().includes(q) || p.arn.toLowerCase().includes(q);
  });

  async function handleInspect(arn: string, name: string) {
    setError(null);
    const res = await inspectPolicy(arn);
    if (res.error) {
      setError(res.error);
    } else {
      setInspectedPolicy({
        name,
        arn,
        document: res.document,
      });
    }
  }

  function handleDelete() {
    if (!selectedPolicy || confirmInput !== selectedPolicy.policyName) return;
    setError(null);
    startTransition(async () => {
      const res = await deletePolicy(selectedPolicy.arn);
      if (res && res.error) {
        setError(res.error);
      } else {
        setSelectedPolicyArn(null);
        setShowDeleteModal(false);
        setConfirmInput("");
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[14px] font-bold text-[#16191f]">
            Policies ({filteredPolicies.length})
          </h2>

          {/* Filter Pills */}
          <div className="flex bg-[#f2f3f3] p-0.5 rounded text-[12px]">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                filterType === "all"
                  ? "bg-white font-medium text-[#16191f] shadow-xs"
                  : "text-[#545b64]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("customer")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                filterType === "customer"
                  ? "bg-white font-medium text-[#16191f] shadow-xs"
                  : "text-[#545b64]"
              }`}
            >
              Customer managed
            </button>
            <button
              onClick={() => setFilterType("aws")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                filterType === "aws"
                  ? "bg-white font-medium text-[#16191f] shadow-xs"
                  : "text-[#545b64]"
              }`}
            >
              AWS managed
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-[260px]">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#545b64]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Find policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-[#aab7b8] rounded px-2.5 pl-8 py-[4px] text-[13px] text-[#16191f] placeholder-[#8d9ba8] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedPolicy && !selectedPolicy.isAWSManaged && (
            <button
              onClick={() => {
                setError(null);
                setConfirmInput("");
                setShowDeleteModal(true);
              }}
              disabled={!canDeletePolicy || isPending}
              title={!canDeletePolicy ? "Missing iam:DeletePolicy permission" : undefined}
              className={`px-3 py-[4px] text-[13px] border rounded-sm font-normal ${
                canDeletePolicy && !isPending
                  ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                  : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed opacity-60"
              }`}
            >
              Delete
            </button>
          )}
          {canCreatePolicy ? (
            <Link
              href="/iam/policies/create"
              className="px-3 py-[4px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] font-medium transition-colors"
            >
              Create policy
            </Link>
          ) : (
            <span
              title="Missing iam:CreatePolicy permission"
              className="px-3 py-[4px] text-[13px] bg-[#eaeded] text-[#879596] rounded-sm font-medium cursor-not-allowed"
            >
              Create policy
            </span>
          )}
        </div>
      </div>

      {/* Permission boundary notice if restricted */}
      {!canCreatePolicy && activeIdentityType !== "admin" && (
        <div className="mx-4 mt-3 p-3 bg-[#f2f8fd] border border-[#0073bb] rounded text-[12px] text-[#16191f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0073bb" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              Read-only mode active: Identity <strong>{activeIdentityName}</strong> cannot create or delete IAM policies.
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#0073bb] bg-white px-2 py-0.5 rounded border border-[#0073bb]/30">
            iam:CreatePolicy / iam:DeletePolicy restricted
          </span>
        </div>
      )}

      {error && (
        <div className="m-4 p-3 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212] flex items-start gap-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d13212" strokeWidth="2" className="shrink-0 mt-0.5">
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

      {/* Policies Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
            <tr>
              <th className="w-10 px-4 py-2.5">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-4 py-2.5 font-bold text-[#16191f]">Policy name</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Attachments</th>
              <th className="px-4 py-2.5">Description</th>
              <th className="px-4 py-2.5 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filteredPolicies.map((p) => {
              const isSelected = selectedPolicyArn === p.arn;
              return (
                <tr
                  key={p.arn}
                  onClick={() =>
                    setSelectedPolicyArn(isSelected ? null : p.arn)
                  }
                  className={`hover:bg-[#f2f8fd] cursor-pointer transition-colors ${
                    isSelected ? "bg-[#f2f8fd]" : ""
                  }`}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="radio"
                      name="selectedPolicy"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedPolicyArn(isSelected ? null : p.arn)
                      }
                      className="cursor-pointer text-[#0073bb] focus:ring-[#0073bb]"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => handleInspect(p.arn, p.policyName)}
                      className="text-[#0073bb] hover:text-[#ec7211] hover:underline text-left font-medium"
                    >
                      {p.policyName}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded ${
                        p.isAWSManaged
                          ? "bg-[#f2f3f3] text-[#545b64]"
                          : "bg-[#e8f2fc] text-[#0073bb] font-medium"
                      }`}
                    >
                      {p.isAWSManaged ? "AWS managed" : "Customer managed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#16191f]">
                    <span className="font-mono text-[11px] bg-[#f2f3f3] px-2 py-0.5 rounded text-[#545b64]">
                      {p.attachmentCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#545b64] max-w-[280px] truncate">
                    {p.description}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleInspect(p.arn, p.policyName)}
                      className="text-[12px] text-[#0073bb] hover:underline"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredPolicies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#545b64]">
                  {policies.length === 0
                    ? "No policies found."
                    : `No policies match "${searchQuery}".`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-[#eaeded] text-[12px] text-[#545b64]">
        {filteredPolicies.length} {filteredPolicies.length === 1 ? "policy" : "policies"}
      </div>

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

      {/* Delete Customer Policy Modal */}
      {showDeleteModal && selectedPolicy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-[500px] w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete policy: {selectedPolicy.policyName}
            </h3>

            {error && (
              <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212] flex items-start gap-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d13212" strokeWidth="2" className="shrink-0 mt-0.5">
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

            {!canDeletePolicy && !error && (
              <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212] flex items-start gap-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d13212" strokeWidth="2" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <div className="font-bold">Access Denied</div>
                  <div className="text-[12px] text-[#545b64] mt-0.5 leading-relaxed">
                    Identity <strong>{activeIdentityName}</strong> is not authorized to perform: <code>iam:DeletePolicy</code> on resource: <code>{selectedPolicy.arn}</code>.
                  </div>
                </div>
              </div>
            )}

            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Are you sure you want to delete policy <strong>{selectedPolicy.policyName}</strong>?
              This policy will be permanently deleted from your AWS account.
            </p>
            <div>
              <label className="block text-[13px] font-medium text-[#16191f] mb-1">
                To confirm deletion, type <strong>{selectedPolicy.policyName}</strong> in the box below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={selectedPolicy.policyName}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#d13212] focus:ring-1 focus:ring-[#d13212]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setError(null);
                }}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmInput !== selectedPolicy.policyName || isPending || !canDeletePolicy}
                title={!canDeletePolicy ? "Missing iam:DeletePolicy permission" : undefined}
                className={`px-4 py-1.5 text-[13px] text-white rounded-sm font-medium ${
                  confirmInput === selectedPolicy.policyName && !isPending && canDeletePolicy
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-[#eaeded] text-[#aab7b8] cursor-not-allowed"
                }`}
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
