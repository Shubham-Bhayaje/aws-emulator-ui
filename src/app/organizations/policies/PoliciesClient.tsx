/**
 * src/app/organizations/policies/PoliciesClient.tsx – Policies list client component.
 * Zero emojis, Cloudscape enterprise standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SCPRecord, deleteSCPAction } from "../actions";

interface PoliciesClientProps {
  policies: SCPRecord[];
}

export function PoliciesClient({ policies }: PoliciesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"SCP" | "TAG" | "BACKUP">("SCP");

  const [deleteModalPolicy, setDeleteModalPolicy] = useState<SCPRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = policies.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleDelete = () => {
    if (!deleteModalPolicy) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteSCPAction(deleteModalPolicy.id);
      if (res.success) {
        setSuccess(`Policy ${deleteModalPolicy.name} was successfully deleted.`);
        setDeleteModalPolicy(null);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete policy.");
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

      {/* Policy Type Selector Tabs */}
      <div className="border-b border-[#eaeded] flex mb-6">
        <button
          onClick={() => setSelectedCategory("SCP")}
          className={`py-2.5 px-4 font-semibold text-[13px] border-b-2 transition-colors ${
            selectedCategory === "SCP"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Service control policies (SCPs)
        </button>
        <button
          onClick={() => setSelectedCategory("TAG")}
          className={`py-2.5 px-4 font-semibold text-[13px] border-b-2 transition-colors ${
            selectedCategory === "TAG"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Tag policies
        </button>
        <button
          onClick={() => setSelectedCategory("BACKUP")}
          className={`py-2.5 px-4 font-semibold text-[13px] border-b-2 transition-colors ${
            selectedCategory === "BACKUP"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Backup policies
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-[#eaeded] rounded-t p-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Filter policies by name or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[300px] border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#ec7211]"
        />

        <Link
          href="/organizations/policies/create"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
        >
          Create policy
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white border border-t-0 border-[#eaeded] rounded-b overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Policy name</th>
              <th className="py-2.5 px-4">Description</th>
              <th className="py-2.5 px-4">Type</th>
              <th className="py-2.5 px-4">Targets attached</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filtered.map((p) => (
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
                <td className="py-3 px-4 text-[#545b64] max-w-md">{p.description}</td>
                <td className="py-3 px-4 text-[#545b64]">{p.type}</td>
                <td className="py-3 px-4 text-[#16191f] font-semibold">
                  {p.attachedTargets.length} target(s)
                </td>
                <td className="py-3 px-4 text-right space-x-3">
                  <Link
                    href={`/organizations/policies/${p.id}`}
                    className="text-[#0972d3] hover:underline font-medium text-[12px]"
                  >
                    View
                  </Link>
                  {!p.awsManaged && (
                    <button
                      onClick={() => setDeleteModalPolicy(p)}
                      className="text-[#d13212] hover:underline font-medium text-[12px]"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[#545b64]">
                  No policies found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalPolicy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#d13212]">Delete policy</h2>
              <button onClick={() => setDeleteModalPolicy(null)} className="text-[#545b64] font-bold text-lg">
                X
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Are you sure you want to permanently delete policy <strong>{deleteModalPolicy.name}</strong>? It will be
                automatically detached from all accounts and organizational units.
              </p>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModalPolicy(null)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={handleDelete}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#d13212] hover:bg-[#b02a0f] text-white px-4 rounded shadow-sm"
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
