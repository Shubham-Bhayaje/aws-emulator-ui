"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteLiveFirewallPolicy } from "../network-firewall-actions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

interface Props {
  initialPolicies: Array<{ name: string; arn: string }>;
  initialError?: string | null;
}

export default function FirewallPoliciesClient({ initialPolicies, initialError }: Props) {
  const router = useRouter();
  const [policies, setPolicies] = useState(initialPolicies);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = policies.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.arn.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!selectedName) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteLiveFirewallPolicy(selectedName);
      if (res.success) {
        setPolicies((prev) => prev.filter((p) => p.name !== selectedName));
        setSuccessMsg(`Firewall policy ${selectedName} deleted successfully.`);
        setSelectedName(null);
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
        router.refresh();
      } else {
        setError(res.error || "Failed to delete firewall policy.");
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
            Firewall policies
            <span className="text-[14px] font-normal text-[#545b64]">({filtered.length})</span>
          </h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            A firewall policy defines the monitoring and protection behavior for a firewall.
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
                  disabled={!selectedName}
                  onClick={() => {
                    setActionMenuOpen(false);
                    if (selectedName) router.push(`/vpc/firewall-policies/${selectedName}`);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[#16191f] hover:bg-[#f2f3f3] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  View details
                </button>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  disabled={!selectedName}
                  onClick={() => {
                    setActionMenuOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[#d13212] hover:bg-[#fdf3f1] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete policy
                </button>
              </div>
            )}
          </div>

          <Link
            href="/vpc/firewall-policies/create"
            className="px-4 py-1.5 text-[13px] font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] shadow-xs"
          >
            Create firewall policy
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

      {/* Table Container */}
      <div className="bg-white border border-[#eaeded] rounded-sm shadow-xs">
        <div className="p-3 border-b border-[#eaeded] flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Find policies by name or ARN"
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
          <button
            onClick={() => router.refresh()}
            className="p-1.5 border border-[#aab7b8] rounded-sm hover:bg-[#f2f3f3] text-[#545b64]"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
              <tr>
                <th className="w-10 px-3 py-2.5"></th>
                <th className="px-3 py-2.5">Policy name</th>
                <th className="px-3 py-2.5">Firewall policy ARN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-[#545b64]">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="text-[15px] font-semibold text-[#16191f]">No firewall policies found</div>
                      <p className="text-[13px] text-[#545b64]">
                        You do not have any firewall policies in this Region. A policy is required to configure firewall rules.
                      </p>
                      <div className="pt-2">
                        <Link
                          href="/vpc/firewall-policies/create"
                          className="inline-block px-4 py-1.5 text-[13px] font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07]"
                        >
                          Create firewall policy
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((pol) => {
                  const isSelected = selectedName === pol.name;
                  return (
                    <tr
                      key={pol.arn || pol.name}
                      className={`hover:bg-[#fbfbfb] cursor-pointer ${isSelected ? "bg-[#f2f8fc]" : ""}`}
                      onClick={() => setSelectedName(pol.name)}
                    >
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedPolicy"
                          checked={isSelected}
                          onChange={() => setSelectedName(pol.name)}
                          className="accent-[#0073bb]"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-medium">
                        <Link
                          href={`/vpc/firewall-policies/${pol.name}`}
                          className="text-[#0073bb] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {pol.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-[#545b64] break-all">
                        {pol.arn}
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
      {isDeleteModalOpen && selectedName && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d5dbdb] rounded-sm max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete {selectedName}?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this firewall policy? You cannot delete a policy that is currently attached to an active firewall.
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
