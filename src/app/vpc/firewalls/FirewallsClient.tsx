"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirewallMetadata } from "@aws-sdk/client-network-firewall";
import { deleteLiveFirewall } from "../network-firewall-actions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

interface Props {
  initialFirewalls: FirewallMetadata[];
  initialError?: string | null;
}

export default function FirewallsClient({ initialFirewalls, initialError }: Props) {
  const router = useRouter();
  const [firewalls, setFirewalls] = useState<FirewallMetadata[]>(initialFirewalls);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = firewalls.filter((f) =>
    (f.FirewallName || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.FirewallArn || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedFirewall = firewalls.find((f) => f.FirewallName === selectedName);

  async function handleDelete() {
    if (!selectedName) return;
    setIsDeleting(true);
    setBannerError(null);
    try {
      const res = await deleteLiveFirewall(selectedName);
      if (res.success) {
        setFirewalls((prev) => prev.filter((f) => f.FirewallName !== selectedName));
        setSuccessMsg(`Firewall ${selectedName} is being deleted.`);
        setSelectedName(null);
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
        router.refresh();
      } else {
        setBannerError(res.error || "Failed to delete firewall.");
      }
    } catch (err: any) {
      setBannerError(err?.message || "An error occurred.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eaeded] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] flex items-center gap-2">
            Firewalls
            <span className="text-[14px] font-normal text-[#545b64]">({filtered.length})</span>
          </h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            AWS Network Firewall provides stateful traffic inspection for your Amazon VPC.
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
                    if (selectedName) router.push(`/vpc/firewalls/${selectedName}`);
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
                  Delete firewall
                </button>
              </div>
            )}
          </div>

          <Link
            href="/vpc/firewalls/create"
            className="px-4 py-1.5 text-[13px] font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] shadow-xs flex items-center gap-1"
          >
            Create firewall
          </Link>
        </div>
      </div>

      {bannerError && <EmulatorOfflineBanner error={bannerError} />}

      {successMsg && (
        <div className="p-3 bg-[#f2f8f0] border border-[#2e7d32] rounded-sm text-[#16191f] text-[13px] flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-[#545b64] hover:text-black text-sm">&times;</button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Total firewalls</div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{firewalls.length}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Active / Ready</div>
          <div className="text-[24px] font-bold text-[#2e7d32] mt-1">{firewalls.length}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Policies</div>
          <div className="text-[24px] font-bold text-[#0073bb] mt-1">
            <Link href="/vpc/firewall-policies" className="hover:underline">View policies</Link>
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded-sm p-4">
          <div className="text-[12px] font-medium text-[#545b64] uppercase tracking-wider">Rule groups</div>
          <div className="text-[24px] font-bold text-[#0073bb] mt-1">
            <Link href="/vpc/rule-groups" className="hover:underline">View rule groups</Link>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#eaeded] rounded-sm shadow-xs">
        {/* Search Bar */}
        <div className="p-3 border-b border-[#eaeded] flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Find firewalls by name or ARN"
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
              <tr>
                <th className="w-10 px-3 py-2.5"></th>
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Firewall ARN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#545b64]">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="text-[15px] font-semibold text-[#16191f]">No firewalls found</div>
                      <p className="text-[13px] text-[#545b64]">
                        You do not have any firewalls configured in this Region. Protect your VPC traffic by creating a stateful Network Firewall.
                      </p>
                      <div className="pt-2">
                        <Link
                          href="/vpc/firewalls/create"
                          className="inline-block px-4 py-1.5 text-[13px] font-medium bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07]"
                        >
                          Create firewall
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((fw) => {
                  const isSelected = selectedName === fw.FirewallName;
                  return (
                    <tr
                      key={fw.FirewallArn || fw.FirewallName}
                      className={`hover:bg-[#fbfbfb] cursor-pointer ${isSelected ? "bg-[#f2f8fc]" : ""}`}
                      onClick={() => setSelectedName(fw.FirewallName || null)}
                    >
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedFirewall"
                          checked={isSelected}
                          onChange={() => setSelectedName(fw.FirewallName || null)}
                          className="accent-[#0073bb]"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-medium">
                        <Link
                          href={`/vpc/firewalls/${fw.FirewallName}`}
                          className="text-[#0073bb] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {fw.FirewallName}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f8f0] text-[#2e7d32] border border-[#a6d997]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2e7d32]"></span>
                          READY
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-[#545b64] break-all">
                        {fw.FirewallArn}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedFirewall && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d5dbdb] rounded-sm max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete {selectedFirewall.FirewallName}?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this firewall? This operation permanently removes the firewall and all associated VPC endpoint attachments. This action cannot be undone.
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
