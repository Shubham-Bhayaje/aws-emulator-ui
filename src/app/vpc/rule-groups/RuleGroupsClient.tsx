"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteLiveRuleGroup } from "../network-firewall-actions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

interface RuleGroupItem {
  name: string;
  arn: string;
  type: "STATELESS" | "STATEFUL";
}

interface Props {
  initialRuleGroups: RuleGroupItem[];
  initialError?: string | null;
}

export default function RuleGroupsClient({ initialRuleGroups, initialError }: Props) {
  const router = useRouter();
  const [ruleGroups, setRuleGroups] = useState<RuleGroupItem[]>(initialRuleGroups);
  const [selectedGroup, setSelectedGroup] = useState<RuleGroupItem | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "STATELESS" | "STATEFUL">("ALL");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = ruleGroups.filter((rg) => {
    const matchesSearch =
      rg.name.toLowerCase().includes(search.toLowerCase()) ||
      rg.arn.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || rg.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const statelessCount = ruleGroups.filter((r) => r.type === "STATELESS").length;
  const statefulCount = ruleGroups.filter((r) => r.type === "STATEFUL").length;

  async function handleDelete() {
    if (!selectedGroup) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteLiveRuleGroup(selectedGroup.name, selectedGroup.type);
      if (res.success) {
        setRuleGroups((prev) => prev.filter((r) => r.name !== selectedGroup.name));
        setSuccessMsg(`Rule group ${selectedGroup.name} deleted successfully.`);
        setSelectedGroup(null);
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
        router.refresh();
      } else {
        setError(res.error || "Failed to delete rule group.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eaeded] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] flex items-center gap-2">
            Network Firewall rule groups
            <span className="text-[14px] font-normal text-[#545b64]">({filtered.length})</span>
          </h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Rule groups define reusable criteria for inspecting and processing network traffic.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              className="px-3.5 py-1.5 text-[13px] font-medium border border-[#aab7b8] rounded-sm bg-white text-[#16191f] hover:bg-[#f2f3f3] flex items-center gap-1.5"
            >
              Actions
              <svg className="w-3.5 h-3.5 text-[#545b64]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {actionMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-[#d5dbdb] rounded-sm shadow-lg py-1 z-20 text-[13px]">
                <button
                  disabled={!selectedGroup}
                  onClick={() => {
                    setActionMenuOpen(false);
                    if (selectedGroup) router.push(`/vpc/rule-groups/${selectedGroup.name}?type=${selectedGroup.type}`);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[#16191f] hover:bg-[#f2f3f3] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  View details
                </button>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  disabled={!selectedGroup}
                  onClick={() => {
                    setActionMenuOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[#d13212] hover:bg-[#fdf3f1] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete rule group
                </button>
              </div>
            )}
          </div>

          <Link
            href="/vpc/rule-groups/create"
            className="px-4 py-1.5 text-[13px] font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] shadow-xs"
          >
            Create rule group
          </Link>
        </div>
      </div>

      {error && <EmulatorOfflineBanner error={error} />}

      {successMsg && (
        <div className="p-3 bg-[#f2f8f0] border border-[#2e7d32] rounded-sm text-[#16191f] text-[13px] flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-[#545b64] hover:text-black text-sm">&times;</button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Total rule groups</div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{ruleGroups.length}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Stateless rule groups</div>
          <div className="text-[24px] font-bold text-[#0073bb] mt-1">{statelessCount}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Stateful rule groups</div>
          <div className="text-[24px] font-bold text-[#8C4FFF] mt-1">{statefulCount}</div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#eaeded] rounded-sm shadow-xs">
        {/* Filters */}
        <div className="p-3 border-b border-[#eaeded] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Find rule groups by name or ARN"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm focus:border-[#0073bb] outline-hidden text-[#16191f]"
              />
              <svg
                className="w-4 h-4 text-[#545b64] absolute left-2.5 top-2.5 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded-sm bg-white text-[#16191f]"
            >
              <option value="ALL">All types ({ruleGroups.length})</option>
              <option value="STATELESS">Stateless ({statelessCount})</option>
              <option value="STATEFUL">Stateful ({statefulCount})</option>
            </select>
          </div>
          <button
            onClick={() => router.refresh()}
            className="p-1.5 border border-[#aab7b8] rounded-sm hover:bg-[#f2f3f3] text-[#545b64] shrink-0"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
              <tr>
                <th className="w-10 px-3 py-2.5"></th>
                <th className="px-3 py-2.5">Rule group name</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Rule group ARN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#545b64]">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="text-[15px] font-semibold text-[#16191f]">No rule groups found</div>
                      <p className="text-[13px] text-[#545b64]">
                        You do not have any rule groups matching this filter. Create stateless or stateful rule groups to filter network traffic.
                      </p>
                      <div className="pt-2">
                        <Link
                          href="/vpc/rule-groups/create"
                          className="inline-block px-4 py-1.5 text-[13px] font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07]"
                        >
                          Create rule group
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((rg) => {
                  const isSelected = selectedGroup?.name === rg.name && selectedGroup?.type === rg.type;
                  return (
                    <tr
                      key={`${rg.type}-${rg.name}`}
                      className={`hover:bg-[#fbfbfb] cursor-pointer ${isSelected ? "bg-[#f2f8fc]" : ""}`}
                      onClick={() => setSelectedGroup(rg)}
                    >
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedRuleGroup"
                          checked={isSelected}
                          onChange={() => setSelectedGroup(rg)}
                          className="accent-[#0073bb]"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-medium">
                        <Link
                          href={`/vpc/rule-groups/${rg.name}?type=${rg.type}`}
                          className="text-[#0073bb] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {rg.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            rg.type === "STATELESS"
                              ? "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
                              : "bg-[#f4f0fc] text-[#8C4FFF] border border-[#d8c7ff]"
                          }`}
                        >
                          {rg.type === "STATELESS" ? "Stateless" : "Stateful"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-[#545b64] break-all">
                        {rg.arn}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedGroup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d5dbdb] rounded-sm max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete {selectedGroup.name}?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this rule group? You cannot delete a rule group that is currently referenced by an active firewall policy.
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
