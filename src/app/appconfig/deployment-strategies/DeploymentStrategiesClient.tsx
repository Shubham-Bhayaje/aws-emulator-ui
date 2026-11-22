"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteDeploymentStrategyAction } from "../actions";

interface StrategyItem {
  id: string;
  name: string;
  description: string;
  deploymentDurationInMinutes: number;
  growthType: string;
  growthFactor: number;
  finalBakeTimeInMinutes: number;
  replicateTo: string;
}

interface Props {
  initialStrategies: StrategyItem[];
}

export default function DeploymentStrategiesClient({ initialStrategies }: Props) {
  const router = useRouter();
  const [strategies, setStrategies] = useState<StrategyItem[]>(initialStrategies);
  const [search, setSearch] = useState("");
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = strategies.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
  });

  const selectedStrategy = strategies.find((s) => s.id === selectedStrategyId);
  const isPredefined = selectedStrategy?.id.startsWith("AppConfig.");

  const handleDelete = async () => {
    if (!selectedStrategyId || isPredefined || deleteConfirmText.toLowerCase() !== "delete") return;
    setDeleteLoading(true);
    setDeleteError(null);
    const res = await deleteDeploymentStrategyAction(selectedStrategyId);
    setDeleteLoading(false);
    if (res.success) {
      setStrategies((prev) => prev.filter((s) => s.id !== selectedStrategyId));
      setSelectedStrategyId(null);
      setIsDeleteOpen(false);
      setDeleteConfirmText("");
      router.refresh();
    } else {
      setDeleteError(res.error || "Failed to delete deployment strategy.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Deployment strategies</h1>
          <p className="text-[13px] text-[#545b64]">
            A deployment strategy determines how fast a configuration version is rolled out and what bake time is monitored for alarms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setIsDeleteOpen(true);
            }}
            disabled={!selectedStrategyId || isPredefined}
            title={isPredefined ? "Predefined AWS deployment strategies cannot be deleted" : undefined}
            className="px-3 text-[13px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2] disabled:opacity-40 transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
          <Link
            href="/appconfig/deployment-strategies/create"
            className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors shadow-xs"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create deployment strategy
          </Link>
        </div>
      </div>

      {/* Strategies Table Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-xs">
        <div className="p-4 border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Find deployment strategies"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] bg-white"
            />
            <svg
              className="w-4 h-4 text-[#545b64] absolute left-2.5 top-2.5 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="text-[13px] text-[#545b64]">
            {filtered.length} of {strategies.length} strategies
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4 w-10"></th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Growth type</th>
                <th className="py-2.5 px-4">Growth factor</th>
                <th className="py-2.5 px-4">Bake time</th>
                <th className="py-2.5 px-4">Replicate to</th>
                <th className="py-2.5 px-4">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.map((s) => {
                const isSelected = selectedStrategyId === s.id;
                const predefined = s.id.startsWith("AppConfig.");
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStrategyId(isSelected ? null : s.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <input
                        type="radio"
                        name="selected-strategy"
                        checked={isSelected}
                        onChange={() => setSelectedStrategyId(s.id)}
                        className="h-3.5 w-3.5 text-[#0073bb] border-[#aab7b8]"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-[#16191f]">{s.name}</div>
                      {s.description && (
                        <div className="text-[11px] text-[#545b64] mt-0.5">{s.description}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-[#16191f]">
                      {s.deploymentDurationInMinutes} min
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#16191f]">
                        {s.growthType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-[#16191f]">
                      {s.growthFactor}%
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-[#16191f]">
                      {s.finalBakeTimeInMinutes} min
                    </td>
                    <td className="py-2.5 px-4 text-[#545b64]">
                      {s.replicateTo}
                    </td>
                    <td className="py-2.5 px-4">
                      {predefined ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e8f0fe] text-[#1a73e8]">
                          AWS predefined
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                          Custom
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && selectedStrategy && !isPredefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#eaeded] shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#eaeded]">
              <h3 className="text-[16px] font-bold text-[#16191f]">Delete deployment strategy</h3>
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                ✕
              </button>
            </div>
            <p className="text-[13px] text-[#16191f]">
              Are you sure you want to delete custom deployment strategy <strong>{selectedStrategy.name}</strong>?
            </p>
            {deleteError && (
              <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
                {deleteError}
              </div>
            )}
            <div>
              <label className="block text-[12px] font-medium text-[#545b64] mb-1">
                To confirm deletion, type <code className="text-[#d13212] font-mono">delete</code>:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading || deleteConfirmText.toLowerCase() !== "delete"}
                className="px-4 text-[13px] font-semibold text-white bg-[#d13212] hover:bg-[#b02a0f] rounded disabled:opacity-40"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
