/**
 * src/app/systems-manager/parameter-store/ParametersClient.tsx – Client Component for Systems Manager Parameter Store.
 * Replicates AWS Console Parameter Store inventory table, metric cards, filtering, sorting, selection, and delete modal.
 * Zero emojis, Cloudscape design system, strict 32px button height standard.
 */

"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SSMParameterSummary } from "./types";
import { deleteParametersAction } from "./actions";

interface ParametersClientProps {
  initialParameters: SSMParameterSummary[];
}

export function ParametersClient({ initialParameters }: ParametersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [parameters, setParameters] = useState<SSMParameterSummary[]>(initialParameters);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [tierFilter, setTierFilter] = useState<string>("ALL");

  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Metric counts
  const totalCount = parameters.length;
  const standardCount = parameters.filter((p) => p.tier === "Standard").length;
  const advancedCount = parameters.filter((p) => p.tier === "Advanced").length;
  const secureCount = parameters.filter((p) => p.type === "SecureString").length;

  // Filtered parameters
  const filteredParameters = useMemo(() => {
    return parameters.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase().trim()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase().trim()));

      const matchType = typeFilter === "ALL" || p.type === typeFilter;
      const matchTier = tierFilter === "ALL" || p.tier === tierFilter;

      return matchSearch && matchType && matchTier;
    });
  }, [parameters, search, typeFilter, tierFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNames(filteredParameters.map((p) => p.name));
    } else {
      setSelectedNames([]);
    }
  };

  const handleToggleSelect = (name: string) => {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const isAllSelected =
    filteredParameters.length > 0 && selectedNames.length === filteredParameters.length;

  const handleDelete = () => {
    if (selectedNames.length === 0) return;

    startTransition(async () => {
      const res = await deleteParametersAction(selectedNames);
      if (res.success) {
        setParameters((prev) => prev.filter((p) => !selectedNames.includes(p.name)));
        setSelectedNames([]);
        setShowDeleteModal(false);
        setStatusMessage({
          type: "success",
          text: `Successfully deleted ${res.deleted.length} parameter${
            res.deleted.length === 1 ? "" : "s"
          }.`,
        });
        router.refresh();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to delete parameters.",
        });
        setShowDeleteModal(false);
      }
    });
  };

  const getEncodedPath = (paramName: string) => {
    const clean = paramName.startsWith("/") ? paramName : `/${paramName}`;
    return `/systems-manager/parameter-store${clean}`;
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Parameter Store</h1>
          <p className="text-[14px] text-[#545b64] mt-1">
            Secure, hierarchical storage for configuration data management and secrets management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
          >
            Refresh
          </button>
          <Link
            href="/systems-manager/parameter-store/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
          >
            Create parameter
          </Link>
        </div>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div
          className={`border rounded p-3 text-[13px] flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-[#f2fcf3] border-[#1d8102] text-[#1d8102]"
              : "bg-[#fdf3f2] border-[#d13212] text-[#d13212]"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-[12px] font-bold text-[#545b64] hover:text-[#16191f] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
            Total Parameters
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalCount}</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
            Standard Tier
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{standardCount}</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
            Advanced Tier
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{advancedCount}</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
            SecureString (KMS)
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{secureCount}</div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search by parameter name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] w-72 focus:outline-none focus:border-[#ec7211]"
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-[#aab7b8] rounded px-2.5 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#ec7211]"
            >
              <option value="ALL">All types</option>
              <option value="String">String</option>
              <option value="StringList">StringList</option>
              <option value="SecureString">SecureString</option>
            </select>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="border border-[#aab7b8] rounded px-2.5 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#ec7211]"
            >
              <option value="ALL">All tiers</option>
              <option value="Standard">Standard</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {selectedNames.length === 1 && (
              <Link
                href={`/systems-manager/parameter-store/edit${
                  selectedNames[0].startsWith("/") ? selectedNames[0] : `/${selectedNames[0]}`
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
              >
                Edit
              </Link>
            )}

            {selectedNames.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#d13212] text-[#d13212] hover:bg-[#fdf3f2] px-3 rounded transition-colors"
              >
                Delete ({selectedNames.length})
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {filteredParameters.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-[16px] font-bold text-[#16191f] mb-1">No parameters found</h3>
            <p className="text-[13px] text-[#545b64] mb-4">
              {parameters.length === 0
                ? "You do not have any parameters in this AWS Region. Get started by creating your first parameter."
                : "No parameters matched your search and filter criteria."}
            </p>
            {parameters.length === 0 && (
              <Link
                href="/systems-manager/parameter-store/create"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
              >
                Create parameter
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                  <th className="py-2.5 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-[#aab7b8] text-[#ec7211] focus:ring-0"
                    />
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-[#16191f]">Name</th>
                  <th className="py-2.5 px-3 font-semibold text-[#16191f]">Type</th>
                  <th className="py-2.5 px-3 font-semibold text-[#16191f]">Tier</th>
                  <th className="py-2.5 px-3 font-semibold text-[#16191f]">Version</th>
                  <th className="py-2.5 px-3 font-semibold text-[#16191f]">Data type</th>
                  <th className="py-2.5 px-3 font-semibold text-[#16191f]">Last modified date</th>
                  <th className="py-2.5 px-3 font-semibold text-[#16191f]">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {filteredParameters.map((p) => {
                  const isChecked = selectedNames.includes(p.name);
                  return (
                    <tr
                      key={p.name}
                      className={`hover:bg-[#f2f8fd] transition-colors ${
                        isChecked ? "bg-[#f2f8fd]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(p.name)}
                          className="rounded border-[#aab7b8] text-[#ec7211] focus:ring-0"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        <Link
                          href={getEncodedPath(p.name)}
                          className="text-[#0972d3] hover:underline font-mono"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            p.type === "SecureString"
                              ? "bg-[#e7f4e4] text-[#1d8102] border border-[#a2dca0]"
                              : p.type === "StringList"
                              ? "bg-[#f3e8ff] text-[#7e22ce] border border-[#d8b4fe]"
                              : "bg-[#e9f3f9] text-[#0972d3] border border-[#9ed0f5]"
                          }`}
                        >
                          {p.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64]">{p.tier}</td>
                      <td className="py-2.5 px-3 text-[#545b64]">{p.version}</td>
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">
                        {p.dataType || "text"}
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64] text-[12px]">
                        {p.lastModifiedDate || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64] truncate max-w-xs">
                        {p.description || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-3 border-t border-[#eaeded] text-[12px] text-[#545b64] flex items-center justify-between">
          <span>
            Showing {filteredParameters.length} of {parameters.length} parameters
          </span>
          {selectedNames.length > 0 && <span>{selectedNames.length} selected</span>}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete parameter{selectedNames.length > 1 ? "s" : ""}?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to permanently delete the following{" "}
              {selectedNames.length === 1 ? "parameter" : `${selectedNames.length} parameters`}? This
              action cannot be undone.
            </p>

            <div className="max-h-40 overflow-y-auto border border-[#eaeded] rounded p-2 bg-[#fafafa]">
              <ul className="text-[12px] font-mono text-[#16191f] space-y-1">
                {selectedNames.map((name) => (
                  <li key={name}>• {name}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-[#d13212] hover:bg-[#a82a0f] text-white px-4 rounded shadow-sm transition-colors disabled:opacity-50"
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
