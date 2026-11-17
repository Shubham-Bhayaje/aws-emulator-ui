/**
 * PolicyDetail – Client component for inspecting IAM policy permissions.
 * Displays syntax-highlighted policy JSON and structured visual statement summary.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deletePolicy } from "../../actions";

export interface PolicyMetadata {
  name: string;
  arn: string;
  description: string;
  defaultVersionId: string;
  createDate: string;
  updateDate: string;
  attachmentCount: number;
  isAttachable: boolean;
  document: any;
}

interface PolicyDetailProps {
  policy: PolicyMetadata;
}

export function PolicyDetail({ policy }: PolicyDetailProps) {
  const [activeTab, setActiveTab] = useState<"visual" | "json">("visual");
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isAWSManaged = policy.arn.includes(":aws:policy");

  // Extract statements from policy document
  const rawStatements = policy.document?.Statement;
  const statements: any[] = Array.isArray(rawStatements)
    ? rawStatements
    : rawStatements
    ? [rawStatements]
    : [];

  function handleCopyJson() {
    navigator.clipboard.writeText(JSON.stringify(policy.document, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDelete() {
    if (confirmInput !== policy.name) return;
    startTransition(async () => {
      const res = await deletePolicy(policy.arn);
      if (res && res.error) {
        setError(res.error);
      } else {
        router.push("/iam/policies");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[22px] font-bold text-[#16191f]">{policy.name}</h1>
            <span
              className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                isAWSManaged
                  ? "bg-[#f2f3f3] text-[#545b64]"
                  : "bg-[#f2f8fd] text-[#0073bb] border border-[#cbe2f2]"
              }`}
            >
              {isAWSManaged ? "AWS managed" : "Customer managed"}
            </span>
          </div>
          <p className="text-[12px] text-[#545b64] font-mono">{policy.arn}</p>
        </div>

        <div className="flex items-center gap-2">
          {!isAWSManaged && (
            <button
              onClick={() => {
                setConfirmInput("");
                setShowDeleteModal(true);
              }}
              className="px-3 py-1.5 text-[13px] border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded-sm font-normal"
            >
              Delete policy
            </button>
          )}
          <Link
            href="/iam/policies"
            className="px-3 py-1.5 text-[13px] border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded-sm font-normal"
          >
            Back to policies
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      {/* Summary card */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
        <h2 className="text-[15px] font-bold text-[#16191f]">Policy summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-[13px]">
          <div>
            <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
              Description
            </div>
            <div className="text-[#16191f]">{policy.description || "—"}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
              Default Version
            </div>
            <div className="font-mono text-[#16191f]">{policy.defaultVersionId}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
              Attached Entities
            </div>
            <div className="font-mono text-[#16191f]">{policy.attachmentCount}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
              Last Updated
            </div>
            <div className="text-[#16191f]">{policy.updateDate}</div>
          </div>
        </div>
      </div>

      {/* Permissions Inspection Card */}
      <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
        {/* Tab switch header */}
        <div className="px-5 py-3 border-b border-[#eaeded] flex items-center justify-between">
          <div className="flex gap-4 text-[13px]">
            <button
              onClick={() => setActiveTab("visual")}
              className={`pb-1 font-medium border-b-2 transition-colors ${
                activeTab === "visual"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Permission statements ({statements.length})
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`pb-1 font-medium border-b-2 transition-colors ${
                activeTab === "json"
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              JSON
            </button>
          </div>

          {activeTab === "json" && (
            <button
              onClick={handleCopyJson}
              className="text-[12px] text-[#0073bb] hover:underline flex items-center gap-1 font-medium"
            >
              {copied ? "Copied" : "Copy JSON"}
            </button>
          )}
        </div>

        {/* Tab 1: Visual Table */}
        {activeTab === "visual" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
                <tr>
                  <th className="px-4 py-2.5">Statement ID</th>
                  <th className="px-4 py-2.5">Effect</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Resource</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {statements.map((stmt, idx) => {
                  const isAllow = stmt.Effect === "Allow";
                  const actions = Array.isArray(stmt.Action)
                    ? stmt.Action
                    : stmt.Action
                    ? [stmt.Action]
                    : ["*"];
                  const resources = Array.isArray(stmt.Resource)
                    ? stmt.Resource
                    : stmt.Resource
                    ? [stmt.Resource]
                    : ["*"];

                  return (
                    <tr key={idx} className="hover:bg-[#f2f8fd]">
                      <td className="px-4 py-3 font-mono text-[12px] text-[#545b64]">
                        {stmt.Sid || `Statement ${idx + 1}`}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                            isAllow
                              ? "bg-[#f2f8f0] text-[#1d8102]"
                              : "bg-[#fdf3f1] text-[#d13212]"
                          }`}
                        >
                          {stmt.Effect ?? "Allow"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[400px]">
                          {actions.map((act: string) => (
                            <span
                              key={act}
                              className="font-mono text-[11px] bg-[#f2f3f3] text-[#16191f] px-1.5 py-0.5 rounded"
                            >
                              {act}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[320px]">
                          {resources.map((res: string) => (
                            <span
                              key={res}
                              className="font-mono text-[11px] bg-[#f2f3f3] text-[#545b64] px-1.5 py-0.5 rounded truncate max-w-full"
                            >
                              {res}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {statements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#545b64]">
                      No statement blocks found in this policy document.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: JSON Code Block */}
        {activeTab === "json" && (
          <div className="p-4 bg-[#000716] rounded-b">
            <pre className="text-[#69f0ae] font-mono text-[12px] overflow-x-auto leading-relaxed">
              {JSON.stringify(policy.document, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Delete Policy Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-[500px] w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete policy: {policy.name}
            </h3>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Are you sure you want to delete policy <strong>{policy.name}</strong>?
            </p>
            <div>
              <label className="block text-[13px] font-medium text-[#16191f] mb-1">
                To confirm deletion, type <strong>{policy.name}</strong> in the box below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={policy.name}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#d13212] focus:ring-1 focus:ring-[#d13212]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmInput !== policy.name || isPending}
                className={`px-4 py-1.5 text-[13px] text-white rounded-sm font-medium ${
                  confirmInput === policy.name && !isPending
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
