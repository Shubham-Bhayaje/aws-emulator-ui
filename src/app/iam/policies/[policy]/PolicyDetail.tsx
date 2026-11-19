/**
 * src/app/iam/policies/[policy]/PolicyDetail.tsx – Policy Details with Permissions and Entities Attached.
 * Zero emojis, Cloudscape enterprise styling.
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
  attachedEntities?: {
    users: Array<{ name: string; id: string }>;
    roles: Array<{ name: string; id: string }>;
    groups: Array<{ name: string; id: string }>;
  };
}

export function PolicyDetail({
  policy,
  attachedEntities = { users: [], roles: [], groups: [] },
}: PolicyDetailProps) {
  const [activeTab, setActiveTab] = useState<"permissions" | "entities" | "details">("permissions");
  const [viewMode, setViewMode] = useState<"visual" | "json">("visual");
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isAWSManaged = policy.arn.includes(":aws:policy");

  const totalAttachedCount =
    attachedEntities.users.length + attachedEntities.roles.length + attachedEntities.groups.length;

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
    <div className="space-y-6 max-w-[1200px]">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-[#16191f]">{policy.name}</h1>
            <span
              className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                isAWSManaged
                  ? "bg-[#f2f3f3] text-[#545b64]"
                  : "bg-[#f2f8fd] text-[#0073bb] border border-[#cbe2f2]"
              }`}
            >
              {isAWSManaged ? "AWS managed" : "Customer managed"}
            </span>
          </div>
          <p className="text-[12px] text-[#545b64] font-mono mt-0.5">{policy.arn}</p>
        </div>

        <div className="flex items-center gap-2">
          {!isAWSManaged && (
            <button
              onClick={() => {
                setConfirmInput("");
                setShowDeleteModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 border border-[#d5dbdb] text-[#d13212] hover:bg-[#fdf3f1] rounded-sm text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors bg-white"
            >
              Delete policy
            </button>
          )}
          <Link
            href="/iam/policies"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
          >
            Policies
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf3f1] border border-[#d13212] text-[#d13212] rounded-sm text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[12px] font-bold hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Box */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-6 text-[13px]">
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">Default version</div>
          <div className="font-mono text-[#16191f] mt-1">{policy.defaultVersionId}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">Creation time</div>
          <div className="text-[#16191f] mt-1">{policy.createDate}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">Update time</div>
          <div className="text-[#16191f] mt-1">{policy.updateDate}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">Entities attached</div>
          <div className="text-[#0073bb] font-bold mt-1">
            {totalAttachedCount > 0 ? totalAttachedCount : policy.attachmentCount} entities
          </div>
        </div>
      </div>

      {/* Tabs */}
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
            Permissions ({statements.length} statements)
          </button>
          <button
            onClick={() => setActiveTab("entities")}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "entities"
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Entities attached ({totalAttachedCount})
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "details"
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Description & Details
          </button>
        </div>

        <div className="p-6">
          {/* Permissions Tab */}
          {activeTab === "permissions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#eaeded]">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("visual")}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className={`h-[32px] px-3 rounded-sm text-[12px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                      viewMode === "visual"
                        ? "bg-[#0073bb] text-white"
                        : "bg-white border border-[#aab7b8] text-[#16191f] hover:bg-[#f2f3f3]"
                    }`}
                  >
                    Visual summary
                  </button>
                  <button
                    onClick={() => setViewMode("json")}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className={`h-[32px] px-3 rounded-sm text-[12px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                      viewMode === "json"
                        ? "bg-[#0073bb] text-white"
                        : "bg-white border border-[#aab7b8] text-[#16191f] hover:bg-[#f2f3f3]"
                    }`}
                  >
                    JSON document
                  </button>
                </div>

                <button
                  onClick={handleCopyJson}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[12px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                >
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              </div>

              {viewMode === "json" ? (
                <div className="bg-[#16191f] p-5 rounded-sm border border-[#eaeded]">
                  <pre className="text-[12px] font-mono text-[#59cbe8] overflow-x-auto leading-relaxed">
                    {JSON.stringify(policy.document, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="space-y-3">
                  {statements.map((stmt, idx) => {
                    const effect = stmt.Effect || "Allow";
                    const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
                    const resources = stmt.Resource
                      ? Array.isArray(stmt.Resource)
                        ? stmt.Resource
                        : [stmt.Resource]
                      : ["*"];

                    return (
                      <div key={idx} className="border border-[#eaeded] rounded-sm p-4 bg-[#fafafa] space-y-2 text-[13px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#16191f]">
                            Statement {stmt.Sid ? `(${stmt.Sid})` : `#${idx + 1}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              effect === "Allow"
                                ? "bg-[#e6f4ea] text-[#137333]"
                                : "bg-[#fdf3f1] text-[#d13212]"
                            }`}
                          >
                            {effect}
                          </span>
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-[#545b64] uppercase mb-1">Actions</div>
                          <div className="flex flex-wrap gap-1">
                            {actions.map((act: string, aIdx: number) => (
                              <span key={aIdx} className="font-mono text-[11px] bg-white px-2 py-0.5 border border-[#d5dbdb] rounded text-[#16191f]">
                                {act}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-[#545b64] uppercase mb-1">Resources</div>
                          <div className="flex flex-wrap gap-1">
                            {resources.map((res: string, rIdx: number) => (
                              <span key={rIdx} className="font-mono text-[11px] bg-white px-2 py-0.5 border border-[#d5dbdb] rounded text-[#545b64]">
                                {res}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Entities Attached Tab */}
          {activeTab === "entities" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-[14px] font-bold text-[#16191f]">Attached entities</h3>
                <p className="text-[12px] text-[#545b64] mt-0.5">
                  Users, roles, and groups currently attached to this policy.
                </p>
              </div>

              {totalAttachedCount === 0 ? (
                <div className="p-8 text-center bg-[#fafafa] border border-[#eaeded] rounded-sm text-[13px] text-[#545b64]">
                  No entities currently attached to this policy.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Users */}
                  <div className="border border-[#eaeded] rounded-sm">
                    <div className="p-3 bg-[#fafafa] border-b border-[#eaeded] font-bold text-[13px] text-[#16191f]">
                      Users ({attachedEntities.users.length})
                    </div>
                    <div className="p-2 max-h-[200px] overflow-y-auto divide-y divide-[#eaeded] text-[13px]">
                      {attachedEntities.users.length === 0 ? (
                        <div className="p-3 text-[12px] text-[#545b64] italic">None</div>
                      ) : (
                        attachedEntities.users.map((u) => (
                          <div key={u.id} className="py-2 px-1">
                            <Link href={`/iam/users/${encodeURIComponent(u.name)}`} className="text-[#0073bb] font-medium hover:underline">
                              {u.name}
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="border border-[#eaeded] rounded-sm">
                    <div className="p-3 bg-[#fafafa] border-b border-[#eaeded] font-bold text-[13px] text-[#16191f]">
                      Roles ({attachedEntities.roles.length})
                    </div>
                    <div className="p-2 max-h-[200px] overflow-y-auto divide-y divide-[#eaeded] text-[13px]">
                      {attachedEntities.roles.length === 0 ? (
                        <div className="p-3 text-[12px] text-[#545b64] italic">None</div>
                      ) : (
                        attachedEntities.roles.map((r) => (
                          <div key={r.id} className="py-2 px-1">
                            <Link href={`/iam/roles/${encodeURIComponent(r.name)}`} className="text-[#0073bb] font-medium hover:underline">
                              {r.name}
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Groups */}
                  <div className="border border-[#eaeded] rounded-sm">
                    <div className="p-3 bg-[#fafafa] border-b border-[#eaeded] font-bold text-[13px] text-[#16191f]">
                      User groups ({attachedEntities.groups.length})
                    </div>
                    <div className="p-2 max-h-[200px] overflow-y-auto divide-y divide-[#eaeded] text-[13px]">
                      {attachedEntities.groups.length === 0 ? (
                        <div className="p-3 text-[12px] text-[#545b64] italic">None</div>
                      ) : (
                        attachedEntities.groups.map((g) => (
                          <div key={g.id} className="py-2 px-1">
                            <Link href={`/iam/user-groups/${encodeURIComponent(g.name)}`} className="text-[#0073bb] font-medium hover:underline">
                              {g.name}
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-4 text-[13px]">
              <div>
                <div className="text-[12px] text-[#545b64] font-medium">Description</div>
                <div className="text-[#16191f] mt-1">{policy.description || "—"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-medium">Policy ARN</div>
                <div className="font-mono text-[12px] text-[#16191f] mt-1 break-all">{policy.arn}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete policy</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete policy <strong className="text-[#16191f]">{policy.name}</strong>?
            </p>
            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Type the policy name to confirm:
              </label>
              <input
                type="text"
                placeholder={policy.name}
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmInput !== policy.name || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#d13212] text-white rounded-sm text-[13px] font-bold hover:bg-[#b02008] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
