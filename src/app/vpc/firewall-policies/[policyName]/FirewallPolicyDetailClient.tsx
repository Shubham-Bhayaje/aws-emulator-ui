"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FirewallPolicyResponse,
  FirewallPolicy,
  FirewallMetadata,
  Tag,
} from "@aws-sdk/client-network-firewall";
import {
  deleteLiveFirewallPolicy,
  tagLiveResource,
  untagLiveResource,
} from "../../network-firewall-actions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

interface Props {
  policyResponse: FirewallPolicyResponse;
  policy?: FirewallPolicy;
  updateToken: string;
  associatedFirewalls: FirewallMetadata[];
  initialTags: Tag[];
}

export default function FirewallPolicyDetailClient({
  policyResponse,
  policy,
  updateToken,
  associatedFirewalls,
  initialTags,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"rules" | "firewalls" | "tags">("rules");
  const [tags, setTags] = useState<Tag[]>(initialTags);

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);

  // New tag state
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");
  const [isSavingTags, setIsSavingTags] = useState(false);

  // Alerts
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteLiveFirewallPolicy(policyResponse.FirewallPolicyName!);
      if (res.success) {
        router.push("/vpc/firewall-policies");
      } else {
        setError(res.error || "Failed to delete firewall policy.");
        setIsDeleting(false);
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
      setIsDeleting(false);
    }
  }

  async function handleAddTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagKey.trim() || !policyResponse.FirewallPolicyArn) return;
    setIsSavingTags(true);
    setError(null);
    try {
      const res = await tagLiveResource(policyResponse.FirewallPolicyArn, [
        { key: newTagKey.trim(), value: newTagValue.trim() },
      ]);
      if (res.success) {
        setTags((prev) => [...prev, { Key: newTagKey.trim(), Value: newTagValue.trim() }]);
        setNewTagKey("");
        setNewTagValue("");
        setSuccessMsg("Tag added successfully.");
        setIsTagsModalOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to add tag.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
    } finally {
      setIsSavingTags(false);
    }
  }

  async function handleRemoveTag(tagKey: string) {
    if (!policyResponse.FirewallPolicyArn) return;
    setError(null);
    try {
      const res = await untagLiveResource(policyResponse.FirewallPolicyArn, [tagKey]);
      if (res.success) {
        setTags((prev) => prev.filter((t) => t.Key !== tagKey));
        setSuccessMsg(`Tag '${tagKey}' removed.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to remove tag.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Breadcrumb & Header */}
      <div className="border-b border-[#eaeded] pb-4">
        <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5">
          <Link href="/vpc" className="hover:underline">VPC</Link>
          <span>&rsaquo;</span>
          <Link href="/vpc/firewall-policies" className="hover:underline">Firewall policies</Link>
          <span>&rsaquo;</span>
          <span className="text-[#16191f]">{policyResponse.FirewallPolicyName}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">{policyResponse.FirewallPolicyName}</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f8f0] text-[#2e7d32] border border-[#a6d997]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2e7d32]"></span>
              {policyResponse.FirewallPolicyStatus || "ACTIVE"}
            </span>
          </div>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-3.5 py-1.5 text-[13px] font-medium bg-[#d13212] text-white rounded-sm hover:bg-[#a82a0f]"
          >
            Delete policy
          </button>
        </div>
      </div>

      {error && <EmulatorOfflineBanner error={error} />}

      {successMsg && (
        <div className="p-3 bg-[#f2f8f0] border border-[#2e7d32] rounded-sm text-[#16191f] text-[13px] flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-[#545b64] hover:text-black text-sm">&times;</button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Stateless capacity</div>
          <div className="text-[20px] font-bold text-[#16191f] mt-1">
            {policyResponse.ConsumedStatelessRuleCapacity ?? 0}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Stateful capacity</div>
          <div className="text-[20px] font-bold text-[#16191f] mt-1">
            {policyResponse.ConsumedStatefulRuleCapacity ?? 0}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Associated firewalls</div>
          <div className="text-[20px] font-bold text-[#0073bb] mt-1">
            {associatedFirewalls.length}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Encryption</div>
          <div className="text-[14px] font-semibold text-[#16191f] mt-1">
            {policyResponse.EncryptionConfiguration?.Type === "CUSTOMER_KMS" ? "Customer KMS CMK" : "AWS owned key"}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#eaeded]">
        <nav className="flex space-x-8 text-[13px] font-medium">
          <button
            onClick={() => setActiveTab("rules")}
            className={`pb-3 border-b-2 ${
              activeTab === "rules"
                ? "border-[#0073bb] text-[#0073bb] font-bold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Policy rules
          </button>
          <button
            onClick={() => setActiveTab("firewalls")}
            className={`pb-3 border-b-2 ${
              activeTab === "firewalls"
                ? "border-[#0073bb] text-[#0073bb] font-bold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Associated firewalls ({associatedFirewalls.length})
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-3 border-b-2 ${
              activeTab === "tags"
                ? "border-[#0073bb] text-[#0073bb] font-bold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({tags.length})
          </button>
        </nav>
      </div>

      {/* Tab 1: Rules */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          {/* Stateless default actions */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-3 shadow-xs">
            <h2 className="text-[16px] font-bold text-[#16191f]">Stateless default actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div>
                <span className="text-[#545b64] block">Default action for full packets</span>
                <span className="font-semibold text-[#16191f] font-mono">
                  {policy?.StatelessDefaultActions?.join(", ") || "aws:pass"}
                </span>
              </div>
              <div>
                <span className="text-[#545b64] block">Default action for fragmented packets</span>
                <span className="font-semibold text-[#16191f] font-mono">
                  {policy?.StatelessFragmentDefaultActions?.join(", ") || "aws:pass"}
                </span>
              </div>
            </div>
          </div>

          {/* Stateless Rule Groups Table */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-3 shadow-xs">
            <h2 className="text-[16px] font-bold text-[#16191f]">Stateless rule groups</h2>
            <div className="border border-[#eaeded] rounded-sm overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <tr>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Rule Group ARN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {!policy?.StatelessRuleGroupReferences || policy.StatelessRuleGroupReferences.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-4 text-center text-[#545b64]">
                        No stateless rule groups associated with this policy.
                      </td>
                    </tr>
                  ) : (
                    policy.StatelessRuleGroupReferences.map((s, idx) => {
                      const rgName = s.ResourceArn?.split("/").pop() || s.ResourceArn;
                      return (
                        <tr key={idx} className="hover:bg-[#fbfbfb]">
                          <td className="px-3 py-2 font-bold text-[#16191f]">{s.Priority}</td>
                          <td className="px-3 py-2 font-mono text-[12px] text-[#0073bb]">
                            <Link href={`/vpc/rule-groups/${rgName}?type=STATELESS`} className="hover:underline">
                              {s.ResourceArn}
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stateful Rule Groups Table */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Stateful rule groups</h2>
              <span className="text-[12px] text-[#545b64]">
                Evaluation order: <span className="font-semibold">{policy?.StatefulEngineOptions?.RuleOrder || "DEFAULT_ACTION_ORDER"}</span>
              </span>
            </div>
            <div className="border border-[#eaeded] rounded-sm overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <tr>
                    <th className="px-3 py-2">Rule Group ARN</th>
                    <th className="px-3 py-2">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {!policy?.StatefulRuleGroupReferences || policy.StatefulRuleGroupReferences.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-4 text-center text-[#545b64]">
                        No stateful rule groups associated with this policy.
                      </td>
                    </tr>
                  ) : (
                    policy.StatefulRuleGroupReferences.map((s, idx) => {
                      const rgName = s.ResourceArn?.split("/").pop() || s.ResourceArn;
                      return (
                        <tr key={idx} className="hover:bg-[#fbfbfb]">
                          <td className="px-3 py-2 font-mono text-[12px] text-[#0073bb]">
                            <Link href={`/vpc/rule-groups/${rgName}?type=STATEFUL`} className="hover:underline">
                              {s.ResourceArn}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-[#545b64]">{s.Priority ?? "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Associated firewalls */}
      {activeTab === "firewalls" && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-3 shadow-xs">
          <h2 className="text-[16px] font-bold text-[#16191f]">Firewalls using this policy</h2>
          <div className="border border-[#eaeded] rounded-sm overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-3 py-2">Firewall Name</th>
                  <th className="px-3 py-2">Firewall ARN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {associatedFirewalls.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-4 text-center text-[#545b64]">
                      No firewalls are currently associated with this policy.
                    </td>
                  </tr>
                ) : (
                  associatedFirewalls.map((fw) => (
                    <tr key={fw.FirewallArn} className="hover:bg-[#fbfbfb]">
                      <td className="px-3 py-2 font-medium text-[#0073bb]">
                        <Link href={`/vpc/firewalls/${fw.FirewallName}`} className="hover:underline">
                          {fw.FirewallName}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-[#545b64]">{fw.FirewallArn}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
            <button
              onClick={() => setIsTagsModalOpen(true)}
              className="px-3.5 py-1.5 text-[13px] font-medium bg-white border border-[#aab7b8] rounded-sm hover:bg-[#f2f3f3]"
            >
              Manage tags
            </button>
          </div>

          <div className="border border-[#eaeded] rounded-sm overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">Value</th>
                  <th className="w-20 px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {tags.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-[#545b64]">
                      No tags associated with this firewall policy.
                    </td>
                  </tr>
                ) : (
                  tags.map((t) => (
                    <tr key={t.Key} className="hover:bg-[#fbfbfb]">
                      <td className="px-3 py-2 font-semibold text-[#16191f]">{t.Key}</td>
                      <td className="px-3 py-2 text-[#545b64]">{t.Value}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleRemoveTag(t.Key!)}
                          className="text-[#d13212] hover:underline text-[12px]"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Tag Modal */}
      {isTagsModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d5dbdb] rounded-sm max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Add tag</h3>
            <form onSubmit={handleAddTag} className="space-y-3 text-[13px]">
              <div>
                <label className="block font-bold text-[#16191f] mb-1">Key <span className="text-[#d13212]">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Environment"
                  value={newTagKey}
                  onChange={(e) => setNewTagKey(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-[#16191f] mb-1">Value</label>
                <input
                  type="text"
                  placeholder="e.g. Production"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsTagsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#aab7b8] rounded-sm bg-white hover:bg-[#f2f3f3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTags}
                  className="px-4 py-1.5 font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] disabled:opacity-50"
                >
                  {isSavingTags ? "Adding..." : "Add tag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d5dbdb] rounded-sm max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete {policyResponse.FirewallPolicyName}?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this firewall policy? This operation permanently removes the policy. You cannot delete a policy that is currently attached to an active firewall.
            </p>
            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                To confirm deletion, type <span className="font-mono text-[#d13212]">delete</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] outline-hidden focus:border-[#d13212]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText("");
                }}
                className="px-3.5 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm bg-white hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== "delete" || isDeleting}
                onClick={handleDelete}
                className="px-4 py-1.5 text-[13px] font-medium bg-[#d13212] text-white rounded-sm hover:bg-[#a82a0f] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
